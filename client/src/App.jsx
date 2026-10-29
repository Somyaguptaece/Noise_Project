import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/common/Sidebar.jsx';
import { Navbar } from './components/common/Navbar.jsx';
import { ToastProvider } from './hooks/useToast.jsx';

// Pages
import { OverviewPage } from './pages/OverviewPage.jsx';
import { InboxPage } from './pages/InboxPage.jsx';
import { TicketWorkspacePage } from './pages/TicketWorkspacePage.jsx';
import { OrdersCustomersPage } from './pages/OrdersCustomersPage.jsx';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage.jsx';
import { AnalyticsPage } from './pages/AnalyticsPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 flex">
          {/* Persistent Sidebar */}
          <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

          {/* Main Layout Area */}
          <div className="flex-1 flex flex-col md:pl-64 min-w-0">
            {/* Top Navigation Bar */}
            <Navbar setMobileOpen={setMobileOpen} />

            {/* Application Views */}
            <main className="flex-1 overflow-x-hidden">
              <Routes>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/tickets/:id" element={<TicketWorkspacePage />} />
                <Route path="/orders" element={<OrdersCustomersPage />} />
                <Route path="/knowledge" element={<KnowledgeBasePage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}
