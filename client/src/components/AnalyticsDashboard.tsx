import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { DashboardStats } from '../types';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Clock, ShieldAlert, CheckCircle2, Inbox, RefreshCw, Zap } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAnalytics();
      setStats(res.analytics);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !stats) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading admin analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: 'var(--danger-light)',
          color: '#f87171',
          padding: '16px 20px',
          borderRadius: 8,
          fontSize: 14,
        }}
      >
        {error}
      </div>
    );
  }

  if (!stats) return null;

  // Prepare PieChart data for Status Breakdown
  const statusPieData = [
    { name: 'Open', value: stats.statusBreakdown.OPEN, color: '#3b82f6' },
    { name: 'In Progress', value: stats.statusBreakdown.IN_PROGRESS, color: '#f59e0b' },
    { name: 'Resolved', value: stats.statusBreakdown.RESOLVED, color: '#10b981' },
    { name: 'Closed', value: stats.statusBreakdown.CLOSED, color: '#6b7280' },
  ].filter((item) => item.value > 0);

  // Reverse volume array for chronological chart order
  const volumeChartData = [...stats.volumeByDay].reverse();

  return (
    <div>
      {/* Top Banner: Cache freshness & refresh */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '12px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          <Zap size={16} style={{ color: 'var(--warning)' }} />
          <span>
            Aggregations cached for 60s &bull; Snapshot at:{' '}
            <strong style={{ color: 'var(--text-main)' }}>
              {new Date(stats.cachedAt).toLocaleTimeString()}
            </strong>
          </span>
        </div>

        <button
          className="btn-secondary"
          onClick={fetchAnalytics}
          style={{ padding: '6px 12px', fontSize: 13 }}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Stats
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title">SLA Breach Rate</span>
            <ShieldAlert size={20} style={{ color: stats.slaBreachRate > 0 ? 'var(--danger)' : 'var(--success)' }} />
          </div>
          <div className="stat-value" style={{ color: stats.slaBreachRate > 20 ? 'var(--danger)' : 'inherit' }}>
            {stats.slaBreachRate}%
          </div>
          <span className="stat-subtitle">Overdue resolution threshold</span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title">Avg Resolution Time</span>
            <Clock size={20} style={{ color: 'var(--info)' }} />
          </div>
          <div className="stat-value">
            {stats.avgResolutionHours !== null ? `${stats.avgResolutionHours}h` : 'N/A'}
          </div>
          <span className="stat-subtitle">Time from creation to resolution</span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title">Active Tickets</span>
            <Inbox size={20} style={{ color: 'var(--warning)' }} />
          </div>
          <div className="stat-value">
            {stats.statusBreakdown.OPEN + stats.statusBreakdown.IN_PROGRESS}
          </div>
          <span className="stat-subtitle">Open & in-progress queue</span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title">Total Resolved</span>
            <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
          </div>
          <div className="stat-value">
            {stats.statusBreakdown.RESOLVED + stats.statusBreakdown.CLOSED}
          </div>
          <span className="stat-subtitle">Completed tickets</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20 }}>
        {/* Chart 1: Ticket Volume Over Time */}
        <div className="chart-card">
          <h3 className="chart-title">Ticket Volume (Last 30 Days)</h3>
          <div style={{ height: 260 }}>
            {volumeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: 6 }}
                    labelStyle={{ color: '#f9fafb' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-subtle)' }}>No historical data</div>
            )}
          </div>
        </div>

        {/* Chart 2: Status Breakdown Pie */}
        <div className="chart-card">
          <h3 className="chart-title">Status Breakdown</h3>
          <div style={{ height: 260 }}>
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: 6 }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-subtle)' }}>No tickets found</div>
            )}
          </div>
        </div>

        {/* Chart 3: Agent Workload Distribution */}
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="chart-title">Support Agent Workload Distribution</h3>
          <div style={{ height: 260 }}>
            {stats.ticketsPerAgent.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.ticketsPerAgent} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="agentName" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: 6 }}
                  />
                  <Legend />
                  <Bar dataKey="openCount" name="Open / In Progress" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolvedCount" name="Resolved / Closed" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-subtle)' }}>No agent activity data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
