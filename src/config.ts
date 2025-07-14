export const eventOrder = [
  // deposit open events
  'deposit',
  'verifier_added',
  'currency_added',
  // configuration events
  'rate_update',
  // intent events
  'intent',
  'exchange',
  'pruned',
  // deposit close events
  'withdrawal',
  'closed',
] as const

export type EventType = (typeof eventOrder)[number]

export const eventOrderId = new Map<EventType, number>(
  eventOrder.map((event, index) => [event, index] as [EventType, number])
)
