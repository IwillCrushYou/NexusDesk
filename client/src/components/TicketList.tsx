import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { TicketSummary, TicketStatus, TicketPriority } from '../types';
import { Plus, Filter, Clock, User as UserIcon, RefreshCw, AlertTriangle } from 'lucide-react';

interface TicketListProps {
  onSelectTicket: (ticketId: string) => void;
  onOpenCreateModal: () => void;
  refreshTrigger: number;
}

export const TicketList: React.FC<TicketListProps> = ({
  onSelectTicket,
  onOpenCreateModal,
  refreshTrigger,
}) => {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listTickets({
        status: (statusFilter as TicketStatus) || undefined,
        priority: (priorityFilter as TicketPriority) || undefined,
      });
      setTickets(res.tickets);
    } catch (err: any) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, refreshTrigger]);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div>
      {/* Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
            <Filter size={16} />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 140 }}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ width: 140 }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <button
            className="btn-secondary"
            onClick={fetchTickets}
            style={{ padding: '8px 10px' }}
            title="Refresh list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <button className="btn-primary" onClick={onOpenCreateModal}>
          <Plus size={16} />
          Open New Ticket
        </button>
      </div>

      {/* Ticket Cards / Table */}
      {error && (
        <div
          style={{
            background: 'var(--danger-light)',
            color: '#f87171',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {loading && tickets.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}
        >
          <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>No tickets found matching your filter.</p>
          <button className="btn-secondary" onClick={onOpenCreateModal}>
            Create your first ticket
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelectTicket(t.id)}
              className="ticket-row"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-subtle)', fontFamily: 'monospace' }}>
                    #{t.id.slice(-6)}
                  </span>
                  <span className={`badge badge-status-${t.status.toLowerCase()}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className={`badge badge-priority-${t.priority.toLowerCase()}`}>
                    {t.priority}
                  </span>
                  {t.slaBreached && (
                    <span className="badge-breach" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={12} />
                      SLA BREACHED
                    </span>
                  )}
                </div>

                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.title}
                </h3>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginTop: 8,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <UserIcon size={12} />
                    {t.createdBy.name}
                  </span>

                  <span>
                    Assignee: <strong style={{ color: 'var(--text-main)' }}>{t.assignedTo ? t.assignedTo.name : 'Unassigned'}</strong>
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <Clock size={12} />
                  {formatTimeAgo(t.createdAt)}
                </div>
                {t.slaDeadline && (
                  <div style={{ fontSize: 11, color: t.slaBreached ? 'var(--danger)' : 'var(--text-subtle)', marginTop: 4 }}>
                    SLA: {new Date(t.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
