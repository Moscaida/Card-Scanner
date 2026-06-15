import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { TCGProduct, TCGPrice } from '@/types';
import GameBadge from '@/components/GameBadge';
import PriceTable from '@/components/PriceTable';
import AddToCollection from '@/components/AddToCollection';

async function getProduct(id: string): Promise<TCGProduct | null> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const res = await fetch(`${base}/api/tcgplayer/products/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

async function getPrices(id: string): Promise<TCGPrice[]> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const res = await fetch(`${base}/api/tcgplayer/prices/${id}`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function CardDetailPage({ params }: { params: { id: string } }) {
  const [product, prices] = await Promise.all([getProduct(params.id), getPrices(params.id)]);
  if (!product) notFound();

  const marketPrice = prices.find((p) => p.subTypeName === 'Normal')?.marketPrice ?? prices[0]?.marketPrice;

  return (
    <div className="space-y-6">
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-sky-400 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to search
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
        {/* Card image */}
        <div className="space-y-4">
          <div className="relative aspect-[5/7] rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          {marketPrice && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">Market Price</p>
              <p className="text-3xl font-bold text-emerald-400">
                ${marketPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start gap-3 flex-wrap mb-2">
              <GameBadge categoryId={product.categoryId} />
            </div>
            <h1 className="text-3xl font-bold text-slate-100">{product.name}</h1>
          </div>

          {/* Extended data */}
          {product.extendedData.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Card Details</h2>
              {product.extendedData.map((field) => (
                <div key={field.name} className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-400 flex-shrink-0">{field.displayName}</span>
                  <span className="text-slate-200 text-right">{field.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pricing */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Pricing</h2>
            <PriceTable prices={prices} />
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 text-sm mt-4 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on TCGPlayer
            </a>
          </div>

          {/* Add to collection */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Add to Collection</h2>
            <AddToCollection product={product} prices={prices} />
          </div>
        </div>
      </div>
    </div>
  );
}
