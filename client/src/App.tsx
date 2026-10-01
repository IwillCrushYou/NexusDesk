import React, { useState, useEffect } from 'react';
import { User } from './types';
import { api, setToken } from './api';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { TicketList } from './components/TicketList';
import { CreateTicketModal } from './components/CreateTicketModal';
import { TicketDetailModal } from './components/TicketDetailModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentTab, setCurrentTab] = useState<'tickets' | 'analytics'>('tickets');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check existing session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.getMe();
        setCurrentUser(res.user);
      } catch {
        setToken(null);
        setCurrentUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    checkSession();
  }, []);

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setCurrentTab('tickets');
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loadingUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading NexusDesk...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={currentUser}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onLogout={handleLogout}
      />

      <main className="container" style={{ flex: 1 }}>
        {!currentUser ? (
          <AuthModal onSuccess={(user) => setCurrentUser(user)} />
        ) : currentTab === 'analytics' && currentUser.role === 'ADMIN' ? (
          <AnalyticsDashboard />
        ) : (
          <TicketList
            onSelectTicket={(id) => setSelectedTicketId(id)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            refreshTrigger={refreshTrigger}
          />
        )}
      </main>

      {/* Create Ticket Modal */}
      {currentUser && (
        <CreateTicketModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={triggerRefresh}
        />
      )}

      {/* Ticket Details & State Transition Modal */}
      {currentUser && selectedTicketId && (
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
export default App;
