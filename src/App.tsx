import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/AppShell';
import { RouteGuard } from './components/RouteGuard';
import { UserRole } from '@bao-bao/shared';

// Pages
import { LoginPage } from './pages/LoginPage';
import { PassengerHomePage } from './pages/passenger/PassengerHomePage';
import { RideDetailPage } from './pages/passenger/RideDetailPage';
import { PassengerHistoryPage } from './pages/passenger/PassengerHistoryPage';
import { DriverHomePage } from './pages/driver/DriverHomePage';
import { DriverRidePage } from './pages/driver/DriverRidePage';
import { DispatchBoardPage } from './pages/dispatcher/DispatchBoardPage';
import { TerminalQueuePage } from './pages/dispatcher/TerminalQueuePage';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminDriversPage } from './pages/admin/AdminDriversPage';
import { AdminRidesPage } from './pages/admin/AdminRidesPage';

import './lib/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/app/home" replace />} />

          {/* Protected Application Routes wrapped in AppShell */}
          <Route
            path="/*"
            element={
              <AppShell>
                <Routes>
                  {/* Passenger Routes */}
                  <Route
                    path="/app/home"
                    element={
                      <RouteGuard allowedRoles={[UserRole.PASSENGER, UserRole.ADMIN]}>
                        <PassengerHomePage />
                      </RouteGuard>
                    }
                  />
                  <Route
                    path="/app/ride/:id"
                    element={
                      <RouteGuard>
                        <RideDetailPage />
                      </RouteGuard>
                    }
                  />
                  <Route
                    path="/app/history"
                    element={
                      <RouteGuard allowedRoles={[UserRole.PASSENGER, UserRole.ADMIN]}>
                        <PassengerHistoryPage />
                      </RouteGuard>
                    }
                  />

                  {/* Driver Routes */}
                  <Route
                    path="/driver/home"
                    element={
                      <RouteGuard allowedRoles={[UserRole.DRIVER, UserRole.ADMIN]}>
                        <DriverHomePage />
                      </RouteGuard>
                    }
                  />
                  <Route
                    path="/driver/ride/:id"
                    element={
                      <RouteGuard allowedRoles={[UserRole.DRIVER, UserRole.ADMIN]}>
                        <DriverRidePage />
                      </RouteGuard>
                    }
                  />

                  {/* Terminal Dispatcher Routes */}
                  <Route
                    path="/dispatch/board"
                    element={
                      <RouteGuard allowedRoles={[UserRole.DISPATCHER, UserRole.ADMIN]}>
                        <DispatchBoardPage />
                      </RouteGuard>
                    }
                  />
                  <Route
                    path="/dispatch/queue"
                    element={
                      <RouteGuard allowedRoles={[UserRole.DISPATCHER, UserRole.ADMIN]}>
                        <TerminalQueuePage />
                      </RouteGuard>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin/overview"
                    element={
                      <RouteGuard allowedRoles={[UserRole.ADMIN]}>
                        <AdminOverviewPage />
                      </RouteGuard>
                    }
                  />
                  <Route
                    path="/admin/drivers"
                    element={
                      <RouteGuard allowedRoles={[UserRole.ADMIN]}>
                        <AdminDriversPage />
                      </RouteGuard>
                    }
                  />
                  <Route
                    path="/admin/rides"
                    element={
                      <RouteGuard allowedRoles={[UserRole.ADMIN]}>
                        <AdminRidesPage />
                      </RouteGuard>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/app/home" replace />} />
                </Routes>
              </AppShell>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
