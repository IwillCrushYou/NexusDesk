import React, { useState } from 'react';
import { api, setToken } from '../api';
import { User } from '../types';
import { Lock, Mail, User as UserIcon, AlertCircle, Eye, EyeOff, Ticket } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = isSignup
        ? await api.signup(name, email, password)
        : await api.login(email, password);
      setToken(res.token);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
    setIsSignup(false);
    setError(null);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-mark">
            <Ticket size={16} color="var(--accent-text)" />
          </div>
          <span className="auth-logo-name">NexusDesk</span>
        </div>

        <h1 className="auth-heading">
          {isSignup ? 'Create account' : 'Sign in'}
        </h1>
        <p className="auth-subheading">
          {isSignup
            ? 'Get access to your team workspace'
            : 'IT helpdesk and ticket management'}
        </p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {isSignup && (
            <div className="form-group">
              <label className="form-label form-label-required">Full Name</label>
              <div className="input-wrapper">
                <UserIcon size={14} className="input-icon" />
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-with-icon"
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label form-label-required">Work Email</label>
            <div className="input-wrapper">
              <Mail size={14} className="input-icon" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-with-icon"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label form-label-required">Password</label>
            <div className="input-wrapper">
              <Lock size={14} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-with-icon"
                style={{ paddingRight: 36 }}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {loading ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setError(null); }}
              style={{ fontSize: 12, color: 'var(--text-secondary)' }}
            >
              {isSignup
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Demo quick-fill */}
          <div className="auth-demo">
            <div className="auth-demo-label">Demo accounts</div>
            <div className="auth-demo-buttons">
              {[
                { label: 'Employee', email: 'alice.emp@nexusdesk.local', role: 'Employee' },
                { label: 'Agent', email: 'charlie.agent@nexusdesk.local', role: 'Agent' },
                { label: 'Admin', email: 'diana.admin@nexusdesk.local', role: 'Admin' },
              ].map(({ label, email: demoEmail, role }) => (
                <button
                  key={label}
                  type="button"
                  className="auth-demo-btn"
                  onClick={() => quickFill(demoEmail)}
                >
                  <span>{label} — {demoEmail}</span>
                  <span style={{ fontSize: 10, opacity: 0.6 }}>{role}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
