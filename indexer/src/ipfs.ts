import { Readable } from 'stream';
import { type Request, type Response, Router } from 'express';

const router = Router();

const IPFS_API_URL = (process.env.IPFS_API_URL || 'http://127.0.0.1:5001').replace(/\/$/, '');
const IPFS_GATEWAY_URL = (process.env.IPFS_GATEWAY_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY_URL = (process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud').replace(/\/$/, '');

type IpfsUploadResult = {
  cid: string;
  uri: string;
  gatewayUrl: string;
  mimeType: string;
  size: number;
};

type IpfsMetadataResult = {
  metadataCid: string;
  tokenURI: string;
  gatewayUrl: string;
};

type PinataResponse = {
  IpfsHash?: string;
};

type KuboAddResponse = {
  Hash?: string;
};

function ok<T>(res: Response, data: T) {
  res.json({
    code: 0,
    message: 'ok',
    data,
  });
}

function fail(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : 'IPFS upload failed';
  res.status(500).json({
    code: 1,
    message,
    data: null,
  });
}

function gatewayUrl(cid: string) {
  const baseUrl = PINATA_JWT ? PINATA_GATEWAY_URL : IPFS_GATEWAY_URL;
  return `${baseUrl}/ipfs/${cid}`;
}

function timeoutSignal(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 5000) {
  const timeout = timeoutSignal(timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: timeout.signal,
    });
  } finally {
    timeout.clear();
  }
}

async function verifyKuboCid(cid: string) {
  const response = await fetchWithTimeout(
    `${IPFS_API_URL}/api/v0/block/stat?arg=${encodeURIComponent(cid)}`,
    { method: 'POST' },
  );

  if (!response.ok) {
    throw new Error(`Kubo stored CID is not readable: ${cid}`);
  }
}

async function verifyKuboGateway(cid: string) {
  const response = await fetchWithTimeout(gatewayUrl(cid));

  if (!response.ok) {
    throw new Error(`Kubo gateway cannot read CID ${cid}: ${response.status} ${response.statusText}`);
  }
}

function requestHeaders(req: Request) {
  const headers = new Headers();

  Object.entries(req.headers).forEach(([key, value]) => {
    if (typeof value === 'string') {
      headers.set(key, value);
    } else if (Array.isArray(value)) {
      headers.set(key, value.join(', '));
    }
  });

  return headers;
}

async function parseMultipartFile(req: Request) {
  const webRequest = new Request('http://localhost/api/ipfs/upload', {
    method: req.method,
    headers: requestHeaders(req),
    body: Readable.toWeb(req) as ReadableStream<Uint8Array>,
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });

  const formData = await webRequest.formData();
  const file = formData.get('file');

  if (!(file instanceof Blob)) {
    throw new Error('Missing uploaded file');
  }

  const filename =
    typeof file === 'object' && 'name' in file && typeof file.name === 'string'
      ? file.name
      : 'asset-file';

  return {
    file,
    filename,
  };
}

async function addToKubo(blob: Blob, filename: string) {
  const formData = new FormData();
  formData.append('file', blob, filename);

  const response = await fetch(`${IPFS_API_URL}/api/v0/add?pin=true`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Kubo add failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json() as KuboAddResponse;
  if (!payload.Hash) {
    throw new Error('Kubo did not return a CID');
  }

  await verifyKuboCid(payload.Hash);
  await verifyKuboGateway(payload.Hash);

  return payload.Hash;
}

async function addToPinata(blob: Blob, filename: string) {
  if (!PINATA_JWT) {
    throw new Error('PINATA_JWT is not configured');
  }

  const formData = new FormData();
  formData.append('file', blob, filename);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Pinata file upload failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json() as PinataResponse;
  if (!payload.IpfsHash) {
    throw new Error('Pinata did not return a CID');
  }

  return payload.IpfsHash;
}

async function pinMetadataToPinata(metadata: unknown) {
  if (!PINATA_JWT) {
    throw new Error('PINATA_JWT is not configured');
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    throw new Error(`Pinata metadata upload failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json() as PinataResponse;
  if (!payload.IpfsHash) {
    throw new Error('Pinata did not return a metadata CID');
  }

  return payload.IpfsHash;
}

async function addBlob(blob: Blob, filename: string) {
  return PINATA_JWT ? addToPinata(blob, filename) : addToKubo(blob, filename);
}

router.post('/ipfs/upload', async (req: Request, res: Response) => {
  try {
    const { file, filename } = await parseMultipartFile(req);
    const cid = await addBlob(file, filename);

    ok<IpfsUploadResult>(res, {
      cid,
      uri: `ipfs://${cid}`,
      gatewayUrl: gatewayUrl(cid),
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
    });
  } catch (error) {
    fail(res, error);
  }
});

router.get('/ipfs/status', async (_req: Request, res: Response) => {
  try {
    if (PINATA_JWT) {
      ok(res, {
        mode: 'pinata',
        gatewayUrl: PINATA_GATEWAY_URL,
        ready: true,
      });
      return;
    }

    const idResponse = await fetchWithTimeout(`${IPFS_API_URL}/api/v0/id`, { method: 'POST' });
    let gatewayReady = false;

    if (idResponse.ok) {
      const healthCid = await addToKubo(
        new Blob(['assetchain-ipfs-healthcheck'], { type: 'text/plain' }),
        'assetchain-ipfs-healthcheck.txt',
      );
      gatewayReady = Boolean(healthCid);
    }

    ok(res, {
      mode: 'kubo',
      apiUrl: IPFS_API_URL,
      gatewayUrl: IPFS_GATEWAY_URL,
      apiReady: idResponse.ok,
      gatewayReady,
      ready: idResponse.ok && gatewayReady,
    });
  } catch (error) {
    fail(res, error);
  }
});

router.post('/ipfs/metadata', expressJson(), async (req: Request, res: Response) => {
  try {
    const metadata = req.body;
    if (!metadata || typeof metadata !== 'object') {
      res.status(400).json({
        code: 1,
        message: 'Invalid metadata payload',
        data: null,
      });
      return;
    }

    const metadataCid = PINATA_JWT
      ? await pinMetadataToPinata(metadata)
      : await addToKubo(
          new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' }),
          'metadata.json',
        );

    ok<IpfsMetadataResult>(res, {
      metadataCid,
      tokenURI: `ipfs://${metadataCid}`,
      gatewayUrl: gatewayUrl(metadataCid),
    });
  } catch (error) {
    fail(res, error);
  }
});

function expressJson() {
  return (req: Request, res: Response, next: (error?: unknown) => void) => {
    let body = '';

    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : {};
        next();
      } catch {
        res.status(400).json({
          code: 1,
          message: 'Invalid JSON body',
          data: null,
        });
      }
    });
    req.on('error', next);
  };
}

export default router;
