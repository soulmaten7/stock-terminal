'use client';

import { useState, type ReactNode } from 'react';

export default function AdminTabs({ tabs }: { tabs: { key: string; label: string; node: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? '');
  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-unjong-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm transition-colors ${
              active === t.key ? 'border-unjong-accent font-semibold text-unjong-primary' : 'border-transparent text-unjong-muted hover:text-unjong-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.key} className={active === t.key ? '' : 'hidden'}>
          {t.node}
        </div>
      ))}
    </div>
  );
}
