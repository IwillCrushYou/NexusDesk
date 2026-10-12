import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { TicketWithRelations, TicketStatus, User } from '../types';
import { X, ChevronRight, History, AlertTriangle, User as UserIcon, Clock, CheckCircle } from 'lucide-react';
import { StatusBadge, PriorityBadge, SlaBreachBadge } from './Badges';
import { useToast } from './ToastProvider';
import { Skeleton } from './Skeleton';

interface TicketDetailModalProps {
  ticketId: string;
  currentUser: User;
  onClose: () => void;
  onStatusUpdated: () => void;
}

const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getAllowedTransitions = (status: TicketStatus): TicketStatus[] => {
  switch (status) {
    case 'OPEN': return ['IN_PROGRESS'];
    case 'IN_PROGRESS': return ['RESOLVED', 'OPEN'];
    case 'RESOLVED': return ['CLOSED', 'IN_PROGRESS'];
    case 'CLOSED': return ['OPEN'];
    default: return [];
  }
};

const TRANSITION_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Reopen',
  IN_PROGRESS: 'Start Progress',
  RESOLVED: 'Mark Resolved',
  CLOSED: 'Close',
};

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticketId,
  currentUser,
  onClose,
  onStatusUpdated,
}) => {
  const [ticket, setTicket] = useState<TicketWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTicket = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTicket(ticketId);
      setTicket(res.ticket);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const canManage = currentUser.role === 'AGENT' || currentUser.role === 'ADMIN';

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    setUpdating(true);
    try {
      const res = await api.updateStatus(ticketId, newStatus);
      setTicket(res.ticket);
      onStatusUpdated();
      toast('success', 'Status updated', `Ticket moved to ${newStatus.replace('_', ' ')}`);
    } catch (err: any) {
      toast('error', 'Update failed', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAutoAssign = async () => {
    setUpdating(true);
    try {
      const res = await api.autoAssign(ticketId);
      setTicket(res.ticket);
      onStatusUpdated();
      toast('success', 'Ticket assigned', `Assigned to ${res.ticket.assignedTo?.name}`);
    } catch (err: any) {
      toast('error', 'Assignment failed', err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-dialog modal-dialog-lg">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span className="text-mono" style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>
              #{ticket?.id.slice(-6).toUpperCase() ?? '···'}
            </span>
            {ticket && (
              <>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                {ticket.slaBreached && <SlaBreachBadge />}
              </>
            )}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} title="Close">
            <X size={17} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Skeleton height={24} width="70%" />
              <Skeleton height={14} />
              <Skeleton height={14} width="85%" />
              <Skeleton height={14} width="60%" />
              <div style={{ height: 16 }} />
              <div className="meta-grid">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="meta-item">
                    <Skeleton height={10} width={80} style={{ marginBottom: 6 }} />
                    <Skeleton height={14} width={120} />
                  </div>
                ))}
              </div>
            </div>
          ) : ticket ? (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>
                {ticket.title}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: 20 }}>
                {ticket.description}
              </p>

              {/* Metadata */}
              <div className="meta-grid">
                <div className="meta-item">
                  <div className="meta-label">Requester</div>
                  <div className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <UserIcon size={13} style={{ color: 'var(--text-secondary)' }} />
                    {ticket.createdBy.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {ticket.createdBy.email}
                  </div>
                </div>

                <div className="meta-item">
                  <div className="meta-label">Assigned Agent</div>
                  <div className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <UserIcon size={13} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ color: ticket.assignedTo ? undefined : 'var(--text-disabled)' }}>
                      {ticket.assignedTo?.name ?? 'Unassigned'}
                    </span>
                    {!ticket.assignedTo && canManage && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 11, padding: '1px 6px', height: 'auto' }}
                        onClick={handleAutoAssign}
                        disabled={updating}
                      >
                        Auto-assign
                      </button>
                    )}
                  </div>
                  {ticket.assignedTo && (
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {ticket.assignedTo.email}
                    </div>
                  )}
                </div>

                <div className="meta-item">
                  <div className="meta-label">SLA Deadline</div>
                  <div className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={13} style={{ color: ticket.slaBreached ? 'var(--danger)' : 'var(--text-secondary)' }} />
                    <span style={{ color: ticket.slaBreached ? 'var(--danger)' : undefined, fontWeight: ticket.slaBreached ? 600 : undefined }}>
                      {formatDateTime(ticket.slaDeadline)}
                    </span>
                  </div>
                </div>

                <div className="meta-item">
                  <div className="meta-label">Timeline</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div className="meta-value" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Created</span>
                      {formatDateTime(ticket.createdAt)}
                    </div>
                    {ticket.resolvedAt && (
                      <div className="meta-value" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={11} style={{ color: 'var(--success)' }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Resolved</span>
                        {formatDateTime(ticket.resolvedAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {canManage && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                    Actions
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {getAllowedTransitions(ticket.status).map((nextStatus) => (
                      <button
                        key={nextStatus}
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange(nextStatus)}
                        disabled={updating}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        {TRANSITION_LABELS[nextStatus]}
                        <ChevronRight size={13} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Timeline */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <History size={14} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    History
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>
                    ({ticket.events?.length ?? 0})
                  </span>
                </div>

                {ticket.events && ticket.events.length > 0 ? (
                  <div className="timeline">
                    {ticket.events.map((evt) => (
                      <div key={evt.id} className="timeline-item">
                        <div className="timeline-dot">
                          <History size={10} />
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-action">
                            <span style={{ fontWeight: 600 }}>{evt.action}</span>
                            {evt.actor && (
                              <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}> by {evt.actor.name}</span>
                            )}
                          </div>
                          {evt.oldValue && evt.newValue && (
                            <div className="timeline-change">
                              <span style={{ color: 'var(--text-disabled)' }}>{evt.oldValue}</span>
                              <ChevronRight size={11} style={{ color: 'var(--text-disabled)' }} />
                              <span>{evt.newValue}</span>
                            </div>
                          )}
                          <div className="timeline-meta">{formatDateTime(evt.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-disabled)' }}>
                    No history events yet.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
