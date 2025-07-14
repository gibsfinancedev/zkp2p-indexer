import { onchainEnum, onchainTable, relations } from "ponder";

export const block = onchainTable("block", (t) => ({
  orderId: t.hex().primaryKey(),
  chainId: t.bigint().notNull(),
  number: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  hash: t.hex().notNull(),
}));

export const transaction = onchainTable("transaction", (t) => ({
  orderId: t.hex().primaryKey(),
  blockId: t.hex().notNull(),
  hash: t.hex().notNull(),
  index: t.bigint().notNull(),
  from: t.hex().notNull(),
  to: t.hex().notNull(), // which contract was called
}));

export const transactionReferences = relations(transaction, ({ one, many }) => ({
  block: one(block, {
    fields: [transaction.blockId],
    references: [block.orderId],
  }),
  deposits: many(deposit),
  depositReceiveds: many(depositReceived),
  depositWithdrawns: many(depositWithdrawn),
  depositCloseds: many(depositClosed),
  depositCurrencyAddeds: many(depositCurrencyAdded),
  depositConversionRateUpdateds: many(depositConversionRateUpdated),
  intentSignaleds: many(intentSignaled),
  intentPruneds: many(intentPruned),
  intentFulfilleds: many(intentFulfilled),
  actions: many(action),
}));

export const participant = onchainTable("participant", (t) => ({
  participantId: t.hex().notNull().primaryKey(),
  address: t.hex().notNull(),
  chainId: t.bigint().notNull(),
}));

export const participantReferences = relations(participant, ({ many }) => ({
  deposits: many(deposit),
  depositReceived: many(depositReceived),
  depositWithdrawn: many(depositWithdrawn),
}));

export const action = onchainTable("action", (t) => ({
  orderId: t.hex().notNull().primaryKey(),
  logId: t.hex().notNull(), // log order id - how everything is linked together
  participantId: t.hex().notNull(),
  transactionId: t.hex().notNull(),
  depositId: t.bigint().notNull(),
}));

export const actionReferences = relations(action, ({ one, many }) => ({
  participant: one(participant, {
    fields: [action.participantId],
    references: [participant.participantId],
  }),
  transaction: one(transaction, {
    fields: [action.transactionId],
    references: [transaction.orderId],
  }),
  deposit: one(deposit, {
    fields: [action.depositId],
    references: [deposit.depositId],
  }),
  depositReceiveds: many(depositReceived),
  depositWithdrawns: many(depositWithdrawn),
  depositCloseds: many(depositClosed),
  depositCurrencyAddeds: many(depositCurrencyAdded), // the event
  depositConversionRateUpdateds: many(depositConversionRateUpdated),
  intentSignaleds: many(intentSignaled),
  intentPruneds: many(intentPruned),
  intentFulfilleds: many(intentFulfilled),
}));

export const status = onchainEnum('status', ['active', 'underfunded', 'closed', 'withdrawn'])

export const deposit = onchainTable("deposit", (t) => ({
  depositId: t.bigint().notNull().primaryKey(),
  orderId: t.hex().notNull(),
  logId: t.hex().notNull(),
  transactionId: t.hex().notNull(),
  token: t.hex().notNull(),
  participantId: t.hex().notNull(),
  deposited: t.bigint().notNull(),
  remaining: t.bigint().notNull(),
  minAmount: t.bigint().notNull(),
  maxAmount: t.bigint().notNull(),
  depositConversionRateCurrencies: t.hex().array().notNull(),
  depositConversionRateVerifiers: t.hex().array().notNull(),
  // a deposit has an implicit state:
  // active: the deposit is still open
  // drained: the deposit is drained of funds but not yet withdrawn/closed
  // - the remaining balance is less than the minimum amount
  // - applied by the deposit or the verifier's terms
  // withdrawn: the deposit has been revoked by the owner
  // closed: the deposit is closed by successfully fulfilling the intent
  status: status('status').notNull(),
}));

