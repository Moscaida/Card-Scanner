import Link from 'next/link';
import Image from 'next/image';
import { TCGProduct, TCGPrice } from '@/types';
import GameBadge from './GameBadge';

function marketPrice(prices?: TCGPrice[]): string | null {
  if (!prices?.length) return null;
  const normal = prices.find((p) => p.subTypeName === 'Normal') ?? prices[0];
  return `$${normal.marketPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface Props {
  product: TCGProduct;
  prices?: TCGPrice[];
}

export default function CardCard({ product, prices }: Props) {
  const price = marketPrice(prices);
  return (
    <Link href={`/card/${product.productId}`} className="group block">
      <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-sky-500 transition-all duration-200 hover:shadow-lg hover:shadow-sky-900/30 hover:-translate-y-1">
        <div className="relative aspect-[5/7] bg-slate-900">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://via.placeholder.com/350x490/1e293b/0ea5e9?text=${encodeURIComponent(product.name.substring(0, 15))}`;
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-sky-500 text-white text-sm font-medium px-3 py-1.5 rounded-md">
              View Details
            </span>
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-slate-100 text-sm font-medium leading-tight line-clamp-2 mb-2">
            {product.name}
          </h3>
          <div className="flex items-center justify-between gap-2">
            <GameBadge categoryId={product.categoryId} />
            {price && (
              <span className="text-emerald-400 text-sm font-semibold">{price}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
