import React, { useState } from 'react';
import { api, setToken } from '../api';
import { User } from '../types';
import { Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (isSignup) {
        res = await api.signup(name, email, password);
      } else {
        res = await api.login(email, password);
      }
      setToken(res.token);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo fill buttons (useful for screen sharing / interviewing)
  const quickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
    setIsSignup(false);
    setError(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>
            {isSignup ? 'Create an Account' : 'Sign In to NexusDesk'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div
              style={{
                background: 'var(--danger-light)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: 6,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {isSignup && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: 'var(--text-muted)' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', paddingLeft: 36 }}
                />
                <UserIcon size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-subtle)' }} />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: 'var(--text-muted)' }}>
              Work Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: 36 }}
              />
              <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-subtle)' }} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: 'var(--text-muted)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: 36 }}
              />
              <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-subtle)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setError(null); }}
              style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'underline' }}
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Quick Demo Logins for Interviews */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>
              Demo Quick-Fill Accounts:
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: 11, padding: '4px 8px' }}
                onClick={() => quickFill('alice.emp@nexusdesk.local')}
              >
                Employee (Alice)
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: 11, padding: '4px 8px' }}
                onClick={() => quickFill('charlie.agent@nexusdesk.local')}
              >
                Agent (Charlie)
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: 11, padding: '4px 8px' }}
                onClick={() => quickFill('diana.admin@nexusdesk.local')}
              >
                Admin (Diana)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
