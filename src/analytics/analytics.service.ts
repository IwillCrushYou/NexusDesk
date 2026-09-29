import { PrismaClient } from '@prisma/client';
import { InMemoryCache } from '../cache/in-memory-cache';

const CACHE_KEY = 'analytics:dashboard';
const CACHE_TTL = 60_000; // 60 seconds

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export type VolumeByDay = { date: string; count: number };

export type AgentStats = {
  agentId: string;
  agentName: string;
  openCount: number;
  resolvedCount: number;
  totalCount: number;
};

export type StatusBreakdown = {
  OPEN: number;
  IN_PROGRESS: number;
  RESOLVED: number;
  CLOSED: number;
};

export type DashboardStats = {
  volumeByDay:        VolumeByDay[];
  avgResolutionHours: number | null;
  slaBreachRate:      number;          // 0–100 percentage
  ticketsPerAgent:    AgentStats[];
  statusBreakdown:    StatusBreakdown;
  cachedAt:           string;          // ISO timestamp — makes staleness visible in responses
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class AnalyticsService {
  private readonly cache = new InMemoryCache();

  constructor(private readonly prisma: PrismaClient) {}

  async getDashboard(): Promise<DashboardStats> {
    const cached = this.cache.get<DashboardStats>(CACHE_KEY);
    if (cached) return cached;

    const stats = await this.computeDashboard();
    this.cache.set(CACHE_KEY, stats, CACHE_TTL);
    return stats;
  }

  // ---------------------------------------------------------------------------
  // Private: runs all aggregations in parallel
  // ---------------------------------------------------------------------------

  private async computeDashboard(): Promise<DashboardStats> {
    const [volumeByDay, resolutionRow, slaRow, agentRows, statusGroups] =
      await Promise.all([
        this.queryVolumeByDay(),
        this.queryAvgResolution(),
        this.querySlaBreachRate(),
        this.queryTicketsPerAgent(),
        this.queryStatusBreakdown(),
      ]);

    return {
      volumeByDay,
      avgResolutionHours: resolutionRow,
      slaBreachRate:      slaRow,
      ticketsPerAgent:    agentRows,
      statusBreakdown:    statusGroups,
      cachedAt:           new Date().toISOString(),
    };
  }

  // --- Ticket volume by day (last 30 days) ------------------------------------

  private async queryVolumeByDay(): Promise<VolumeByDay[]> {
    const rows = await this.prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT
        DATE(created_at)  AS date,
        COUNT(*)::bigint  AS count
      FROM   tickets
      WHERE  created_at >= NOW() - INTERVAL '30 days'
      GROUP  BY DATE(created_at)
      ORDER  BY date DESC
    `;

    return rows.map((r) => ({
      date:  r.date.toISOString().slice(0, 10),
      count: Number(r.count),
    }));
  }

  // --- Average resolution time (hours) ----------------------------------------

  private async queryAvgResolution(): Promise<number | null> {
    const rows = await this.prisma.$queryRaw<{ avg_hours: number | null }[]>`
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

  private async querySlaBreachRate(): Promise<number> {
    const rows = await this.prisma.$queryRaw<
      { breached: bigint; total: bigint }[]
    >`
      SELECT
        COUNT(*) FILTER (WHERE sla_breached = true)  AS breached,
        COUNT(*)                                      AS total
      FROM tickets
    `;

    const { breached, total } = rows[0] ?? { breached: 0n, total: 0n };
    if (Number(total) === 0) return 0;

    return Math.round((Number(breached) / Number(total)) * 100 * 100) / 100;
  }

  // --- Tickets per agent -----------------------------------------------------

  private async queryTicketsPerAgent(): Promise<AgentStats[]> {
    const rows = await this.prisma.$queryRaw<
      {
        agent_id:       string;
        agent_name:     string;
        open_count:     bigint;
        resolved_count: bigint;
        total_count:    bigint;
      }[]
    >`
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
      agentId:       r.agent_id,
      agentName:     r.agent_name,
      openCount:     Number(r.open_count),
      resolvedCount: Number(r.resolved_count),
      totalCount:    Number(r.total_count),
    }));
  }

  // --- Status breakdown ------------------------------------------------------

  private async queryStatusBreakdown(): Promise<StatusBreakdown> {
    const groups = await this.prisma.ticket.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const breakdown: StatusBreakdown = {
      OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0,
    };
    for (const g of groups) {
      breakdown[g.status] = g._count._all;
    }
    return breakdown;
  }
}
