export type ProfileAsset = {
  tokenId: string;
  title: string;
  imageUrl: string;
  isListed: boolean;
  price?: string;
};

export type ProfileActivityType = "MINT" | "LIST" | "SALE" | "BUY" | "CANCEL_LISTING";

export type ProfileActivity = {
  id: string;
  type: ProfileActivityType;
  title: string;
  description: string;
  txHash?: string;
  timestamp: string;
};

export type ProfileStats = {
  ownedTotal: number;
  createdTotal: number;
  listedTotal: number;
  activityTotal: number;
};

export type ProfileData = {
  ownedAssets: ProfileAsset[];
  createdAssets: ProfileAsset[];
  activities: ProfileActivity[];
  stats: ProfileStats;
};
