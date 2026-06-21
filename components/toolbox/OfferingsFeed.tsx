'use client';

import { useState } from 'react';
import IpoFeed from './IpoFeed';
import DividendFeed from './DividendFeed';

export default function OfferingsFeed() {
  const [view, setView] = useState<'ipo' | 'div'>('ipo');
  return (
    <div>
      <div className="mb-2 flex gap-1">
        <button
          type="button"
          onClick={() => setView('ipo')}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            view === 'ipo' ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
          }`}
        >
          공모주
        </button>
        <button
          type="button"
          onClick={() => setView('div')}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            view === 'div' ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
          }`}
        >
          배당
        </button>
      </div>
      {view === 'ipo' ? <IpoFeed /> : <DividendFeed />}
    </div>
  );
}
