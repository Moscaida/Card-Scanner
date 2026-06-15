'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { addToCollection, removeFromCollection, isInCollection } from '@/lib/collection';
import { TCGProduct, TCGPrice } from '@/types';

const CONDITIONS = ['Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'];

interface Props {
  product: TCGProduct;
  prices: TCGPrice[];
}

export default function AddToCollection({ product, prices }: Props) {
  const [inCollection, setInCollection] = useState(false);
  const [condition, setCondition] = useState('Near Mint');
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState('');

  useEffect(() => {
    setInCollection(isInCollection(product.productId));
  }, [product.productId]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function handleAdd() {
    const normal = prices.find((p) => p.subTypeName === 'Normal') ?? prices[0];
    addToCollection({
      productId: product.productId,
      name: product.name,
      imageUrl: product.imageUrl,
      categoryId: product.categoryId,
      condition,
      quantity,
      addedAt: new Date().toISOString(),
      marketPrice: normal?.marketPrice,
    });
    setInCollection(true);
    showToast(`Added ${quantity}x ${product.name} to collection!`);
  }

  function handleRemove() {
    removeFromCollection(product.productId);
    setInCollection(false);
    showToast('Removed from collection.');
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="bg-emerald-900/60 border border-emerald-700 text-emerald-300 text-sm px-4 py-2 rounded-lg">
          {toast}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Condition</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-sky-500"
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Quantity</label>
          <input
            type="number"
            min={1}
            max={99}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          {inCollection ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {inCollection ? 'Add More' : 'Add to Collection'}
        </button>
        {inCollection && (
          <button
            onClick={handleRemove}
            className="flex items-center justify-center gap-2 bg-red-900/60 hover:bg-red-900 text-red-300 font-medium py-2.5 px-4 rounded-lg border border-red-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
