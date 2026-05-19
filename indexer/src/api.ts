import { type Request, type Response, Router } from 'express';
import { store } from './store.js';

const router = Router();

function qs(req: Request, key: string, fallback: string): string {
  return (req.query as Record<string, string | undefined>)[key] ?? fallback;
}

function pid(req: Request, key: string): number {
  return parseInt(qs(req, key, '0'));
}

function tokenIdParam(req: Request): number {
  return parseInt((req.params as Record<string, string>).tokenId ?? '0');
}

// ===== Listings =====

router.get('/listings', (req: Request, res: Response) => {
  const page = Math.max(1, pid(req, 'page') || 1);
  const pageSize = Math.min(100, Math.max(1, pid(req, 'pageSize') || 20));
  const result = store.getListings(page, pageSize);
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
  const page = Math.max(1, pid(req, 'page') || 1);
  const pageSize = Math.min(100, Math.max(1, pid(req, 'pageSize') || 20));
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
