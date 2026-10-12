import React, { useState } from 'react';
import {
  Ticket,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  Sun,
  Moon,
  Users,
  Activity,
  Layers,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { User } from '../types';
import { api, setToken } from '../api';
import { useToast } from './ToastProvider';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLoginSuccess: (user: User) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onLoginSuccess }) => {
  const { theme, toggle } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'employee' | 'agent' | 'admin'>('employee');
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const handleQuickLogin = async (email: string, roleName: string) => {
    setDemoLoading(email);
    try {
      const res = await api.login(email, 'Password123!');
      setToken(res.token);
      toast('success', `Signed in as ${roleName}`, `Logged in with demo profile: ${email}`);
      onLoginSuccess(res.user);
    } catch (err: any) {
      toast('error', 'Demo sign-in failed', err.message || 'Could not log in');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="landing-container">
      {/* Navigation Header */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <div className="sidebar-logo-mark">
              <Ticket size={16} color="var(--accent-text)" />
            </div>
            <span className="landing-brand-name">NexusDesk</span>
          </div>

          <nav className="landing-links">
            <a href="#features">Features</a>
            <a href="#roles">Workflows</a>
            <a href="#sla">SLA & Security</a>
            <a href="#demo">Live Demo</a>
          </nav>

          <div className="landing-actions">
            <button
              className="btn btn-ghost btn-icon"
              onClick={toggle}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{ color: 'var(--text-secondary)' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenAuth('login')}
            >
              Sign In
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onOpenAuth('signup')}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-badge">
          <span className="landing-badge-dot" />
          NexusDesk IT Service Desk 2.0
        </div>

        <h1 className="landing-hero-title">
          Modern IT helpdesk engineered for <span className="highlight-text">clarity</span> and velocity.
        </h1>

        <p className="landing-hero-subtitle">
          Eliminate ticket chaos. NexusDesk pairs intelligent load-balanced auto-assignment, strict SLA monitoring, and immutable event auditing with a quiet, distraction-free interface.
        </p>

        <div className="landing-hero-cta">
          <button
            className="btn btn-primary"
            style={{ padding: '9px 20px', fontSize: 14 }}
            onClick={() => onOpenAuth('signup')}
          >
            Start Free Workspace
            <ArrowRight size={15} />
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '9px 18px', fontSize: 14 }}
            onClick={() => onOpenAuth('login')}
          >
            Sign In with Email
          </button>
        </div>

        {/* Quick Demo Launcher Bar */}
        <div className="landing-demo-bar">
          <span className="landing-demo-label">1-Click Demo Evaluation:</span>
          <div className="landing-demo-pills">
            <button
              className="demo-pill"
              onClick={() => handleQuickLogin('alice.emp@nexusdesk.local', 'Alice (Employee)')}
              disabled={demoLoading !== null}
            >
              <Users size={12} />
              <span>Employee (Alice)</span>
            </button>
            <button
              className="demo-pill"
              onClick={() => handleQuickLogin('charlie.agent@nexusdesk.local', 'Charlie (Agent)')}
              disabled={demoLoading !== null}
            >
              <UserCheck size={12} />
              <span>Support Agent (Charlie)</span>
            </button>
            <button
              className="demo-pill"
              onClick={() => handleQuickLogin('diana.admin@nexusdesk.local', 'Diana (Admin)')}
              disabled={demoLoading !== null}
            >
              <ShieldCheck size={12} />
              <span>Admin (Diana)</span>
            </button>
          </div>
        </div>

        {/* Product UI Preview Mockup */}
        <div className="landing-preview-window">
          <div className="preview-topbar">
            <div className="preview-dots">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
            <div className="preview-address">nexusdesk.internal / workspace / tickets</div>
          </div>

          <div className="preview-body">
            <div className="preview-metrics">
              <div className="preview-metric-card">
                <span className="p-label">Open Tickets</span>
                <span className="p-val">12</span>
                <span className="p-sub">queue active</span>
              </div>
              <div className="preview-metric-card">
                <span className="p-label">Unassigned</span>
                <span className="p-val" style={{ color: 'var(--warning)' }}>2</span>
                <span className="p-sub">needs dispatch</span>
              </div>
              <div className="preview-metric-card">
                <span className="p-label">Avg Resolution</span>
                <span className="p-val">1.4h</span>
                <span className="p-sub">within SLA target</span>
              </div>
              <div className="preview-metric-card">
                <span className="p-label">SLA Breach Rate</span>
                <span className="p-val" style={{ color: 'var(--success)' }}>0.0%</span>
                <span className="p-sub">100% compliant</span>
              </div>
            </div>

            <div className="preview-table">
              <div className="preview-row preview-row-head">
                <span>ID</span>
                <span>Subject</span>
                <span>Requester</span>
                <span>Assignee</span>
                <span>Priority</span>
                <span>Status</span>
              </div>
              <div className="preview-row">
                <span className="text-mono">#TK-8942</span>
                <span className="preview-subject">VPN Gateway authentication error across EU-West</span>
                <span>Alice Martin</span>
                <span>Charlie Agent</span>
                <span className="priority-badge priority-critical">Critical</span>
                <span className="status-badge status-in_progress">In Progress</span>
              </div>
              <div className="preview-row">
                <span className="text-mono">#TK-8941</span>
                <span className="preview-subject">Provision Docker & Kubernetes access for data science</span>
                <span>Marcus Vance</span>
                <span>Auto-Assigned</span>
                <span className="priority-badge priority-high">High</span>
                <span className="status-badge status-open">Open</span>
              </div>
              <div className="preview-row">
                <span className="text-mono">#TK-8940</span>
                <span className="preview-subject">Hardware security key (Yubikey 5C) replacement</span>
                <span>Elena Rostova</span>
                <span>Charlie Agent</span>
                <span className="priority-badge priority-medium">Medium</span>
                <span className="status-badge status-resolved">Resolved</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Section */}
      <section id="features" className="landing-section">
        <div className="landing-section-header">
          <span className="section-eyebrow">Purpose-Built Architecture</span>
          <h2 className="section-headline">Everything your support infrastructure needs. Nothing it doesn't.</h2>
          <p className="section-description">
            Designed from first principles to prioritize operator focus, rapid triage, and predictable service level fulfillment.
          </p>
        </div>

        <div className="landing-grid-cards">
          <div className="feature-card">
            <div className="feature-icon-box">
              <Zap size={18} />
            </div>
            <h3 className="feature-title">Intelligent Auto-Assignment</h3>
            <p className="feature-body">
              Automatically distributes incoming tickets to the least-loaded support engineer, preventing burnout and ensuring uniform response distribution across your team.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Clock size={18} />
            </div>
            <h3 className="feature-title">Strict SLA Timers & Alarms</h3>
            <p className="feature-body">
              Deterministic SLA timers dynamically calibrated to priority (4h Critical down to 72h Low). Clear visual alarms signal approaching thresholds before agreements breach.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Activity size={18} />
            </div>
            <h3 className="feature-title">Immutable Event Audit Trail</h3>
            <p className="feature-body">
              Every state transition, agent assignment, and timestamp change is preserved in an immutable chronological history for complete compliance and review.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Layers size={18} />
            </div>
            <h3 className="feature-title">Finite State Machine Engine</h3>
            <p className="feature-body">
              Explicit transition logic enforces safe ticket lifecycles (Open &rarr; In Progress &rarr; Resolved &rarr; Closed) without accidental jumps or invalid statuses.
            </p>
          </div>
        </div>
      </section>

      {/* Workflows by Role Section */}
      <section id="roles" className="landing-section" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
        <div className="landing-section-header">
          <span className="section-eyebrow">Tailored Workspaces</span>
          <h2 className="section-headline">Customized for every stakeholder in your organization</h2>
        </div>

        <div className="roles-tab-selector">
          <button
            className={`roles-tab-btn ${activeTab === 'employee' ? 'active' : ''}`}
            onClick={() => setActiveTab('employee')}
          >
            For Employees
          </button>
          <button
            className={`roles-tab-btn ${activeTab === 'agent' ? 'active' : ''}`}
            onClick={() => setActiveTab('agent')}
          >
            For Support Agents
          </button>
          <button
            className={`roles-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            For IT Administrators
          </button>
        </div>

        <div className="roles-tab-content">
          {activeTab === 'employee' && (
            <div className="roles-detail-box">
              <div className="roles-detail-text">
                <h3>Effortless issue submission & live updates</h3>
                <p>
                  Employees report problems in seconds with clear priority categories. They get real-time visibility into who is working on their ticket and estimated SLA completion times without chasing down engineers.
                </p>
                <ul className="roles-check-list">
                  <li>Simplified ticket submission with auto-triage</li>
                  <li>Live tracking of assigned specialist</li>
                  <li>Real-time notifications upon status resolution</li>
                </ul>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 14 }}
                  onClick={() => handleQuickLogin('alice.emp@nexusdesk.local', 'Alice (Employee)')}
                >
                  Experience Employee View &rarr;
                </button>
              </div>
            </div>
          )}

          {activeTab === 'agent' && (
            <div className="roles-detail-box">
              <div className="roles-detail-text">
                <h3>High-velocity triage and queue execution</h3>
                <p>
                  Support engineers operate in a distraction-free queue. Quick keyboard-accessible filtering, instant state transitions, and SLA warnings keep urgent problems front-and-center.
                </p>
                <ul className="roles-check-list">
                  <li>Filtered views: My Tickets, Unassigned, and Critical queues</li>
                  <li>One-click state transitions following strict business rules</li>
                  <li>Zero decorative clutter—pure information density</li>
                </ul>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 14 }}
                  onClick={() => handleQuickLogin('charlie.agent@nexusdesk.local', 'Charlie (Agent)')}
                >
                  Experience Agent View &rarr;
                </button>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="roles-detail-box">
              <div className="roles-detail-text">
                <h3>Complete operational telemetry and governance</h3>
                <p>
                  Workspace administrators oversee team capacity, analyze 30-day ticket volume trends, inspect SLA breach metrics, and manage user access across the company.
                </p>
                <ul className="roles-check-list">
                  <li>Real-time aggregate analytics & resolution duration trends</li>
                  <li>Workload distribution breakdown per support engineer</li>
                  <li>Company-wide member roster and access control</li>
                </ul>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 14 }}
                  onClick={() => handleQuickLogin('diana.admin@nexusdesk.local', 'Diana (Admin)')}
                >
                  Experience Admin View &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SLA & Security Section */}
      <section id="sla" className="landing-section">
        <div className="landing-sla-banner">
          <div className="sla-banner-content">
            <span className="section-eyebrow">Enterprise SLA Guarantees</span>
            <h2 className="section-headline" style={{ color: 'var(--text-primary)' }}>
              Deterministic SLAs. Verifiable reliability.
            </h2>
            <p className="section-description">
              Configure strict response windows per criticality level. Whether it is a 4-hour critical incident or a standard 72-hour provisioning request, NexusDesk measures and alerts before service promises fail.
            </p>
            <div className="sla-tiers">
              <div className="sla-tier-card">
                <span className="sla-tier-name">Critical</span>
                <span className="sla-tier-hours">4 Hours</span>
                <span className="sla-tier-desc">P1 Outages & Security</span>
              </div>
              <div className="sla-tier-card">
                <span className="sla-tier-name">High</span>
                <span className="sla-tier-hours">24 Hours</span>
                <span className="sla-tier-desc">Impaired Workflow</span>
              </div>
              <div className="sla-tier-card">
                <span className="sla-tier-name">Medium</span>
                <span className="sla-tier-hours">48 Hours</span>
                <span className="sla-tier-desc">Standard Technical Help</span>
              </div>
              <div className="sla-tier-card">
                <span className="sla-tier-name">Low</span>
                <span className="sla-tier-hours">72 Hours</span>
                <span className="sla-tier-desc">General Inquiries</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Final Section */}
      <section id="demo" className="landing-cta-section">
        <div className="cta-box">
          <h2 className="cta-headline">Ready to streamline your internal IT helpdesk?</h2>
          <p className="cta-subtitle">
            Sign up for a workspace or explore our demo accounts with pre-populated production data.
          </p>
          <div className="cta-btn-group">
            <button
              className="btn btn-primary"
              style={{ padding: '10px 24px', fontSize: 14 }}
              onClick={() => onOpenAuth('signup')}
            >
              Get Started with NexusDesk
              <ChevronRight size={15} />
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '10px 20px', fontSize: 14 }}
              onClick={() => onOpenAuth('login')}
            >
              Sign In to Existing Account
            </button>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-left">
            <div className="sidebar-logo-mark" style={{ width: 22, height: 22 }}>
              <Ticket size={12} color="var(--accent-text)" />
            </div>
            <span style={{ fontWeight: 600, fontSize: 13 }}>NexusDesk</span>
            <span style={{ color: 'var(--text-disabled)', fontSize: 12 }}>— Minimalist Enterprise IT Service Desk</span>
          </div>
          <div className="footer-right">
            <span>Clean &bull; Restrained &bull; Fast</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
