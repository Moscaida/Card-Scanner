import clsx from 'clsx';

const GAME_LABELS: Record<number, string> = {
  1: 'MTG',
  2: 'Pokémon',
  4: 'Yu-Gi-Oh!',
};

const GAME_COLORS: Record<number, string> = {
  1: 'bg-blue-900 text-blue-300 border-blue-700',
  2: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  4: 'bg-purple-900 text-purple-300 border-purple-700',
};

interface Props {
  categoryId: number;
  className?: string;
}

export default function GameBadge({ categoryId, className }: Props) {
  return (
    <span
      className={clsx(
        'inline-block px-2 py-0.5 text-xs font-medium rounded border',
        GAME_COLORS[categoryId] ?? 'bg-slate-700 text-slate-300 border-slate-600',
        className
      )}
    >
      {GAME_LABELS[categoryId] ?? 'TCG'}
    </span>
  );
}
