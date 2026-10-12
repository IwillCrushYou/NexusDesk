import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { DashboardStats, TicketSummary } from '../types';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RefreshCw, Clock, ShieldAlert } from 'lucide-react';
import { MetricsSkeleton } from './Skeleton';

export const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAnalytics();
      setStats(res.analytics);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  if (loading && !stats) return <MetricsSkeleton />;

  if (error) {
    return (
      <div className="alert alert-error">
        <ShieldAlert size={14} />
        <span>{error}</span>
        <button className="btn btn-ghost btn-sm" onClick={fetchAnalytics} style={{ marginLeft: 'auto' }}>Retry</button>
      </div>
    );
  }

  if (!stats) return null;

  const volumeChartData = [...stats.volumeByDay].reverse();

  return (
    <div>
      {/* Cache Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock size={13} />
          Snapshot at{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            {new Date(stats.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </strong>
          {' '}· cached 60s
        </span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchAnalytics}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="metrics-row">
        <div className="metric-item">
          <div className="metric-label">Open</div>
          <div className="metric-value">{stats.statusBreakdown.OPEN}</div>
          <div className="metric-sub">active tickets</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">In Progress</div>
          <div className="metric-value">{stats.statusBreakdown.IN_PROGRESS}</div>
          <div className="metric-sub">being handled</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Resolved</div>
          <div className="metric-value">{stats.statusBreakdown.RESOLVED + stats.statusBreakdown.CLOSED}</div>
          <div className="metric-sub">completed</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">SLA Breach Rate</div>
          <div className="metric-value" style={{ color: stats.slaBreachRate > 20 ? 'var(--danger)' : undefined }}>
            {stats.slaBreachRate}%
          </div>
          <div className="metric-sub">
            {stats.avgResolutionHours != null ? `avg ${stats.avgResolutionHours}h resolution` : 'no resolutions yet'}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>
        {/* Volume over time */}
        <div className="ticket-table-container" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>
            Ticket Volume — Last 30 Days
          </div>
          <div style={{ height: 200 }}>
            {volumeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeChartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="20%" stopColor="#8BE0C1" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#8BE0C1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text-disabled)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-disabled)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: 6, fontSize: 12 }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-secondary)' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#8BE0C1" strokeWidth={1.5} fill="url(#areaFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-disabled)', fontSize: 13 }}>
                No data yet
              </div>
            )}
          </div>
        </div>

        {/* Agent workload */}
        {stats.ticketsPerAgent.length > 0 && (
          <div className="ticket-table-container" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>
              Agent Workload
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.ticketsPerAgent} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="agentName" stroke="var(--text-disabled)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-disabled)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: 6, fontSize: 12 }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Bar dataKey="openCount" name="Open" fill="#8BE0C1" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="resolvedCount" name="Resolved" fill="var(--border)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
