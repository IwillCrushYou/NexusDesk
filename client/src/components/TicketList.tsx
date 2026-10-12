import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { TicketSummary, TicketStatus, TicketPriority, User } from '../types';
import { Plus, RefreshCw, Search, X } from 'lucide-react';
import { StatusBadge, PriorityBadge, SlaBreachBadge } from './Badges';
import { TicketTableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

interface TicketListProps {
  currentUser: User;
  onSelectTicket: (ticketId: string) => void;
  onOpenCreateModal: () => void;
  refreshTrigger: number;
  /** If set, only show tickets for this view */
  view?: 'my-tickets' | 'all-tickets' | 'unassigned';
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const TicketList: React.FC<TicketListProps> = ({
  currentUser,
  onSelectTicket,
  onOpenCreateModal,
  refreshTrigger,
  view = 'all-tickets',
}) => {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
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

  const filtered = useMemo(() => {
    let result = tickets;

    // Apply view filter
    if (view === 'my-tickets') {
      result = result.filter((t) => t.createdById === currentUser.id || t.assignedToId === currentUser.id);
    } else if (view === 'unassigned') {
      result = result.filter((t) => !t.assignedToId && (t.status === 'OPEN' || t.status === 'IN_PROGRESS'));
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.createdBy.name.toLowerCase().includes(q),
      );
    }

    return result;
  }, [tickets, view, currentUser.id, searchQuery]);

  const hasFilters = statusFilter || priorityFilter || searchQuery;

  const clearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setSearchQuery('');
  };

  if (loading) return <TicketTableSkeleton />;

  if (error) {
    return (
      <div className="ticket-table-container">
        <div className="alert alert-error" style={{ margin: 20 }}>
          <span>{error}</span>
          <button className="btn btn-ghost btn-sm" onClick={fetchTickets} style={{ marginLeft: 'auto' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-table-container">
      <div className="ticket-table-toolbar">
        <div className="ticket-table-filters">
          {/* Search */}
          <div className="input-wrapper" style={{ position: 'relative' }}>
            <Search size={13} className="input-icon" />
            <input
              type="text"
              placeholder="Search tickets…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input input-with-icon"
            />
            {searchQuery && (
              <button
                className="input-action"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          {/* Refresh */}
          <button
            className="btn btn-ghost btn-icon"
            onClick={fetchTickets}
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Clear filters */}
          {hasFilters && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={clearFilters}
              style={{ color: 'var(--text-secondary)' }}
            >
              <X size={13} />
              Clear
            </button>
          )}
        </div>

        <button className="btn btn-primary" onClick={onOpenCreateModal}>
          <Plus size={14} />
          New Ticket
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No tickets match your filters' : 'No tickets yet'}
          description={
            hasFilters
              ? 'Try adjusting your search or filters.'
              : 'Create your first support ticket to get started.'
          }
          action={
            hasFilters ? (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                Clear filters
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={onOpenCreateModal}>
                <Plus size={14} />
                Create ticket
              </button>
            )
          }
        />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Requester</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} onClick={() => onSelectTicket(t.id)}>
                  <td>
                    <span className="table-id">#{t.id.slice(-6).toUpperCase()}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="table-title">{t.title}</span>
                      {t.slaBreached && <SlaBreachBadge />}
                    </div>
                  </td>
                  <td>
                    <span className="table-meta">{t.createdBy.name}</span>
                  </td>
                  <td>
                    <span className="table-meta" style={{ color: t.assignedTo ? undefined : 'var(--text-disabled)' }}>
                      {t.assignedTo?.name ?? '—'}
                    </span>
                  </td>
                  <td>
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td>
                    <span className="table-meta">{formatDate(t.updatedAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
              {hasFilters && ` matching filters`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
