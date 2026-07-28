'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { clearCache } from '@/lib/clientCache';
import { PageShell } from '@/components/layout/PageShell';
import { useTranslations, useLocale } from 'next-intl';
import { formatDate } from '@/lib/utils/format';
import { User, ShieldCheck, Activity as ActivityIcon, Star, AlertTriangle, LogOut, Mail } from 'lucide-react';

type Tab = 'profile' | 'account' | 'activity';

export default function MyPage() {
  const t = useTranslations('MyPage');
  const tHeader = useTranslations('Header'); // '로그아웃' 재사용(dedup)
  const locale = useLocale(); // 이메일 opt-in ON 시점 로케일 저장용(STEP 784)
  const router = useRouter();
  const pathname = usePathname(); // 로케일 무관 경로 — 로그인 후 마이로 복귀(next)
  const { user, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [watchlistCount, setWatchlistCount] = useState<number | null>(null);
  const [providers, setProviders] = useState<string[]>([]);

  // 이메일 모닝 브리핑 opt-in(STEP 784) — 기본 OFF, 언제든 끌 수 있음.
  const [emailBrief, setEmailBrief] = useState(false);
  const [emailBriefLoaded, setEmailBriefLoaded] = useState(false);
  const [emailBriefSaving, setEmailBriefSaving] = useState(false);
  const [emailBriefLoadError, setEmailBriefLoadError] = useState(false); // 조회 실패 — OFF로 위장 금지(STEP 804 §5)
  const [emailBriefMsg, setEmailBriefMsg] = useState<string | null>(null); // 토글 실패 안내

  // 비밀번호 변경(계정·보안 탭 — 이메일 로그인 계정만)
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // 회원 탈퇴(위험 구역)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) { router.push(`/auth/login?next=${encodeURIComponent(pathname)}`); return; }
    if (user) {
      setNickname(user.nickname ?? '');
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

  const loadData = async () => {
    try {
      const wl = await fetch('/api/watchlist').then((r) => r.json()).catch(() => ({}));
      setWatchlistCount(Array.isArray(wl.watchlist) ? wl.watchlist.length : 0);
    } catch { /* ignore */ }
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const p = (data.user?.app_metadata?.providers as string[] | undefined) ?? [];
      setProviders(p);
    } catch { /* ignore */ }
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('email_subscriptions').select('daily_brief').eq('user_id', user!.id).maybeSingle();
      if (error) throw error;
      setEmailBrief(data?.daily_brief ?? false);
      setEmailBriefLoadError(false);
    } catch { setEmailBriefLoadError(true); /* 조회 실패를 '구독 안 함(OFF)'으로 위장하지 않는다(STEP 804 §5) */ }
    setEmailBriefLoaded(true);
  };

  // ON=현재 로케일로 upsert(닉네임 변경과 동일하게 RLS 경로로 직접) · OFF=daily_brief만 false.
  const toggleEmailBrief = async () => {
    if (!user || emailBriefSaving) return; // 연타 방지(STEP 804 §5)
    setEmailBriefSaving(true);
    setEmailBriefMsg(null);
    const next = !emailBrief;
    const supabase = createClient();
    const { error } = await supabase.from('email_subscriptions').upsert(
      { user_id: user.id, daily_brief: next, locale, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    if (!error) { setEmailBrief(next); setEmailBriefLoadError(false); }
    else setEmailBriefMsg(t('saveFail')); // 실패 안내(기존엔 조용히 실패)
    setEmailBriefSaving(false);
  };

  const updateNickname = async () => {
    if (!user || !nickname.trim()) return;
    setSaving(true);
    setSaveMsg(null);
    const supabase = createClient();
    const { error } = await supabase.from('users').update({ nickname: nickname.trim() }).eq('id', user.id);
    if (error) {
      setSaveMsg({ ok: false, text: t('saveFail') });
    } else {
      useAuthStore.getState().setUser({ ...user, nickname: nickname.trim() });
      setSaveMsg({ ok: true, text: t('saveOk') });
    }
    setSaving(false);
  };

  const changePassword = async () => {
    setPwMsg(null);
    if (newPassword.length < 8) { setPwMsg({ ok: false, text: t('errPasswordShort') }); return; }
    if (newPassword !== newPassword2) { setPwMsg({ ok: false, text: t('errPasswordMismatch') }); return; }
    setPwSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwMsg({ ok: true, text: t('pwChangeOk') });
      setNewPassword('');
      setNewPassword2('');
    } catch {
      setPwMsg({ ok: false, text: t('pwChangeFail') });
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAuthStore.getState().setUser(null);
    clearCache();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (deleteInput.trim() !== t('withdrawConfirmWord')) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      if (!res.ok) throw new Error('delete_failed');
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
    } catch {
      setDeleteError(t('deleteAccountFail'));
      setDeleting(false);
    }
  };

  if (isLoading || !user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-unjong-accent border-t-transparent" /></div>;
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: t('tabProfile'), icon: <User size={16} /> },
    { key: 'account', label: t('tabAccount'), icon: <ShieldCheck size={16} /> },
    { key: 'activity', label: t('tabActivity'), icon: <ActivityIcon size={16} /> },
  ];

  const initial = (user.nickname || user.email || 'U').charAt(0).toUpperCase();
  const canChangePassword = providers.includes('email');

  // STEP 798 §2: 5면 셸 정합(마이만 max-w-7xl로 튀던 것 → 오늘·관심과 같은 좌측 144·본문 680). 모바일 px-4 유지.
  return (
    <PageShell mobilePadded>
      <h1 className="mb-6 text-2xl font-bold text-unjong-primary">{t('title')}</h1>

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
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2DD4BF] text-2xl font-bold text-[#0E1116]">
            {initial}
          </div>
          <div>
            <label className="mb-1 block text-sm text-unjong-muted">{t('nickname')}</label>
            <div className="flex gap-2">
              <input value={nickname} onChange={(e) => { setNickname(e.target.value); setSaveMsg(null); }} className="flex-1 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2.5 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
              <button type="button" onClick={updateNickname} disabled={saving} className="shrink-0 rounded-lg bg-unjong-strong px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? t('saving') : t('change')}</button>
            </div>
            {saveMsg ? <p className={`mt-1.5 text-xs ${saveMsg.ok ? 'text-emerald-400' : 'text-red-500'}`}>{saveMsg.text}</p> : null}
          </div>
        </div>
      )}

      {activeTab === 'account' && (
        <div className="max-w-xl space-y-6">
          <div className="space-y-4 rounded-xl border border-unjong-border bg-unjong-surface p-6">
            <div>
              <label className="mb-1 block text-sm text-unjong-muted">{t('email')}</label>
              <input value={user.email ?? ''} disabled className="w-full rounded-lg border border-unjong-border bg-unjong-background px-3 py-2.5 text-sm text-unjong-muted" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-unjong-muted">{t('joined')}</label>
              <p className="text-sm text-unjong-primary">{formatDate(user.created_at)}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-unjong-muted">{t('accountLoginMethod')}</label>
              <div className="flex flex-wrap gap-1.5">
                {providers.includes('google') && (
                  <span className="rounded-full bg-unjong-background px-2.5 py-1 text-xs font-medium text-unjong-primary">{t('providerGoogle')}</span>
                )}
                {providers.includes('email') && (
                  <span className="rounded-full bg-unjong-background px-2.5 py-1 text-xs font-medium text-unjong-primary">{t('providerEmail')}</span>
                )}
              </div>
            </div>

            <div className="border-t border-unjong-border pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-unjong-primary"><Mail size={14} />{t('emailBriefTitle')}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-unjong-muted">{t('emailBriefDesc')}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={emailBrief}
                  disabled={!emailBriefLoaded || emailBriefSaving}
                  onClick={toggleEmailBrief}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${emailBrief ? 'bg-unjong-accent' : 'bg-unjong-border'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${emailBrief ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {emailBriefLoadError && <p className="mt-2 text-xs text-unjong-danger">{t('emailBriefLoadError')}</p>}
              {emailBriefMsg && <p className="mt-2 text-xs text-unjong-danger">{emailBriefMsg}</p>}
            </div>

            <div className="border-t border-unjong-border pt-4">
              <p className="mb-2 text-sm font-semibold text-unjong-primary">{t('pwSectionTitle')}</p>
              {canChangePassword ? (
                <div className="space-y-2.5">
                  <div>
                    <label className="mb-1 block text-xs text-unjong-muted">{t('fieldNewPassword')} <span className="text-unjong-muted">({t('pwHint')})</span></label>
                    <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPwMsg(null); }} className="w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" autoComplete="new-password" minLength={8} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-unjong-muted">{t('fieldNewPasswordConfirm')}</label>
                    <input type="password" value={newPassword2} onChange={(e) => { setNewPassword2(e.target.value); setPwMsg(null); }} className="w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" autoComplete="new-password" minLength={8} />
                  </div>
                  <button type="button" onClick={changePassword} disabled={pwSaving} className="rounded-lg bg-unjong-strong px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    {pwSaving ? t('pwChanging') : t('pwChangeSubmit')}
                  </button>
                  {pwMsg ? <p className={`text-xs ${pwMsg.ok ? 'text-emerald-400' : 'text-red-500'}`}>{pwMsg.text}</p> : null}
                </div>
              ) : (
                <p className="text-sm text-unjong-muted">{t('googleOnlyNote')}</p>
              )}
            </div>
          </div>

          {/* 로그아웃 — 모바일은 헤더 아이콘이 숨겨져(STEP 768) 여기가 유일한 로그아웃 경로 */}
          <div className="rounded-xl border border-unjong-border bg-unjong-surface p-6">
            <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-lg border border-unjong-border px-4 py-2 text-sm font-semibold text-unjong-primary hover:bg-unjong-background">
              <LogOut size={15} /> {tHeader('logout')}
            </button>
          </div>

          {/* 위험 구역 */}
          <div className="space-y-3 rounded-xl border border-red-500/30 bg-red-500/5 p-6">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-red-500"><AlertTriangle size={15} />{t('dangerZoneTitle')}</p>
            {!showDeleteConfirm ? (
              <button type="button" onClick={() => setShowDeleteConfirm(true)} className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10">
                {t('withdrawTitle')}
              </button>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs leading-relaxed text-unjong-muted">{t('withdrawWarning')}</p>
                <label className="block text-xs text-unjong-muted">{t('withdrawConfirmLabel', { word: t('withdrawConfirmWord') })}</label>
                <input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={t('withdrawConfirmWord')}
                  className="w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-red-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteInput.trim() !== t('withdrawConfirmWord')}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    {deleting ? t('withdrawSubmitting') : t('withdrawSubmit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeleteError(null); }}
                    className="rounded-lg border border-unjong-border px-4 py-2 text-sm text-unjong-muted hover:text-unjong-primary"
                  >
                    {t('withdrawCancel')}
                  </button>
                </div>
                {deleteError ? <p className="text-xs text-red-500">{deleteError}</p> : null}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="max-w-xl space-y-6">
          <div className="rounded-xl border border-unjong-border bg-unjong-surface p-6">
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-unjong-primary"><Star size={15} />{t('watchlistTitle')}</p>
            <p className="mb-2 text-sm text-unjong-muted">{t('watchlistCount', { n: watchlistCount ?? 0 })}</p>
            <Link href="/favorites" className="text-sm font-semibold text-unjong-accent">{t('watchlistViewLink')}</Link>
          </div>
        </div>
      )}
    </PageShell>
  );
}
