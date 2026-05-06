import { create } from 'zustand';
import {
    type User, 
    type UserProfile,
    type UserRole
} from '@/types/user';


interface UserStoreState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  loadUser: (address?: string) => Promise<void>;
  setUser: (u: User | null) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setRole: (role: UserRole) => void;
  logout: () => void;
}

// 简单内置 mock 数据，用于替代真实后端调用
const MOCK_USERS: Record<string, User> = {
  '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa': {
    address: '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa',
    role: 'creator',
    verified: true,
    createdCount: 3,
    royaltiesEarned: '1200000000000000000', // 1.2 ETH (wei)
    lastSeenChainId: 137,
    profile: {
      displayName: 'Alice Creator',
      bio: '数字艺术家，专注生成艺术',
      avatarCid: 'bafybeia...mock',
    },
    createdAt: new Date().toISOString(),
  },
  '0xBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb': {
    address: '0xBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb',
    role: 'collector',
    verified: false,
    createdCount: 0,
    royaltiesEarned: '0',
    lastSeenChainId: 137,
    profile: { displayName: 'Bob Collector' },
    createdAt: new Date().toISOString(),
  },
};

export const useUserStore = create<UserStoreState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  loadUser: async (address?: string) => {
    set({ isLoading: true, error: null });
    try {
      // 模拟网络延迟
      await new Promise((r) => setTimeout(r, 400));

      // 若提供地址，优先使用对应 mock，否则取第一个 mock
      let u: User | null = null;
      if (address) {
        u = MOCK_USERS[address] ?? null;
      } else {
        const first = Object.values(MOCK_USERS)[0] ?? null;
        u = first;
      }

      if (!u) {
        // 如果没有 mock，初始化为 guest
        set({ user: null, isLoading: false });
      } else {
        set({ user: u, isLoading: false });
      }
    } catch (err: any) {
      set({ error: err?.message ?? String(err), isLoading: false });
    }
  },

  setUser: (u) => set({ user: u }),

  updateProfile: (patch) => {
    const { user } = get();
    if (!user) return;
    const next: User = { ...user, profile: { ...(user.profile || {}), ...patch } };
    set({ user: next });
  },

  setRole: (role) => {
    const { user } = get();
    if (!user) return;
    set({ user: { ...user, role } });
  },

  logout: () => set({ user: null }),
}));
