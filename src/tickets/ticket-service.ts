import { TicketPriority, TicketStatus, UserRole } from '@prisma/client';
import { TicketFilter, TicketRepository, TicketWithRelations } from './ticket-repository';
import { computeSlaDeadline } from '../sla/sla.config';

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class TicketError extends Error {
  constructor(
    public readonly code:
      | 'NOT_FOUND'
      | 'FORBIDDEN'
      | 'INVALID_TRANSITION'
      | 'NO_AGENTS',
  ) {
    super(code);
  }
}

// ---------------------------------------------------------------------------
// State machine
// Valid transitions: current status → allowed next statuses
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.OPEN]:        [TicketStatus.IN_PROGRESS],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.RESOLVED, TicketStatus.OPEN],
  [TicketStatus.RESOLVED]:    [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
  [TicketStatus.CLOSED]:      [TicketStatus.OPEN],
};

// ---------------------------------------------------------------------------
// Actor type (subset of req.user)
// ---------------------------------------------------------------------------

export type Actor = { id: string; role: UserRole };

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class TicketService {
  constructor(private readonly tickets: TicketRepository) {}

  // --- Create ----------------------------------------------------------------

  async createTicket(
    actor: Actor,
    input: {
      title: string;
      description: string;
      priority?: TicketPriority;
      slaDeadline?: Date;
    },
    autoAssign = false,
  ) {
    let assignedToId: string | undefined;

    if (autoAssign) {
      const agentId = await this.tickets.findLeastLoadedAgentId();
      if (!agentId) throw new TicketError('NO_AGENTS');
      assignedToId = agentId;
    }

    const { title, description } = input;
    const priority    = input.priority ?? TicketPriority.MEDIUM;
    const slaDeadline = input.slaDeadline ?? computeSlaDeadline(priority);

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

  async listTickets(
    actor: Actor,
    query: { status?: TicketStatus; priority?: TicketPriority },
  ) {
    const filter: TicketFilter = { ...query };

    switch (actor.role) {
      case UserRole.EMPLOYEE:
        filter.createdById = actor.id;   // employees see only their own
        break;
      case UserRole.AGENT:
        filter.assignedToId = actor.id;  // agents see only their assigned
        break;
      // ADMIN: no scope restriction — sees everything
    }

    return this.tickets.findMany(filter);
  }

  // --- Get by id -------------------------------------------------------------

  async getTicket(actor: Actor, ticketId: string): Promise<TicketWithRelations> {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) throw new TicketError('NOT_FOUND');
    this.assertCanView(actor, ticket);
    return ticket;
  }

  // --- Update status ---------------------------------------------------------

  async updateStatus(actor: Actor, ticketId: string, newStatus: TicketStatus) {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) throw new TicketError('NOT_FOUND');

    const allowed = VALID_TRANSITIONS[ticket.status];
    if (!allowed.includes(newStatus)) {
      throw new TicketError('INVALID_TRANSITION');
    }

    // Manage resolvedAt automatically
    const resolvedAt =
      newStatus === TicketStatus.RESOLVED ? new Date()
      : newStatus === TicketStatus.OPEN || newStatus === TicketStatus.IN_PROGRESS ? null
      : undefined; // CLOSED — leave resolvedAt unchanged

    const updated = await this.tickets.update(ticketId, { status: newStatus, resolvedAt });
    await this.tickets.logEvent(ticketId, actor.id, 'STATUS_CHANGED', ticket.status, newStatus);
    return updated;
  }

  // --- Manual assign ---------------------------------------------------------

  async assignTicket(actor: Actor, ticketId: string, assigneeId: string | null) {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) throw new TicketError('NOT_FOUND');

    const updated = await this.tickets.update(ticketId, { assignedToId: assigneeId });
    await this.tickets.logEvent(
      ticketId,
      actor.id,
      'ASSIGNED',
      ticket.assignedToId ?? undefined,
      assigneeId ?? undefined,
    );
    return updated;
  }

  // --- Auto-assign to least-loaded agent ------------------------------------

  async autoAssign(actor: Actor, ticketId: string) {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) throw new TicketError('NOT_FOUND');

    const agentId = await this.tickets.findLeastLoadedAgentId();
    if (!agentId) throw new TicketError('NO_AGENTS');

    const updated = await this.tickets.update(ticketId, { assignedToId: agentId });
    await this.tickets.logEvent(
      ticketId,
      actor.id,
      'AUTO_ASSIGNED',
      ticket.assignedToId ?? undefined,
      agentId,
    );
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private assertCanView(actor: Actor, ticket: TicketWithRelations) {
    if (actor.role === UserRole.ADMIN) return;
    if (actor.role === UserRole.AGENT && ticket.assignedToId === actor.id) return;
    if (actor.role === UserRole.EMPLOYEE && ticket.createdById === actor.id) return;
    throw new TicketError('FORBIDDEN');
  }
}
