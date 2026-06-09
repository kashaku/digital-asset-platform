export type MintAssetForm = {
  file: File | null;
  name: string;
  description: string;
  category: "art" | "photo" | "music" | "document" | "collectible";
  royaltyBps: number;
};

export type UploadedMediaResult = {
  cid: string;
  uri: string;
  gatewayUrl: string;
  mimeType: string;
  size: number;
};

export type UploadedMetadataResult = {
  metadataCid: string;
  tokenURI: string;
  gatewayUrl: string;
};

export type MintStep = "idle" | "uploading-media" | "uploading-metadata" | "waiting-signature" | "confirmed" | "failed";
