import { type Request, type Response, Router } from 'express';
import { store } from './store.js';

const router = Router();

function queryString(req: Request, key: string, fallback: string): string {
  return (req.query as Record<string, string | undefined>)[key] ?? fallback;
}

function optionalQueryString(req: Request, key: string): string | undefined {
  return (req.query as Record<string, string | undefined>)[key];
}

function intParam(req: Request, key: string): number {
  return parseInt(queryString(req, key, '0'));
}

function tokenIdParam(req: Request): number {
  return parseInt((req.params as Record<string, string>).tokenId ?? '0');
}

function tryParseBigIntParam(req: Request, key: string): [bigint | null, Error | null] {
  const value = optionalQueryString(req, key);
  if (value === undefined) return [null, null];
  try {
    return [BigInt(value), null];
  } catch (error) {
    return [null, error as Error];
  }
}

// ===== Listings =====

router.get('/listings', (req: Request, res: Response) => {
  const page = Math.max(1, intParam(req, 'page') || 1);
  const pageSize = Math.min(100, Math.max(1, intParam(req, 'pageSize') || 20));
  const minPrice = tryParseBigIntParam(req, 'minPrice');
  const maxPrice = tryParseBigIntParam(req, 'maxPrice');
  const seller = optionalQueryString(req, 'seller')?.toLowerCase();
  const creator = optionalQueryString(req, 'creator')?.toLowerCase();
  const tokenId = optionalQueryString(req, 'tokenId');

  if (minPrice[1] || maxPrice[1]) {
    res.status(400).json({ error: 'Invalid price filter' });
    return;
  }

  const tokenIdNumber = tokenId === undefined ? null : parseInt(tokenId);
  if (tokenId !== undefined && Number.isNaN(tokenIdNumber)) {
    res.status(400).json({ error: 'Invalid tokenId filter' });
    return;
  }

  const result = store.getListings(page, pageSize, (listing) => {
    if (tokenIdNumber !== null && listing.tokenId !== tokenIdNumber) {
      return false;
    }
    if (seller && listing.seller.toLowerCase() !== seller) {
      return false;
    }
    if (creator && listing.creator.toLowerCase() !== creator) {
      return false;
    }
    if (minPrice[0] !== null && listing.price < minPrice[0]) {
      return false;
    }
    if (maxPrice[0] !== null && listing.price > maxPrice[0]) {
      return false;
    }
    return true;
  });

  res.json({
    ...result,
    items: result.items.map(serializeListing),
  });
});

router.get('/listings/:tokenId', (req: Request, res: Response) => {
  const tokenId = tokenIdParam(req);
  const listing = store.getListing(tokenId);
  if (!listing) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }
  res.json(serializeListing(listing));
});

// ===== Offers =====

router.get('/offers/:tokenId', (req: Request, res: Response) => {
  const tokenId = tokenIdParam(req);
  res.json({
    tokenId,
    offers: store.getOffers(tokenId).map(serializeOffer),
  });
});

// ===== NFTs =====

router.get('/nfts', (req: Request, res: Response) => {
  const page = Math.max(1, intParam(req, 'page') || 1);
  const pageSize = Math.min(100, Math.max(1, intParam(req, 'pageSize') || 20));
  res.json(store.getNFTs(page, pageSize));
});

router.get('/nfts/:tokenId', (req: Request, res: Response) => {
  const tokenId = tokenIdParam(req);
  const nft = store.getNFT(tokenId);
  if (!nft) {
    res.status(404).json({ error: 'NFT not found' });
    return;
  }
  res.json(nft);
});

// ===== Stats =====

router.get('/stats', (_req: Request, res: Response) => {
  res.json(store.stats());
});

export default router;

function serializeListing(l: { tokenId: number; price: bigint; seller: string; tokenURI: string; creator: string }) {
  return { ...l, price: l.price.toString() };
}

function serializeOffer(o: { tokenId: number; buyer: string; price: bigint; expiresAt: number }) {
  return { ...o, price: o.price.toString() };
}
