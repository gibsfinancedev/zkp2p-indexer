import { eq } from "ponder";
import { Context, ponder, Event } from "ponder:registry";
import * as schema from "ponder:schema";
import { concatHex, Hex, keccak256, numberToHex } from "viem";

const ids = {
  block: ({chainId, hash}: { chainId: bigint; hash: Hex }) => keccak256(concatHex([numberToHex(chainId, { size: 8}), hash])),
  transaction: ({ chainId, hash }: { chainId: bigint; hash: Hex }) => keccak256(concatHex([numberToHex(chainId, { size: 8 }), hash])),
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
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    context.db.insert(schema.depositReceived).values({
      orderId: logOrderId,
      token: event.args.token,
      depositor: event.args.depositor,
      amount: event.args.amount,
      transactionId: transactionOrderId,
      depositId: event.args.depositId,
    })
  ])
});

ponder.on("Escrow:DepositWithdrawn", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    context.db.insert(schema.depositWithdrawn).values({
      orderId: logOrderId,
      depositor: event.args.depositor,
      amount: event.args.amount,
      transactionId: transactionOrderId,
      depositId: event.args.depositId,
    })
  ])
});

ponder.on("Escrow:DepositClosed", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    context.db.insert(schema.depositClosed).values({
      orderId: logOrderId,
      depositor: event.args.depositor,
      transactionId: transactionOrderId,
      depositId: event.args.depositId,
    })
  ])
});

ponder.on("Escrow:DepositConversionRateUpdated", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    context.db.insert(schema.depositConversionRateUpdated).values({
      orderId: logOrderId,
      conversionRate: event.args.newConversionRate,
      transactionId: transactionOrderId,
      depositId: event.args.depositId,
      currency: event.args.currency,
      verifier: event.args.verifier,
    })
  ])
})

ponder.on("Escrow:DepositCurrencyAdded", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    context.db.insert(schema.depositCurrencyAdded).values({
      orderId: logOrderId,
      currency: event.args.currency,
      conversionRate: event.args.conversionRate,
      transactionId: transactionOrderId,
      depositId: event.args.depositId,
      verifier: event.args.verifier,
    })
  ])
})

ponder.on("Escrow:IntentSignaled", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    context.db.insert(schema.intentSignaled).values({
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
    })
  ])
})

ponder.on("Escrow:IntentPruned", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    context.db.insert(schema.intentPruned).values({
      orderId: logOrderId,
      intentHash: event.args.intentHash,
      depositId: event.args.depositId,
      transactionId: transactionOrderId,
    })
  ])
})

ponder.on("Escrow:IntentFulfilled", async ({ event, context }) => {
  const logOrderId = orderId.log({ event, context })
  const transactionOrderId = orderId.transaction({ event, context })
  await Promise.all([
    upsertBlock(event, context),
    upsertTransaction(event, context),
    context.db.insert(schema.intentFulfilled).values({
      orderId: logOrderId,
      intentHash: event.args.intentHash,
      depositId: event.args.depositId,
      transactionId: transactionOrderId,
      verifier: event.args.verifier,
      owner: event.args.owner,
      to: event.args.to,
      amount: event.args.amount,
      sustainabilityFee: event.args.sustainabilityFee,
      verifierFee: event.args.verifierFee,
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
