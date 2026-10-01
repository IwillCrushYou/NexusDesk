import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { TicketWithRelations, TicketStatus, User } from '../types';
import { X, Clock, User as UserIcon, ShieldAlert, CheckCircle, ArrowRight, History } from 'lucide-react';

interface TicketDetailModalProps {
  ticketId: string | null;
  currentUser: User;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticketId,
  currentUser,
  onClose,
  onStatusUpdated,
}) => {
  const [ticket, setTicket] = useState<TicketWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTicket(ticketId);
      setTicket(res.ticket);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  if (!ticketId) return null;

  const canManage = currentUser.role === 'AGENT' || currentUser.role === 'ADMIN';

  // Allowed transitions per state machine
  const getAllowedTransitions = (status: TicketStatus): TicketStatus[] => {
    switch (status) {
      case 'OPEN':
        return ['IN_PROGRESS'];
      case 'IN_PROGRESS':
        return ['RESOLVED', 'OPEN'];
      case 'RESOLVED':
        return ['CLOSED', 'IN_PROGRESS'];
      case 'CLOSED':
        return ['OPEN'];
      default:
        return [];
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setUpdating(true);
    setError(null);
    try {
      const res = await api.updateStatus(ticketId, newStatus);
      setTicket(res.ticket);
      onStatusUpdated();
    } catch (err: any) {
      setError(err.message || 'Status transition failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleAutoAssign = async () => {
    setUpdating(true);
    setError(null);
    try {
      const res = await api.autoAssign(ticketId);
      setTicket(res.ticket);
      onStatusUpdated();
    } catch (err: any) {
      setError(err.message || 'Auto-assignment failed');
    } finally {
      setUpdating(false);
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: 650 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-subtle)', fontFamily: 'monospace' }}>
              #{ticket?.id.slice(-6)}
            </span>
            {ticket && (
              <>
                <span className={`badge badge-status-${ticket.status.toLowerCase()}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className={`badge badge-priority-${ticket.priority.toLowerCase()}`}>
                  {ticket.priority}
                </span>
                {ticket.slaBreached && (
                  <span className="badge-breach">SLA BREACHED</span>
                )}
              </>
            )}
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div
              style={{
                background: 'var(--danger-light)',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading ticket details...
            </div>
          ) : ticket ? (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
                {ticket.title}
              </h2>

              <p style={{ color: 'var(--text-muted)', fontSize: 14, whiteSpace: 'pre-wrap', marginBottom: 20 }}>
                {ticket.description}
              </p>

              {/* Metadata Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 12,
                  padding: 14,
                  background: 'var(--bg-card)',
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 20,
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-subtle)', display: 'block', fontSize: 11 }}>CREATED BY</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <UserIcon size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontWeight: 500 }}>{ticket.createdBy.name}</span>
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-subtle)', display: 'block', fontSize: 11 }}>ASSIGNED AGENT</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <UserIcon size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontWeight: 500 }}>
                      {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
                    </span>
                    {!ticket.assignedTo && canManage && (
                      <button
                        onClick={handleAutoAssign}
                        disabled={updating}
                        style={{ fontSize: 11, color: 'var(--primary)', textDecoration: 'underline', marginLeft: 6 }}
                      >
                        Auto-Assign
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-subtle)', display: 'block', fontSize: 11 }}>SLA DEADLINE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Clock size={14} style={{ color: ticket.slaBreached ? 'var(--danger)' : 'var(--text-muted)' }} />
                    <span style={{ color: ticket.slaBreached ? 'var(--danger)' : 'inherit', fontWeight: ticket.slaBreached ? 700 : 400 }}>
                      {formatDateTime(ticket.slaDeadline)}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-subtle)', display: 'block', fontSize: 11 }}>RESOLVED TIMESTAMP</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                    <span>{formatDateTime(ticket.resolvedAt)}</span>
                  </div>
                </div>
              </div>

              {/* State Machine Transition Actions */}
              {canManage && (
                <div
                  style={{
                    padding: 14,
                    background: 'rgba(79, 70, 229, 0.05)',
                    border: '1px solid rgba(79, 70, 229, 0.2)',
                    borderRadius: 8,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
                    State Machine Actions (Next Allowed States):
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {getAllowedTransitions(ticket.status).map((nextStatus) => (
                      <button
                        key={nextStatus}
                        className="btn-primary"
                        onClick={() => handleStatusChange(nextStatus)}
                        disabled={updating}
                        style={{ fontSize: 12, padding: '6px 12px' }}
                      >
                        Move to {nextStatus.replace('_', ' ')}
                        <ArrowRight size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Event Timeline */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <History size={16} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Audit History ({ticket.events?.length || 0})
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ticket.events && ticket.events.length > 0 ? (
                    ticket.events.map((evt) => (
                      <div
                        key={evt.id}
                        style={{
                          padding: '8px 12px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          fontSize: 12,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                            {evt.action}
                          </span>
                          {evt.oldValue && evt.newValue && (
                            <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                              ({evt.oldValue} ➔ {evt.newValue})
                            </span>
                          )}
                        </div>
                        <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>
                          {formatDateTime(evt.timestamp)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-subtle)', fontSize: 12 }}>No audit events logged yet.</div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
