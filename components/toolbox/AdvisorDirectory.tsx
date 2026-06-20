'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Search, Siren, X, ChevronLeft, ChevronRight, ShieldCheck, Heart, Globe } from 'lucide-react';
import RoomSubmitModal from './RoomSubmitModal';

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
  like_count: number;
  report_count: number;
  platform: string;
  liked: boolean;
};

const REASONS = ['허위·과장 수익률', '환불 거부', '미등록·사칭 의심', '리딩방 먹튀(잠적)', '불법 추천·미신고 자문', '기타'];
const PAGE_SIZE = 100;
const PLATFORMS = [['all', '전체'], ['telegram', '텔레그램'], ['kakao', '카카오톡'], ['naver', '네이버'], ['etc', '기타']] as const;
const SORTS = [['name_asc', '가나다 오름차순'], ['name_desc', '가나다 내림차순'], ['popular', '추천순']] as const;
type PlatformKey = 'all' | 'telegram' | 'kakao' | 'naver' | 'etc';
type SortKey = 'name_asc' | 'name_desc' | 'popular';

function fav(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}
function faviconFor(p: string, homepage: string | null): string | null {
  if (p === 'telegram') return fav('telegram.org');
  if (p === 'kakao') return fav('kakaocorp.com');
  if (p === 'naver') return fav('naver.com');
  if (homepage) {
    try { return fav(new URL(homepage).hostname); } catch { return null; }
  }
  return null;
}
function platformLabel(p: string): string {
  return p === 'telegram' ? '텔레그램' : p === 'kakao' ? '카카오톡' : p === 'naver' ? '네이버' : '기타';
}
function roomNameOf(a: Advisor): string {
  return (a.info_name && a.info_name.trim()) || a.company_name;
}

function PreviewBody({ a, onLike, onReport }: { a: Advisor; onLike: () => void; onReport: () => void }) {
  const ic = faviconFor(a.platform, a.homepage);
  const roomName = roomNameOf(a);
  const rows: [string, string | null][] = [
    ['등록업체', a.company_name],
    ['대표', a.representative],
    ['주소', a.address],
    ['신고기간', `${a.valid_from ?? '—'} ~ ${a.valid_to ?? '—'}`],
  ];
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {ic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ic} alt="" width={20} height={20} className="h-5 w-5 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
        ) : <Globe size={18} className="text-unjong-muted" />}
        <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-unjong-primary">{roomName}</h3>
      </div>
      <div className="mb-3 inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
        <ShieldCheck size={12} /> 금감원 등록 · {platformLabel(a.platform)}
      </div>
      <dl className="space-y-1.5 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="w-14 shrink-0 text-unjong-muted">{k}</dt>
            <dd className="min-w-0 flex-1 text-unjong-primary">{v || '—'}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-center gap-3 text-xs">
        <button type="button" onClick={onLike} className={`flex items-center gap-1 ${a.liked ? 'text-red-500' : 'text-unjong-muted hover:text-red-500'}`}>
          <Heart size={13} className={a.liked ? 'fill-red-500' : ''} /> {a.like_count}
        </button>
        <button type="button" onClick={onReport} className="flex items-center gap-1 text-unjong-muted hover:text-red-500">
          <Siren size={13} /> 신고 {a.report_count}
        </button>
      </div>
      {a.homepage ? (
        <a href={a.homepage} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white">
          바로가기 <ExternalLink size={13} />
        </a>
      ) : null}
    </div>
  );
}

