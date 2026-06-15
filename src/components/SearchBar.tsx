'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  defaultValue?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function SearchBar({ defaultValue = '', onSearch, placeholder = 'Search cards...', autoFocus }: Props) {
  const [value, setValue] = useState(defaultValue);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback(
    (val: string) => {
      setValue(val);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onSearch(val), 300);
    },
    [onSearch]
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-10 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
      />
      {value && (
        <button
          onClick={() => handleChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
