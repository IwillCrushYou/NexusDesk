export type UserRole = 'EMPLOYEE' | 'AGENT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TicketEvent {
  id: string;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  timestamp: string;
  actor?: {
    name: string;
    email: string;
  };
}

export interface TicketSummary {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  slaDeadline?: string | null;
  slaBreached: boolean;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  assignedToId?: string | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface TicketWithRelations extends TicketSummary {
  events: TicketEvent[];
}

export interface NotificationItem {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  ticketId?: string | null;
}

export interface VolumeByDay {
  date: string;
  count: number;
}

export interface AgentStats {
  agentId: string;
  agentName: string;
  openCount: number;
  resolvedCount: number;
  totalCount: number;
}

export interface StatusBreakdown {
  OPEN: number;
  IN_PROGRESS: number;
  RESOLVED: number;
  CLOSED: number;
}

export interface DashboardStats {
  volumeByDay: VolumeByDay[];
  avgResolutionHours: number | null;
  slaBreachRate: number;
  ticketsPerAgent: AgentStats[];
  statusBreakdown: StatusBreakdown;
  cachedAt: string;
}
