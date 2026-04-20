'use client';

import Link from 'next/link';
import {
  Home,
  Star,
  TrendingUp,
  Flame,
  LineChart,
  Users,
  BarChart3,
  Newspaper,
  FileText,
  Calendar,
  Globe,
  MessageCircle,
} from 'lucide-react';

const ITEMS = [
  { icon: Home,          label: '홈',              href: '/' },
  { icon: Star,          label: '관심종목',         href: '/watchlist' },
  { icon: TrendingUp,    label: '상승/하락 TOP',    href: '/movers/price' },
  { icon: Flame,         label: '거래량 급등',       href: '/movers/volume' },
  { icon: LineChart,     label: '차트',             href: '/chart' },
  { icon: BarChart3,     label: '수급 TOP',         href: '/net-buy' },
  { icon: Users,         label: '투자자 동향',       href: '/investor-flow' },
  { icon: Newspaper,     label: '뉴스 속보',        href: '/news' },
  { icon: FileText,      label: 'DART 공시',        href: '/filings' },
  { icon: Calendar,      label: '경제캘린더',        href: '/calendar' },
  { icon: Globe,         label: '글로벌 지수',       href: '/global' },
  { icon: MessageCircle, label: '커뮤니티 채팅',     href: '/chat' },
];

export default function VerticalNav() {
  return (
    <nav className="hidden md:flex flex-col items-center w-12 bg-white border-r border-[#E5E7EB] py-3 sticky top-0 h-screen shrink-0">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            title={item.label}
            className="group relative flex items-center justify-center w-10 h-10 mb-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Icon className="w-4 h-4 text-gray-600 group-hover:text-gray-900" />
            <span className="absolute left-full ml-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
