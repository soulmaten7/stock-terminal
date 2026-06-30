'use client';

import { Fragment, useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { getCache, setCache } from '@/lib/clientCache';
import { ExternalLink, Search, Siren, X, ChevronLeft, ChevronRight, ShieldCheck, Star, ArrowUp, ArrowDown, UserCheck } from 'lucide-react';
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

const REASONS = ['허위·과장 수익률', '환불 거부', '미등록·사칭 의심', '리딩방 먹튀(잠적)', '불법 추천·미신고 자문', '기타'];
const PAGE_SIZE = 100;
type View = 'fss' | 'verified' | 'interest';
type Dir = 'asc' | 'desc';
const VIEW_TABS: { key: View; label: string }[] = [
  { key: 'fss', label: '금감원 등록업체' },
  { key: 'verified', label: '인증 리딩방' },
  { key: 'interest', label: '관심도순' },
];

function platformLabel(p: string): string {
  return p === 'telegram' ? '텔레그램' : p === 'kakao' ? '카카오톡' : p === 'naver' ? '네이버' : '기타';
}
const LINK_TYPE_LABEL: Record<string, string> = { room: '리딩방', youtube: '유튜브', site: '사이트' };
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
// 행 키 — 채널 단위 행은 channel_id, 업체 단위 행은 biz_no
function rowKey(a: Advisor): string {
  return a.channel_id ?? a.biz_no;
}

// 인피드 광고 슬롯 — '예시'가 아니라 '광고 문의하기' CTA(/advertise). 맨 위 + N개마다. (AdSlotRow 공용)
const AD_EVERY = 10;

function PreviewBody({ a, onReport, isFav, onToggleFav }: { a: Advisor; onReport: () => void; isFav: boolean; onToggleFav: () => void }) {
  const roomName = roomNameOf(a);
  const isFss = a.source === 'fss';
  const ch = channelOf(a);
  const rows: [string, string | null][] = isFss
    ? [
        ['대표', a.representative],
        ['주소', a.address],
        ['신고기간', `${a.valid_from ?? '—'} ~ ${a.valid_to ?? '—'}`],
      ]
    : [
        ['운영 업체', a.company_name],
        ['소개', a.intro],
      ];
  // 채널 단위 행이면 그 채널 링크, 업체 단위면 홈페이지를 미리보기 대상으로
  const linkUrl = a.channel_url || a.homepage;
  const [og, setOg] = useState<{ title: string | null; image: string | null; description: string | null; siteName: string | null; status: string } | null>(null);
  const [ogLoading, setOgLoading] = useState(false);
  useEffect(() => {
    setOg(null);
    if (!a.verified_owner || !linkUrl) { setOgLoading(false); return; }
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
          aria-label={isFav ? '즐겨찾기 해제' : '즐겨찾기'}
          className={`shrink-0 transition-colors ${isFav ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
        >
          <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {isFss ? (
          <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
            <ShieldCheck size={12} /> 유사투자자문 신고 · {platformLabel(a.platform)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded border border-unjong-border bg-unjong-background px-2 py-0.5 text-[11px] font-medium text-unjong-muted">
            이용자 등록 · {platformLabel(a.platform)}
          </span>
        )}
        {a.verified_owner ? (
          <span className="inline-flex items-center gap-1 rounded border border-unjong-accent/40 bg-unjong-accent/10 px-2 py-0.5 text-[11px] font-medium text-unjong-accent">
            <UserCheck size={12} /> 운영자 인증
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
            <UserCheck size={13} className="shrink-0 text-unjong-accent" aria-label="운영자 인증" />
            <span className="truncate text-unjong-primary">{ch}</span>
          </span>
        ) : <span />}
        <button type="button" onClick={onReport} className="flex shrink-0 items-center gap-1 text-unjong-muted hover:text-red-500">
          <Siren size={13} /> 신고 {a.report_count}
        </button>
      </div>
      {a.verified_owner && linkUrl ? (
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
          <a href={linkUrl} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center justify-center gap-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white">
            연결링크 바로가기 <ExternalLink size={13} />
          </a>
        </div>
      ) : null}
      {!a.channel_id && a.biz_links && a.biz_links.length > 0 ? (
        <div className="mt-3 border-t border-unjong-border pt-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-unjong-muted">
            업체 제공 <span className="rounded bg-unjong-background px-1 py-0.5 text-[10px] font-normal">업체가 직접 등록</span>
          </div>
          <div className="space-y-1.5">
            {a.biz_links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-2 rounded-lg border border-unjong-border px-3 py-2 text-xs transition-colors hover:border-unjong-accent">
                <span className="shrink-0 rounded bg-unjong-background px-1.5 py-0.5 text-[10px] font-medium text-unjong-muted">{LINK_TYPE_LABEL[l.type] ?? l.type}</span>
                {l.is_paid ? <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">광고</span> : null}
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
    const t = setTimeout(async () => {
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
    return () => clearTimeout(t);
  }, [view, dir, page, q]);

  useEffect(() => {
    if (!loginNotice) return;
    const t = setTimeout(() => setLoginNotice(false), 3000);
    return () => clearTimeout(t);
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
      if (!r.ok) throw new Error(j.error ?? '제출 실패');
      setReportDone(true);
    } catch (e) {
      setReportError(e instanceof Error ? e.message : '제출 실패');
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
      <p className="mb-3 rounded-lg border border-unjong-border bg-unjong-background px-3 py-2 text-[11px] leading-relaxed text-unjong-muted">
        출처: 금융감독원 '파인'(매일 갱신). <strong className="text-unjong-primary">'신고'는 안전 보증·인증이 아닙니다.</strong> 트릴리언은 안전성·수익성을 보증하지 않고 사실만 제공합니다. 신고 안 된 익명 리딩방은 특히 주의.
      </p>

      {/* 검색 (맨 위) */}
      <div className="relative mb-2">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="리딩방명·업체명·대표자 전체 검색"
          className="w-full rounded-lg border border-unjong-border bg-unjong-surface py-2.5 pl-9 pr-3 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
        />
      </div>

      {/* 컨트롤 줄 — 좌: 뷰 탭(각 ↕), 우: 등록·관리 */}
      <div className="mb-2 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {VIEW_TABS.map((t) => {
            const active = view === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => selectView(t.key)}
                className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  active ? 'border-unjong-accent bg-unjong-accent/10 text-unjong-accent' : 'border-unjong-border text-unjong-muted hover:text-unjong-primary'
                }`}
              >
                {t.label} {tabArrow(active)}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => { if (!isLoggedIn) { setLoginNotice(true); return; } router.push('/business'); }}
          className="shrink-0 rounded-lg border border-unjong-accent px-3 py-1.5 text-xs font-semibold text-unjong-accent transition-colors hover:bg-unjong-accent hover:text-white"
        >
          리딩방 등록·관리
        </button>
      </div>

      {loginNotice ? (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span>로그인 후 이용할 수 있어요.</span>
          <a href="/auth/login" className="font-semibold underline">로그인</a>
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
              <p className="py-10 text-center text-sm text-unjong-muted">검색 결과가 없습니다. 신고되지 않은 업체일 수 있으니 주의하세요.</p>
            ) : view === 'verified' ? (
              <div className="mt-2 rounded-xl border border-unjong-border bg-unjong-surface p-6 text-center">
                <p className="text-sm font-semibold text-unjong-primary">아직 인증된 리딩방이 없어요.</p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-unjong-muted">본인 리딩방이세요? 금감원 유사투자자문 신고 + 운영자 인증을 마치면 <b className="text-unjong-accent">무료로 게재</b>돼요.</p>
                <button
                  type="button"
                  onClick={() => { if (!isLoggedIn) { setLoginNotice(true); return; } router.push('/business'); }}
                  className="mt-4 inline-flex items-center gap-1 rounded-lg bg-unjong-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  리딩방 등록·관리 <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-unjong-muted">등록된 곳이 없습니다.</p>
            )
          ) : (
            <>
              <div className="grid grid-cols-[1.75rem_1.5fr_1fr_4.5rem] items-center gap-2 border-b border-l-2 border-l-transparent border-b-unjong-border px-2 py-1.5 text-[11px] font-medium text-unjong-muted">
                <span className="text-center">#</span>
                <span>등록업체명</span>
                <span>채널명</span>
                <span className="text-right">관심</span>
              </div>
              <ul>
              {results.map((a, i) => {
                const n = (page - 1) * PAGE_SIZE + i + 1;
                const isSel = selected ? rowKey(selected) === rowKey(a) : false;
                const ch = channelOf(a);
                return (
                  <Fragment key={rowKey(a)}>
                    {i % AD_EVERY === 0 ? <li><AdSlotRow slot="room" /></li> : null}
                    <li
                    className={`group grid grid-cols-[1.75rem_1.5fr_1fr_4.5rem] items-center gap-2 border-b border-b-unjong-border border-l-2 px-2 py-2.5 transition-colors hover:bg-unjong-background ${
                      isSel ? 'border-l-unjong-accent bg-unjong-background' : 'border-l-transparent'
                    }`}
                  >
                    <span className="text-center text-sm font-bold text-unjong-muted">{n}</span>
                    <button type="button" onClick={() => setSelected(a)} className="flex min-w-0 items-center gap-1.5 text-left">
                      <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{a.company_name}</span>
                      {a.source === 'fss' ? <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="유사투자자문 신고" /> : null}
                    </button>
                    <button type="button" onClick={() => setSelected(a)} className="flex min-w-0 items-center gap-1 text-left text-xs">
                      {ch ? (
                        <>
                          <UserCheck size={12} className="shrink-0 text-unjong-accent" aria-label="운영자 인증" />
                          <span className="truncate text-unjong-primary">{ch}</span>
                        </>
                      ) : (
                        <span className="text-unjong-muted">—</span>
                      )}
                    </button>
                    <span className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFav(a)}
                        aria-label={favs.has(a.biz_no) ? '즐겨찾기 해제' : '즐겨찾기'}
                        title="관심(즐겨찾기)"
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
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="flex h-8 w-8 items-center justify-center rounded-md border border-unjong-border text-unjong-muted hover:border-unjong-accent disabled:opacity-40" aria-label="이전">
                <ChevronLeft size={15} />
              </button>
              {pageNumbers().map((p, idx) =>
                p === '…' ? (
                  <span key={`e${idx}`} className="px-1 text-xs text-unjong-muted">…</span>
                ) : (
                  <button key={p} type="button" onClick={() => setPage(p)} className={`h-8 min-w-[2rem] rounded-md px-2 text-sm font-medium transition-colors ${p === page ? 'bg-unjong-primary text-white' : 'border border-unjong-border text-unjong-muted hover:border-unjong-accent'}`}>
                    {p}
                  </button>
                )
              )}
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="flex h-8 w-8 items-center justify-center rounded-md border border-unjong-border text-unjong-muted hover:border-unjong-accent disabled:opacity-40" aria-label="다음">
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
              <p className="py-12 text-center text-xs leading-relaxed text-unjong-muted">왼쪽에서 리딩방을 선택하면<br />여기에 금감원 정보가 표시됩니다.</p>
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
                <h3 className="text-sm font-bold text-unjong-primary">신고하기</h3>
                <p className="mt-0.5 truncate text-xs text-unjong-muted">{roomNameOf(reporting)}</p>
              </div>
              <button type="button" onClick={() => setReporting(null)} aria-label="닫기" className="text-unjong-muted hover:text-unjong-primary">
                <X size={18} />
              </button>
            </div>

            {reportDone ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-unjong-primary">신고가 접수되었습니다.</p>
                <p className="mt-1 text-xs text-unjong-muted">확인 후 필요 시 금융감독원에 전달됩니다.</p>
                <button type="button" onClick={() => setReporting(null)} className="mt-4 rounded-lg bg-unjong-primary px-4 py-2 text-sm font-semibold text-white">닫기</button>
              </div>
            ) : (
              <>
                <label className="mb-1 block text-xs font-medium text-unjong-muted">신고 사유</label>
                <div className="mb-3">
                  <SelectDropdown
                    value={reportReason}
                    onChange={setReportReason}
                    options={REASONS.map((r) => ({ value: r, label: r }))}
                    placeholder="선택하세요"
                  />
                </div>
                <label className="mb-1 block text-xs font-medium text-unjong-muted">상세 내용 (선택)</label>
                <textarea value={reportContent} onChange={(e) => setReportContent(e.target.value)} rows={4} placeholder="구체적인 피해 내용·정황을 적어주세요." className="mb-1 w-full resize-none rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
                <p className="mb-3 text-[11px] leading-relaxed text-unjong-muted">신고는 접수 후 관리자 검토를 거쳐 공개에 반영됩니다. 허위 신고는 무고가 될 수 있으니 사실에 근거해 작성해주세요.</p>
                {reportError ? <p className="mb-2 text-xs text-red-500">{reportError}</p> : null}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setReporting(null)} className="flex-1 rounded-lg border border-unjong-border py-2 text-sm font-medium text-unjong-muted hover:bg-unjong-background">취소</button>
                  <button type="button" onClick={submitReport} disabled={!reportReason || reportSubmitting} className="flex-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white disabled:opacity-50">{reportSubmitting ? '제출 중…' : '신고하기'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

    </section>
  );
}
