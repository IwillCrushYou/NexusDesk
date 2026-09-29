"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const in_memory_cache_1 = require("../cache/in-memory-cache");
const CACHE_KEY = 'analytics:dashboard';
const CACHE_TTL = 60_000; // 60 seconds
// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
class AnalyticsService {
    prisma;
    cache = new in_memory_cache_1.InMemoryCache();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboard() {
        const cached = this.cache.get(CACHE_KEY);
        if (cached)
            return cached;
        const stats = await this.computeDashboard();
        this.cache.set(CACHE_KEY, stats, CACHE_TTL);
        return stats;
    }
    // ---------------------------------------------------------------------------
    // Private: runs all aggregations in parallel
    // ---------------------------------------------------------------------------
    async computeDashboard() {
        const [volumeByDay, resolutionRow, slaRow, agentRows, statusGroups] = await Promise.all([
            this.queryVolumeByDay(),
            this.queryAvgResolution(),
            this.querySlaBreachRate(),
            this.queryTicketsPerAgent(),
            this.queryStatusBreakdown(),
        ]);
        return {
            volumeByDay,
            avgResolutionHours: resolutionRow,
            slaBreachRate: slaRow,
            ticketsPerAgent: agentRows,
            statusBreakdown: statusGroups,
            cachedAt: new Date().toISOString(),
        };
    }
    // --- Ticket volume by day (last 30 days) ------------------------------------
    async queryVolumeByDay() {
        const rows = await this.prisma.$queryRaw `
      SELECT
        DATE(created_at)  AS date,
        COUNT(*)::bigint  AS count
      FROM   tickets
      WHERE  created_at >= NOW() - INTERVAL '30 days'
      GROUP  BY DATE(created_at)
      ORDER  BY date DESC
    `;
        return rows.map((r) => ({
            date: r.date.toISOString().slice(0, 10),
            count: Number(r.count),
        }));
    }
    // --- Average resolution time (hours) ----------------------------------------
    async queryAvgResolution() {
        const rows = await this.prisma.$queryRaw `
      SELECT
        ROUND(
          AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)::numeric,
          2
        ) AS avg_hours
      FROM tickets
      WHERE resolved_at IS NOT NULL
        AND status IN ('RESOLVED', 'CLOSED')
    `;
        const val = rows[0]?.avg_hours;
        return val != null ? Number(val) : null;
    }
    // --- SLA breach rate (%) ---------------------------------------------------
    async querySlaBreachRate() {
        const rows = await this.prisma.$queryRaw `
      SELECT
        COUNT(*) FILTER (WHERE sla_breached = true)  AS breached,
        COUNT(*)                                      AS total
      FROM tickets
    `;
        const { breached, total } = rows[0] ?? { breached: 0n, total: 0n };
        if (Number(total) === 0)
            return 0;
        return Math.round((Number(breached) / Number(total)) * 100 * 100) / 100;
    }
    // --- Tickets per agent -----------------------------------------------------
    async queryTicketsPerAgent() {
        const rows = await this.prisma.$queryRaw `
      SELECT
        u.id                                                               AS agent_id,
        u.name                                                             AS agent_name,
        COUNT(t.id) FILTER (WHERE t.status IN ('OPEN', 'IN_PROGRESS'))    AS open_count,
        COUNT(t.id) FILTER (WHERE t.status IN ('RESOLVED', 'CLOSED'))     AS resolved_count,
        COUNT(t.id)                                                        AS total_count
      FROM   users u
      LEFT   JOIN tickets t ON t.assigned_to = u.id
      WHERE  u.role = 'AGENT'
      GROUP  BY u.id, u.name
      ORDER  BY total_count DESC
    `;
        return rows.map((r) => ({
            agentId: r.agent_id,
            agentName: r.agent_name,
            openCount: Number(r.open_count),
            resolvedCount: Number(r.resolved_count),
            totalCount: Number(r.total_count),
        }));
    }
    // --- Status breakdown ------------------------------------------------------
    async queryStatusBreakdown() {
        const groups = await this.prisma.ticket.groupBy({
            by: ['status'],
            _count: { _all: true },
        });
        const breakdown = {
            OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0,
        };
        for (const g of groups) {
            breakdown[g.status] = g._count._all;
        }
        return breakdown;
    }
}
exports.AnalyticsService = AnalyticsService;
