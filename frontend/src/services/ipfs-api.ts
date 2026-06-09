import type {
  MintAssetForm,
  UploadedMediaResult,
  UploadedMetadataResult,
} from "@/types/mint";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const MOCK_METADATA_STORAGE_KEY = "assetchain:mock-metadata";

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T | null;
};

export type TokenMetadata = {
  name?: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  royaltyBps?: number;
  royaltyRate?: number;
  attributes?: Array<{
    trait_type?: string;
    value?: string | number;
  }>;
  properties?: {
    cid?: string;
    mime?: string;
    royaltyBps?: number;
  };
  royalty?: {
    bps?: number;
    rate?: number;
  };
};

function readMockMetadata() {
  if (typeof localStorage === "undefined") {
    return {};
  }

  try {
    return JSON.parse(localStorage.getItem(MOCK_METADATA_STORAGE_KEY) ?? "{}") as Record<string, TokenMetadata>;
  } catch {
    return {};
  }
}

function writeMockMetadata(tokenURI: string, metadata: TokenMetadata) {
  if (typeof localStorage === "undefined") {
    return;
  }

  const storedMetadata = readMockMetadata();
  storedMetadata[tokenURI] = metadata;
  localStorage.setItem(MOCK_METADATA_STORAGE_KEY, JSON.stringify(storedMetadata));
}

function toGatewayUrl(uri: string) {
  if (uri.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${uri.replace(/^ipfs:\/\//, "")}`;
  }

  return uri;
}

function isLocalMockUri(uri: string) {
  return uri.startsWith("ipfs://mock-") || uri.startsWith("ipfs://metadata-mock-");
}

export async function resolveTokenMetadata(tokenURI: string): Promise<TokenMetadata | null> {
  if (!tokenURI) {
    return null;
  }

  const mockMetadata = readMockMetadata()[tokenURI];
  if (mockMetadata) {
    return mockMetadata;
  }

  if (isLocalMockUri(tokenURI)) {
    return null;
  }

  try {
    const response = await fetch(toGatewayUrl(tokenURI), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as TokenMetadata;
  } catch {
    return null;
  }
}

async function parseApiResponse<T>(response: Response): Promise<T> {
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

/**
 * 上传媒体文件到 IPFS。
 *
 * 对应接口文档：
 * POST /api/ipfs/upload
 */
export async function uploadMediaToIpfs(file: File): Promise<UploadedMediaResult> {
  if (!API_BASE_URL) {
    const mockCid = `mock-${file.name.replace(/\s+/g, "-").toLowerCase()}`;

    return {
      cid: mockCid,
      uri: `ipfs://${mockCid}`,
      gatewayUrl: URL.createObjectURL(file),
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    };
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/ipfs/upload`, {
    method: "POST",
    body: formData,
  });

  return parseApiResponse<UploadedMediaResult>(response);
}

/**
 * 生成并上传 metadata.json。
 *
 * 对应接口文档：
 * POST /api/ipfs/metadata
 */
export async function uploadMetadataToIpfs(
  form: MintAssetForm,
  media: UploadedMediaResult,
): Promise<UploadedMetadataResult> {
  const metadata = {
    name: form.name,
    description: form.description,
    image: media.uri,
    royaltyBps: form.royaltyBps,
    royaltyRate: form.royaltyBps / 100,
    attributes: [
      {
        trait_type: "category",
        value: form.category,
      },
      {
        trait_type: "royalty_bps",
        value: form.royaltyBps,
      },
    ],
    properties: {
      cid: media.cid,
      mime: media.mimeType,
      royaltyBps: form.royaltyBps,
    },
    royalty: {
      bps: form.royaltyBps,
      rate: form.royaltyBps / 100,
    },
  };

  if (!API_BASE_URL) {
    const tokenURI = `ipfs://metadata-${media.cid}`;
    writeMockMetadata(tokenURI, {
      ...metadata,
      imageUrl: media.gatewayUrl,
    });

    return {
      metadataCid: `metadata-${media.cid}`,
      tokenURI,
      gatewayUrl: media.gatewayUrl,
    };
  }

  const response = await fetch(`${API_BASE_URL}/api/ipfs/metadata`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(metadata),
  });

  return parseApiResponse<UploadedMetadataResult>(response);
}