export const depositReferences = relations(deposit, ({ one, many }) => ({
  transaction: one(transaction, {
    fields: [deposit.transactionId],
    references: [transaction.orderId],
  }),
  owner: one(participant, {
    fields: [deposit.participantId],
    references: [participant.participantId],
  }),
  depositCurrencyAddeds: many(depositCurrencyAdded),
  depositVerifierAddeds: many(depositVerifierAdded),
  depositConversionRateUpdateds: many(depositConversionRateUpdated),
  actions: many(action),
  depositReceiveds: many(depositReceived),
  depositWithdrawns: many(depositWithdrawn),
  depositCloseds: many(depositClosed),
  intentSignaleds: many(intentSignaled),
  intentPruneds: many(intentPruned),
  intentFulfilleds: many(intentFulfilled),
  depositDeltas: many(depositDelta),
  depositVerifiers: many(depositVerifierAdded),
}));

export const depositDelta = onchainTable("depositDelta", (t) => ({
  orderId: t.hex().primaryKey(),
  logId: t.hex().notNull(),
  depositId: t.bigint().notNull(),
  amountBefore: t.bigint().notNull(),
  delta: t.bigint().notNull(),
  amountAfter: t.bigint().notNull(),
}));

export const depositDeltaReferences = relations(depositDelta, ({ one }) => ({
  deposit: one(deposit, {
    fields: [depositDelta.depositId],
    references: [deposit.depositId],
  }),
  action: one(action, {
    fields: [depositDelta.logId],
    references: [action.logId],
  }),
}));

// a conversion rate is a rate for a specific currency, verifier, and deposit
// it is unique for each update to the rate track, so if you change
// from 1.01 to 1.02, to 1.01, you will have three rates, and the conversionRateId
// will be different for each rate
export const depositConversionRateUpdated = onchainTable("depositConversionRateUpdated", (t) => ({
  depositConversionRateUpdatedId: t.hex().primaryKey(),
  orderId: t.hex().notNull(),
  logId: t.hex().notNull(),
  transactionId: t.hex().notNull(),
  // shared between all updates for a given deposit, currency, verifier combo
  depositVerifierAddedId: t.hex().notNull(),
  depositCurrencyAddedId: t.hex().notNull(),
  // inputs to track
  currency: t.hex().notNull(),
  verifier: t.hex().notNull(),
  depositId: t.bigint().notNull(),
  // specific input to this rate
  changeId: t.integer().notNull(),
  // actual value!
  value: t.bigint().notNull(),
  active: t.boolean().notNull(),
}));

export const depositConversionRateUpdatedReferences = relations(depositConversionRateUpdated, ({ one }) => ({
  deposit: one(deposit, {
    fields: [depositConversionRateUpdated.depositId],
    references: [deposit.depositId],
  }),
  depositVerifierAdded: one(depositVerifierAdded, {
    fields: [depositConversionRateUpdated.depositVerifierAddedId],
    references: [depositVerifierAdded.depositVerifierAddedId],
  }),
  depositCurrencyAdded: one(depositCurrencyAdded, {
    fields: [depositConversionRateUpdated.depositCurrencyAddedId],
    references: [depositCurrencyAdded.depositCurrencyAddedId],
  }),
  transaction: one(transaction, {
    fields: [depositConversionRateUpdated.transactionId],
    references: [transaction.orderId],
  }),
  action: one(action, {
    fields: [depositConversionRateUpdated.logId],
    references: [action.logId],
  }),
}));

export const depositReceived = onchainTable("depositReceived", (t) => ({
  depositId: t.bigint().primaryKey(),
  orderId: t.hex().notNull(),
  logId: t.hex().notNull(),
  token: t.hex().notNull(),
  participantId: t.hex().notNull(),
  amount: t.bigint().notNull(),
  transactionId: t.hex().notNull(),
}));

export const depositReceivedReferences = relations(depositReceived, ({ one }) => ({
  transaction: one(transaction, {
    fields: [depositReceived.transactionId],
    references: [transaction.orderId],
  }),
  deposit: one(deposit, {
    fields: [depositReceived.depositId],
    references: [deposit.depositId],
  }),
  participant: one(participant, {
    fields: [depositReceived.participantId],
    references: [participant.participantId],
  }),
  action: one(action, {
    fields: [depositReceived.logId],
    references: [action.logId],
  }),
  depositDelta: one(depositDelta, {
    fields: [depositReceived.logId],
    references: [depositDelta.logId],
  }),
}));

export const depositWithdrawn = onchainTable("depositWithdrawn", (t) => ({
  orderId: t.hex().primaryKey(),
  logId: t.hex().notNull(),
  depositId: t.bigint().notNull(),
  participantId: t.hex().notNull(),
  amount: t.bigint().notNull(), // amount sent to owner during withdrawal
  transactionId: t.hex().notNull(),
}));

