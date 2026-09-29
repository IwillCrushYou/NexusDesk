import { describe, it, expect, vi } from 'vitest';
import { TicketPriority } from '@prisma/client';
import { computeSlaDeadline, SLA_HOURS } from '../src/sla/sla.config';

describe('SLA Configuration', () => {
  it('correctly maps priorities to hours', () => {
    expect(SLA_HOURS[TicketPriority.CRITICAL]).toBe(4);
    expect(SLA_HOURS[TicketPriority.HIGH]).toBe(24);
    expect(SLA_HOURS[TicketPriority.MEDIUM]).toBe(48);
    expect(SLA_HOURS[TicketPriority.LOW]).toBe(72);
  });

  describe('computeSlaDeadline', () => {
    it('computes CRITICAL deadline (4 hours)', () => {
      const start = new Date('2024-01-01T12:00:00Z');
      const deadline = computeSlaDeadline(TicketPriority.CRITICAL, start);
      expect(deadline.toISOString()).toBe('2024-01-01T16:00:00.000Z');
    });

    it('computes LOW deadline (72 hours)', () => {
      const start = new Date('2024-01-01T12:00:00Z');
      const deadline = computeSlaDeadline(TicketPriority.LOW, start);
      // 72 hours = 3 days exactly
      expect(deadline.toISOString()).toBe('2024-01-04T12:00:00.000Z');
    });

    it('defaults to current time if from is omitted', () => {
      // Mock system time to be deterministic
      const mockNow = new Date('2024-05-15T08:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(mockNow);

      const deadline = computeSlaDeadline(TicketPriority.HIGH); // 24h
      expect(deadline.toISOString()).toBe('2024-05-16T08:00:00.000Z');
      
      vi.useRealTimers();
    });
  });
});
