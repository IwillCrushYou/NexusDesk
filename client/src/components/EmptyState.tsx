import React from 'react';
import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
}) => (
  <div className="empty-state">
    <div className="empty-state-icon">
      {icon ?? <InboxIcon size={40} />}
    </div>
    <div className="empty-state-title">{title}</div>
    {description && <div className="empty-state-desc">{description}</div>}
    {action}
  </div>
);

