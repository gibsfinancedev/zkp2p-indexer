import { onchainTable, relations } from "ponder";

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
  depositReceived: many(depositReceived),
  depositWithdrawn: many(depositWithdrawn),
  depositClosed: many(depositClosed),
  depositConversionRateUpdated: many(depositConversionRateUpdated),
  depositCurrencyAdded: many(depositCurrencyAdded),
  intentSignaled: many(intentSignaled),
  intentPruned: many(intentPruned),
  intentFulfilled: many(intentFulfilled),
  participantActions: many(participantAction),
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

export const participantAction = onchainTable("participantAction", (t) => ({
  actionId: t.hex().notNull().primaryKey(),
  participantId: t.hex().notNull(),
  transactionId: t.hex().notNull(),
}));

export const participantActionReferences = relations(participantAction, ({ one, many }) => ({
  participant: one(participant, {
    fields: [participantAction.participantId],
    references: [participant.participantId],
  }),
  transaction: one(transaction, {
    fields: [participantAction.transactionId],
    references: [transaction.orderId],
  }),
  deposit: many(deposit),
  depositReceived: many(depositReceived),
  depositWithdrawn: many(depositWithdrawn),
  depositClosed: many(depositClosed),
  depositConversionRateUpdated: many(depositConversionRateUpdated),
  depositCurrencyAdded: many(depositCurrencyAdded),
  intentSignaled: many(intentSignaled),
  intentPruned: many(intentPruned),
  intentFulfilled: many(intentFulfilled),
}));

export const deposit = onchainTable("deposit", (t) => ({
  depositId: t.bigint().notNull().primaryKey(),
  transactionId: t.hex().notNull(),
  token: t.hex().notNull(),
  participantId: t.hex().notNull(),
  participantActionId: t.hex().notNull(),
  deposited: t.bigint().notNull(),
  remaining: t.bigint().notNull(),
  minAmount: t.bigint().notNull(),
  maxAmount: t.bigint().notNull(),
  // a deposit has an implicit state:
  // active: the deposit is still open
  // drained: the deposit is drained of funds but not yet withdrawn/closed
  // - the remaining balance is less than the minimum amount
  // - applied by the deposit or the verifier's terms
  // withdrawn: the deposit has been revoked by the owner
  // closed: the deposit is closed by successfully fulfilling the intent
  status: t.text().notNull(),
}));

export const depositReferences = relations(deposit, ({ one }) => ({
  transaction: one(transaction, {
    fields: [deposit.transactionId],
    references: [transaction.orderId],
  }),
  participantAction: one(participantAction, {
    fields: [deposit.participantActionId],
    references: [participantAction.actionId],
  }),
  participant: one(participant, {
    fields: [deposit.participantId],
    references: [participant.participantId],
  }),
}));

export const depositReceived = onchainTable("depositReceived", (t) => ({
  orderId: t.hex().primaryKey(),
  token: t.hex().notNull(),
  participantId: t.hex().notNull(),
  participantActionId: t.hex().notNull(),
  depositId: t.bigint().notNull(),
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
  participantAction: one(participantAction, {
    fields: [depositReceived.participantActionId],
    references: [participantAction.actionId],
  }),
}));

export const depositWithdrawn = onchainTable("depositWithdrawn", (t) => ({
  orderId: t.hex().primaryKey(),
  depositId: t.bigint().notNull(),
  participantId: t.hex().notNull(),
  participantActionId: t.hex().notNull(),
  amount: t.bigint().notNull(), // amount withdrawn
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
  participantAction: one(participantAction, {
    fields: [depositWithdrawn.participantActionId],
    references: [participantAction.actionId],
  }),
  transaction: one(transaction, {
    fields: [depositWithdrawn.transactionId],
    references: [transaction.orderId],
  }),
}));

export const depositClosed = onchainTable("depositClosed", (t) => ({
  orderId: t.hex().primaryKey(),
  depositId: t.bigint().notNull(),
  participantId: t.hex().notNull(),
  participantActionId: t.hex().notNull(),
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
  participantAction: one(participantAction, {
    fields: [depositClosed.participantActionId],
    references: [participantAction.actionId],
  }),
}));

