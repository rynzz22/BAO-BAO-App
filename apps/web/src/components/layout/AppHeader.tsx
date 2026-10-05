import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  MapPin, Car, Monitor, LayoutDashboard, LogOut,
  Menu, X, ChevronDown, Wifi
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  roles?: string[]
}

const navItems: NavItem[] = [
  { to: '/app', label: 'Passenger', icon: <MapPin size={16} />, roles: ['PASSENGER', 'ADMIN'] },
  { to: '/driver', label: 'Driver App', icon: <Car size={16} />, roles: ['DRIVER', 'ADMIN'] },
  { to: '/dispatch', label: 'Dispatcher', icon: <Monitor size={16} />, roles: ['DISPATCHER', 'ADMIN'] },
  { to: '/admin', label: 'Admin', icon: <LayoutDashboard size={16} />, roles: ['ADMIN'] },
]

export default function AppHeader() {
  const { profile, logout } = useAuthStore()
  const { sidebarOpen, setSidebarOpen } = useUiStore()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)

  const visibleItems = navItems.filter(
    (item) => !item.roles || !profile || item.roles.includes(profile.role)
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    navigate('/login')
    setProfileOpen(false)
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 no-tap-highlight">
              <div className="w-8 h-8 rounded-xl gradient-teal flex items-center justify-center shadow-frost">
                <Wifi size={15} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-bold text-base text-ink">Bao Bao</span>
                <span className="text-ink-tertiary text-xs ml-1.5">Talibon</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-ink-secondary hover:text-ink hover:bg-surface-subtle'
                    )
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {profile ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className={cn(
                      'flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl transition-all duration-150',
                      'hover:bg-surface-subtle',
                      profileOpen && 'bg-surface-subtle'
                    )}
                    aria-expanded={profileOpen}
                  >
                    <Avatar name={profile.fullName ?? profile.email ?? 'U'} size="sm" />
                    <span className="hidden sm:block text-sm font-medium text-ink max-w-24 truncate">
                      {profile.fullName?.split(' ')[0] ?? 'Profile'}
                    </span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        'text-ink-tertiary transition-transform duration-150',
                        profileOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {profileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setProfileOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-52 glass shadow-float rounded-2xl overflow-hidden z-20 animate-scale-in">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-sm font-semibold text-ink truncate">
                            {profile.fullName ?? 'User'}
                          </p>
                          <p className="text-xs text-ink-tertiary truncate">
                            {profile.email ?? profile.phoneNumber ?? ''}
                          </p>
                          <span className="mt-1.5 inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">
                            {profile.role}
                          </span>
                        </div>
                        <div className="p-1.5">
                          <Link
                            to="/app/profile"
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-ink-secondary hover:bg-surface-subtle hover:text-ink transition-colors"
                            onClick={() => setProfileOpen(false)}
                          >
                            Profile Settings
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={14} />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-xl text-ink-secondary hover:bg-surface-subtle transition-colors"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed top-14 left-0 right-0 z-40 glass-nav shadow-float md:hidden animate-slide-down">
            <nav className="flex flex-col p-3 gap-1" aria-label="Mobile navigation">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-ink-secondary hover:text-ink hover:bg-surface-subtle'
                    )
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
