import { TCGCategory, TCGProduct, TCGPrice, SearchResult } from '@/types';
import { getMockCategories, getMockProduct, getMockPrices, searchMockProducts } from './mockData';

const PUBLIC_KEY = process.env.TCGPLAYER_PUBLIC_KEY;
const PRIVATE_KEY = process.env.TCGPLAYER_PRIVATE_KEY;
const BASE_URL = 'https://api.tcgplayer.com';

const useMockData = !PUBLIC_KEY || !PRIVATE_KEY;

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }
  const res = await fetch(`${BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${PUBLIC_KEY}&client_secret=${PRIVATE_KEY}`,
  });
  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60000,
  };
  return cachedToken.value;
}

async function apiGet<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getCategories(): Promise<TCGCategory[]> {
  if (useMockData) return getMockCategories();
  const data = await apiGet<{ results: TCGCategory[] }>('/catalog/categories?limit=50');
  return data.results;
}

export async function searchProducts(
  query: string,
  categoryId?: number,
  offset = 0,
  limit = 20
): Promise<SearchResult> {
  if (useMockData) {
    const results = searchMockProducts(query, categoryId);
    const page = results.slice(offset, offset + limit);
    return { totalItems: results.length, results: page };
  }
  const params = new URLSearchParams({ productName: query, offset: String(offset), limit: String(limit) });
  if (categoryId) params.set('categoryId', String(categoryId));
  const data = await apiGet<{ totalItems: number; results: TCGProduct[] }>(
    `/catalog/products?${params}`
  );
  return data;
}

export async function getProduct(productId: number): Promise<TCGProduct | null> {
  if (useMockData) return getMockProduct(productId);
  const data = await apiGet<{ results: TCGProduct[] }>(`/catalog/products/${productId}`);
  return data.results[0] ?? null;
}

export async function getProductPrices(productId: number): Promise<TCGPrice[]> {
  if (useMockData) return getMockPrices(productId);
  const data = await apiGet<{ results: TCGPrice[] }>(`/pricing/product/${productId}`);
  return data.results;
}
