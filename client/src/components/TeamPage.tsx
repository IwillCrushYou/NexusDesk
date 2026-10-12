import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { User } from '../types';
import { Users, Mail } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export const TeamPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listUsers()
      .then((res) => setUsers(res.users))
      .catch((err) => setError(err.message || 'Failed to load team'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">All users in your NexusDesk workspace</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <span>{error}</span>
        </div>
      )}

      <div className="ticket-table-container">
        {loading ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <Skeleton width={32} height={32} style={{ borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <Skeleton width={120} height={13} style={{ marginBottom: 6 }} />
                  <Skeleton width={180} height={11} />
                </div>
                <Skeleton width={60} height={20} />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="No team members have been added yet."
            icon={<Users size={40} />}
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const initials = u.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <tr key={u.id} style={{ cursor: 'default' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {initials}
                        </div>
                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
                        <Mail size={13} />
                        {u.email}
                      </div>
                    </td>
                    <td>
                      <span className={`role-chip role-${u.role.toLowerCase()}`}>{u.role}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
