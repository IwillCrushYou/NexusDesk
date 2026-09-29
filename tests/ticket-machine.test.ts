import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketPriority, TicketStatus, UserRole } from '@prisma/client';
import { TicketService, TicketError, Actor } from '../src/tickets/ticket-service';
import { TicketRepository, TicketWithRelations, TicketFilter, CreateTicketInput, UpdateTicketData } from '../src/tickets/ticket-repository';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

class MockTicketRepository implements TicketRepository {
  public tickets: TicketWithRelations[] = [];
  public events: any[] = [];

  async create(input: CreateTicketInput): Promise<TicketWithRelations> {
    const t = { id: 't1', ...input, status: TicketStatus.OPEN } as unknown as TicketWithRelations;
    this.tickets.push(t);
    return t;
  }
  async findById(id: string) { return this.tickets.find(t => t.id === id) || null; }
  async findMany(f: TicketFilter) { return [] as any; }
  async update(id: string, data: UpdateTicketData) {
    const t = this.tickets.find(t => t.id === id)!;
    Object.assign(t, data);
    return t;
  }
  async findLeastLoadedAgentId() { return 'agent1'; }
  async logEvent(t: string, act: string, action: string, o?: string, n?: string) {
    this.events.push({ action, o, n });
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TicketService State Machine', () => {
  let repo: MockTicketRepository;
  let service: TicketService;
  const adminActor: Actor = { id: 'admin1', role: UserRole.ADMIN };

  beforeEach(() => {
    repo = new MockTicketRepository();
    service = new TicketService(repo);
    // Seed an initial OPEN ticket
    repo.tickets.push({
      id: 't-open',
      status: TicketStatus.OPEN,
      createdById: 'emp1',
      assignedToId: 'agent1',
      title: 'Help',
    } as any);
  });

  it('allows transition from OPEN to IN_PROGRESS', async () => {
    const ticket = await service.updateStatus(adminActor, 't-open', TicketStatus.IN_PROGRESS);
    expect(ticket.status).toBe(TicketStatus.IN_PROGRESS);
    // Auto-resolvedAt should be null
    expect(ticket.resolvedAt).toBe(null);
  });

  it('blocks invalid transition from OPEN directly to CLOSED', async () => {
    await expect(service.updateStatus(adminActor, 't-open', TicketStatus.CLOSED))
      .rejects.toThrowError(new TicketError('INVALID_TRANSITION'));
  });

  it('auto-sets resolvedAt when transitioning to RESOLVED', async () => {
    // Force ticket to IN_PROGRESS first
    repo.tickets[0].status = TicketStatus.IN_PROGRESS;
    
    // Mock system time to check resolvedAt explicitly
    vi.useFakeTimers();
    const mockNow = new Date('2024-10-10T12:00:00Z');
    vi.setSystemTime(mockNow);

    const ticket = await service.updateStatus(adminActor, 't-open', TicketStatus.RESOLVED);
    
    expect(ticket.status).toBe(TicketStatus.RESOLVED);
    expect(ticket.resolvedAt).toEqual(mockNow);
    
    vi.useRealTimers();
  });

  it('clears resolvedAt when a RESOLVED ticket is reopened to IN_PROGRESS', async () => {
    repo.tickets[0].status = TicketStatus.RESOLVED;
    repo.tickets[0].resolvedAt = new Date('2024-01-01T00:00:00Z');

    const ticket = await service.updateStatus(adminActor, 't-open', TicketStatus.IN_PROGRESS);
    
    expect(ticket.status).toBe(TicketStatus.IN_PROGRESS);
    expect(ticket.resolvedAt).toBeNull();
  });
});
