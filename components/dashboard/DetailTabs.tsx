'use client';

export type DetailTab = 'overview' | 'news' | 'disclosures' | 'financials';

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'overview',    label: '종합' },
  { id: 'news',        label: '뉴스' },
  { id: 'disclosures', label: '공시' },
  { id: 'financials',  label: '재무' },
];

interface Props {
  activeTab: DetailTab;
  onChange: (tab: DetailTab) => void;
}

export default function DetailTabs({ activeTab, onChange }: Props) {
  return (
    <nav className="flex border-b border-[#E5E7EB] shrink-0" role="tablist">
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`relative flex-1 h-10 text-xs transition-colors ${
              active ? 'text-[#0ABAB5] font-bold' : 'text-[#444] hover:text-black'
            }`}
          >
            {tab.label}
            {active && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0ABAB5]"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
