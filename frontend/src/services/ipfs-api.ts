import type {
  MintAssetForm,
  UploadedMediaResult,
  UploadedMetadataResult,
} from "@/types/mint";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T | null;
};

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
    attributes: [
      {
        trait_type: "category",
        value: form.category,
      },
    ],
    properties: {
      cid: media.cid,
      mime: media.mimeType,
    },
  };

  if (!API_BASE_URL) {
    return {
      metadataCid: `metadata-${media.cid}`,
      tokenURI: `ipfs://metadata-${media.cid}`,
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
