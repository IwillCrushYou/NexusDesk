"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaTicketRepository = void 0;
const client_1 = require("@prisma/client");
// ---------------------------------------------------------------------------
// Prisma implementation
// ---------------------------------------------------------------------------
const WITH_RELATIONS = {
    include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        events: { orderBy: { timestamp: 'desc' } },
        comments: {
            include: { author: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'asc' },
        },
    },
};
const WITH_SUMMARY = {
    include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
    },
};
class PrismaTicketRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.ticket.create({ data: input, ...WITH_RELATIONS });
    }
    findById(id) {
        return this.prisma.ticket.findUnique({ where: { id }, ...WITH_RELATIONS });
    }
    findMany(filter) {
        return this.prisma.ticket.findMany({
            where: {
                ...(filter.createdById && { createdById: filter.createdById }),
                ...(filter.assignedToId && { assignedToId: filter.assignedToId }),
                ...(filter.status && { status: filter.status }),
                ...(filter.priority && { priority: filter.priority }),
            },
            ...WITH_SUMMARY,
            orderBy: { createdAt: 'desc' },
        });
    }
    update(id, data) {
        return this.prisma.ticket.update({ where: { id }, data, ...WITH_RELATIONS });
    }
    async findLeastLoadedAgentId() {
        const agents = await this.prisma.user.findMany({
            where: { role: client_1.UserRole.AGENT },
            select: {
                id: true,
                _count: {
                    select: {
                        assignedTickets: {
                            where: { status: { in: [client_1.TicketStatus.OPEN, client_1.TicketStatus.IN_PROGRESS] } },
                        },
                    },
                },
            },
            orderBy: { assignedTickets: { _count: 'asc' } },
        });
        return agents[0]?.id ?? null;
    }
    async logEvent(ticketId, actorId, action, oldValue, newValue) {
        await this.prisma.ticketEvent.create({
            data: { ticketId, actorId, action, oldValue, newValue },
        });
    }
}
exports.PrismaTicketRepository = PrismaTicketRepository;
