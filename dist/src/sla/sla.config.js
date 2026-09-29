"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLA_HOURS = void 0;
exports.computeSlaDeadline = computeSlaDeadline;
const client_1 = require("@prisma/client");
/**
 * Resolution SLA in hours per priority level.
 * These are computed at ticket creation and stored as sla_deadline.
 */
exports.SLA_HOURS = {
    [client_1.TicketPriority.CRITICAL]: 4,
    [client_1.TicketPriority.HIGH]: 24,
    [client_1.TicketPriority.MEDIUM]: 48,
    [client_1.TicketPriority.LOW]: 72,
};
/**
 * Returns the SLA deadline Date for a given priority, starting from now.
 */
function computeSlaDeadline(priority, from = new Date()) {
    const hours = exports.SLA_HOURS[priority];
    return new Date(from.getTime() + hours * 60 * 60 * 1000);
}
