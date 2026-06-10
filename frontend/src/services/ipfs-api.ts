import type {
  MintAssetForm,
  UploadedMediaResult,
  UploadedMetadataResult,
} from "@/types/mint";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const MOCK_METADATA_STORAGE_KEY = "assetchain:mock-metadata";
const LEGACY_MOCK_MEDIA_STORAGE_KEY = "assetchain:mock-media";
const MOCK_MEDIA_DB_NAME = "assetchain-mock-ipfs";
const MOCK_MEDIA_STORE_NAME = "media";

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

function removeLegacyMockMediaStorage() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(LEGACY_MOCK_MEDIA_STORAGE_KEY);
  }
}

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

function compactMockMetadata(metadata: Record<string, TokenMetadata>) {
  return Object.fromEntries(
    Object.entries(metadata).map(([tokenURI, item]) => {
      const imageUrl =
        item.imageUrl?.startsWith("data:") || item.imageUrl?.startsWith("blob:")
          ? undefined
          : item.imageUrl;

      return [
        tokenURI,
        {
          ...item,
          imageUrl,
        },
      ];
    }),
  ) as Record<string, TokenMetadata>;
}

function writeMockMetadata(tokenURI: string, metadata: TokenMetadata) {
  if (typeof localStorage === "undefined") {
    return;
  }

  removeLegacyMockMediaStorage();

  const storedMetadata = compactMockMetadata(readMockMetadata());
  storedMetadata[tokenURI] = compactMockMetadata({ [tokenURI]: metadata })[tokenURI];

  try {
    localStorage.setItem(MOCK_METADATA_STORAGE_KEY, JSON.stringify(storedMetadata));
  } catch {
    localStorage.setItem(
      MOCK_METADATA_STORAGE_KEY,
      JSON.stringify(compactMockMetadata({ [tokenURI]: metadata })),
    );
  }
}

function openMockMediaDb() {
  return new Promise<IDBDatabase | null>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }

    const request = indexedDB.open(MOCK_MEDIA_DB_NAME, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(MOCK_MEDIA_STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function writeMockMedia(uri: string, file: File) {
  removeLegacyMockMediaStorage();

  const db = await openMockMediaDb();
  if (!db) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(MOCK_MEDIA_STORE_NAME, "readwrite");
    transaction.objectStore(MOCK_MEDIA_STORE_NAME).put(file, uri);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function readMockMediaUrl(uri: string) {
  const db = await openMockMediaDb();
  if (!db) {
    return null;
  }

  try {
    const storedMedia = await new Promise<Blob | undefined>((resolve, reject) => {
      const transaction = db.transaction(MOCK_MEDIA_STORE_NAME, "readonly");
      const request = transaction.objectStore(MOCK_MEDIA_STORE_NAME).get(uri);

      request.onsuccess = () => resolve(request.result as Blob | undefined);
      request.onerror = () => reject(request.error);
    });

    return storedMedia ? URL.createObjectURL(storedMedia) : null;
  } finally {
    db.close();
  }
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

async function resolveGatewayUrl(uri: string) {
  if (isLocalMockUri(uri)) {
    const mockMedia = await readMockMediaUrl(uri);
    if (mockMedia) {
      return mockMedia;
    }
  }

  return toGatewayUrl(uri);
}

async function normalizeMockMetadata(metadata: TokenMetadata): Promise<TokenMetadata> {
  const shouldResolveImageUrl =
    !metadata.imageUrl ||
    metadata.imageUrl.startsWith("blob:") ||
    metadata.imageUrl.startsWith("data:");

  const imageUrl =
    shouldResolveImageUrl && metadata.image
      ? await resolveGatewayUrl(metadata.image)
      : metadata.imageUrl;

  return {
    ...metadata,
    imageUrl,
  };
}

export async function resolveTokenMetadata(tokenURI: string): Promise<TokenMetadata | null> {
  if (!tokenURI) {
    return null;
  }

  removeLegacyMockMediaStorage();

  const mockMetadata = readMockMetadata()[tokenURI];
  if (mockMetadata) {
    return normalizeMockMetadata(mockMetadata);
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
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (payload.code !== 0) {
    throw new Error(payload.message || "API returned an error");
  }

  if (payload.data === null) {
    throw new Error("API did not return valid data");
  }

  return payload.data;
}

/**
 * Upload media to IPFS.
 *
 * API contract:
 * POST /api/ipfs/upload
 */
export async function uploadMediaToIpfs(file: File): Promise<UploadedMediaResult> {
  if (!API_BASE_URL) {
    const mockCid = `mock-${file.name.replace(/\s+/g, "-").toLowerCase()}`;
    const uri = `ipfs://${mockCid}`;

    await writeMockMedia(uri, file);

    return {
      cid: mockCid,
      uri,
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
 * Generate and upload metadata.json.
 *
 * API contract:
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
    writeMockMetadata(tokenURI, metadata);

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
