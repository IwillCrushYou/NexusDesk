import { TicketPriority } from '@prisma/client';

/**
 * Resolution SLA in hours per priority level.
 * These are computed at ticket creation and stored as sla_deadline.
 */
export const SLA_HOURS: Record<TicketPriority, number> = {
  [TicketPriority.CRITICAL]: 4,
  [TicketPriority.HIGH]:     24,
  [TicketPriority.MEDIUM]:   48,
  [TicketPriority.LOW]:      72,
};

/**
 * Returns the SLA deadline Date for a given priority, starting from now.
 */
export function computeSlaDeadline(priority: TicketPriority, from = new Date()): Date {
  const hours = SLA_HOURS[priority];
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}
