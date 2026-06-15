import { TCGPrice } from '@/types';

function fmt(val: number | null): string {
  if (val === null || val === undefined) return '—';
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface Props {
  prices: TCGPrice[];
}

export default function PriceTable({ prices }: Props) {
  if (!prices.length) {
    return <p className="text-slate-400 text-sm">No pricing data available.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-2 pr-4 text-slate-400 font-medium">Type</th>
            <th className="text-right py-2 px-3 text-slate-400 font-medium">Low</th>
            <th className="text-right py-2 px-3 text-slate-400 font-medium">Mid</th>
            <th className="text-right py-2 px-3 text-sky-400 font-semibold">Market</th>
            <th className="text-right py-2 pl-3 text-slate-400 font-medium">High</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((price, i) => (
            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
              <td className="py-3 pr-4 text-slate-200 font-medium">{price.subTypeName}</td>
              <td className="py-3 px-3 text-right text-slate-300">{fmt(price.lowPrice)}</td>
              <td className="py-3 px-3 text-right text-slate-300">{fmt(price.midPrice)}</td>
              <td className="py-3 px-3 text-right text-emerald-400 font-semibold">{fmt(price.marketPrice)}</td>
              <td className="py-3 pl-3 text-right text-slate-300">{fmt(price.highPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
