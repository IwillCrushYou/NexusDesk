import React, { useState } from 'react';
import { api } from '../api';
import { TicketPriority } from '../types';
import { X, AlertCircle } from 'lucide-react';

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
  const [autoAssign, setAutoAssign] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.createTicket({
        title,
        description,
        priority,
        autoAssign,
      });
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setAutoAssign(false);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Open New Support Ticket</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div
              style={{
                background: 'var(--danger-light)',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: 'var(--text-muted)' }}>
              Subject / Title
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={200}
              placeholder="e.g., Cannot connect to VPN server"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: 'var(--text-muted)' }}>
              Priority & SLA
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              style={{ width: '100%' }}
            >
              <option value="LOW">Low (72 hr SLA)</option>
              <option value="MEDIUM">Medium (48 hr SLA)</option>
              <option value="HIGH">High (24 hr SLA)</option>
              <option value="CRITICAL">Critical (4 hr SLA)</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: 'var(--text-muted)' }}>
              Issue Description
            </label>
            <textarea
              required
              rows={4}
              minLength={10}
              placeholder="Describe the technical issue, steps to reproduce, or affected service..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div
            style={{
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: 'var(--bg-card)',
              borderRadius: 6,
              border: '1px solid var(--border)',
            }}
          >
            <input
              type="checkbox"
              id="autoAssign"
              checked={autoAssign}
              onChange={(e) => setAutoAssign(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <label htmlFor="autoAssign" style={{ fontSize: 13, cursor: 'pointer' }}>
              <span style={{ fontWeight: 600 }}>Auto-assign to least-loaded agent</span>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Automatically balance workload across available support engineers.
              </p>
            </label>
          </div>

          <div className="modal-footer" style={{ padding: 0 }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
