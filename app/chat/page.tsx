import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ChatWidget from '@/components/widgets/ChatWidget';

export const metadata: Metadata = { title: '실시간 채팅 — StockTerminal' };

export default function ChatPage() {
  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-black mb-1">실시간 채팅</h1>
        <p className="text-sm text-[#666]">
          투자자 간 실시간 메시지. $종목명 또는 $005930 형식으로 태그하면 자동 링크. Supabase Realtime 기반.
        </p>
      </div>

      <div className="h-[calc(100vh-200px)] min-h-[500px]">
        <ChatWidget />
      </div>
    </div>
  );
}
