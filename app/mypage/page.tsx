'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useWatchlistStore } from '@/stores/watchlistStore';
import { formatDate, formatNumber } from '@/lib/utils/format';
import { User, CreditCard, Star, Bell, MessageCircle, Trash2, Crown } from 'lucide-react';
import type { Payment } from '@/types/api';
import type { Watchlist } from '@/types/user';

type Tab = 'profile' | 'subscription' | 'watchlist' | 'notifications' | 'chat';

export default function MyPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const { items: watchlistItems, setItems, removeItem } = useWatchlistStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login');
    if (user) {
      setNickname(user.nickname);
      loadData();
    }
  }, [user, isLoading]);

  const loadData = async () => {
    if (!user) return;
    const supabase = createClient();

    const [watchlistRes, paymentsRes] = await Promise.all([
      supabase.from('watchlist').select('*').eq('user_id', user.id).order('display_order'),
      supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);

    if (watchlistRes.data) setItems(watchlistRes.data);
    if (paymentsRes.data) setPayments(paymentsRes.data);
  };

  const updateNickname = async () => {
    if (!user || !nickname.trim()) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('users').update({ nickname: nickname.trim() }).eq('id', user.id);
    useAuthStore.getState().setUser({ ...user, nickname: nickname.trim() });
    setSaving(false);
  };

  const removeFromWatchlist = async (item: Watchlist) => {
    const supabase = createClient();
    await supabase.from('watchlist').delete().eq('id', item.id);
    removeItem(item.id);
  };

  if (isLoading || !user) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" /></div>;
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: '프로필', icon: <User className="w-4 h-4" /> },
    { key: 'subscription', label: '구독 관리', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'watchlist', label: '관심 종목', icon: <Star className="w-4 h-4" /> },
    { key: 'notifications', label: '알림 설정', icon: <Bell className="w-4 h-4" /> },
    { key: 'chat', label: '채팅 관리', icon: <MessageCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">마이페이지</h1>

      <div className="flex gap-8">
        {/* Sidebar Tabs */}
        <div className="w-56 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${
                activeTab === tab.key ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-dark-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-dark-700 rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-bold">프로필 관리</h2>
              <div>
                <label className="text-xs text-text-secondary block mb-1">닉네임</label>
                <div className="flex gap-2">
                  <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="flex-1 px-4 py-2.5 bg-dark-800 border border-border rounded-lg text-sm" />
                  <button onClick={updateNickname} disabled={saving} className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm">{saving ? '저장중...' : '변경'}</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">이메일</label>
                <input value={user.email} disabled className="w-full px-4 py-2.5 bg-dark-800 border border-border rounded-lg text-sm text-text-secondary" />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">가입일</label>
                <p className="text-sm">{formatDate(user.created_at)}</p>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="bg-dark-700 rounded-xl border border-border p-6">
                <h2 className="font-bold mb-4">현재 구독</h2>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.role === 'premium' ? 'bg-premium/20 text-premium' : 'bg-dark-600 text-text-secondary'}`}>
                    {user.role === 'premium' ? '프리미엄' : '무료'}
                  </span>
                  {user.subscription_status === 'active' && user.subscription_end_date && (
                    <span className="text-sm text-text-secondary">다음 결제일: {formatDate(user.subscription_end_date)}</span>
                  )}
                </div>
                {user.role === 'free' && (
                  <Link href="/pricing" className="inline-flex items-center gap-2 px-4 py-2 bg-premium text-dark-900 rounded-lg text-sm font-medium">
                    <Crown className="w-4 h-4" /> 프리미엄 시작하기
                  </Link>
                )}
              </div>

              <div className="bg-dark-700 rounded-xl border border-border p-6">
                <h2 className="font-bold mb-4">결제 내역</h2>
                {payments.length === 0 ? (
                  <p className="text-text-secondary text-sm">결제 내역이 없습니다</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr className="text-text-secondary text-xs"><th className="text-left pb-2">날짜</th><th className="text-right pb-2">금액</th><th className="text-left pb-2">유형</th><th className="text-left pb-2">상태</th></tr></thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-t border-border/50">
                          <td className="py-2">{formatDate(p.created_at)}</td>
                          <td className="py-2 text-right font-mono-price">{formatNumber(p.amount)}원</td>
                          <td className="py-2">{p.payment_type === 'subscription' ? '구독' : '배너'}</td>
                          <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs ${p.status === 'completed' ? 'bg-success/20 text-success' : 'bg-dark-600 text-text-secondary'}`}>{p.status === 'completed' ? '완료' : p.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'watchlist' && (
            <div className="bg-dark-700 rounded-xl border border-border p-6">
              <h2 className="font-bold mb-4">관심 종목</h2>
              {watchlistItems.length === 0 ? (
                <p className="text-text-secondary text-sm">등록된 관심 종목이 없습니다</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="text-text-secondary text-xs"><th className="text-left pb-2">종목코드</th><th className="text-left pb-2">시장</th><th className="text-left pb-2">등록일</th><th className="text-right pb-2">삭제</th></tr></thead>
                  <tbody>
                    {watchlistItems.map((item) => (
                      <tr key={item.id} className="border-t border-border/50">
                        <td className="py-2"><Link href={`/stocks/${item.symbol}`} className="text-accent hover:underline">{item.symbol}</Link></td>
                        <td className="py-2">{item.market}</td>
                        <td className="py-2 text-text-secondary">{formatDate(item.created_at)}</td>
                        <td className="py-2 text-right">
                          <button onClick={() => removeFromWatchlist(item)} className="text-up hover:text-up/80"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-dark-700 rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-bold">알림 설정</h2>
              <p className="text-text-secondary text-sm">알림 기능은 준비 중입니다.</p>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="bg-dark-700 rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-bold">채팅 관리</h2>
              <p className="text-text-secondary text-sm">채팅 기록 및 제재 이력 확인은 준비 중입니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
