"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const client_1 = require("@prisma/client");
const sla_config_1 = require("../src/sla/sla.config");
(0, vitest_1.describe)('SLA Configuration', () => {
    (0, vitest_1.it)('correctly maps priorities to hours', () => {
        (0, vitest_1.expect)(sla_config_1.SLA_HOURS[client_1.TicketPriority.CRITICAL]).toBe(4);
        (0, vitest_1.expect)(sla_config_1.SLA_HOURS[client_1.TicketPriority.HIGH]).toBe(24);
        (0, vitest_1.expect)(sla_config_1.SLA_HOURS[client_1.TicketPriority.MEDIUM]).toBe(48);
        (0, vitest_1.expect)(sla_config_1.SLA_HOURS[client_1.TicketPriority.LOW]).toBe(72);
    });
    (0, vitest_1.describe)('computeSlaDeadline', () => {
        (0, vitest_1.it)('computes CRITICAL deadline (4 hours)', () => {
            const start = new Date('2024-01-01T12:00:00Z');
            const deadline = (0, sla_config_1.computeSlaDeadline)(client_1.TicketPriority.CRITICAL, start);
            (0, vitest_1.expect)(deadline.toISOString()).toBe('2024-01-01T16:00:00.000Z');
        });
        (0, vitest_1.it)('computes LOW deadline (72 hours)', () => {
            const start = new Date('2024-01-01T12:00:00Z');
            const deadline = (0, sla_config_1.computeSlaDeadline)(client_1.TicketPriority.LOW, start);
            // 72 hours = 3 days exactly
            (0, vitest_1.expect)(deadline.toISOString()).toBe('2024-01-04T12:00:00.000Z');
        });
        (0, vitest_1.it)('defaults to current time if from is omitted', () => {
            // Mock system time to be deterministic
            const mockNow = new Date('2024-05-15T08:00:00Z');
            vitest_1.vi.useFakeTimers();
            vitest_1.vi.setSystemTime(mockNow);
            const deadline = (0, sla_config_1.computeSlaDeadline)(client_1.TicketPriority.HIGH); // 24h
            (0, vitest_1.expect)(deadline.toISOString()).toBe('2024-05-16T08:00:00.000Z');
            vitest_1.vi.useRealTimers();
        });
    });
});
