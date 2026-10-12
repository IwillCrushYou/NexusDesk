import React, { useState, useEffect } from 'react';
import { User } from './types';
import { api, setToken } from './api';
import { Sidebar, Topbar, NavPage } from './components/Sidebar';
import { AuthScreen } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { TicketList } from './components/TicketList';
import { CreateTicketModal } from './components/CreateTicketModal';
import { TicketDetailModal } from './components/TicketDetailModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { OverviewDashboard } from './components/OverviewDashboard';
import { TeamPage } from './components/TeamPage';
import { SettingsPage } from './components/SettingsPage';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastProvider } from './components/ToastProvider';

const PAGE_TITLES: Record<NavPage, string> = {
  'overview': 'Overview',
  'my-tickets': 'My Tickets',
  'all-tickets': 'All Tickets',
  'unassigned': 'Unassigned',
  'reports': 'Reports',
  'team': 'Team',
  'settings': 'Settings',
};

function normalizeUser(user: User): User {
  const name = typeof user.name === 'string' && user.name.trim()
    ? user.name.trim()
    : typeof user.email === 'string' && user.email.includes('@')
      ? user.email.split('@')[0]
      : 'User';

  return { ...user, name };
}

const AppInner: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [unauthView, setUnauthView] = useState<'landing' | 'auth'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentPage, setCurrentPage] = useState<NavPage>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check existing session on mount
  useEffect(() => {
    api.getMe()
      .then((res) => setCurrentUser(normalizeUser(res.user)))
      .catch(() => { setToken(null); setCurrentUser(null); })
      .finally(() => setLoadingUser(false));
  }, []);

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setCurrentPage('overview');
    setUnauthView('landing');
    setSidebarOpen(false);
  };

  const triggerRefresh = () => setRefreshTrigger((n) => n + 1);

  if (loadingUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  if (!currentUser) {
    if (unauthView === 'landing') {
      return (
        <LandingPage
          onOpenAuth={(mode) => {
            setAuthMode(mode);
            setUnauthView('auth');
          }}
          onLoginSuccess={(user) => setCurrentUser(normalizeUser(user))}
        />
      );
    }
    return (
      <AuthScreen
        initialMode={authMode}
        onSuccess={(user) => setCurrentUser(normalizeUser(user))}
        onBackToLanding={() => setUnauthView('landing')}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return (
          <OverviewDashboard
            currentUser={currentUser}
            onSelectTicket={setSelectedTicketId}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            refreshTrigger={refreshTrigger}
          />
        );

      case 'my-tickets':
        return (
          <TicketList
            currentUser={currentUser}
            view="my-tickets"
            onSelectTicket={setSelectedTicketId}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            refreshTrigger={refreshTrigger}
          />
        );

      case 'all-tickets':
        return (
          <TicketList
            currentUser={currentUser}
            view="all-tickets"
            onSelectTicket={setSelectedTicketId}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            refreshTrigger={refreshTrigger}
          />
        );

      case 'unassigned':
        return (
          <TicketList
            currentUser={currentUser}
            view="unassigned"
            onSelectTicket={setSelectedTicketId}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            refreshTrigger={refreshTrigger}
          />
        );

      case 'reports':
        if (currentUser.role === 'AGENT' || currentUser.role === 'ADMIN') {
          return <AnalyticsDashboard />;
        }
        // Fallback for users that somehow reach this route
        return (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
            Access restricted.
          </div>
        );

      case 'team':
        if (currentUser.role === 'ADMIN') {
          return <TeamPage />;
        }
        return (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
            Access restricted.
          </div>
        );

      case 'settings':
        return <SettingsPage currentUser={currentUser} />;

      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        user={currentUser}
        currentPage={currentPage}
        onNavigate={(page) => { setCurrentPage(page); setSidebarOpen(false); }}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-workspace">
        <Topbar
          title={PAGE_TITLES[currentPage]}
          user={currentUser}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          actions={
            ['overview', 'my-tickets', 'all-tickets', 'unassigned'].includes(currentPage) ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsCreateModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              >
                + New Ticket
              </button>
            ) : undefined
          }
        />

        <main className="page-content">
          {renderPage()}
        </main>
      </div>

      {/* Modals */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={triggerRefresh}
      />

      {selectedTicketId && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          currentUser={currentUser}
          onClose={() => setSelectedTicketId(null)}
          onStatusUpdated={triggerRefresh}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => (
  <ThemeProvider>
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  </ThemeProvider>
);

export default App;
