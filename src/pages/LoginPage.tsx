import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, PRESET_PERSONAS, SeedPersona } from '../lib/auth-store';
import { api } from '../lib/api-client';
import { UserRole, ProfileDto } from '@bao-bao/shared';
import { Car, Lock, Mail, User, ArrowRight, ShieldCheck, Phone } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { switchPersona, setAuth } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PASSENGER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // In production, this would call supabase.auth.signInWithPassword or signUp.
      // Here, we sync with the backend /auth/sync endpoint to register/retrieve the profile.
      const userId = `usr-${Date.now()}`;
      const profile = await api.post<ProfileDto>('/auth/sync', {
        fullName: fullName || email.split('@')[0],
        email,
        role,
        preferredLanguage: 'en',
      }, {
        headers: { Authorization: `Bearer ${userId}` },
      });

      setAuth(userId, profile);

      if (profile.role === UserRole.PASSENGER) navigate('/app/home');
      else if (profile.role === UserRole.DRIVER) navigate('/driver/home');
      else if (profile.role === UserRole.DISPATCHER) navigate('/dispatch/board');
      else if (profile.role === UserRole.ADMIN) navigate('/admin/overview');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersonaLogin = async (persona: SeedPersona) => {
    setLoading(true);
    try {
      await switchPersona(persona);
      if (persona.role === UserRole.PASSENGER) navigate('/app/home');
      else if (persona.role === UserRole.DRIVER) navigate('/driver/home');
      else if (persona.role === UserRole.DISPATCHER) navigate('/dispatch/board');
      else if (persona.role === UserRole.ADMIN) navigate('/admin/overview');
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white text-3xl font-extrabold flex items-center justify-center mx-auto shadow-md mb-3">
          🛺
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          BAO BAO Talibon
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Community transportation across App, SMS, and Dispatcher channels
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Quick Demo Personas */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 mb-6 shadow-xs">
          <div className="flex items-center gap-2 mb-2 font-bold text-xs text-emerald-900 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Instant Demo Personas</span>
          </div>
          <p className="text-xs text-emerald-800 mb-3">
            Click any role to log in with pre-configured seed data and credentials:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_PERSONAS.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={loading}
                onClick={() => handleQuickPersonaLogin(p)}
                className="text-left p-2.5 bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100/50 rounded-xl transition-all shadow-xs flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 truncate">{p.name.split(' ')[0]}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {p.role}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 truncate mt-1">
                  {p.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Regular Login Form */}
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleAuthSubmit}>
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={UserRole.PASSENGER}>Passenger</option>
                  <option value={UserRole.DRIVER}>Driver (Smartphone App)</option>
                  <option value={UserRole.DISPATCHER}>Terminal Dispatcher</option>
                  <option value={UserRole.ADMIN}>LGU Admin</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors shadow-sm disabled:opacity-50"
            >
              <span>{isSignUp ? 'Create Account & Sync' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-emerald-700 font-bold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
