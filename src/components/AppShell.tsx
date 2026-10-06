import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, PRESET_PERSONAS } from '../lib/auth-store';
import { UserRole } from '@bao-bao/shared';
import { Car, Globe, LogOut, ChevronDown, Waves } from 'lucide-react';

const homes = {
  [UserRole.PASSENGER]: '/app/home',
  [UserRole.DRIVER]: '/driver/home',
  [UserRole.DISPATCHER]: '/dispatch/board',
  [UserRole.ADMIN]: '/admin/overview',
};
const navigation = {
  [UserRole.PASSENGER]: [
    { to: '/app/home', label: 'Book a ride' },
    { to: '/app/history', label: 'My rides' },
  ],
  [UserRole.DRIVER]: [{ to: '/driver/home', label: 'Driver home' }],
  [UserRole.DISPATCHER]: [
    { to: '/dispatch/board', label: 'Dispatch' },
    { to: '/dispatch/queue', label: 'Terminal queue' },
  ],
  [UserRole.ADMIN]: [
    { to: '/admin/overview', label: 'Overview' },
    { to: '/admin/drivers', label: 'Drivers' },
    { to: '/admin/rides', label: 'Rides' },
  ],
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, switchPersona, logout } = useAuthStore();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const role = user?.role || UserRole.PASSENGER;
  const accountRef = React.useRef<HTMLDetailsElement>(null);
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="app-header frost-surface">
        <div className="header-inner">
          <Link to={homes[role]} className="brand" aria-label="Bao Bao home">
            <span className="brand-icon">
              <Car size={23} />
            </span>
            <span>
              <strong>
                bao bao<span className="brand-dot">.</span>
              </strong>
              <small>TALIBON, BOHOL</small>
            </span>
          </Link>
          <nav className="main-nav" aria-label="Main navigation">
            {navigation[role].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-controls">
            <button
              className="language-button"
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'ceb' : 'en')}
              aria-label="Switch English or Cebuano"
            >
              <Globe size={16} />
              <span>{i18n.language.toUpperCase()}</span>
            </button>
            <details
              className="account-menu"
              ref={accountRef}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && accountRef.current) {
                  accountRef.current.open = false;
                  accountRef.current.querySelector('summary')?.focus();
                }
              }}
            >
              <summary aria-label="Account and demo roles">
                <span className="avatar">{user?.fullName?.charAt(0) || 'A'}</span>
                <span className="account-name">{user?.fullName?.split(' ')[0] || 'Account'}</span>
                <ChevronDown size={14} />
              </summary>
              <div className="account-panel frost-surface">
                <p className="eyebrow">EXPLORE DEMO ROLES</p>
                {PRESET_PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={async () => {
                      await switchPersona(p);
                      if (accountRef.current) accountRef.current.open = false;
                      navigate(homes[p.role]);
                    }}
                    className={user?.id === p.id ? 'selected' : ''}
                  >
                    <strong>{p.name.split(' (')[0]}</strong>
                    <small>{p.role.toLowerCase()}</small>
                  </button>
                ))}
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </details>
          </div>
        </div>
      </header>
      <main id="main-content" className="app-main">
        {children}
      </main>
      <footer className="app-footer">
        <span>
          <Waves size={18} /> Made for the way Talibon moves.
        </span>
        <span>BAO BAO � Talibon, Bohol</span>
      </footer>
    </div>
  );
};
