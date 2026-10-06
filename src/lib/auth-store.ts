import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, ProfileDto } from '@bao-bao/shared';
import { api } from './api-client';

export interface SeedPersona {
  role: UserRole;
  name: string;
  email: string;
  id: string;
  description: string;
}

export const PRESET_PERSONAS: SeedPersona[] = [
  {
    role: UserRole.PASSENGER,
    name: 'AJ Passenger',
    email: 'ana@baobao.local',
    id: '44444444-4444-4444-4444-444444444404',
    description: 'Local student/commuter booking tricycles across Talibon',
  },
  {
    role: UserRole.DRIVER,
    name: 'Mario Batumbakal (Driver #017)',
    email: 'mario@baobao.local',
    id: '44444444-4444-4444-4444-444444444403',
    description: 'Smartphone App Driver with motorized tricycle TRIC-017',
  },
  {
    role: UserRole.DISPATCHER,
    name: 'Elena Dispatcher',
    email: 'dispatcher@baobao.local',
    id: '44444444-4444-4444-4444-444444444402',
    description: 'Talibon Seaport Terminal manager assigning rides & queue',
  },
  {
    role: UserRole.ADMIN,
    name: 'System Administrator',
    email: 'admin@baobao.local',
    id: '44444444-4444-4444-4444-444444444401',
    description: 'LGU Transport Admin managing drivers, approvals & analytics',
  },
];

interface AuthState {
  user: ProfileDto | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: ProfileDto) => void;
  logout: () => void;
  switchPersona: (persona: SeedPersona) => Promise<void>;
  syncProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: {
        id: PRESET_PERSONAS[0].id,
        fullName: PRESET_PERSONAS[0].name,
        email: PRESET_PERSONAS[0].email,
        phoneNumber: '+639000000088',
        role: UserRole.PASSENGER,
        preferredLanguage: 'en',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      token: PRESET_PERSONAS[0].id,
      isAuthenticated: true,

      setAuth: (token: string, user: ProfileDto) => {
        set({ token, user, isAuthenticated: true });
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
        localStorage.removeItem('bao_bao_auth');
      },

      switchPersona: async (persona: SeedPersona) => {
        const token = persona.id;
        try {
          const profile = await api.get<ProfileDto>('/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({ token, user: profile, isAuthenticated: true });
        } catch {
          // If profile fetch fails, sync it
          try {
            const synced = await api.post<ProfileDto>(
              '/auth/sync',
              {
                fullName: persona.name,
                email: persona.email,
                role: persona.role,
              },
              { headers: { Authorization: `Bearer ${token}` } },
            );
            set({ token, user: synced, isAuthenticated: true });
          } catch {
            set({
              token,
              user: {
                id: persona.id,
                fullName: persona.name,
                email: persona.email,
                phoneNumber: '+639000000000',
                role: persona.role,
                preferredLanguage: 'en',
                isActive: true,
                createdAt: new Date().toISOString(),
              },
              isAuthenticated: true,
            });
          }
        }
      },

      syncProfile: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const profile = await api.get<ProfileDto>('/me');
          set({ user: profile, isAuthenticated: true });
        } catch (err) {
          console.warn('Sync profile error:', err);
        }
      },
    }),
    {
      name: 'bao_bao_auth',
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as AuthState;
        if (
          state.user?.id === PRESET_PERSONAS[0].id &&
          state.user.fullName === 'AJ Passenger'
        ) {
          return { ...state, user: { ...state.user, fullName: PRESET_PERSONAS[0].name } };
        }
        return state;
      },
    },
  ),
);