export default function AdvisorDirectory({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [platform, setPlatform] = useState<PlatformKey>('all');
  const [sort, setSort] = useState<SortKey>('name_asc');
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');

  const [results, setResults] = useState<Advisor[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Advisor | null>(null);
  const [loginNotice, setLoginNotice] = useState(false);
  const [registering, setRegistering] = useState(false);

  const [reporting, setReporting] = useState<Advisor | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportError, setReportError] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => { setPage(1); }, [platform, sort, q]);
  useEffect(() => { setSelected(null); }, [platform, sort, q, page]);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/advisors?platform=${platform}&sort=${sort}&page=${page}&q=${encodeURIComponent(q)}`);
        const j = await r.json();
        setResults(j.results ?? []);
        setTotal(j.total ?? 0);
        setSearching(!!j.searching);
      } catch {
        setResults([]); setTotal(0);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [platform, sort, page, q]);

  useEffect(() => {
    if (!loginNotice) return;
    const t = setTimeout(() => setLoginNotice(false), 3000);
    return () => clearTimeout(t);
  }, [loginNotice]);

  async function toggleLike(a: Advisor) {
    if (!isLoggedIn) { setLoginNotice(true); return; }
    const wasLiked = a.liked;
    const apply = (liked: boolean, delta: number) => {
      setResults((prev) => prev.map((x) => x.biz_no === a.biz_no ? { ...x, liked, like_count: x.like_count + delta } : x));
      setSelected((s) => (s && s.biz_no === a.biz_no ? { ...s, liked, like_count: s.like_count + delta } : s));
    };
    apply(!wasLiked, wasLiked ? -1 : 1);
    try {
      const r = await fetch('/api/likes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: a.biz_no, target_type: 'fss_advisor' }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'fail');
      setResults((prev) => prev.map((x) => x.biz_no === a.biz_no ? { ...x, liked: j.liked, like_count: j.count } : x));
      setSelected((s) => (s && s.biz_no === a.biz_no ? { ...s, liked: j.liked, like_count: j.count } : s));
    } catch {
      apply(wasLiked, wasLiked ? 1 : -1);
      setLoginNotice(true);
    }
  }

  function openReport(a: Advisor) {
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
      const id = reporting.biz_no;
      setResults((prev) => prev.map((x) => x.biz_no === id ? { ...x, report_count: x.report_count + 1 } : x));
      setSelected((s) => (s && s.biz_no === id ? { ...s, report_count: s.report_count + 1 } : s));
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

  return (
    <section className="min-w-0">
      <p className="mb-3 rounded-lg border border-unjong-border bg-unjong-background px-3 py-2 text-[11px] leading-relaxed text-unjong-muted">
        출처: 금융감독원 '파인'(매일 갱신). <strong className="text-unjong-primary">'신고'는 안전 보증·인증이 아닙니다.</strong> 운종은 안전성·수익성을 보증하지 않고 사실만 제공합니다. 신고 안 된 익명 리딩방은 특히 주의.
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

      {/* 컨트롤 줄 — 본문과 동일 칼럼 구조(리스트폭 + 미리보기폭). 정렬·등록을 카드 오른쪽 끝에 맞춤. */}
      <div className="mb-2 flex gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex gap-1 overflow-x-auto">
            {PLATFORMS.map(([p, label]) => (
              <button
                key={p}
                type="button"
                onClick={() => { setQ(''); setPlatform(p); }}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  platform === p && !searching ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {SORTS.map(([s, label]) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  sort === s ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => { if (!isLoggedIn) { setLoginNotice(true); return; } setRegistering(true); }}
            className="ml-auto shrink-0 rounded-lg border border-unjong-accent px-3 py-1.5 text-xs font-semibold text-unjong-accent transition-colors hover:bg-unjong-accent hover:text-white"
          >
            + 리딩방 등록
          </button>
        </div>
        <div className="hidden w-72 shrink-0 lg:block" />
      </div>

      {loginNotice ? (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span>좋아요는 로그인 후 이용할 수 있어요.</span>
          <a href="/auth/login" className="font-semibold underline">로그인</a>
        </div>
      ) : null}

      {/* 본문: 리스트 + 미리보기 */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          {loading ? (
            <p className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</p>
          ) : results.length === 0 ? (
            <p className="py-10 text-center text-sm text-unjong-muted">
              {searching ? '검색 결과가 없습니다. 신고되지 않은 업체일 수 있으니 주의하세요.' : '이 플랫폼에 등록된 곳이 없습니다.'}
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((a, i) => {
                const n = (page - 1) * PAGE_SIZE + i + 1;
                const icon = faviconFor(a.platform, a.homepage);
                const isSel = selected?.biz_no === a.biz_no;
                return (
                  <li
                    key={a.biz_no}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                      isSel ? 'border-unjong-accent bg-unjong-background' : 'border-unjong-border'
                    }`}
                  >
                    <button type="button" onClick={() => setSelected(a)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      <span className="w-6 shrink-0 text-center text-xs font-bold text-unjong-muted">{n}</span>
                      {icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={icon} alt="" width={16} height={16} className="h-4 w-4 shrink-0 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
                      ) : <Globe size={14} className="shrink-0 text-unjong-muted" />}
                      <span className="truncate text-sm font-semibold text-unjong-primary">{roomNameOf(a)}</span>
                      <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="금감원 등록" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLike(a)}
                      aria-label="좋아요"
                      className={`flex shrink-0 items-center gap-0.5 text-xs ${a.liked ? 'text-red-500' : 'text-unjong-muted hover:text-red-500'}`}
                    >
                      <Heart size={13} className={a.liked ? 'fill-red-500' : ''} /> {a.like_count}
                    </button>
                    <button
                      type="button"
                      onClick={() => openReport(a)}
                      title="신고하기"
                      aria-label="신고하기"
                      className="flex shrink-0 items-center gap-0.5 text-xs text-unjong-muted hover:text-red-500"
                    >
                      <Siren size={13} /> {a.report_count > 0 ? a.report_count : ''}
                    </button>
                    {a.homepage ? (
                      <a
                        href={a.homepage}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        title="바로가기"
                        className="flex shrink-0 items-center rounded-md border border-unjong-border px-2 py-1 text-xs text-unjong-muted transition-colors hover:border-unjong-accent hover:text-unjong-accent"
                      >
                        <ExternalLink size={12} />
                      </a>
                    ) : null}
                  </li>
                );
              })}
            </ul>
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
              <PreviewBody a={selected} onLike={() => toggleLike(selected)} onReport={() => openReport(selected)} />
            ) : (
              <p className="py-12 text-center text-xs leading-relaxed text-unjong-muted">왼쪽에서 리딩방을 선택하면<br />여기에 금감원 정보가 표시됩니다.</p>
            )}
          </div>
        </aside>
      </div>

      {/* 미리보기 (모바일 하단 시트) */}
      {selected ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40 lg:hidden">
          <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl border-t border-unjong-border bg-unjong-surface p-4">
            <div className="mb-1 flex justify-end">
              <button type="button" onClick={() => setSelected(null)} aria-label="닫기" className="text-unjong-muted hover:text-unjong-primary">
                <X size={18} />
              </button>
            </div>
            <PreviewBody a={selected} onLike={() => toggleLike(selected)} onReport={() => openReport(selected)} />
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
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="mb-3 w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent">
                  <option value="">선택하세요</option>
                  {REASONS.map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
                <label className="mb-1 block text-xs font-medium text-unjong-muted">상세 내용 (선택)</label>
                <textarea value={reportContent} onChange={(e) => setReportContent(e.target.value)} rows={4} placeholder="구체적인 피해 내용·정황을 적어주세요." className="mb-1 w-full resize-none rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
                <p className="mb-3 text-[11px] leading-relaxed text-unjong-muted">허위 신고는 무고가 될 수 있습니다. 사실에 근거해 작성해주세요. (로그인·본인확인은 추후 적용 예정)</p>
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

      {/* 내 리딩방 등록 모달 */}
      {registering ? <RoomSubmitModal onClose={() => setRegistering(false)} /> : null}
    </section>
  );
}
