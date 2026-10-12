import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  dangerous?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  dangerous = false,
}) => (
  <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
    <div className="modal-dialog confirm-dialog">
      <div className="confirm-body">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {dangerous && (
            <div style={{ color: 'var(--danger)', marginTop: 2, flexShrink: 0 }}>
              <AlertTriangle size={20} />
            </div>
          )}
          <div>
            <div className="confirm-title">{title}</div>
            <div className="confirm-text">{message}</div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
        <button
          className={`btn ${dangerous ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

