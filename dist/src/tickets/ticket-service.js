"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketService = exports.TicketError = void 0;
const client_1 = require("@prisma/client");
const sla_config_1 = require("../sla/sla.config");
// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------
class TicketError extends Error {
    code;
    constructor(code) {
        super(code);
        this.code = code;
    }
}
exports.TicketError = TicketError;
// ---------------------------------------------------------------------------
// State machine
// Valid transitions: current status → allowed next statuses
// ---------------------------------------------------------------------------
const VALID_TRANSITIONS = {
    [client_1.TicketStatus.OPEN]: [client_1.TicketStatus.IN_PROGRESS],
    [client_1.TicketStatus.IN_PROGRESS]: [client_1.TicketStatus.RESOLVED, client_1.TicketStatus.OPEN],
    [client_1.TicketStatus.RESOLVED]: [client_1.TicketStatus.CLOSED, client_1.TicketStatus.IN_PROGRESS],
    [client_1.TicketStatus.CLOSED]: [client_1.TicketStatus.OPEN],
};
// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
class TicketService {
    tickets;
    constructor(tickets) {
        this.tickets = tickets;
    }
    // --- Create ----------------------------------------------------------------
    async createTicket(actor, input, autoAssign = false) {
        let assignedToId;
        if (autoAssign) {
            const agentId = await this.tickets.findLeastLoadedAgentId();
            if (!agentId)
                throw new TicketError('NO_AGENTS');
            assignedToId = agentId;
        }
        const { title, description } = input;
        const priority = input.priority ?? client_1.TicketPriority.MEDIUM;
        const slaDeadline = input.slaDeadline ?? (0, sla_config_1.computeSlaDeadline)(priority);
        const ticket = await this.tickets.create({
            title,
            description,
            priority,
            slaDeadline,
            createdById: actor.id,
            assignedToId,
        });
        // Audit log
        await this.tickets.logEvent(ticket.id, actor.id, 'CREATED');
        if (assignedToId) {
            await this.tickets.logEvent(ticket.id, actor.id, 'AUTO_ASSIGNED', undefined, assignedToId);
        }
        return ticket;
    }
    // --- List ------------------------------------------------------------------
    async listTickets(actor, query) {
        const filter = { ...query };
        switch (actor.role) {
            case client_1.UserRole.EMPLOYEE:
                filter.createdById = actor.id; // employees see only their own
                break;
            case client_1.UserRole.AGENT:
                filter.assignedToId = actor.id; // agents see only their assigned
                break;
            // ADMIN: no scope restriction — sees everything
        }
        return this.tickets.findMany(filter);
    }
    // --- Get by id -------------------------------------------------------------
    async getTicket(actor, ticketId) {
        const ticket = await this.tickets.findById(ticketId);
        if (!ticket)
            throw new TicketError('NOT_FOUND');
        this.assertCanView(actor, ticket);
        return ticket;
    }
    // --- Update status ---------------------------------------------------------
    async updateStatus(actor, ticketId, newStatus) {
        const ticket = await this.tickets.findById(ticketId);
        if (!ticket)
            throw new TicketError('NOT_FOUND');
        const allowed = VALID_TRANSITIONS[ticket.status];
        if (!allowed.includes(newStatus)) {
            throw new TicketError('INVALID_TRANSITION');
        }
        // Manage resolvedAt automatically
        const resolvedAt = newStatus === client_1.TicketStatus.RESOLVED ? new Date()
            : newStatus === client_1.TicketStatus.OPEN || newStatus === client_1.TicketStatus.IN_PROGRESS ? null
                : undefined; // CLOSED — leave resolvedAt unchanged
        const updated = await this.tickets.update(ticketId, { status: newStatus, resolvedAt });
        await this.tickets.logEvent(ticketId, actor.id, 'STATUS_CHANGED', ticket.status, newStatus);
        return updated;
    }
    // --- Manual assign ---------------------------------------------------------
    async assignTicket(actor, ticketId, assigneeId) {
        const ticket = await this.tickets.findById(ticketId);
        if (!ticket)
            throw new TicketError('NOT_FOUND');
        const updated = await this.tickets.update(ticketId, { assignedToId: assigneeId });
        await this.tickets.logEvent(ticketId, actor.id, 'ASSIGNED', ticket.assignedToId ?? undefined, assigneeId ?? undefined);
        return updated;
    }
    // --- Auto-assign to least-loaded agent ------------------------------------
    async autoAssign(actor, ticketId) {
        const ticket = await this.tickets.findById(ticketId);
        if (!ticket)
            throw new TicketError('NOT_FOUND');
        const agentId = await this.tickets.findLeastLoadedAgentId();
        if (!agentId)
            throw new TicketError('NO_AGENTS');
        const updated = await this.tickets.update(ticketId, { assignedToId: agentId });
        await this.tickets.logEvent(ticketId, actor.id, 'AUTO_ASSIGNED', ticket.assignedToId ?? undefined, agentId);
        return updated;
    }
    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------
    assertCanView(actor, ticket) {
        if (actor.role === client_1.UserRole.ADMIN)
            return;
        if (actor.role === client_1.UserRole.AGENT && ticket.assignedToId === actor.id)
            return;
        if (actor.role === client_1.UserRole.EMPLOYEE && ticket.createdById === actor.id)
            return;
        throw new TicketError('FORBIDDEN');
    }
}
exports.TicketService = TicketService;
