import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { ToastContainer } from '@/components/ui/Toast'
import AppHeader from '@/components/layout/AppHeader'
import { PageLoader } from '@/components/ui/Spinner'

// Pages
import LoginPage from '@/pages/LoginPage'
import PassengerHomePage from '@/pages/passenger/HomePage'
import ActiveRidePage from '@/pages/passenger/ActiveRidePage'
import RideHistoryPage from '@/pages/passenger/RideHistoryPage'
import ProfilePage from '@/pages/passenger/ProfilePage'
import DriverHomePage from '@/pages/driver/DriverHomePage'
import DriverRideActivePage from '@/pages/driver/DriverRideActivePage'
import DispatchBoardPage from '@/pages/dispatcher/DispatchBoardPage'
import AdminOverviewPage from '@/pages/admin/AdminOverviewPage'
import NotFoundPage from '@/pages/NotFoundPage'
import type { Profile } from '@/types'

// ─── Auth guard ───────────────────────────────────────────────

function RequireAuth({ roles }: { roles?: string[] }) {
  const { profile, isLoading } = useAuthStore()

  if (isLoading) return <PageLoader />

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(profile.role)) {
    // Redirect to their default page
    const defaults: Record<string, string> = {
      PASSENGER: '/app',
      DRIVER: '/driver',
      DISPATCHER: '/dispatch',
      ADMIN: '/admin',
    }
    return <Navigate to={defaults[profile.role] ?? '/app'} replace />
  }

  return <Outlet />
}

// ─── App shell with header ────────────────────────────────────

function AppShell() {
  return (
    <>
      <AppHeader />
      <Outlet />
    </>
  )
}

// ─── Auth provider effect ─────────────────────────────────────

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setProfile, setToken, setLoading } = useAuthStore()

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        setToken(data.session.access_token)
        try {
          const profile = await api.post<Profile>('/auth/sync')
          setProfile(profile)
        } catch {
          // Session exists but no profile — may need to register
          setProfile(null)
        }
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setToken(session.access_token)
        try {
          const profile = await api.post<Profile>('/auth/sync')
          setProfile(profile)
        } catch {
          setProfile(null)
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
        setToken(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [setProfile, setToken, setLoading])

  return <>{children}</>
}

// ─── Root ─────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/app" replace />} />

            {/* Protected — all roles with header */}
            <Route element={<AppShell />}>
              {/* Passenger */}
              <Route element={<RequireAuth roles={['PASSENGER', 'ADMIN']} />}>
                <Route path="/app" element={<PassengerHomePage />} />
                <Route path="/app/ride/:id" element={<ActiveRidePage />} />
                <Route path="/app/history" element={<RideHistoryPage />} />
                <Route path="/app/profile" element={<ProfilePage />} />
              </Route>

              {/* Driver */}
              <Route element={<RequireAuth roles={['DRIVER', 'ADMIN']} />}>
                <Route path="/driver" element={<DriverHomePage />} />
                <Route path="/driver/ride/:id" element={<DriverRideActivePage />} />
              </Route>

              {/* Dispatcher */}
              <Route element={<RequireAuth roles={['DISPATCHER', 'ADMIN']} />}>
                <Route path="/dispatch" element={<DispatchBoardPage />} />
              </Route>

              {/* Admin */}
              <Route element={<RequireAuth roles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminOverviewPage />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <ToastContainer />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
