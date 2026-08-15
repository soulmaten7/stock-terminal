'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Store, ShieldCheck } from 'lucide-react';
import MyBusinessClient from './MyBusinessClient';
import BusinessClaimClient from './BusinessClaimClient';

type Tab = 'claim' | 'manage';

export default function BusinessHub() {
  const t = useTranslations('Business');
  const [tab, setTab] = useState<Tab>('claim');

  // 스마트 기본 탭: 인증된 업체 있으면 '관리'로
  useEffect(() => {
    let cancelled = false;
    fetch('/api/business/mine')
      .then((r) => r.json())
      .then((j) => { if (!cancelled && (j.businesses?.length ?? 0) > 0) setTab('manage'); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'claim', label: t('tabClaim'), icon: <ShieldCheck size={16} /> },
    { key: 'manage', label: t('tabManage'), icon: <Store size={16} /> },
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
      {tab === 'claim' ? <BusinessClaimClient /> : <MyBusinessClient />}
    </div>
  );
}
