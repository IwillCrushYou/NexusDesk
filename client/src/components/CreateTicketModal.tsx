import React, { useState } from 'react';
import { api } from '../api';
import { TicketPriority } from '../types';
import { X, AlertCircle } from 'lucide-react';
import { useToast } from './ToastProvider';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [autoAssign, setAutoAssign] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const reset = () => {
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setAutoAssign(true);
    setError(null);
  };

  const handleClose = () => {
    if (!submitting) {
      reset();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      await api.createTicket({ title, description, priority, autoAssign });
      onCreated();
      toast('success', 'Ticket created', title);
      reset();
      onClose();
    } catch (err: any) {
      // Preserve values on failure
      setError(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="modal-dialog">
        <div className="modal-header">
          <span className="modal-title">New Support Ticket</span>
          <button className="btn btn-ghost btn-icon" onClick={handleClose} disabled={submitting} title="Close">
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label form-label-required">Subject</label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={200}
                placeholder="e.g., Cannot connect to VPN"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                disabled={submitting}
              >
                <option value="LOW">Low — 72 hr SLA</option>
                <option value="MEDIUM">Medium — 48 hr SLA</option>
                <option value="HIGH">High — 24 hr SLA</option>
                <option value="CRITICAL">Critical — 4 hr SLA</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Description</label>
              <textarea
                required
                rows={5}
                minLength={10}
                placeholder="Describe the technical issue, steps to reproduce, and affected services…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <input
                type="checkbox"
                id="autoAssign"
                checked={autoAssign}
                onChange={(e) => setAutoAssign(e.target.checked)}
                disabled={submitting}
                style={{ width: 14, height: 14, marginTop: 2, flexShrink: 0 }}
              />
              <label htmlFor="autoAssign" style={{ cursor: 'pointer', flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Auto-assign agent</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                  Automatically assign to the least-loaded available agent.
                </div>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
