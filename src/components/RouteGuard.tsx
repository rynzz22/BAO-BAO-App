import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../lib/auth-store';
import { UserRole } from '@bao-bao/shared';
import { ShieldAlert } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl shadow-sm border border-amber-200 text-center">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Access Restricted</h2>
        <p className="text-sm text-slate-600 mb-4">
          This area requires the <strong>{allowedRoles.join(' or ')}</strong> role. Your current role is{' '}
          <strong>{user.role}</strong>.
        </p>
        <p className="text-xs text-slate-500">
          Use the top-right role switcher to switch to an authorized persona for testing.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
