import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, PRESET_PERSONAS } from '../lib/auth-store';
import { UserRole } from '@bao-bao/shared';
import {
  Car,
  Users,
  ShieldCheck,
  Radio,
  Globe,
  LogOut,
  MapPin,
  ChevronDown,
  Clock,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, switchPersona, logout } = useAuthStore();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ceb' : 'en';
    i18n.changeLanguage(newLang);
  };

  const navLinks = [
    {
      to: '/app/home',
      label: 'Passenger',
      icon: MapPin,
      role: UserRole.PASSENGER,
    },
    {
      to: '/driver/home',
      label: 'Driver App',
      icon: Car,
      role: UserRole.DRIVER,
    },
    {
      to: '/dispatch/board',
      label: 'Terminal Dispatch',
      icon: Radio,
      role: UserRole.DISPATCHER,
    },
    {
      to: '/admin/overview',
      label: 'Admin',
      icon: ShieldCheck,
      role: UserRole.ADMIN,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link to="/app/home" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
                  🛺
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight text-emerald-800">
                    BAO BAO
                  </span>
                  <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                    Talibon
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname.startsWith(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Controls (Persona Switcher, Language, User) */}
            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                title="Toggle Language (English / Cebuano)"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{i18n.language.toUpperCase()}</span>
              </button>

              {/* Persona Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="max-w-[120px] truncate">{user?.fullName || 'Select User'}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-emerald-700 border border-emerald-200">
                    {user?.role}
                  </span>
                  <ChevronDown className="w-3 h-3 text-emerald-700" />
                </button>

                {showPersonaMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Role & Persona
                    </div>
                    {PRESET_PERSONAS.map((p) => (
                      <button
                        key={p.id}
                        onClick={async () => {
                          await switchPersona(p);
                          setShowPersonaMenu(false);
                          if (p.role === UserRole.PASSENGER) navigate('/app/home');
                          else if (p.role === UserRole.DRIVER) navigate('/driver/home');
                          else if (p.role === UserRole.DISPATCHER) navigate('/dispatch/board');
                          else if (p.role === UserRole.ADMIN) navigate('/admin/overview');
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-emerald-50 transition-colors ${
                          user?.id === p.id ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>{p.name}</span>
                          <span className="text-[10px] font-semibold text-emerald-700 uppercase bg-emerald-100/80 px-1.5 py-0.2 rounded">
                            {p.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 truncate mt-0.5">
                          {p.description}
                        </span>
                      </button>
                    ))}
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => {
                        logout();
                        navigate('/login');
                        setShowPersonaMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 font-semibold flex items-center gap-2 hover:bg-red-50"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden border-t border-slate-200 bg-white px-2 py-1.5 flex justify-around">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex flex-col items-center py-1 px-3 text-[11px] font-medium rounded-lg ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>
          <strong>BAO BAO</strong> &copy; {new Date().getFullYear()} — Talibon, Bohol. Inclusive
          Transportation Platform across App, SMS, and Dispatcher Channels.
        </p>
      </footer>
    </div>
  );
};
