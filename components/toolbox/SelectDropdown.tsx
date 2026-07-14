'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

export default function SelectDropdown({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const t = useTranslations('Feed');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm outline-none focus:border-unjong-accent"
      >
        <span className={selected ? 'text-unjong-primary' : 'text-unjong-muted'}>
          {selected ? selected.label : (placeholder ?? t('select'))}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-unjong-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-unjong-border bg-unjong-surface py-1 shadow-lg">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-unjong-background ${
                o.value === value ? 'font-semibold text-unjong-primary' : 'text-unjong-primary'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
