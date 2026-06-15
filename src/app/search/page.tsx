'use client';

import { useState, useEffect, useCallback } from 'react';
import { TCGProduct, TCGPrice } from '@/types';
import SearchBar from '@/components/SearchBar';
import CardCard from '@/components/CardCard';

const GAMES = [
  { label: 'All', categoryId: undefined },
  { label: 'MTG', categoryId: 1 },
  { label: 'Pokémon', categoryId: 2 },
  { label: 'Yu-Gi-Oh!', categoryId: 4 },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [products, setProducts] = useState<TCGProduct[]>([]);
  const [prices, setPrices] = useState<Map<number, TCGPrice[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const doSearch = useCallback(async (q: string, cat?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, limit: '24' });
      if (cat) params.set('categoryId', String(cat));
      const res = await fetch(`/api/tcgplayer/search?${params}`);
      const data = await res.json();
      setProducts(data.results ?? []);
      setTotal(data.totalItems ?? 0);

      // Fetch prices for visible cards
      const priceMap = new Map<number, TCGPrice[]>();
      await Promise.all(
        (data.results ?? []).map(async (p: TCGProduct) => {
          const r = await fetch(`/api/tcgplayer/prices/${p.productId}`);
          priceMap.set(p.productId, await r.json());
        })
      );
      setPrices(priceMap);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doSearch(query, categoryId);
  }, [query, categoryId, doSearch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-4">Search Cards</h1>
        <SearchBar defaultValue={query} onSearch={setQuery} placeholder="Search by card name..." autoFocus />
      </div>

      {/* Game filter */}
      <div className="flex gap-2 flex-wrap">
        {GAMES.map(({ label, categoryId: cat }) => (
          <button
            key={label}
            onClick={() => setCategoryId(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              categoryId === cat
                ? 'bg-sky-600 border-sky-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-sky-600 hover:text-sky-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-slate-400 text-sm">
          {total > 0 ? `${total} card${total !== 1 ? 's' : ''} found` : query ? 'No cards matched your search.' : 'Browse all cards below.'}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 animate-pulse">
              <div className="aspect-[5/7] bg-slate-700" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-5xl mb-4">🃏</p>
          <p className="text-lg font-medium">No cards found</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.map((product) => (
            <CardCard key={product.productId} product={product} prices={prices.get(product.productId)} />
          ))}
        </div>
      )}
    </div>
  );
}
