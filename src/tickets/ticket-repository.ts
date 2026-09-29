import { Prisma, PrismaClient, TicketPriority, TicketStatus, UserRole } from '@prisma/client';

// ---------------------------------------------------------------------------
// Derived types (fully typed Prisma payloads)
// ---------------------------------------------------------------------------

export type TicketWithRelations = Prisma.TicketGetPayload<{
  include: {
    createdBy: { select: { id: true; name: true; email: true; role: true } };
    assignedTo: { select: { id: true; name: true; email: true; role: true } };
    events: true;
    comments: {
      include: { author: { select: { id: true; name: true; role: true } } };
    };
  };
}>;

export type TicketSummary = Prisma.TicketGetPayload<{
  include: {
    createdBy: { select: { id: true; name: true; email: true } };
    assignedTo: { select: { id: true; name: true; email: true } };
  };
}>;

// ---------------------------------------------------------------------------
// Input / filter types
// ---------------------------------------------------------------------------

export type CreateTicketInput = {
  title: string;
  description: string;
  priority?: TicketPriority;
  slaDeadline?: Date;
  createdById: string;
  assignedToId?: string;
};

export type UpdateTicketData = {
  status?: TicketStatus;
  assignedToId?: string | null;
  resolvedAt?: Date | null;
};

export type TicketFilter = {
  createdById?: string;
  assignedToId?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
};

// ---------------------------------------------------------------------------
// Repository interface
// ---------------------------------------------------------------------------

export interface TicketRepository {
  create(input: CreateTicketInput): Promise<TicketWithRelations>;
  findById(id: string): Promise<TicketWithRelations | null>;
  findMany(filter: TicketFilter): Promise<TicketSummary[]>;
  update(id: string, data: UpdateTicketData): Promise<TicketWithRelations>;
  findLeastLoadedAgentId(): Promise<string | null>;
  logEvent(
    ticketId: string,
    actorId: string,
    action: string,
    oldValue?: string,
    newValue?: string,
  ): Promise<void>;
}

// ---------------------------------------------------------------------------
// Prisma implementation
// ---------------------------------------------------------------------------

const WITH_RELATIONS = {
  include: {
    createdBy: { select: { id: true, name: true, email: true, role: true } },
    assignedTo: { select: { id: true, name: true, email: true, role: true } },
    events: { orderBy: { timestamp: 'desc' as const } },
    comments: {
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' as const },
    },
  },
} satisfies Prisma.TicketDefaultArgs;

const WITH_SUMMARY = {
  include: {
    createdBy: { select: { id: true, name: true, email: true } },
    assignedTo: { select: { id: true, name: true, email: true } },
  },
} satisfies Prisma.TicketDefaultArgs;

export class PrismaTicketRepository implements TicketRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(input: CreateTicketInput) {
    return this.prisma.ticket.create({ data: input, ...WITH_RELATIONS });
  }

  findById(id: string) {
    return this.prisma.ticket.findUnique({ where: { id }, ...WITH_RELATIONS });
  }

  findMany(filter: TicketFilter) {
    return this.prisma.ticket.findMany({
      where: {
        ...(filter.createdById  && { createdById:  filter.createdById  }),
        ...(filter.assignedToId && { assignedToId: filter.assignedToId }),
        ...(filter.status       && { status:       filter.status       }),
        ...(filter.priority     && { priority:     filter.priority     }),
      },
      ...WITH_SUMMARY,
      orderBy: { createdAt: 'desc' },
    });
  }

  update(id: string, data: UpdateTicketData) {
    return this.prisma.ticket.update({ where: { id }, data, ...WITH_RELATIONS });
  }

  async findLeastLoadedAgentId(): Promise<string | null> {
    const agents = await this.prisma.user.findMany({
      where: { role: UserRole.AGENT },
      select: {
        id: true,
        _count: {
          select: {
            assignedTickets: {
              where: { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } },
            },
          },
        },
      },
      orderBy: { assignedTickets: { _count: 'asc' } },
    });
    return agents[0]?.id ?? null;
  }

  async logEvent(
    ticketId: string,
    actorId: string,
    action: string,
    oldValue?: string,
    newValue?: string,
  ): Promise<void> {
    await this.prisma.ticketEvent.create({
      data: { ticketId, actorId, action, oldValue, newValue },
    });
  }
}
