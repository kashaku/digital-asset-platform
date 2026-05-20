import type { ProfileActivity, ProfileAsset, ProfileData } from "@/types/profile";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T | null;
};

type AssetListResponse = {
  items: ProfileAsset[];
  total: number;
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`请求失败：${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (payload.code !== 0) {
    throw new Error(payload.message || "接口返回异常");
  }

  if (payload.data === null) {
    throw new Error("接口未返回有效数据");
  }

  return payload.data;
}

const mockOwnedAssets: ProfileAsset[] = [
  {
    tokenId: "1",
    title: "交大风华 - 银杏叶",
    imageUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=900&auto=format&fit=crop",
    isListed: true,
    price: "0.5 MATIC",
  },
  {
    tokenId: "116",
    title: "链上证书样张",
    imageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=900&auto=format&fit=crop",
    isListed: false,
  },
];

const mockCreatedAssets: ProfileAsset[] = [
  ...mockOwnedAssets,
  {
    tokenId: "201",
    title: "校园数字海报",
    imageUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=900&auto=format&fit=crop",
    isListed: false,
  },
];

const mockActivities: ProfileActivity[] = [
  {
    id: "activity-1",
    type: "MINT",
    title: "铸造资产",
    description: "完成 Token #1 的链上铸造。",
    txHash: "0x8c7a6f9b3d2e1c0a",
    timestamp: "2026-05-13 10:30",
  },
  {
    id: "activity-2",
    type: "LIST",
    title: "上架资产",
    description: "将 Token #1 以 0.5 MATIC 上架到市场。",
    txHash: "0x7a6f9b3d2e1c0a8c",
    timestamp: "2026-05-13 11:05",
  },
];

/**
 * 获取用户持有资产。
 *
 * 对应接口文档：
 * GET /api/users/{address}/assets
 */
export async function fetchUserOwnedAssets(address: string): Promise<ProfileAsset[]> {
  if (!API_BASE_URL) {
    return mockOwnedAssets;
  }

  const data = await request<AssetListResponse>(`/api/users/${address}/assets`);
  return data.items;
}

/**
 * 获取用户创建资产。
 *
 * 对应接口文档：
 * GET /api/users/{address}/created
 */
export async function fetchUserCreatedAssets(address: string): Promise<ProfileAsset[]> {
  if (!API_BASE_URL) {
    return mockCreatedAssets;
  }

  const data = await request<AssetListResponse>(`/api/users/${address}/created`);
  return data.items;
}

/**
 * 获取用户活动记录。
 *
 * 对应接口文档：
 * GET /api/users/{address}/activities
 */
export async function fetchUserActivities(address: string): Promise<ProfileActivity[]> {
  if (!API_BASE_URL) {
    return mockActivities;
  }

  const data = await request<{ items: ProfileActivity[]; total: number }>(
    `/api/users/${address}/activities`,
  );

  return data.items;
}

export async function fetchProfileData(address: string): Promise<ProfileData> {
  const [ownedAssets, createdAssets, activities] = await Promise.all([
    fetchUserOwnedAssets(address),
    fetchUserCreatedAssets(address),
    fetchUserActivities(address),
  ]);

  return {
    ownedAssets,
    createdAssets,
    activities,
    stats: {
      ownedTotal: ownedAssets.length,
      createdTotal: createdAssets.length,
      listedTotal: ownedAssets.filter((asset) => asset.isListed).length,
      activityTotal: activities.length,
    },
  };
}
