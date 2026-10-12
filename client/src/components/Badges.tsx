import React from 'react';
import { TicketStatus, TicketPriority } from '../types';
import { AlertTriangle } from 'lucide-react';

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => (
  <span className={`status-badge status-${status.toLowerCase()}`}>
    {STATUS_LABELS[status]}
  </span>
);

export const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => (
  <span className={`priority-badge priority-${priority.toLowerCase()}`}>
    {PRIORITY_LABELS[priority]}
  </span>
);

export const SlaBreachBadge: React.FC = () => (
  <span className="sla-breach">
    <AlertTriangle size={10} />
    SLA
  </span>
);

