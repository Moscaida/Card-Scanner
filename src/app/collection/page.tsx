'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ScanLine, TrendingUp } from 'lucide-react';
import { CollectionCard } from '@/types';
import { getCollection, removeFromCollection, updateQuantity, getCollectionStats } from '@/lib/collection';
import GameBadge from '@/components/GameBadge';

const GAME_NAMES: Record<number, string> = { 1: 'MTG', 2: 'Pokémon', 4: 'Yu-Gi-Oh!' };

export default function CollectionPage() {
  const [cards, setCards] = useState<CollectionCard[]>([]);
  const [filterCat, setFilterCat] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'date'>('date');

  function reload() {
    setCards(getCollection());
  }

  useEffect(() => {
    reload();
  }, []);

  function handleRemove(productId: number) {
    removeFromCollection(productId);
    reload();
  }

  function handleQtyChange(productId: number, qty: number) {
    updateQuantity(productId, qty);
    reload();
  }

  const filtered = cards
    .filter((c) => (filterCat ? c.categoryId === filterCat : true))
    .sort((a, b) => {
      if (sortBy === 'value') return (b.marketPrice ?? 0) * b.quantity - (a.marketPrice ?? 0) * a.quantity;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });

  const stats = getCollectionStats();

  if (cards.length === 0) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-6xl">🃏</p>
        <h2 className="text-2xl font-bold text-slate-100">Your collection is empty</h2>
        <p className="text-slate-400">Start by scanning or searching for cards.</p>
        <div className="flex justify-center gap-3 mt-6">
          <Link href="/" className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 px-5 rounded-lg transition-colors">
            <ScanLine className="w-4 h-4" />
            Scan a Card
          </Link>
          <Link href="/search" className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-2.5 px-5 rounded-lg transition-colors">
            Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">My Collection</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Cards', value: stats.totalCards },
          { label: 'Unique Cards', value: stats.uniqueCards },
          {
            label: 'Est. Value',
            value: `$${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
            <TrendingUp className="w-5 h-5 text-sky-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-100">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 flex-wrap">
          {[undefined, 1, 2, 4].map((cat) => (
            <button
              key={cat ?? 'all'}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filterCat === cat
                  ? 'bg-sky-600 border-sky-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-sky-600'
              }`}
            >
              {cat ? GAME_NAMES[cat] : 'All'}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="ml-auto bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-sky-500"
        >
          <option value="date">Sort: Recent</option>
          <option value="value">Sort: Value</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {/* Cards list */}
      <div className="space-y-3">
        {filtered.map((card) => (
          <div key={card.productId} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
            <Link href={`/card/${card.productId}`} className="flex-shrink-0">
              <Image
                src={card.imageUrl}
                alt={card.name}
                width={56}
                height={78}
                className="rounded-md border border-slate-700 object-cover"
                unoptimized
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/card/${card.productId}`} className="hover:text-sky-400 transition-colors">
                <h3 className="text-slate-100 font-medium truncate">{card.name}</h3>
              </Link>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <GameBadge categoryId={card.categoryId} />
                <span className="text-xs text-slate-500">{card.condition}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                {card.marketPrice && (
                  <p className="text-emerald-400 font-semibold text-sm">
                    ${(card.marketPrice * card.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
                <p className="text-slate-500 text-xs">
                  {card.marketPrice
                    ? `$${card.marketPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ea.`
                    : '—'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleQtyChange(card.productId, Math.max(1, card.quantity - 1))}
                  className="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded flex items-center justify-center text-lg leading-none transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center text-slate-200 text-sm font-medium">{card.quantity}</span>
                <button
                  onClick={() => handleQtyChange(card.productId, card.quantity + 1)}
                  className="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded flex items-center justify-center text-lg leading-none transition-colors"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => handleRemove(card.productId)}
                className="w-8 h-8 bg-red-900/40 hover:bg-red-900/70 text-red-400 rounded-lg flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
