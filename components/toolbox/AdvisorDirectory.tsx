'use client';

import { Fragment, useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { useTranslations } from 'next-intl';
import { getCache, setCache } from '@/lib/clientCache';
import { ExternalLink, Search, Siren, X, ChevronLeft, ChevronRight, ShieldCheck, Star, ArrowUp, ArrowDown, UserCheck, Send, PlayCircle, Globe, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SelectDropdown from './SelectDropdown';
import AdSlotRow from './AdSlotRow';

type Advisor = {
  biz_no: string;
  company_name: string;
  info_name: string | null;
  representative: string | null;
  valid_from: string | null;
  valid_to: string | null;
  homepage: string | null;
  phone: string | null;
  address: string | null;
  report_count: number;
  favorite_count: number;
  platform: string;
  source: string;
  intro: string | null;
  biz_links?: { type: string; url: string; label: string | null; is_paid: boolean }[];
  verified_owner?: boolean;
  // 채널 단위 행(인증 리딩방 뷰) — 활성 business_link 1개 = 1행
  channel_id?: string;
  channel_label?: string | null;
  channel_url?: string | null;
  channel_platform?: string | null;
  channel_is_paid?: boolean;
};

// 값은 /api/reports 로 전송·DB 저장 → 번역 금지(원문 유지). 표시 라벨만 키로 해석.
const REASONS = ['허위·과장 수익률', '환불 거부', '미등록·사칭 의심', '리딩방 먹튀(잠적)', '불법 추천·미신고 자문', '기타'];
const REASON_KEYS: Record<string, string> = {
  '허위·과장 수익률': 'reason.falseReturns',
  '환불 거부': 'reason.refundDenied',
  '미등록·사칭 의심': 'reason.unregistered',
  '리딩방 먹튀(잠적)': 'reason.scam',
  '불법 추천·미신고 자문': 'reason.illegal',
  '기타': 'reason.etc',
};
type Translate = ReturnType<typeof useTranslations>;
const PAGE_SIZE = 100;
type View = 'fss' | 'verified' | 'interest';
type Dir = 'asc' | 'desc';
const VIEW_TABS: { key: View; labelKey: string }[] = [
  { key: 'fss', labelKey: 'view.fss' },
  { key: 'verified', labelKey: 'view.verified' },
  { key: 'interest', labelKey: 'view.interest' },
];

function platformLabel(p: string, t: Translate): string {
  return p === 'telegram' ? t('platform.telegram') : p === 'kakao' ? t('platform.kakao') : p === 'naver' ? t('platform.naver') : t('platform.etc');
}
function PlatformIcon({ p, className }: { p?: string | null; className?: string }) {
  if (p === 'telegram') return <Send size={12} className={className} />;
  if (p === 'youtube') return <PlayCircle size={12} className={className} />;
  if (p === 'kakao') return <MessageCircle size={12} className={className} />;
  return <Globe size={12} className={className} />;
}
const LINK_TYPE_KEYS: Record<string, string> = { room: 'linkType.room', youtube: 'linkType.youtube', site: 'linkType.site' };
function roomNameOf(a: Advisor): string {
  return (a.info_name && a.info_name.trim()) || a.company_name;
}
function hostOf(u: string): string { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } }
// 채널명 = 인증한 곳만. 채널 단위 행이면 그 채널명, 업체 단위 행이면 첫 링크/리딩방명. 미인증 → null("—").
function channelOf(a: Advisor): string | null {
  if (a.channel_id) return (a.channel_label && a.channel_label.trim()) || a.company_name || null;
  if (!a.verified_owner) return null;
  const name = (a.info_name && a.info_name.trim()) || (a.biz_links && a.biz_links[0]?.label?.trim()) || a.company_name;
  return name || null;
}
// 인증 채널 없을 때 보여줄 공개 채널(금감원 homepage). 있으면 {label, url}.
function publicChannelOf(a: Advisor, t: Translate): { label: string; url: string } | null {
  if (a.channel_id || a.verified_owner) return null;
  if (!a.homepage || !a.homepage.trim()) return null;
  const p = a.platform;
  const label = p === 'telegram' ? t('pub.telegram') : p === 'kakao' ? t('pub.kakao') : p === 'youtube' ? t('pub.youtube') : t('pub.home');
  return { label, url: a.homepage.trim() };
}
// 행 키 — 채널 단위 행은 channel_id, 업체 단위 행은 biz_no
function rowKey(a: Advisor): string {
  return a.channel_id ?? a.biz_no;
}

// 인피드 광고 슬롯 — '예시'가 아니라 '광고 문의하기' CTA(/advertise). 맨 위 + N개마다. (AdSlotRow 공용)
const AD_EVERY = 10;

function PreviewBody({ a, onReport, isFav, onToggleFav }: { a: Advisor; onReport: () => void; isFav: boolean; onToggleFav: () => void }) {
  const t = useTranslations('Advisor');
  const tf = useTranslations('Feed');
  const roomName = roomNameOf(a);
  const isFss = a.source === 'fss';
  const ch = channelOf(a);
  const rows: [string, string | null][] = isFss
    ? [
        [t('fieldRep'), a.representative],
        [t('fieldAddress'), a.address],
        [t('fieldPeriod'), `${a.valid_from ?? '—'} ~ ${a.valid_to ?? '—'}`],
      ]
    : [
        [t('fieldCompany'), a.company_name],
        [t('fieldIntro'), a.intro],
      ];
  // 채널 단위 행이면 그 채널 링크, 업체 단위면 홈페이지를 미리보기 대상으로
  const linkUrl = a.channel_url || a.homepage;
  const [og, setOg] = useState<{ title: string | null; image: string | null; description: string | null; siteName: string | null; status: string } | null>(null);
  const [ogLoading, setOgLoading] = useState(false);
  useEffect(() => {
    setOg(null);
    if (!linkUrl) { setOgLoading(false); return; }
    let cancelled = false;
    setOgLoading(true);
    fetch(`/api/link-preview?url=${encodeURIComponent(linkUrl)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setOg(d); })
      .catch(() => { if (!cancelled) setOg(null); })
      .finally(() => { if (!cancelled) setOgLoading(false); });
    return () => { cancelled = true; };
  }, [linkUrl, a.verified_owner]);
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-unjong-primary">{isFss ? a.company_name : roomName}</h3>
        <button
          type="button"
          onClick={onToggleFav}
          aria-label={isFav ? t('favRemove') : t('fav')}
          className={`shrink-0 transition-colors ${isFav ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
        >
          <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {isFss ? (
          <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
            <ShieldCheck size={12} /> {t('fssReported', { platform: platformLabel(a.platform, t) })}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded border border-unjong-border bg-unjong-background px-2 py-0.5 text-[11px] font-medium text-unjong-muted">
            {t('userRegistered', { platform: platformLabel(a.platform, t) })}
          </span>
        )}
        {a.verified_owner ? (
          <span className="inline-flex items-center gap-1 rounded border border-unjong-accent/40 bg-unjong-accent/10 px-2 py-0.5 text-[11px] font-medium text-unjong-accent">
            <UserCheck size={12} /> {t('ownerVerified')}
          </span>
        ) : null}
      </div>
      <dl className="space-y-1.5 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="w-14 shrink-0 text-unjong-muted">{k}</dt>
            <dd className="min-w-0 flex-1 text-unjong-primary">{v || '—'}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        {a.verified_owner && ch ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <UserCheck size={13} className="shrink-0 text-unjong-accent" aria-label={t('ownerVerified')} />
            <span className="truncate text-unjong-primary">{ch}</span>
          </span>
        ) : <span />}
        <button type="button" onClick={onReport} className="flex shrink-0 items-center gap-1 text-unjong-muted hover:text-red-500">
          <Siren size={13} /> {t('reportCount', { n: a.report_count })}
        </button>
      </div>
      {linkUrl ? (
        <div className="mt-3">
          {ogLoading ? (
            <div className="mb-2 h-24 animate-pulse rounded-lg bg-unjong-background" />
          ) : og && og.status === 'ok' && (og.image || og.title) ? (
            <a href={linkUrl} target="_blank" rel="noopener noreferrer nofollow" className="mb-2 block overflow-hidden rounded-lg border border-unjong-border transition-colors hover:border-unjong-accent">
              {og.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={og.image} alt="" className="h-28 w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              ) : null}
              <div className="p-2.5">
                <p className="line-clamp-1 text-xs font-semibold text-unjong-primary">{og.title || hostOf(linkUrl)}</p>
                {og.description ? <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-unjong-muted">{og.description}</p> : null}
                <p className="mt-1 truncate text-[10px] text-unjong-muted">{og.siteName || hostOf(linkUrl)}</p>
              </div>
            </a>
          ) : null}
          {a.verified_owner ? (
            <a href={linkUrl} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center justify-center gap-1 rounded-lg bg-unjong-strong py-2 text-sm font-semibold text-white">
              {t('linkGo')} <ExternalLink size={13} />
            </a>
          ) : (
            <>
              <a href={linkUrl} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center justify-center gap-1 rounded-lg border border-unjong-border py-2 text-sm font-semibold text-unjong-primary hover:border-unjong-accent hover:text-unjong-accent">
                <PlatformIcon p={a.platform} /> {t('platformGo', { platform: platformLabel(a.platform, t) })} <ExternalLink size={12} />
              </a>
              <p className="mt-1 text-center text-[10px] text-unjong-muted">{t('publicLinkNote')}</p>
            </>
          )}
        </div>
      ) : null}
      {!a.channel_id && a.biz_links && a.biz_links.length > 0 ? (
        <div className="mt-3 border-t border-unjong-border pt-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-unjong-muted">
            {t('bizProvided')} <span className="rounded bg-unjong-background px-1 py-0.5 text-[10px] font-normal">{t('bizProvidedBadge')}</span>
          </div>
          <div className="space-y-1.5">
            {a.biz_links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-2 rounded-lg border border-unjong-border px-3 py-2 text-xs transition-colors hover:border-unjong-accent">
                <span className="shrink-0 rounded bg-unjong-background px-1.5 py-0.5 text-[10px] font-medium text-unjong-muted">{LINK_TYPE_KEYS[l.type] ? t(LINK_TYPE_KEYS[l.type]) : l.type}</span>
                {l.is_paid ? <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">{tf('ad')}</span> : null}
                <span className="min-w-0 flex-1 truncate text-unjong-primary">{l.label || l.url}</span>
                <ExternalLink size={12} className="shrink-0 text-unjong-muted" />
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdvisorDirectory({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = useTranslations('Advisor');
  const [view, setView] = useState<View>('fss');
  const [dir, setDir] = useState<Dir>('asc');
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');

  const cachedInit = getCache<{ results: Advisor[]; total: number; searching: boolean }>('advisors:fss:asc:1:');
  const [results, setResults] = useState<Advisor[]>(cachedInit?.results ?? []);
  const [total, setTotal] = useState(cachedInit?.total ?? 0);
  const [searching, setSearching] = useState(cachedInit?.searching ?? false);
  const [loading, setLoading] = useState(cachedInit === undefined);
  const [selected, setSelected] = useState<Advisor | null>(null);
  const [loginNotice, setLoginNotice] = useState(false);
  const router = useRouter();

  // 모바일 하단 시트: 핸들을 잡고 아래로 드래그하면 닫힘
  const [sheetDragY, setSheetDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);
  function onSheetTouchStart(e: ReactTouchEvent) {
    dragStartY.current = e.touches[0].clientY;
  }
  function onSheetTouchMove(e: ReactTouchEvent) {
    if (dragStartY.current === null) return;
    setSheetDragY(Math.max(0, e.touches[0].clientY - dragStartY.current)); // 아래로만
  }
  function onSheetTouchEnd() {
    if (sheetDragY > 90) setSelected(null); // 충분히 내리면 닫기
    setSheetDragY(0);                        // 아니면 제자리로 스냅백
    dragStartY.current = null;
  }

  const [reporting, setReporting] = useState<Advisor | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportError, setReportError] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => { setPage(1); }, [view, dir, q]);
  useEffect(() => { setSelected(null); }, [view, dir, q, page]);

  useEffect(() => {
    const cacheKey = `advisors:${view}:${dir}:${page}:${q}`;
    const cached = getCache<{ results: Advisor[]; total: number; searching: boolean }>(cacheKey);
    if (cached) { setResults(cached.results); setTotal(cached.total); setSearching(cached.searching); setLoading(false); }
    else { setLoading(true); }
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/advisors?view=${view}&dir=${dir}&page=${page}&q=${encodeURIComponent(q)}`);
        const j = await r.json();
        const nextResults = j.results ?? [];
        const nextTotal = j.total ?? 0;
        const nextSearching = !!j.searching;
        setResults(nextResults); setTotal(nextTotal); setSearching(nextSearching);
        setCache(cacheKey, { results: nextResults, total: nextTotal, searching: nextSearching });
      } catch {
        if (!cached) { setResults([]); setTotal(0); }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [view, dir, page, q]);

  useEffect(() => {
    if (!loginNotice) return;
    const timer = setTimeout(() => setLoginNotice(false), 3000);
    return () => clearTimeout(timer);
  }, [loginNotice]);

  const [favs, setFavs] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!isLoggedIn) { setFavs(new Set()); return; }
    fetch('/api/rooms/favorite')
      .then((r) => r.json())
      .then((j) => setFavs(new Set((j.favorites ?? []).map((f: { biz_no: string }) => f.biz_no))))
      .catch(() => {});
  }, [isLoggedIn]);
  async function toggleFav(a: Advisor) {
    if (!isLoggedIn) { setLoginNotice(true); return; }
    const isFav = favs.has(a.biz_no);
    const delta = isFav ? -1 : 1;
    setFavs((prev) => { const n = new Set(prev); if (isFav) n.delete(a.biz_no); else n.add(a.biz_no); return n; });
    setResults((prev) => prev.map((x) => x.biz_no === a.biz_no ? { ...x, favorite_count: Math.max(0, x.favorite_count + delta) } : x));
    setSelected((s) => (s && s.biz_no === a.biz_no ? { ...s, favorite_count: Math.max(0, s.favorite_count + delta) } : s));
    try {
      await fetch('/api/rooms/favorite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biz_no: a.biz_no, favorite: !isFav }),
      });
    } catch {
      setFavs((prev) => { const n = new Set(prev); if (isFav) n.add(a.biz_no); else n.delete(a.biz_no); return n; });
      setResults((prev) => prev.map((x) => x.biz_no === a.biz_no ? { ...x, favorite_count: Math.max(0, x.favorite_count - delta) } : x));
      setSelected((s) => (s && s.biz_no === a.biz_no ? { ...s, favorite_count: Math.max(0, s.favorite_count - delta) } : s));
    }
  }

  function openReport(a: Advisor) {
    if (!isLoggedIn) { setLoginNotice(true); return; }
    setReporting(a); setReportReason(''); setReportContent(''); setReportDone(false); setReportError('');
  }
  async function submitReport() {
    if (!reporting || !reportReason) return;
    setReportSubmitting(true); setReportError('');
    try {
      const r = await fetch('/api/reports', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: 'fss_advisor', target_id: reporting.biz_no, target_name: roomNameOf(reporting), reason: reportReason, content: reportContent }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? t('submitFail'));
      setReportDone(true);
    } catch (e) {
      setReportError(e instanceof Error ? e.message : t('submitFail'));
    } finally {
      setReportSubmitting(false);
    }
  }

  function pageNumbers(): (number | '…')[] {
    const out: (number | '…')[] = [];
    const win = 2;
    const start = Math.max(1, page - win);
    const end = Math.min(totalPages, page + win);
    if (start > 1) { out.push(1); if (start > 2) out.push('…'); }
    for (let i = start; i <= end; i++) out.push(i);
    if (end < totalPages) { if (end < totalPages - 1) out.push('…'); out.push(totalPages); }
    return out;
  }

  function selectView(v: View) {
    if (v === view) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setView(v); setDir(v === 'interest' ? 'desc' : 'asc'); }
    setPage(1);
  }
  const tabArrow = (active: boolean) =>
    active ? (dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ArrowUp size={11} className="opacity-20" />;

  return (
    <section className="min-w-0">
      <h2 className="mb-2 text-base font-bold text-unjong-primary">{t('title')}</h2>
      <p className="mb-3 rounded-lg border border-unjong-border bg-unjong-background px-3 py-2 text-[11px] leading-relaxed text-unjong-muted">
        {t.rich('notice', { s: (c) => <strong className="text-unjong-primary">{c}</strong> })}
      </p>

      {/* 검색 (맨 위) */}
      <div className="relative mb-2">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search')}
          className="w-full rounded-lg border border-unjong-border bg-unjong-surface py-2.5 pl-9 pr-3 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
        />
      </div>

      {/* 컨트롤 줄 — 좌: 뷰 탭(각 ↕), 우: 등록·관리 */}
      <div className="mb-2 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {VIEW_TABS.map((tab) => {
            const active = view === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => selectView(tab.key)}
                className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  active ? 'border-unjong-accent bg-unjong-accent/10 text-unjong-accent' : 'border-unjong-border text-unjong-muted hover:text-unjong-primary'
                }`}
              >
                {t(tab.labelKey)} {tabArrow(active)}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => { if (!isLoggedIn) { setLoginNotice(true); return; } router.push('/business'); }}
          className="shrink-0 rounded-lg border border-unjong-accent px-3 py-1.5 text-xs font-semibold text-unjong-accent transition-colors hover:bg-unjong-accent hover:text-white"
        >
          {t('manage')}
        </button>
      </div>

      {loginNotice ? (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
          <span>{t('loginNotice')}</span>
          <a href="/auth/login" className="font-semibold underline">{t('login')}</a>
        </div>
      ) : null}

      {/* 본문: 리스트 + 미리보기 */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          {loading ? (
            <ul className="space-y-2 py-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <li key={i} className="h-16 animate-pulse rounded-lg bg-unjong-background" />
              ))}
            </ul>
          ) : results.length === 0 ? (
            searching ? (
              <p className="py-10 text-center text-sm text-unjong-muted">{t('noSearchResult')}</p>
            ) : view === 'verified' ? (
              <div className="mt-2 rounded-xl border border-unjong-border bg-unjong-surface p-6 text-center">
                <p className="text-sm font-semibold text-unjong-primary">{t('noVerifiedTitle')}</p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-unjong-muted">{t.rich('noVerifiedDesc', { b: (c) => <b className="text-unjong-accent">{c}</b> })}</p>
                <button
                  type="button"
                  onClick={() => { if (!isLoggedIn) { setLoginNotice(true); return; } router.push('/business'); }}
                  className="mt-4 inline-flex items-center gap-1 rounded-lg bg-unjong-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {t('manage')} <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-unjong-muted">{t('empty')}</p>
            )
          ) : (
            <>
              <div className="grid grid-cols-[1.75rem_1.5fr_1fr_4.5rem] items-center gap-2 border-b border-l-2 border-l-transparent border-b-unjong-border px-2 py-1.5 text-[11px] font-medium text-unjong-muted">
                <span className="text-center">#</span>
                <span>{t('colCompany')}</span>
                <span>{t('colChannel')}</span>
                <span className="text-right">{t('colInterest')}</span>
              </div>
              <ul>
              {results.map((a, i) => {
                const n = (page - 1) * PAGE_SIZE + i + 1;
                const isSel = selected ? rowKey(selected) === rowKey(a) : false;
                const ch = channelOf(a);
                const pub = publicChannelOf(a, t);
                return (
                  <Fragment key={rowKey(a)}>
                    {i > 0 && i % AD_EVERY === 0 ? <li><AdSlotRow slot="room" /></li> : null}
                    <li
                    onClick={() => setSelected(a)}
                    className={`group grid cursor-pointer grid-cols-[1.75rem_1.5fr_1fr_4.5rem] items-center gap-2 border-b border-b-unjong-border border-l-2 px-2 py-2.5 transition-colors hover:bg-unjong-background ${
                      isSel ? 'border-l-unjong-accent bg-unjong-background' : 'border-l-transparent'
                    }`}
                  >
                    <span className="text-center text-sm font-bold text-unjong-muted">{n}</span>
                    <span className="flex min-w-0 items-center gap-1.5 text-left">
                      <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{a.company_name}</span>
                      {a.source === 'fss' ? <ShieldCheck size={13} className="shrink-0 text-emerald-400" aria-label={t('fssBadge')} /> : null}
                    </span>
                    <div className="flex min-w-0 items-center gap-1 text-left text-xs">
                      {ch ? (
                        <><UserCheck size={12} className="shrink-0 text-unjong-accent" aria-label={t('ownerVerified')} /><span className="truncate text-unjong-primary">{ch}</span></>
                      ) : pub ? (
                        <span className="flex min-w-0 items-center gap-1 text-unjong-muted group-hover:text-unjong-accent">
                          <PlatformIcon p={a.platform} className="shrink-0" />
                          <span className="truncate">{pub.label}</span>
                        </span>
                      ) : (
                        <span className="text-unjong-muted">—</span>
                      )}
                    </div>
                    <span className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleFav(a); }}
                        aria-label={favs.has(a.biz_no) ? t('favRemove') : t('fav')}
                        title={t('favTitle')}
                        className={`flex shrink-0 items-center gap-0.5 text-xs tabular-nums transition-colors ${favs.has(a.biz_no) ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
                      >
                        <Star size={14} fill={favs.has(a.biz_no) ? 'currentColor' : 'none'} />
                        {a.favorite_count > 0 ? <span>{a.favorite_count}</span> : null}
                      </button>
                    </span>
                  </li>
                  </Fragment>
                );
              })}
            </ul>
            </>
          )}

          {!loading && totalPages > 1 ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="flex h-8 w-8 items-center justify-center rounded-md border border-unjong-border text-unjong-muted hover:border-unjong-accent disabled:opacity-40" aria-label={t('prev')}>
                <ChevronLeft size={15} />
              </button>
              {pageNumbers().map((p, idx) =>
                p === '…' ? (
                  <span key={`e${idx}`} className="px-1 text-xs text-unjong-muted">…</span>
                ) : (
                  <button key={p} type="button" onClick={() => setPage(p)} className={`h-8 min-w-[2rem] rounded-md px-2 text-sm font-medium transition-colors ${p === page ? 'bg-unjong-strong text-white' : 'border border-unjong-border text-unjong-muted hover:border-unjong-accent'}`}>
                    {p}
                  </button>
                )
              )}
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="flex h-8 w-8 items-center justify-center rounded-md border border-unjong-border text-unjong-muted hover:border-unjong-accent disabled:opacity-40" aria-label={t('next')}>
                <ChevronRight size={15} />
              </button>
            </div>
          ) : null}
        </div>

        {/* 미리보기 (데스크탑 우측 — 티커 밑 스티키) */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-11 rounded-xl border border-unjong-border bg-unjong-surface p-4">
            {selected ? (
              <PreviewBody a={selected} onReport={() => openReport(selected)} isFav={favs.has(selected.biz_no)} onToggleFav={() => toggleFav(selected)} />
            ) : (
              <p className="py-12 text-center text-xs leading-relaxed text-unjong-muted">{t.rich('previewEmpty', { br: () => <br /> })}</p>
            )}
          </div>
        </aside>
      </div>

      {/* 미리보기 (모바일 하단 시트 — 바깥 터치 또는 아래로 드래그하면 닫힘) */}
      {selected ? (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/40 lg:hidden"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border-t border-unjong-border bg-unjong-surface pb-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: `translateY(${sheetDragY}px)`,
              transition: sheetDragY ? 'none' : 'transform 0.2s ease',
            }}
          >
            {/* 드래그 핸들 — 잡고 아래로 내리면 닫힘 */}
            <div
              className="flex cursor-grab touch-none justify-center px-3 pb-2 pt-3 active:cursor-grabbing"
              onTouchStart={onSheetTouchStart}
              onTouchMove={onSheetTouchMove}
              onTouchEnd={onSheetTouchEnd}
            >
              <span className="h-1.5 w-10 rounded-full bg-unjong-border" />
            </div>
            <div className="px-3 sm:px-4">
              <PreviewBody a={selected} onReport={() => openReport(selected)} isFav={favs.has(selected.biz_no)} onToggleFav={() => toggleFav(selected)} />
            </div>
          </div>
        </div>
      ) : null}

      {/* 신고 모달 */}
      {reporting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-unjong-border bg-unjong-surface p-4 shadow-xl">
            <div className="mb-3 flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-unjong-primary">{t('reportTitle')}</h3>
                <p className="mt-0.5 truncate text-xs text-unjong-muted">{roomNameOf(reporting)}</p>
              </div>
              <button type="button" onClick={() => setReporting(null)} aria-label={t('reportClose')} className="text-unjong-muted hover:text-unjong-primary">
                <X size={18} />
              </button>
            </div>

            {reportDone ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-unjong-primary">{t('reportDone')}</p>
                <p className="mt-1 text-xs text-unjong-muted">{t('reportDoneDesc')}</p>
                <button type="button" onClick={() => setReporting(null)} className="mt-4 rounded-lg bg-unjong-strong px-4 py-2 text-sm font-semibold text-white">{t('reportClose')}</button>
              </div>
            ) : (
              <>
                <label className="mb-1 block text-xs font-medium text-unjong-muted">{t('reportReason')}</label>
                <div className="mb-3">
                  <SelectDropdown
                    value={reportReason}
                    onChange={setReportReason}
                    options={REASONS.map((r) => ({ value: r, label: t(REASON_KEYS[r]) }))}
                  />
                </div>
                <label className="mb-1 block text-xs font-medium text-unjong-muted">{t('reportDetail')}</label>
                <textarea value={reportContent} onChange={(e) => setReportContent(e.target.value)} rows={4} placeholder={t('reportPlaceholder')} className="mb-1 w-full resize-none rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
                <p className="mb-3 text-[11px] leading-relaxed text-unjong-muted">{t('reportGuide')}</p>
                {reportError ? <p className="mb-2 text-xs text-red-500">{reportError}</p> : null}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setReporting(null)} className="flex-1 rounded-lg border border-unjong-border py-2 text-sm font-medium text-unjong-muted hover:bg-unjong-background">{t('reportCancel')}</button>
                  <button type="button" onClick={submitReport} disabled={!reportReason || reportSubmitting} className="flex-1 rounded-lg bg-unjong-strong py-2 text-sm font-semibold text-white disabled:opacity-50">{reportSubmitting ? t('reportSubmitting') : t('reportTitle')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

    </section>
  );
}
