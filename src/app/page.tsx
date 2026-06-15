import { ScanLine, Zap, Database } from 'lucide-react';
import CardScanner from '@/components/CardScanner';

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-sky-900/40 border border-sky-800 text-sky-400 text-xs font-semibold px-3 py-1.5 rounded-full">
          <Zap className="w-3.5 h-3.5" />
          Powered by TCGPlayer Data
        </div>
        <h1 className="text-4xl font-bold text-slate-100">Card Scanner</h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Point your camera at any trading card to instantly identify it and get real-time market prices.
        </p>
      </div>

      {/* Scanner */}
      <CardScanner />

      {/* Feature callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
        {[
          {
            icon: ScanLine,
            title: 'Camera OCR Scanning',
            desc: 'Uses on-device OCR to read card names directly from your camera.',
          },
          {
            icon: Database,
            title: 'MTG · Pokémon · Yu-Gi-Oh!',
            desc: 'Supports all major TCG games with pricing data.',
          },
          {
            icon: Zap,
            title: 'Live Prices',
            desc: 'Market, Low, Mid, and High prices from TCGPlayer.',
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
            <Icon className="w-6 h-6 text-sky-400 mb-2" />
            <h3 className="text-slate-100 font-semibold text-sm mb-1">{title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
