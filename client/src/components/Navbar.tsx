import React, { useState, useEffect } from 'react';
import { User, NotificationItem } from '../types';
import { api } from '../api';
import { Ticket, BarChart3, Bell, LogOut, CheckCheck } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  currentTab: 'tickets' | 'analytics';
  onSelectTab: (tab: 'tickets' | 'analytics') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentTab,
  onSelectTab,
  onLogout,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.listNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // silently fail if not authenticated
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'badge-role-admin';
      case 'AGENT':
        return 'badge-role-agent';
      default:
        return 'badge-role-employee';
    }
  };

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <a href="#" className="brand" onClick={(e) => { e.preventDefault(); onSelectTab('tickets'); }}>
          <div className="brand-icon">
            <Ticket size={20} />
          </div>
          <span>NexusDesk</span>
        </a>

        {user && (
          <nav className="nav-links">
            <button
              className={`nav-btn ${currentTab === 'tickets' ? 'active' : ''}`}
              onClick={() => onSelectTab('tickets')}
            >
              <Ticket size={16} />
              Tickets
            </button>

            {user.role === 'ADMIN' && (
              <button
                className={`nav-btn ${currentTab === 'analytics' ? 'active' : ''}`}
                onClick={() => onSelectTab('analytics')}
              >
                <BarChart3 size={16} />
                Analytics
              </button>
            )}
          </nav>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user && (
          <>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn-secondary"
                style={{ padding: '8px 10px', position: 'relative' }}
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      background: 'var(--danger)',
                      color: 'white',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 10,
                      padding: '2px 5px',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 45,
                    width: 340,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    zIndex: 60,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {unreadCount} unread
                    </span>
                  </div>

                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--border)',
                            background: n.read ? 'transparent' : 'rgba(79, 70, 229, 0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 8,
                            fontSize: 13,
                          }}
                        >
                          <div>
                            <p style={{ color: n.read ? 'var(--text-muted)' : 'var(--text-main)', marginBottom: 4 }}>
                              {n.message}
                            </p>
                            <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                              {new Date(n.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          {!n.read && (
                            <button
                              onClick={() => handleMarkRead(n.id)}
                              style={{ color: 'var(--primary)', height: 'fit-content' }}
                              title="Mark as read"
                            >
                              <CheckCheck size={16} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{user.name}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                  <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                className="btn-secondary"
                onClick={onLogout}
                style={{ padding: '8px 10px', color: 'var(--danger)' }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
