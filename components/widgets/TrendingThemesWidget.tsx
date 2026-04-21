'use client';

// TODO: 실데이터 연결 (KRX 섹터 지수 or pykrx 테마 분류) — 별도 Phase
import { TrendingUp } from 'lucide-react';
import WidgetCard from '@/components/home/WidgetCard';

interface Theme {
  name: string;
  change: number;
  count: number;
}

const THEMES: Theme[] = [
  { name: '반도체 장비', change: 3.2, count: 45 },
  { name: '2차전지 소재', change: 2.8, count: 32 },
  { name: 'AI 반도체', change: 2.5, count: 18 },
  { name: '조선', change: 1.9, count: 24 },
  { name: '방산', change: 1.6, count: 15 },
];

interface Props {
  inline?: boolean;
  size?: 'default' | 'large';
}

export default function TrendingThemesWidget({ inline = false, size = 'default' }: Props = {}) {
  const content = (
    <div className="flex flex-col h-full divide-y divide-[#F5F5F5]">
      {THEMES.map((theme) => (
        <div
          key={theme.name}
          className="flex items-center justify-between py-2 px-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-[#1A1A2E] truncate">{theme.name}</span>
            <span className="text-[10px] text-[#999] shrink-0">{theme.count}종목</span>
          </div>
          <span className="text-sm font-bold text-[#FF3B30] shrink-0">
            +{theme.change.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );

  if (inline) {
    return <div className="h-full overflow-auto">{content}</div>;
  }

  return (
    <WidgetCard
      title="상승 테마"
      subtitle="KRX 섹터"
      href="/themes"
      size={size}
      className="h-full"
      action={
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-[#FF3B30]" />
          <span className="text-[10px] text-[#FF3B30] font-bold">TOP 5</span>
        </div>
      }
    >
      {content}
    </WidgetCard>
  );
}
