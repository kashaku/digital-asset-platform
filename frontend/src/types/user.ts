export type UserRole =
  | 'creator'
  | 'collector'
  | 'guest'
  | 'reviewer'
  | 'developer'
  | 'admin';

export interface UserProfile {
  displayName?: string;
  bio?: string;
  avatarCid?: string;      // IPFS CID 指向头像
  profileCid?: string;     // IPFS CID 指向扩展 profile JSON
  website?: string;
}

export interface User {
  address: string;         // 链上地址，主标识
  role: UserRole;
  verified?: boolean;      // 是否经过平台/人工验证（可选）
  createdCount?: number;   // 铸造/发布的作品数量（可选）
  royaltiesEarned?: string;// 累计版税，使用 string 保存 wei/最小单位（可选）
  lastSeenChainId?: number | null;
  profile?: UserProfile;
  createdAt?: string;      // ISO 时间字符串（可选）
}