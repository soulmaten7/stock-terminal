'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber, formatDate } from '@/lib/utils/format';
import Link from 'next/link';
import {
  Users, CreditCard, BarChart3, Shield, MessageCircle,
  Settings, BadgeCheck, Bell, ChevronRight, Handshake,
} from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

type Tab = 'dashboard' | 'users' | 'banners' | 'chat' | 'notice' | 'settings';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState({ totalUsers: 0, premiumUsers: 0, todaySignups: 0, totalBanners: 0 });
  const [recentUsers, setRecentUsers] = useState<Array<Record<string, unknown>>>([]);
  const [userList, setUserList] = useState<Array<Record<string, unknown>>>([]);
  const [bannerList, setBannerList] = useState<Array<Record<string, unknown>>>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStats();
    loadRecentUsers();
  }, []);

  const loadStats = async () => {
    try {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];

      const [usersRes, premiumRes, todayRes, bannersRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'premium'),
        supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('banners').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        premiumUsers: premiumRes.count || 0,
        todaySignups: todayRes.count || 0,
        totalBanners: bannersRes.count || 0,
      });
    } catch {
      // Supabase 미연결 시 기본값 유지
    }
  };

  const loadRecentUsers = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5);
      setRecentUsers(data || []);
    } catch {
      // Supabase 미연결 시 빈 배열
    }
  };

  const loadUsers = async () => {
    try {
      const supabase = createClient();
      let query = supabase.from('users').select('*').order('created_at', { ascending: false }).limit(50);
      if (searchQuery) {
        query = query.or(`nickname.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      const { data } = await query;
      setUserList(data || []);
    } catch {
      // Supabase 미연결
    }
  };

  const loadBanners = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('banners')
        .select('*, advertisers(company_name, advertiser_type)')
        .order('created_at', { ascending: false })
        .limit(50);
      setBannerList(data || []);
    } catch {
      // Supabase 미연결
    }
  };

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'banners') loadBanners();
  }, [activeTab]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: '대시보드', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'users', label: '회원 관리', icon: <Users className="w-4 h-4" /> },
    { key: 'banners', label: '배너 관리', icon: <BadgeCheck className="w-4 h-4" /> },
    { key: 'chat', label: '채팅 관리', icon: <MessageCircle className="w-4 h-4" /> },
    { key: 'notice', label: '공지사항', icon: <Bell className="w-4 h-4" /> },
    { key: 'settings', label: '설정', icon: <Settings className="w-4 h-4" /> },
  ];

  const statCards = [
    { label: '전체 회원', value: stats.totalUsers, icon: Users, color: 'text-accent' },
    { label: '프리미엄 회원', value: stats.premiumUsers, icon: CreditCard, color: 'text-premium' },
    { label: '오늘 가입', value: stats.todaySignups, icon: Users, color: 'text-success' },
    { label: '활성 배너', value: stats.totalBanners, icon: BadgeCheck, color: 'text-warning' },
  ];

  return (
    <AuthGuard minPlan="admin">
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">관리자 대시보드</h1>

      <div className="flex gap-8">
        {/* Sidebar — dark */}
        <div className="w-56 shrink-0 space-y-1 bg-[#1A1A2E] rounded-xl p-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === tab.key ? 'bg-accent/20 text-accent font-medium' : 'text-white/60 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* ── Dashboard ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-4 gap-4">
                {statCards.map((stat) => (
                  <div key={stat.label} className="bg-dark-700 rounded-xl border border-border p-5">
                    <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                    <p className="text-2xl font-bold font-mono-price">{formatNumber(stat.value)}</p>
                    <p className="text-xs text-text-secondary mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Recent Signups */}
                <div className="bg-dark-700 rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">최근 가입 회원</h3>
                    <button onClick={() => setActiveTab('users')} className="text-xs text-accent flex items-center gap-1 hover:underline">
                      전체보기 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  {recentUsers.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <Users className="w-8 h-8 text-text-secondary/30 mb-2" />
                      <p className="text-text-secondary text-sm">가입 회원이 없습니다</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {recentUsers.map((u) => (
                        <li key={u.id as string} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div>
                            <p className="text-sm font-medium">{u.nickname as string}</p>
                            <p className="text-xs text-text-secondary">{u.email as string}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-0.5 rounded ${(u.role as string) === 'premium' ? 'bg-premium/20 text-premium' : 'bg-dark-600 text-text-secondary'}`}>
                              {u.role as string}
                            </span>
                            <p className="text-xs text-text-secondary mt-1">{formatDate(u.created_at as string)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Pending Banners */}
                <div className="bg-dark-700 rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">배너 승인 대기</h3>
                    <button onClick={() => setActiveTab('banners')} className="text-xs text-accent flex items-center gap-1 hover:underline">
                      전체보기 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex flex-col items-center py-8 text-center">
                    <BadgeCheck className="w-8 h-8 text-text-secondary/30 mb-2" />
                    <p className="text-text-secondary text-sm">승인 대기 중인 배너가 없습니다</p>
                  </div>
                </div>
              </div>

              {/* Quick links */}
              <div className="bg-dark-700 rounded-xl border border-border p-5">
                <h3 className="font-semibold text-sm mb-4">바로가기</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/admin/partners"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-accent/60 hover:bg-dark-600/30 transition-colors"
                  >
                    <Handshake className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-sm font-medium">파트너 관리</p>
                      <p className="text-xs text-text-secondary">Partner-Agnostic 슬롯 + 리드젠</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Chat Reports */}
              <div className="bg-dark-700 rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">채팅 신고 목록</h3>
                  <button onClick={() => setActiveTab('chat')} className="text-xs text-accent flex items-center gap-1 hover:underline">
                    전체보기 <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-col items-center py-8 text-center">
                  <Shield className="w-8 h-8 text-text-secondary/30 mb-2" />
                  <p className="text-text-secondary text-sm">신고된 채팅이 없습니다</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Users ── */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이메일 또는 닉네임 검색"
                  className="flex-1 px-4 py-2 bg-dark-700 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                />
                <button onClick={loadUsers} className="px-4 py-2 bg-accent text-white rounded-lg text-sm">검색</button>
              </div>
              <div className="bg-dark-700 rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-dark-800 text-text-secondary text-xs">
                    <th className="text-left px-4 py-3">닉네임</th><th className="text-left px-4 py-3">이메일</th>
                    <th className="text-left px-4 py-3">가입일</th><th className="text-left px-4 py-3">구독</th><th className="text-left px-4 py-3">역할</th>
                  </tr></thead>
                  <tbody>
                    {userList.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-12 text-text-secondary text-sm">회원 데이터가 없습니다</td></tr>
                    ) : userList.map((u: Record<string, unknown>) => (
                      <tr key={u.id as string} className="border-t border-border/50 hover:bg-dark-600/30">
                        <td className="px-4 py-2.5">{u.nickname as string}</td>
                        <td className="px-4 py-2.5 text-text-secondary">{u.email as string}</td>
                        <td className="px-4 py-2.5 text-text-secondary">{formatDate(u.created_at as string)}</td>
                        <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-xs ${(u.subscription_status as string) === 'active' ? 'bg-success/20 text-success' : 'bg-dark-600 text-text-secondary'}`}>{(u.subscription_status as string) || 'free'}</span></td>
                        <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded text-xs bg-dark-600">{u.role as string}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Banners ── */}
          {activeTab === 'banners' && (
            <div className="bg-dark-700 rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-dark-800 text-text-secondary text-xs">
                  <th className="text-left px-4 py-3">제목</th><th className="text-left px-4 py-3">광고주</th>
                  <th className="text-left px-4 py-3">유형</th><th className="text-left px-4 py-3">상태</th>
                  <th className="text-right px-4 py-3">클릭</th><th className="text-left px-4 py-3">결제</th>
                </tr></thead>
                <tbody>
                  {bannerList.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-text-secondary text-sm">등록된 배너가 없습니다</td></tr>
                  ) : bannerList.map((b: Record<string, unknown>) => (
                    <tr key={b.id as number} className="border-t border-border/50 hover:bg-dark-600/30">
                      <td className="px-4 py-2.5">{b.title as string}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{(b.advertisers as Record<string, string>)?.company_name || '-'}</td>
                      <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded ${(b.banner_tier as string) === 'premium' ? 'bg-accent/20 text-accent' : 'bg-dark-600'}`}>{b.banner_tier as string}</span></td>
                      <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded ${b.is_active ? 'bg-success/20 text-success' : 'bg-dark-600'}`}>{b.is_active ? '활성' : '비활성'}</span></td>
                      <td className="px-4 py-2.5 text-right font-mono-price">{formatNumber(b.click_count as number)}</td>
                      <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded ${(b.payment_status as string) === 'paid' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>{(b.payment_status as string) || '-'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Chat Management ── */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#E5E7EB] p-6">
                <h3 className="font-bold text-black text-base mb-4">채팅 관리</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#F5F5F5] p-4 text-center">
                    <p className="text-2xl font-bold text-black font-mono-price">0</p>
                    <p className="text-xs text-[#999999]">신고 대기</p>
                  </div>
                  <div className="bg-[#F5F5F5] p-4 text-center">
                    <p className="text-2xl font-bold text-black font-mono-price">0</p>
                    <p className="text-xs text-[#999999]">금지 사용자</p>
                  </div>
                  <div className="bg-[#F5F5F5] p-4 text-center">
                    <p className="text-2xl font-bold text-black font-mono-price">0</p>
                    <p className="text-xs text-[#999999]">오늘 메시지</p>
                  </div>
                </div>
                <p className="text-[#999999] text-sm text-center">채팅 신고 내역이 없습니다</p>
              </div>
            </div>
          )}

          {/* ── Placeholder tabs ── */}
          {(activeTab === 'notice' || activeTab === 'settings') && (
            <div className="bg-white border border-[#E5E7EB] p-12 text-center">
              <Settings className="w-10 h-10 text-[#999999] mx-auto mb-3" />
              <p className="text-black text-sm font-bold">이 섹션은 준비 중입니다</p>
              <p className="text-[#999999] text-xs mt-1">곧 업데이트됩니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
