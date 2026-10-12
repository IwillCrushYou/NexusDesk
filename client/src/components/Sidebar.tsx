import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Ticket,
  InboxIcon,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Moon,
  Sun,
  Bell,
  CheckCheck,
  Menu,
  X,
} from 'lucide-react';
import { User, NotificationItem } from '../types';
import { useTheme } from './ThemeProvider';
import { api } from '../api';

export type NavPage =
  | 'overview'
  | 'my-tickets'
  | 'all-tickets'
  | 'unassigned'
  | 'reports'
  | 'team'
  | 'settings';

interface SidebarProps {
  user: User;
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  onLogout: () => void;
  ticketCounts?: { open: number; unassigned: number };
  isOpen: boolean;
  onClose: () => void;
}

interface NotifBellProps {
  user: User;
}

const NotifBell: React.FC<NotifBellProps> = ({ user }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.listNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => setOpen(!open)}
        title="Notifications"
        style={{ position: 'relative' }}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span
            className="badge-count"
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              fontSize: 9,
              minWidth: 15,
              height: 15,
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-title">Notifications</span>
            <span className="text-muted" style={{ fontSize: 11 }}>{unreadCount} unread</span>
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                  {!n.read && <div className="notif-dot" />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--text-primary)', marginBottom: 2 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-disabled)' }}>
                      {new Date(n.createdAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  </div>
                  {!n.read && (
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ padding: 3, flexShrink: 0 }}
                      onClick={() => markRead(n.id)}
                      title="Mark read"
                    >
                      <CheckCheck size={13} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  currentPage,
  onNavigate,
  onLogout,
  ticketCounts,
  isOpen,
  onClose,
}) => {
  const { theme, toggle } = useTheme();

  const navItem = (
    page: NavPage,
    label: string,
    Icon: React.ElementType,
    count?: number,
  ) => (
    <button
      key={page}
      className={`sidebar-item ${currentPage === page ? 'active' : ''}`}
      onClick={() => { onNavigate(page); onClose(); }}
    >
      <Icon size={15} />
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="sidebar-item-count">{count}</span>
      )}
    </button>
  );

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <Ticket size={14} color="var(--accent-text)" />
          </div>
          <span className="sidebar-logo-name">NexusDesk</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-label">Workspace</div>
            {navItem('overview', 'Overview', LayoutDashboard)}
            {navItem('my-tickets', 'My Tickets', Ticket, ticketCounts?.open)}
            {navItem('all-tickets', 'All Tickets', InboxIcon)}
            {navItem('unassigned', 'Unassigned', X, ticketCounts?.unassigned)}
          </div>

          {(user.role === 'AGENT' || user.role === 'ADMIN') && (
            <div className="sidebar-section">
              <div className="sidebar-section-label">Management</div>
              {navItem('reports', 'Reports', BarChart3)}
              {user.role === 'ADMIN' && navItem('team', 'Team', Users)}
            </div>
          )}

          <div className="sidebar-section">
            <div className="sidebar-section-label">Account</div>
            {navItem('settings', 'Settings', Settings)}
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* Theme toggle */}
          <button className="theme-toggle" onClick={toggle} title="Toggle theme">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              {theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </span>
            <div
              style={{
                width: 28,
                height: 16,
                borderRadius: 8,
                background: theme === 'dark' ? 'var(--accent)' : 'var(--sidebar-text-muted)',
                position: 'relative',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: theme === 'dark' ? 14 : 2,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.15s',
                }}
              />
            </div>
          </button>

          {/* User profile */}
          <div className="sidebar-user" style={{ marginTop: 4 }}>
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              onClick={onLogout}
              title="Sign out"
              style={{ color: 'var(--sidebar-text-muted)', padding: 4 }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

interface TopbarProps {
  title: string;
  user: User;
  onMenuToggle: () => void;
  actions?: React.ReactNode;
}

export const Topbar: React.FC<TopbarProps> = ({ title, user, onMenuToggle, actions }) => (
  <div className="topbar">
    <div className="topbar-left">
      <button className="menu-toggle btn" onClick={onMenuToggle} title="Toggle menu">
        <Menu size={18} />
      </button>
      <span className="topbar-title">{title}</span>
    </div>
    <div className="topbar-right">
      <NotifBell user={user} />
      {actions}
    </div>
  </div>
);
