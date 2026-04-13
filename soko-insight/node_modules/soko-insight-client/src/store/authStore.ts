import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authService, RegisterInput, LoginInput, UpdateProfileInput } from '../services/authService';
import type { SubscriptionTier } from '../config/pricing';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  register: (data: RegisterInput) => Promise<void>;
  login: (data: LoginInput) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<void>;
  updateSubscription: (subscriptionTier: SubscriptionTier) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      register: async (data: RegisterInput) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const message = error.response?.data?.error || 'Registration failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      login: async (data: LoginInput) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(data);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const message = error.response?.data?.error || 'Login failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true });
        try {
          const user = await authService.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateProfile: async (data: UpdateProfileInput) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.updateProfile(data);
          set({ user, isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.error || 'Update failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      updateSubscription: async (subscriptionTier: SubscriptionTier) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.updateSubscription(subscriptionTier);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const message = error.response?.data?.error || 'Subscription update failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

