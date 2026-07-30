import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: string;
  subscriptionTier: string;
  subscriptionExpiresAt: string | null;
  isVerified: boolean;
  isVerifiedSeller: boolean;
  bio: string | null;
  location: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'majaay-auth' }
  )
);