export const depositConversionRateUpdated = onchainTable("depositConversionRateUpdated", (t) => ({
  orderId: t.hex().primaryKey(),
  conversionRate: t.bigint().notNull(),
  transactionId: t.hex().notNull(),
  depositId: t.bigint().notNull(),
  currency: t.hex().notNull(),
  verifier: t.hex().notNull(),
  participantActionId: t.hex().notNull(),
}));

export const depositConversionRateUpdatedReferences = relations(depositConversionRateUpdated, ({ one }) => ({
  transaction: one(transaction, {
    fields: [depositConversionRateUpdated.transactionId],
    references: [transaction.orderId],
  }),
  deposit: one(deposit, {
    fields: [depositConversionRateUpdated.depositId],
    references: [deposit.depositId],
  }),
  participantAction: one(participantAction, {
    fields: [depositConversionRateUpdated.participantActionId],
    references: [participantAction.actionId],
  }),
}));

export const depositCurrencyAdded = onchainTable("depositCurrencyAdded", (t) => ({
  orderId: t.hex().primaryKey(),
  depositId: t.bigint().notNull(),
  verifier: t.hex().notNull(),
  currency: t.hex().notNull(),
  conversionRate: t.bigint().notNull(),
  transactionId: t.hex().notNull(),
  participantId: t.hex().notNull(),
  participantActionId: t.hex().notNull(),
}));

export const depositCurrencyAddedReferences = relations(depositCurrencyAdded, ({ one }) => ({
  deposit: one(deposit, {
    fields: [depositCurrencyAdded.depositId],
    references: [deposit.depositId],
  }),
  transaction: one(transaction, {
    fields: [depositCurrencyAdded.transactionId],
    references: [transaction.orderId],
  }),
  participant: one(participant, {
    fields: [depositCurrencyAdded.participantId],
    references: [participant.participantId],
  }),
  participantAction: one(participantAction, {
    fields: [depositCurrencyAdded.participantActionId],
    references: [participantAction.actionId],
  }),
}));

export const intentSignaled = onchainTable("intentSignaled", (t) => ({
  orderId: t.hex().primaryKey(),
  intentHash: t.hex().notNull(),
  depositId: t.bigint().notNull(),
  verifier: t.hex().notNull(),
  owner: t.hex().notNull(),
  to: t.hex().notNull(),
  amount: t.bigint().notNull(),
  fiatCurrency: t.hex().notNull(),
  conversionRate: t.bigint().notNull(),
  transactionId: t.hex().notNull(),
  participantActionId: t.hex().notNull(),
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
  participantAction: one(participantAction, {
    fields: [intentSignaled.participantActionId],
    references: [participantAction.actionId],
  }),
}));

export const intentPruned = onchainTable("intentPruned", (t) => ({
  orderId: t.hex().primaryKey(),
  intentHash: t.hex().notNull(),
  depositId: t.bigint().notNull(),
  transactionId: t.hex().notNull(),
  participantActionId: t.hex().notNull(),
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
  participantAction: one(participantAction, {
    fields: [intentPruned.participantActionId],
    references: [participantAction.actionId],
  }),
}));

export const intentFulfilled = onchainTable("intentFulfilled", (t) => ({
  orderId: t.hex().primaryKey(),
  intentHash: t.hex().notNull(),
  depositId: t.bigint().notNull(),
  verifier: t.hex().notNull(),
  ownerId: t.hex().notNull(),
  to: t.hex().notNull(),
  amount: t.bigint().notNull(),
  sustainabilityFee: t.bigint().notNull(),
  verifierFee: t.bigint().notNull(),
  transactionId: t.hex().notNull(),
  participantId: t.hex().notNull(),
  participantActionId: t.hex().notNull(),
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
  participantAction: one(participantAction, {
    fields: [intentFulfilled.participantActionId],
    references: [participantAction.actionId],
  }),
  participant: one(participant, {
    fields: [intentFulfilled.participantId],
    references: [participant.participantId],
  }),
  owner: one(participant, {
    fields: [intentFulfilled.ownerId],
    references: [participant.participantId],
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