export const depositWithdrawnReferences = relations(depositWithdrawn, ({ one }) => ({
  deposit: one(deposit, {
    fields: [depositWithdrawn.depositId],
    references: [deposit.depositId],
  }),
  participant: one(participant, {
    fields: [depositWithdrawn.participantId],
    references: [participant.participantId],
  }),
  action: one(action, {
    fields: [depositWithdrawn.logId],
    references: [action.logId],
  }),
  transaction: one(transaction, {
    fields: [depositWithdrawn.transactionId],
    references: [transaction.orderId],
  }),
  depositDelta: one(depositDelta, {
    fields: [depositWithdrawn.logId],
    references: [depositDelta.logId],
  }),
}));

export const depositClosed = onchainTable("depositClosed", (t) => ({
  orderId: t.hex().notNull(),
  logId: t.hex().notNull(),
  depositId: t.bigint().primaryKey(),
  participantId: t.hex().notNull(),
  transactionId: t.hex().notNull(),
}));

export const depositClosedReferences = relations(depositClosed, ({ one }) => ({
  participant: one(participant, {
    fields: [depositClosed.participantId],
    references: [participant.participantId],
  }),
  deposit: one(deposit, {
    fields: [depositClosed.depositId],
    references: [deposit.depositId],
  }),
  transaction: one(transaction, {
    fields: [depositClosed.transactionId],
    references: [transaction.orderId],
  }),
  action: one(action, {
    fields: [depositClosed.logId],
    references: [action.logId],
  }),
}));

export const depositCurrencyAdded = onchainTable("depositCurrencyAdded", (t) => ({
  depositCurrencyAddedId: t.hex().primaryKey(),
  orderId: t.hex().notNull(),
  logId: t.hex().notNull(),
  depositId: t.bigint().notNull(),
  verifier: t.hex().notNull(),
  currency: t.hex().notNull(),
  participantId: t.hex().notNull(),
  depositVerifierAddedId: t.hex().notNull(),
  currentDepositConversionRateUpdatedId: t.hex().notNull(),
  transactionId: t.hex().notNull(),
}));

export const depositCurrencyAddedReferences = relations(depositCurrencyAdded, ({ one, many }) => ({
  deposit: one(deposit, {
    fields: [depositCurrencyAdded.depositId],
    references: [deposit.depositId],
  }),
  transaction: one(transaction, {
    fields: [depositCurrencyAdded.transactionId],
    references: [transaction.orderId],
  }),
  depositVerifierAdded: one(depositVerifierAdded, {
    fields: [depositCurrencyAdded.depositVerifierAddedId],
    references: [depositVerifierAdded.depositVerifierAddedId],
  }),
  currentDepositConversionRateUpdated: one(depositConversionRateUpdated, {
    fields: [depositCurrencyAdded.currentDepositConversionRateUpdatedId],
    references: [depositConversionRateUpdated.depositConversionRateUpdatedId], // the current rate for this track
  }),
  depositConversionRateUpdateds: many(depositConversionRateUpdated),
  participant: one(participant, {
    fields: [depositCurrencyAdded.participantId],
    references: [participant.participantId],
  }),
  action: one(action, {
    fields: [depositCurrencyAdded.logId],
    references: [action.logId],
  }),
}));

export const payeeDetails = onchainTable("payeeDetails", (t) => ({
  payeeDetailsId: t.hex().primaryKey(), // hash of the payee details
  intentGatingService: t.hex().notNull(),
  payeeDetails: t.hex().notNull(),
  data: t.hex().notNull(),
}));

export const depositVerifierAdded = onchainTable("depositVerifierAdded", (t) => ({
  depositVerifierAddedId: t.hex().primaryKey(),
  orderId: t.hex().notNull(),
  logId: t.hex().notNull(),
  depositId: t.bigint().notNull(),
  verifier: t.hex().notNull(),
  transactionId: t.hex().notNull(),
  participantId: t.hex().notNull(),
  payeeDetailsHash: t.hex().notNull(),
  intentGatingService: t.hex().notNull(),
}));

