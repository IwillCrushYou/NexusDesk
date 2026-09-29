"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlaCheckerJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
class SlaCheckerJob {
    prisma;
    task = null;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Start the job on a cron schedule.
     * Default: every 5 minutes.
     */
    start(schedule = '*/5 * * * *') {
        this.task = node_cron_1.default.schedule(schedule, () => {
            this.run().catch((err) => console.error('[SLA checker] Error:', err));
        });
        console.log('[SLA checker] Started — running on schedule:', schedule);
    }
    stop() {
        this.task?.stop();
        console.log('[SLA checker] Stopped');
    }
    /**
     * Core logic — can be called manually for testing.
     * Finds all unbreached tickets past their SLA deadline and flags them.
     */
    async run() {
        const now = new Date();
        const overdueTickets = await this.prisma.ticket.findMany({
            where: {
                slaBreached: false,
                slaDeadline: { lt: now },
                status: { notIn: [client_1.TicketStatus.RESOLVED, client_1.TicketStatus.CLOSED] },
            },
            select: {
                id: true,
                title: true,
                createdById: true,
                assignedToId: true,
            },
        });
        if (overdueTickets.length === 0)
            return;
        console.log(`[SLA checker] Flagging ${overdueTickets.length} overdue ticket(s)`);
        for (const ticket of overdueTickets) {
            // Atomic: mark breached + audit log + notifications in one transaction
            await this.prisma.$transaction(async (tx) => {
                // 1. Flag the ticket
                await tx.ticket.update({
                    where: { id: ticket.id },
                    data: { slaBreached: true },
                });
                // 2. Audit event
                await tx.ticketEvent.create({
                    data: {
                        ticketId: ticket.id,
                        actorId: ticket.createdById, // system event attributed to creator (no system user yet)
                        action: 'SLA_BREACHED',
                    },
                });
                // 3. Notify the ticket creator
                await tx.notification.create({
                    data: {
                        userId: ticket.createdById,
                        ticketId: ticket.id,
                        message: `Your ticket "${ticket.title}" has breached its SLA deadline.`,
                    },
                });
                // 4. Notify the assigned agent (if any, and not the same person)
                if (ticket.assignedToId && ticket.assignedToId !== ticket.createdById) {
                    await tx.notification.create({
                        data: {
                            userId: ticket.assignedToId,
                            ticketId: ticket.id,
                            message: `Assigned ticket "${ticket.title}" has breached its SLA deadline.`,
                        },
                    });
                }
            });
            console.log(`[SLA checker] Breached: ticket ${ticket.id} — "${ticket.title}"`);
        }
    }
}
exports.SlaCheckerJob = SlaCheckerJob;
