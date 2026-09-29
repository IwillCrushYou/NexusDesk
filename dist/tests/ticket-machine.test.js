"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const client_1 = require("@prisma/client");
const ticket_service_1 = require("../src/tickets/ticket-service");
// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
class MockTicketRepository {
    tickets = [];
    events = [];
    async create(input) {
        const t = { id: 't1', ...input, status: client_1.TicketStatus.OPEN };
        this.tickets.push(t);
        return t;
    }
    async findById(id) { return this.tickets.find(t => t.id === id) || null; }
    async findMany(f) { return []; }
    async update(id, data) {
        const t = this.tickets.find(t => t.id === id);
        Object.assign(t, data);
        return t;
    }
    async findLeastLoadedAgentId() { return 'agent1'; }
    async logEvent(t, act, action, o, n) {
        this.events.push({ action, o, n });
    }
}
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('TicketService State Machine', () => {
    let repo;
    let service;
    const adminActor = { id: 'admin1', role: client_1.UserRole.ADMIN };
    (0, vitest_1.beforeEach)(() => {
        repo = new MockTicketRepository();
        service = new ticket_service_1.TicketService(repo);
        // Seed an initial OPEN ticket
        repo.tickets.push({
            id: 't-open',
            status: client_1.TicketStatus.OPEN,
            createdById: 'emp1',
            assignedToId: 'agent1',
            title: 'Help',
        });
    });
    (0, vitest_1.it)('allows transition from OPEN to IN_PROGRESS', async () => {
        const ticket = await service.updateStatus(adminActor, 't-open', client_1.TicketStatus.IN_PROGRESS);
        (0, vitest_1.expect)(ticket.status).toBe(client_1.TicketStatus.IN_PROGRESS);
        // Auto-resolvedAt should be null
        (0, vitest_1.expect)(ticket.resolvedAt).toBe(null);
    });
    (0, vitest_1.it)('blocks invalid transition from OPEN directly to CLOSED', async () => {
        await (0, vitest_1.expect)(service.updateStatus(adminActor, 't-open', client_1.TicketStatus.CLOSED))
            .rejects.toThrowError(new ticket_service_1.TicketError('INVALID_TRANSITION'));
    });
    (0, vitest_1.it)('auto-sets resolvedAt when transitioning to RESOLVED', async () => {
        // Force ticket to IN_PROGRESS first
        repo.tickets[0].status = client_1.TicketStatus.IN_PROGRESS;
        // Mock system time to check resolvedAt explicitly
        vitest_1.vi.useFakeTimers();
        const mockNow = new Date('2024-10-10T12:00:00Z');
        vitest_1.vi.setSystemTime(mockNow);
        const ticket = await service.updateStatus(adminActor, 't-open', client_1.TicketStatus.RESOLVED);
        (0, vitest_1.expect)(ticket.status).toBe(client_1.TicketStatus.RESOLVED);
        (0, vitest_1.expect)(ticket.resolvedAt).toEqual(mockNow);
        vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.it)('clears resolvedAt when a RESOLVED ticket is reopened to IN_PROGRESS', async () => {
        repo.tickets[0].status = client_1.TicketStatus.RESOLVED;
        repo.tickets[0].resolvedAt = new Date('2024-01-01T00:00:00Z');
        const ticket = await service.updateStatus(adminActor, 't-open', client_1.TicketStatus.IN_PROGRESS);
        (0, vitest_1.expect)(ticket.status).toBe(client_1.TicketStatus.IN_PROGRESS);
        (0, vitest_1.expect)(ticket.resolvedAt).toBeNull();
    });
});
