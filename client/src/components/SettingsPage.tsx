import React from 'react';
import { User } from '../types';
import { useTheme } from './ThemeProvider';
import { Moon, Sun } from 'lucide-react';

interface SettingsPageProps {
  currentUser: User;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser }) => {
  const { theme, toggle } = useTheme();

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Account and workspace preferences</p>
        </div>
      </div>

      <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Profile */}
        <div className="ticket-table-container" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
            Profile
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div className="form-label">Name</div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{currentUser.name}</div>
            </div>
            <div>
              <div className="form-label">Email</div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{currentUser.email}</div>
            </div>
            <div>
              <div className="form-label">Role</div>
              <span className={`role-chip role-${currentUser.role.toLowerCase()}`}>{currentUser.role}</span>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="ticket-table-container" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
            Appearance
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Theme</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Currently using {theme} mode
              </div>
            </div>
            <button
              className="btn btn-secondary"
              onClick={toggle}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              Switch to {theme === 'dark' ? 'light' : 'dark'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div style={{ fontSize: 12, color: 'var(--text-disabled)', textAlign: 'center' }}>
          NexusDesk · IT helpdesk and ticket management
        </div>
      </div>
    </div>
  );
};

