'use client';

import { useState } from 'react';
import { Store, ShieldCheck } from 'lucide-react';
import MyBusinessClient from './MyBusinessClient';
import BusinessClaimClient from './BusinessClaimClient';

type Tab = 'manage' | 'claim';

export default function BusinessHub() {
  const [tab, setTab] = useState<Tab>('manage');
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'manage', label: '내 업체 관리', icon: <Store size={16} /> },
    { key: 'claim', label: '새 업체 인증', icon: <ShieldCheck size={16} /> },
  ];
  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-unjong-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm transition-colors ${
              tab === t.key ? 'border-unjong-accent font-semibold text-unjong-primary' : 'border-transparent text-unjong-muted hover:text-unjong-primary'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      {tab === 'manage' ? <MyBusinessClient /> : <BusinessClaimClient />}
    </div>
  );
}
