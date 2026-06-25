'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { formatDate } from '@/lib/utils/format';
import { User, Siren, Trash2 } from 'lucide-react';

type Tab = 'profile' | 'reports';
type MyReport = { id: number; target_name: string; reason: string; status: string; created_at: string };

export default function MyPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [myReports, setMyReports] = useState<MyReport[]>([]);

  useEffect(() => {
    if (!isLoading && !user) { router.push('/auth/login'); return; }
    if (user) {
      setNickname(user.nickname ?? '');
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

  const loadData = async () => {
    try {
      const rep = await fetch('/api/reports').then((r) => r.json()).catch(() => ({}));
      setMyReports(rep.reports ?? []);
    } catch { /* ignore */ }
  };

  const updateNickname = async () => {
    if (!user || !nickname.trim()) return;
    setSaving(true);
    setSaveMsg(null);
    const supabase = createClient();
    const { error } = await supabase.from('users').update({ nickname: nickname.trim() }).eq('id', user.id);
    if (error) {
      setSaveMsg({ ok: false, text: '저장에 실패했어요. 잠시 후 다시 시도해주세요.' });
    } else {
      useAuthStore.getState().setUser({ ...user, nickname: nickname.trim() });
      setSaveMsg({ ok: true, text: '닉네임을 저장했어요.' });
    }
    setSaving(false);
  };

  const withdrawReport = async (id: number) => {
    const res = await fetch('/api/reports', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    });
    if (res.ok) setMyReports((prev) => prev.filter((r) => r.id !== id));
    else { const j = await res.json().catch(() => ({})); alert(j.error ?? '철회 실패'); }
  };

  if (isLoading || !user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-unjong-accent border-t-transparent" /></div>;
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: '프로필', icon: <User size={16} /> },
    { key: 'reports', label: '내 신고', icon: <Siren size={16} /> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-unjong-primary">마이페이지</h1>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-unjong-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm transition-colors ${
              activeTab === tab.key ? 'border-unjong-accent font-semibold text-unjong-primary' : 'border-transparent text-unjong-muted hover:text-unjong-primary'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="max-w-xl space-y-4 rounded-xl border border-unjong-border bg-unjong-surface p-6">
          <div>
            <label className="mb-1 block text-sm text-unjong-muted">닉네임</label>
            <div className="flex gap-2">
              <input value={nickname} onChange={(e) => { setNickname(e.target.value); setSaveMsg(null); }} className="flex-1 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2.5 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
              <button type="button" onClick={updateNickname} disabled={saving} className="shrink-0 rounded-lg bg-unjong-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? '저장 중…' : '변경'}</button>
            </div>
            {saveMsg ? <p className={`mt-1.5 text-xs ${saveMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>{saveMsg.text}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-sm text-unjong-muted">이메일</label>
            <input value={user.email ?? ''} disabled className="w-full rounded-lg border border-unjong-border bg-unjong-background px-3 py-2.5 text-sm text-unjong-muted" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-unjong-muted">가입일</label>
            <p className="text-sm text-unjong-primary">{formatDate(user.created_at)}</p>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="rounded-xl border border-unjong-border bg-unjong-surface p-2">
          {myReports.length === 0 ? (
            <p className="p-5 text-center text-sm text-unjong-muted">접수한 신고가 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                    <th className="px-3 py-2 text-left font-medium">대상</th>
                    <th className="px-3 py-2 text-left font-medium">사유</th>
                    <th className="px-3 py-2 text-left font-medium">상태</th>
                    <th className="px-3 py-2 text-left font-medium">접수일</th>
                    <th className="px-3 py-2 text-right font-medium">철회</th>
                  </tr>
                </thead>
                <tbody>
                  {myReports.map((r) => (
                    <tr key={r.id} className="border-b border-unjong-border last:border-0">
                      <td className="px-3 py-2 text-unjong-primary">{r.target_name}</td>
                      <td className="px-3 py-2 text-unjong-muted">{r.reason}</td>
                      <td className="px-3 py-2"><span className={r.status === 'confirmed' ? 'font-medium text-emerald-600' : r.status === 'dismissed' ? 'text-unjong-muted line-through' : 'text-amber-600'}>{r.status === 'confirmed' ? '확인됨' : r.status === 'dismissed' ? '기각됨' : '대기'}</span></td>
                      <td className="px-3 py-2 text-unjong-muted">{formatDate(r.created_at)}</td>
                      <td className="px-3 py-2 text-right">{r.status === 'confirmed' ? <span className="text-xs text-unjong-muted">—</span> : <button type="button" onClick={() => withdrawReport(r.id)} title="철회" className="text-unjong-muted hover:text-red-500"><Trash2 size={14} className="inline" /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
