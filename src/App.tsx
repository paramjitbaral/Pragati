/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Sidebar, BottomNav } from './components/Navigation';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
import { Plans } from './pages/Plans';
import { HistoryPage } from './pages/History';
import { Profile } from './pages/Profile';
import { SystemHealth } from './pages/SystemHealth';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { KYCPage } from './pages/KYC';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GuardProvider, useGuard } from './contexts/GuardContext';
import { VerificationModal } from './components/VerificationModal';
import { AnimatePresence, motion } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { seedInitialData } from './lib/seed';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();
  
  React.useEffect(() => {
    const isPotentialAdmin = user?.email === 'sworajbaral04@gmail.com' || userProfile?.role === 'admin';
    if (isPotentialAdmin) {
      seedInitialData();
    }
  }, [user, userProfile]);
  
  if (loading) {
    return <>{children}</>; 
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const isVerified = user?.emailVerified || userProfile?.isVerified;
  if (!isVerified && location.pathname !== '/verify-email') {
    return <Navigate to="/verify-email" />;
  }
  
  return <>{children}</>;
}

import { AdminPage } from './pages/Admin';

function AppContent() {
  const location = useLocation();
  const { user } = useAuth();
  const { isVerifying, verificationType, resolveVerification } = useGuard();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return { title: 'Dashboard', subtitle: 'Command Center' };
      case '/plans': return { title: 'Insurance Plans', subtitle: 'Tiers' };
      case '/history': return { title: 'History', subtitle: 'Payouts' };
      case '/profile': return { title: 'Profile', subtitle: 'Worker Architecture' };
      case '/health': return { title: 'System Health', subtitle: 'Fraud & Analytics' };
      case '/kyc': return { title: 'Identity Vault', subtitle: 'Verification' };
      case '/admin': return { title: 'Admin Command', subtitle: 'Operations' };
      default: return { title: 'Kinetic Trust', subtitle: '' };
    }
  };

  const { title, subtitle } = getPageTitle();
  const isAuthPage = ['/login', '/signup', '/verify-email'].includes(location.pathname);
  const isKycPage = location.pathname === '/kyc';

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<ProtectedRoute><VerifyEmailPage /></ProtectedRoute>} />
      </Routes>
    );
  }

  if (isKycPage) {
    return (
      <Routes>
        <Route path="/kyc" element={<ProtectedRoute><KYCPage /></ProtectedRoute>} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col pb-24 md:pb-0">
        <TopBar title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Routes location={location}>
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/health" element={<ProtectedRoute><SystemHealth /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <BottomNav />
      {isVerifying && verificationType && (
        <VerificationModal type={verificationType} onResolve={resolveVerification} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <GuardProvider>
            <AppContent />
          </GuardProvider>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