export const depositVerifierAddedReferences = relations(depositVerifierAdded, ({ one, many }) => ({
  deposit: one(deposit, {
    fields: [depositVerifierAdded.depositId],
    references: [deposit.depositId],
  }),
  participant: one(participant, {
    fields: [depositVerifierAdded.participantId],
    references: [participant.participantId],
  }),
  transaction: one(transaction, {
    fields: [depositVerifierAdded.transactionId],
    references: [transaction.orderId],
  }),
  depositCurrencyAdded: many(depositCurrencyAdded),
  depositConversionRateUpdated: many(depositConversionRateUpdated),
  payeeDetails: one(payeeDetails, {
    fields: [depositVerifierAdded.payeeDetailsHash],
    references: [payeeDetails.payeeDetailsId],
  }),
}));

export const intentSignaled = onchainTable("intentSignaled", (t) => ({
  intentHash: t.hex().notNull().primaryKey(),
  orderId: t.hex().notNull(),
  depositId: t.bigint().notNull(),
  verifier: t.hex().notNull(),
  owner: t.hex().notNull(),
  to: t.hex().notNull(),
  amount: t.bigint().notNull(),
  currency: t.hex().notNull(),
  depositVerifierAddedId: t.hex().notNull(),
  depositCurrencyAddedId: t.hex().notNull(),
  depositConversionRateUpdatedId: t.hex().notNull(),
  transactionId: t.hex().notNull(),
  logId: t.hex().notNull(),
  participantId: t.hex().notNull(),
}));

export const intentSignaledReferences = relations(intentSignaled, ({ one }) => ({
  transaction: one(transaction, {
    fields: [intentSignaled.transactionId],
    references: [transaction.orderId],
  }),
  deposit: one(deposit, {
    fields: [intentSignaled.depositId],
    references: [deposit.depositId],
  }),
  depositVerifierAdded: one(depositVerifierAdded, {
    fields: [intentSignaled.depositVerifierAddedId],
    references: [depositVerifierAdded.depositVerifierAddedId],
  }),
  depositCurrencyAdded: one(depositCurrencyAdded, {
    fields: [intentSignaled.depositCurrencyAddedId],
    references: [depositCurrencyAdded.depositCurrencyAddedId],
  }),
  depositConversionRateUpdated: one(depositConversionRateUpdated, {
    fields: [intentSignaled.depositConversionRateUpdatedId],
    references: [depositConversionRateUpdated.depositConversionRateUpdatedId],
  }),
  action: one(action, {
    fields: [intentSignaled.orderId],
    references: [action.orderId],
  }),
  participant: one(participant, {
    fields: [intentSignaled.participantId],
    references: [participant.participantId],
  }),
}));

export const intentPruned = onchainTable("intentPruned", (t) => ({
  orderId: t.hex().primaryKey(),
  logId: t.hex().notNull(),
  intentHash: t.hex().notNull(),
  depositId: t.bigint().notNull(),
  transactionId: t.hex().notNull(),
  participantId: t.hex().notNull(),
}));

export const intentPrunedReferences = relations(intentPruned, ({ one }) => ({
  transaction: one(transaction, {
    fields: [intentPruned.transactionId],
    references: [transaction.orderId],
  }),
  deposit: one(deposit, {
    fields: [intentPruned.depositId],
    references: [deposit.depositId],
  }),
  action: one(action, {
    fields: [intentPruned.orderId],
    references: [action.orderId],
  }),
  participant: one(participant, {
    fields: [intentPruned.participantId],
    references: [participant.participantId],
  }),
}));

export const intentFulfilled = onchainTable("intentFulfilled", (t) => ({
  orderId: t.hex().primaryKey(),
  intentHash: t.hex().notNull(),
  depositId: t.bigint().notNull(),
  verifier: t.hex().notNull(),
  currency: t.hex().notNull(),
  ownerId: t.hex().notNull(),
  to: t.hex().notNull(),
  amount: t.bigint().notNull(),
  sustainabilityFee: t.bigint().notNull(),
  verifierFee: t.bigint().notNull(),
  transactionId: t.hex().notNull(),
  participantId: t.hex().notNull(),
  logId: t.hex().notNull(),
  depositVerifierAddedId: t.hex().notNull(),
  depositCurrencyAddedId: t.hex().notNull(),
  depositConversionRateUpdatedId: t.hex().notNull(),
}));

