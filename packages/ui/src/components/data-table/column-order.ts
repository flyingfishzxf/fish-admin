export function moveColumnOrder(order: string[], sourceId: string, targetId: string): string[] {
  const from = order.indexOf(sourceId)
  const to = order.indexOf(targetId)
  if (from === -1 || to === -1 || from === to) return order

  const next = [...order]
  next.splice(from, 1)
  next.splice(to, 0, sourceId)
  return next
}
