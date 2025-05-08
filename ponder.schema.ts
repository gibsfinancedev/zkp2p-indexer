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

export const transactionReferences = relations(transaction, ({ one }) => ({
  block: one(block, {
    fields: [transaction.blockId],
    references: [block.orderId],
  }),
}));

export const depositReceived = onchainTable("depositReceived", (t) => ({
  orderId: t.hex().primaryKey(),
  token: t.hex().notNull(),
  depositor: t.hex().notNull(),
  depositId: t.bigint().notNull(),
  amount: t.bigint().notNull(),
  transactionId: t.hex().notNull(),
}));

export const depositReceivedReferences = relations(depositReceived, ({ one }) => ({
  transaction: one(transaction, {
    fields: [depositReceived.transactionId],
    references: [transaction.orderId],
  }),
}));

export const depositWithdrawn = onchainTable("depositWithdrawn", (t) => ({
  orderId: t.hex().primaryKey(),
  depositId: t.bigint().notNull(),
  depositor: t.hex().notNull(),
  amount: t.bigint().notNull(), // amount withdrawn
  transactionId: t.hex().notNull(),
}));

export const depositWithdrawnReferences = relations(depositWithdrawn, ({ one }) => ({
  deposit: one(depositReceived, {
    fields: [depositWithdrawn.depositId],
    references: [depositReceived.depositId],
  }),
  transaction: one(transaction, {
    fields: [depositWithdrawn.transactionId],
    references: [transaction.orderId],
  }),
}));

export const depositClosed = onchainTable("depositClosed", (t) => ({
  orderId: t.hex().primaryKey(),
  depositId: t.bigint().notNull(),
  depositor: t.hex().notNull(),
  transactionId: t.hex().notNull(),
}));

export const depositClosedReferences = relations(depositClosed, ({ one }) => ({
  deposit: one(depositReceived, {
    fields: [depositClosed.depositId],
    references: [depositReceived.depositId],
  }),
  transaction: one(transaction, {
    fields: [depositClosed.transactionId],
    references: [transaction.orderId],
  }),
}));

export const depositConversionRateUpdated = onchainTable("depositConversionRateUpdated", (t) => ({
  orderId: t.hex().primaryKey(),
  conversionRate: t.bigint().notNull(),
  transactionId: t.hex().notNull(),
  depositId: t.bigint().notNull(),
  currency: t.hex().notNull(),
  verifier: t.hex().notNull(),
}));

export const depositConversionRateUpdatedReferences = relations(depositConversionRateUpdated, ({ one }) => ({
  transaction: one(transaction, {
    fields: [depositConversionRateUpdated.transactionId],
    references: [transaction.orderId],
  }),
  deposit: one(depositReceived, {
    fields: [depositConversionRateUpdated.depositId],
    references: [depositReceived.depositId],
  }),
}));

export const depositCurrencyAdded = onchainTable("depositCurrencyAdded", (t) => ({
  orderId: t.hex().primaryKey(),
  depositId: t.bigint().notNull(),
  verifier: t.hex().notNull(),
  currency: t.hex().notNull(),
  conversionRate: t.bigint().notNull(),
  transactionId: t.hex().notNull(),
}));

export const depositCurrencyAddedReferences = relations(depositCurrencyAdded, ({ one }) => ({
  deposit: one(depositReceived, {
    fields: [depositCurrencyAdded.depositId],
    references: [depositReceived.depositId],
  }),
  transaction: one(transaction, {
    fields: [depositCurrencyAdded.transactionId],
    references: [transaction.orderId],
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
}));

export const intentSignaledReferences = relations(intentSignaled, ({ one }) => ({
  transaction: one(transaction, {
    fields: [intentSignaled.transactionId],
    references: [transaction.orderId],
  }),
  deposit: one(depositReceived, {
    fields: [intentSignaled.depositId],
    references: [depositReceived.depositId],
  }),
}));

export const intentPruned = onchainTable("intentPruned", (t) => ({
  orderId: t.hex().primaryKey(),
  intentHash: t.hex().notNull(),
  depositId: t.bigint().notNull(),
  transactionId: t.hex().notNull(),
}));

export const intentPrunedReferences = relations(intentPruned, ({ one }) => ({
  transaction: one(transaction, {
    fields: [intentPruned.transactionId],
    references: [transaction.orderId],
  }),
  deposit: one(depositReceived, {
    fields: [intentPruned.depositId],
    references: [depositReceived.depositId],
  }),
}));

export const intentFulfilled = onchainTable("intentFulfilled", (t) => ({
  orderId: t.hex().primaryKey(),
  intentHash: t.hex().notNull(),
  depositId: t.bigint().notNull(),
  verifier: t.hex().notNull(),
  owner: t.hex().notNull(),
  to: t.hex().notNull(),
  amount: t.bigint().notNull(),
  sustainabilityFee: t.bigint().notNull(),
  verifierFee: t.bigint().notNull(),
  transactionId: t.hex().notNull(),
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

