import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { TicketSummary, DashboardStats, User } from '../types';
import { Plus } from 'lucide-react';
import { StatusBadge, PriorityBadge } from './Badges';
import { MetricsSkeleton, Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

interface OverviewDashboardProps {
  currentUser: User;
  onSelectTicket: (id: string) => void;
  onOpenCreateModal: () => void;
  refreshTrigger: number;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  currentUser,
  onSelectTicket,
  onOpenCreateModal,
  refreshTrigger,
}) => {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketsRes] = await Promise.all([
        api.listTickets(),
      ]);
      setTickets(ticketsRes.tickets);

      // Only admins get analytics
      if (currentUser.role === 'ADMIN') {
        const analyticsRes = await api.getAnalytics();
        setStats(analyticsRes.analytics);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [refreshTrigger]);

  const open = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolved = tickets.filter((t) => t.status === 'RESOLVED').length;
  const unassigned = tickets.filter((t) => !t.assignedToId && (t.status === 'OPEN' || t.status === 'IN_PROGRESS')).length;

  const myTickets = tickets
    .filter((t) => t.assignedToId === currentUser.id || t.createdById === currentUser.id)
    .filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS')
    .slice(0, 5);

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? 'Good morning' :
    greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">
            {greeting}, {currentUser.name.split(' ')[0]} · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={onOpenCreateModal}>
            <Plus size={14} />
            New Ticket
          </button>
        </div>
      </div>

      {/* Metrics */}
      {loading ? (
        <MetricsSkeleton />
      ) : (
        <div className="metrics-row">
          <div className="metric-item">
            <div className="metric-label">Open</div>
            <div className="metric-value">{open}</div>
            <div className="metric-sub">awaiting action</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Unassigned</div>
            <div className="metric-value" style={{ color: unassigned > 0 ? 'var(--warning)' : undefined }}>
              {unassigned}
            </div>
            <div className="metric-sub">need an agent</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">In Progress</div>
            <div className="metric-value">{inProgress}</div>
            <div className="metric-sub">being handled</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Resolved</div>
            <div className="metric-value">{resolved}</div>
            <div className="metric-sub">closed out</div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: myTickets.length > 0 ? '1fr 320px' : '1fr', gap: 20 }}>
        {/* Recent Tickets Table */}
        <div className="section">
          <div className="section-header">
            <span className="section-title">Recent Tickets</span>
          </div>

          <div className="ticket-table-container">
            {loading ? (
              <div style={{ padding: 20 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <Skeleton width={60} height={12} />
                    <Skeleton width={200} height={12} />
                    <Skeleton width={80} height={12} style={{ marginLeft: 'auto' }} />
                  </div>
                ))}
              </div>
            ) : recentTickets.length === 0 ? (
              <EmptyState
                title="No tickets yet"
                description="Create your first support ticket to get started."
                action={
                  <button className="btn btn-primary btn-sm" onClick={onOpenCreateModal}>
                    <Plus size={13} />
                    Create ticket
                  </button>
                }
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTickets.map((t) => (
                      <tr key={t.id} onClick={() => onSelectTicket(t.id)}>
                        <td><span className="table-id">#{t.id.slice(-6).toUpperCase()}</span></td>
                        <td><span className="table-title">{t.title}</span></td>
                        <td><StatusBadge status={t.status} /></td>
                        <td><PriorityBadge priority={t.priority} /></td>
                        <td><span className="table-meta">{formatDate(t.updatedAt)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* My Active Tickets */}
        {!loading && myTickets.length > 0 && (
          <div className="section">
            <div className="section-header">
              <span className="section-title">My Active</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{myTickets.length}</span>
            </div>

            <div className="ticket-table-container">
              {myTickets.map((t, i) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: i < myTickets.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background var(--transition)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {formatDate(t.updatedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