export const intentFulfilledReferences = relations(intentFulfilled, ({ one }) => ({
  transaction: one(transaction, {
    fields: [intentFulfilled.transactionId],
    references: [transaction.orderId],
  }),
  deposit: one(deposit, {
    fields: [intentFulfilled.depositId],
    references: [deposit.depositId],
  }),
  action: one(action, {
    fields: [intentFulfilled.logId],
    references: [action.logId],
  }),
  participant: one(participant, {
    fields: [intentFulfilled.participantId],
    references: [participant.participantId],
  }),
  owner: one(participant, {
    fields: [intentFulfilled.ownerId],
    references: [participant.participantId],
  }),
  depositCurrencyAdded: one(depositCurrencyAdded, {
    fields: [intentFulfilled.depositCurrencyAddedId],
    references: [depositCurrencyAdded.depositCurrencyAddedId],
  }),
  depositVerifierAdded: one(depositVerifierAdded, {
    fields: [intentFulfilled.depositVerifierAddedId],
    references: [depositVerifierAdded.depositVerifierAddedId],
  }),
  depositConversionRateUpdated: one(depositConversionRateUpdated, {
    fields: [intentFulfilled.depositConversionRateUpdatedId],
    references: [depositConversionRateUpdated.depositConversionRateUpdatedId],
  }),
  depositDelta: one(depositDelta, {
    fields: [intentFulfilled.logId],
    references: [depositDelta.logId],
  }),
}));

// updateable
export const paymentVerifier = onchainTable("paymentVerifier", (t) => ({
  id: t.hex().primaryKey(),
  verifier: t.hex().notNull(),
  feeShare: t.bigint().notNull(),
  active: t.boolean().notNull(),
}));

export const paymentVerifierAdded = onchainTable("paymentVerifierAdded", (t) => ({
  orderId: t.hex().primaryKey(),
  verifier: t.hex().notNull(),
  verifierId: t.hex().notNull(),
  feeShare: t.bigint().notNull(),
  transactionId: t.hex().notNull(),
}));

export const paymentVerifierAddedReferences = relations(paymentVerifierAdded, ({ one }) => ({
  transaction: one(transaction, {
    fields: [paymentVerifierAdded.transactionId],
    references: [transaction.orderId],
  }),
  paymentVerifier: one(paymentVerifier, {
    fields: [paymentVerifierAdded.verifierId],
    references: [paymentVerifier.id],
  }),
}));

export const paymentVerifierFeeShareUpdated = onchainTable("paymentVerifierFeeShareUpdated", (t) => ({
  orderId: t.hex().primaryKey(),
  verifier: t.hex().notNull(),
  verifierId: t.hex().notNull(),
  feeShare: t.bigint().notNull(),
  transactionId: t.hex().notNull(),
}));

export const paymentVerifierFeeShareUpdatedReferences = relations(paymentVerifierFeeShareUpdated, ({ one }) => ({
  transaction: one(transaction, {
    fields: [paymentVerifierFeeShareUpdated.transactionId],
    references: [transaction.orderId],
  }),
  verifier: one(paymentVerifier, {
    fields: [paymentVerifierFeeShareUpdated.verifierId],
    references: [paymentVerifier.id],
  }),
}));

export const paymentVerifierRemoved = onchainTable("paymentVerifierRemoved", (t) => ({
  orderId: t.hex().primaryKey(),
  verifier: t.hex().notNull(),
  verifierId: t.hex().notNull(),
  transactionId: t.hex().notNull(),
}));

export const paymentVerifierRemovedReferences = relations(paymentVerifierRemoved, ({ one }) => ({
  transaction: one(transaction, {
    fields: [paymentVerifierRemoved.transactionId],
    references: [transaction.orderId],
  }),
  verifier: one(paymentVerifier, {
    fields: [paymentVerifierRemoved.verifierId],
    references: [paymentVerifier.id],
  }),
}));

export const stat = onchainTable("stat", (t) => ({
  orderId: t.hex().primaryKey(), // timestamp truncated to the hour, day, week + action id
  type: t.text().notNull(), // hour, day, week
  action: t.text().notNull(), // deposit / withdrawal
  amount: t.bigint().notNull(), // amount of the currency moved
  currency: t.hex(), // currency
  token: t.hex().notNull(), // token
  verifier: t.hex().notNull(), // verifier
}));
