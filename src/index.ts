import { ponder, type Context, type Event } from "ponder:registry";
import * as schema from "ponder:schema";
import { concatHex, keccak256, numberToHex, type Hex } from "viem";

const ids = {
  block: ({chainId, hash}: { chainId: bigint | number; hash: Hex }) => keccak256(concatHex([numberToHex(chainId, { size: 8}), hash])),
  transaction: ({ chainId, hash }: { chainId: bigint | number; hash: Hex }) => keccak256(concatHex([numberToHex(chainId, { size: 8 }), hash])),
  participant: ({ chainId, address }: { chainId: bigint | number; address: Hex }) => keccak256(concatHex([numberToHex(chainId, { size: 8 }), address])),
  participantAction: ({ transactionId, participantId }: { participantId: Hex; transactionId: Hex }) => keccak256(concatHex([participantId, transactionId])),
};

type OrderIdInputs = {
  event: Event,
  context: Context,
}

const orderId = {
  block: ({ event, context }: OrderIdInputs) => concatHex([
    numberToHex(event.block.timestamp, { size: 8 }),
    numberToHex(context.network.chainId, { size: 4 }),
  ]),
  transaction: ({ event, context }: OrderIdInputs) => concatHex([
    numberToHex(event.block.timestamp, { size: 8 }),
    numberToHex(event.transaction.transactionIndex!, { size: 4 }),
    numberToHex(context.network.chainId, { size: 4 }),
  ]),
  log: ({ event, context }: OrderIdInputs) => concatHex([
    numberToHex(event.block.timestamp, { size: 8 }),
    numberToHex(event.transaction.transactionIndex!, { size: 4 }),
    numberToHex(event.log.logIndex, { size: 4 }),
    numberToHex(context.network.chainId, { size: 4 }),
  ]),
};

const upsertBlock = async (event: Event, context: Context) => {
  const chainId = BigInt(context.network.chainId)
  return await context.db.insert(schema.block).values({
    orderId: orderId.block({ event, context }),
    chainId,
    number: event.block.number!,
    timestamp: event.block.timestamp,
    hash: event.block.hash!,
  }).onConflictDoNothing();
};

const upsertTransaction = async (event: Event, context: Context) => {
  return await context.db.insert(schema.transaction).values({
    orderId: orderId.transaction({ event, context }),
    index: BigInt(event.transaction.transactionIndex!),
    hash: event.transaction.hash!,
    from: event.transaction.from!,
    to: event.transaction.to!,
    blockId: orderId.block({ event, context }),
  }).onConflictDoNothing();
};

ponder.on("Escrow:DepositReceived", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  const participantId = ids.participant({ chainId: context.network.chainId, address: event.args.depositor })
  const participantActionId = ids.participantAction({ transactionId: transactionOrderId, participantId })
  const [min, max] = event.args.intentAmountRange
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    context.db.insert(schema.deposit).values({
      depositId: event.args.depositId,
      token: event.args.token,
      participantId,
      participantActionId,
      deposited: event.args.amount,
      remaining: event.args.amount,
      minAmount: min,
      maxAmount: max,
      status: "active",
      transactionId: transactionOrderId,
    }),
    context.db.insert(schema.depositReceived).values({
      orderId: logOrderId,
      token: event.args.token,
      participantId,
      transactionId: transactionOrderId,
      depositId: event.args.depositId,
      amount: event.args.amount,
      participantActionId,
    })
  ])
});

ponder.on("Escrow:DepositWithdrawn", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  const participantId = ids.participant({ chainId: context.network.chainId, address: event.args.depositor })
  const participantActionId = ids.participantAction({ transactionId: transactionOrderId, participantId })
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    context.db.update(schema.deposit, {
      depositId: event.args.depositId,
    }).set({
      remaining: 0n,
      status: 'withdrawn',
    }),
    context.db.insert(schema.depositWithdrawn).values({
      orderId: logOrderId,
      participantId,
      participantActionId,
      amount: event.args.amount,
      transactionId: transactionOrderId,
      depositId: event.args.depositId,
    })
  ])
});

ponder.on("Escrow:DepositClosed", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  const participantId = ids.participant({ chainId: context.network.chainId, address: event.args.depositor })
  const participantActionId = ids.participantAction({ transactionId: transactionOrderId, participantId })
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    context.db.update(schema.deposit, {
      depositId: event.args.depositId,
    }).set({
      remaining: 0n,
      status: 'closed',
    }),
    context.db.insert(schema.depositClosed).values({
      orderId: logOrderId,
      participantId,
      participantActionId,
      transactionId: transactionOrderId,
      depositId: event.args.depositId,
    })
  ])
});

const getDeposit = async (depositId: bigint, context: Context) => {
  const deposit = await context.db.find(schema.deposit, {
    depositId,
  })
  if (!deposit) {
    throw new Error("Deposit not found")
  }
  return deposit
}

