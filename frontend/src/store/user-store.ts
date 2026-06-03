import { create } from 'zustand';

import {
  type User,
  type UserProfile,
  type UserRole,
} from '@/types/user';

type WalletUserInput = {
  address: string;
  chainId: number | null;
  signature: string;
};

interface UserStoreState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setWalletUser: (input: WalletUserInput) => void;
  clearUser: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setRole: (role: UserRole) => void;
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const useUserStore = create<UserStoreState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  setWalletUser: ({ address, chainId, signature }) => {
    const currentUser = get().user;
    const isSameAddress = currentUser?.address.toLowerCase() === address.toLowerCase();
    const existingProfile = isSameAddress ? currentUser?.profile : undefined;

    set({
      user: {
        address,
        role: isSameAddress ? currentUser?.role ?? 'guest' : 'guest',
        verified: Boolean(signature),
        createdCount: isSameAddress ? currentUser?.createdCount ?? 0 : 0,
        royaltiesEarned: isSameAddress ? currentUser?.royaltiesEarned ?? '0' : '0',
        lastSeenChainId: chainId,
        profile: {
          displayName: existingProfile?.displayName ?? shortAddress(address),
          bio: existingProfile?.bio,
          avatarCid: existingProfile?.avatarCid,
          profileCid: existingProfile?.profileCid,
          website: existingProfile?.website,
        },
        createdAt: isSameAddress ? currentUser?.createdAt : new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    });
  },

  clearUser: () => {
    set({ user: null, isLoading: false, error: null });
  },

  updateProfile: (patch) => {
    const { user } = get();
    if (!user) return;

    set({
      user: {
        ...user,
        profile: {
          ...(user.profile || {}),
          ...patch,
        },
      },
    });
  },

  setRole: (role) => {
    const { user } = get();
    if (!user) return;

    set({
      user: {
        ...user,
        role,
      },
    });
  },
}));