ponder.on("Escrow:DepositConversionRateUpdated", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    context.db.update(schema.deposit, {
      depositId: event.args.depositId,
    }).set({
      conversionRate: event.args.newConversionRate,
    }),
    getDeposit(event.args.depositId, context).then((deposit) => {
      const participantActionId = ids.participantAction({
        transactionId: transactionOrderId,
        participantId: deposit.participantId,
      })
      return context.db.insert(schema.depositConversionRateUpdated).values({
        orderId: logOrderId,
        conversionRate: event.args.newConversionRate,
        transactionId: transactionOrderId,
        depositId: event.args.depositId,
        currency: event.args.currency,
        verifier: event.args.verifier,
        participantId: deposit.participantId,
        participantActionId,
      })
    })
  ])
})

ponder.on("Escrow:DepositCurrencyAdded", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    getDeposit(event.args.depositId, context).then((deposit) => {
      const participantActionId = ids.participantAction({
        transactionId: transactionOrderId,
        participantId: deposit.participantId,
      })
      return context.db.insert(schema.depositCurrencyAdded).values({
        orderId: logOrderId,
        currency: event.args.currency,
        conversionRate: event.args.conversionRate,
        transactionId: transactionOrderId,
        depositId: event.args.depositId,
        verifier: event.args.verifier,
        participantId: deposit.participantId,
        participantActionId,
      })
    })
  ])
})

ponder.on("Escrow:IntentSignaled", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    getDeposit(event.args.depositId, context).then((deposit) => {
      const participantActionId = ids.participantAction({
        transactionId: transactionOrderId,
        participantId: deposit.participantId,
      })
      return context.db.insert(schema.intentSignaled).values({
        orderId: logOrderId,
        intentHash: event.args.intentHash,
        depositId: event.args.depositId,
        verifier: event.args.verifier,
        amount: event.args.amount,
        conversionRate: event.args.conversionRate,
        owner: event.args.owner,
        to: event.args.to,
        fiatCurrency: event.args.fiatCurrency,
        transactionId: transactionOrderId,
        participantId: deposit.participantId,
        participantActionId,
      })
    })
  ])
})

ponder.on("Escrow:IntentPruned", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    getDeposit(event.args.depositId, context).then((deposit) => {
      const participantActionId = ids.participantAction({
        transactionId: transactionOrderId,
        participantId: deposit.participantId,
      })
      return context.db.insert(schema.intentPruned).values({
        orderId: logOrderId,
        intentHash: event.args.intentHash,
        depositId: event.args.depositId,
        transactionId: transactionOrderId,
        participantId: deposit.participantId,
        participantActionId,
      })
    })
  ])
})

ponder.on("Escrow:IntentFulfilled", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  const ownerId = ids.participant({ chainId: context.network.chainId, address: event.args.owner })
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    getDeposit(event.args.depositId, context).then((deposit) => {
      const participantActionId = ids.participantAction({
        transactionId: transactionOrderId,
        participantId: deposit.participantId,
      })
      return context.db.insert(schema.intentFulfilled).values({
        orderId: logOrderId,
        intentHash: event.args.intentHash,
        depositId: event.args.depositId,
        transactionId: transactionOrderId,
        verifier: event.args.verifier,
        ownerId,
        to: event.args.to,
        amount: event.args.amount,
        sustainabilityFee: event.args.sustainabilityFee,
        verifierFee: event.args.verifierFee,
        participantId: deposit.participantId,
        participantActionId,
      })
    })
  ])
})

ponder.on("Escrow:PaymentVerifierAdded", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  const verifierId = event.args.verifier
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    context.db.insert(schema.paymentVerifierAdded).values({
      orderId: logOrderId,
      verifier: event.args.verifier,
      verifierId,
      feeShare: event.args.feeShare,
      transactionId: transactionOrderId,
    }),
    context.db.insert(schema.paymentVerifier).values({
      id: verifierId,
      verifier: event.args.verifier,
      feeShare: event.args.feeShare,
      active: true,
    }).onConflictDoNothing(),
  ])
})

ponder.on("Escrow:PaymentVerifierFeeShareUpdated", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  const verifierId = event.args.verifier
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    context.db.insert(schema.paymentVerifierFeeShareUpdated).values({
      orderId: logOrderId,
      verifier: event.args.verifier,
      verifierId,
      feeShare: event.args.feeShare,
      transactionId: transactionOrderId,
    }),
    context.db.update(schema.paymentVerifier, {
      id: verifierId,
    }).set({
      feeShare: event.args.feeShare,
    }),
  ])
})

ponder.on("Escrow:PaymentVerifierRemoved", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  const verifierId = event.args.verifier
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    context.db.insert(schema.paymentVerifierRemoved).values({
      orderId: logOrderId,
      verifier: event.args.verifier,
      verifierId,
      transactionId: transactionOrderId,
    }),
    context.db.update(schema.paymentVerifier, {
      id: verifierId,
    }).set({
      active: false,
    }),
  ])
})
