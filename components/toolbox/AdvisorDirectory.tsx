'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Search, Siren, X, ChevronLeft, ChevronRight, ShieldCheck, Heart } from 'lucide-react';

type Advisor = {
  biz_no: string;
  company_name: string;
  representative: string | null;
  valid_from: string | null;
  valid_to: string | null;
  homepage: string | null;
  phone: string | null;
  address: string | null;
  like_count: number;
  report_count: number;
  liked: boolean;
};

const REASONS = ['허위·과장 수익률', '환불 거부', '미등록·사칭 의심', '리딩방 먹튀(잠적)', '불법 추천·미신고 자문', '기타'];
const PAGE_SIZE = 100;
const SORTS = [['name_asc', '가나다 오름차순'], ['name_desc', '가나다 내림차순'], ['popular', '추천순']] as const;
type SortKey = 'name_asc' | 'name_desc' | 'popular';

function region(address: string | null): string {
  if (!address) return '';
  return address.split(' ').slice(0, 2).join(' ');
}

function platform(homepage: string | null): string | null {
  if (!homepage) return null;
  const h = homepage.toLowerCase();
  if (h.includes('t.me') || h.includes('telegram')) return '텔레그램';
  if (h.includes('cafe.naver') || h.includes('naver.me')) return '네이버카페';
  if (h.includes('band.us')) return '밴드';
  return '웹';
}

export default function AdvisorDirectory({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [mode, setMode] = useState<'rooms' | 'all'>('rooms');
  const [sort, setSort] = useState<SortKey>('name_asc');
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');

  const [results, setResults] = useState<Advisor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loginNotice, setLoginNotice] = useState(false);

  // 신고 모달
  const [reporting, setReporting] = useState<Advisor | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportError, setReportError] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => { setPage(1); }, [mode, sort, q]);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/advisors?mode=${mode}&sort=${sort}&page=${page}&q=${encodeURIComponent(q)}`);
        const j = await r.json();
        setResults(j.results ?? []);
        setTotal(j.total ?? 0);
      } catch {
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [mode, sort, page, q]);

  useEffect(() => {
    if (!loginNotice) return;
    const t = setTimeout(() => setLoginNotice(false), 3000);
    return () => clearTimeout(t);
  }, [loginNotice]);

  async function toggleLike(a: Advisor) {
    if (!isLoggedIn) { setLoginNotice(true); return; }
    const wasLiked = a.liked;
    setResults((prev) => prev.map((x) => x.biz_no === a.biz_no
      ? { ...x, liked: !wasLiked, like_count: x.like_count + (wasLiked ? -1 : 1) } : x));
    try {
      const r = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: a.biz_no, target_type: 'fss_advisor' }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'fail');
      setResults((prev) => prev.map((x) => x.biz_no === a.biz_no ? { ...x, liked: j.liked, like_count: j.count } : x));
    } catch {
      setResults((prev) => prev.map((x) => x.biz_no === a.biz_no
        ? { ...x, liked: wasLiked, like_count: x.like_count + (wasLiked ? 1 : -1) } : x));
      setLoginNotice(true);
    }
  }

  function openReport(a: Advisor) {
    setReporting(a);
    setReportReason('');
    setReportContent('');
    setReportDone(false);
    setReportError('');
  }

  async function submitReport() {
    if (!reporting || !reportReason) return;
    setReportSubmitting(true);
    setReportError('');
    try {
      const r = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'fss_advisor',
          target_id: reporting.biz_no,
          target_name: reporting.company_name,
          reason: reportReason,
          content: reportContent,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? '제출 실패');
      const id = reporting.biz_no;
      setResults((prev) => prev.map((x) => x.biz_no === id ? { ...x, report_count: x.report_count + 1 } : x));
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
      {/* 면책 배너 */}
      <div className="mb-3 rounded-xl border border-unjong-border bg-unjong-background p-3">
        <p className="text-sm font-bold text-unjong-primary">금융감독원 신고 유사투자자문·리딩방</p>
        <p className="mt-1 text-xs leading-relaxed text-unjong-muted">
          출처: 금융감독원 금융소비자포털 '파인' (매일 갱신).{' '}
          '신고'는 정부의 안전 보증·인증이 아닙니다. 운종은 어떤 업체의 안전성·수익성도 보증하지 않으며 사실만 제공합니다.{' '}
          <strong className="text-unjong-primary">신고되지 않은 익명 리딩방은 특히 주의</strong>하세요.
        </p>
      </div>

      {/* 모드 토글 */}
      <div className="mb-2 flex gap-1">
        {([['rooms', '리딩방·주식카페'], ['all', '전체 등록업체 조회']] as const).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              mode === m ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="relative mb-2">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={mode === 'rooms' ? '리딩방·카페 이름 검색' : '업체명 또는 대표자 검색'}
          className="w-full rounded-lg border border-unjong-border bg-unjong-surface py-2.5 pl-9 pr-3 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
        />
      </div>

      {/* 정렬 탭 */}
      <div className="mb-3 flex gap-1 overflow-x-auto">
        {SORTS.map(([s, label]) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
              sort === s ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loginNotice ? (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span>좋아요는 로그인 후 이용할 수 있어요.</span>
          <a href="/auth/login" className="font-semibold underline">로그인</a>
        </div>
      ) : null}

      <p className="mb-2 px-1 text-xs text-unjong-muted">
        {mode === 'rooms' ? '리딩방·주식카페' : '전체 등록업체'} {total.toLocaleString()}곳
        {totalPages > 1 ? ` · ${page}/${totalPages} 페이지` : ''}
      </p>

      {/* 결과 */}
      {loading ? (
        <p className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</p>
      ) : results.length === 0 ? (
        <p className="py-10 text-center text-sm text-unjong-muted">
          {q ? '검색 결과가 없습니다. 신고되지 않은 업체일 수 있으니 주의하세요.' : '표시할 항목이 없습니다.'}
        </p>
      ) : (
        <ul className="space-y-1">
          {results.map((a, i) => {
            const n = (page - 1) * PAGE_SIZE + i + 1;
            const pf = platform(a.homepage);
            return (
              <li key={a.biz_no} className="rounded-lg border border-unjong-border p-3">
                <div className="flex items-start gap-3">
                  <span className="w-7 shrink-0 pt-0.5 text-center text-sm font-bold text-unjong-muted">{n}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-unjong-primary">{a.company_name}</span>
                      <span className="inline-flex items-center gap-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-600">
                        <ShieldCheck size={11} /> 금감원 등록
                      </span>
                      {pf ? <span className="rounded border border-unjong-border px-1.5 py-0.5 text-[11px] text-unjong-muted">{pf}</span> : null}
                    </div>
                    <p className="mt-0.5 text-xs text-unjong-muted">
                      대표 {a.representative ?? '—'}
                      {region(a.address) ? ` · ${region(a.address)}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-unjong-muted">
                      신고기간 {a.valid_from ?? '—'} ~ {a.valid_to ?? '—'}
                      {a.phone ? ` · ☎ ${a.phone}` : ''}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleLike(a)}
                        aria-label="좋아요"
                        className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                          a.liked ? 'border-red-300 text-red-500' : 'border-unjong-border text-unjong-muted hover:border-red-300 hover:text-red-500'
                        }`}
                      >
                        <Heart size={12} className={a.liked ? 'fill-red-500' : ''} /> {a.like_count}
                      </button>
                      <button
                        type="button"
                        onClick={() => openReport(a)}
                        title="신고하기"
                        aria-label="신고하기"
                        className="flex items-center gap-1 rounded-md border border-unjong-border px-2 py-1 text-xs text-unjong-muted transition-colors hover:border-red-400 hover:text-red-500"
                      >
                        <Siren size={12} /> 신고{a.report_count > 0 ? ` ${a.report_count}` : ''}
                      </button>
                    </div>
                  </div>
                  {a.homepage ? (
                    <a
                      href={a.homepage}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="flex shrink-0 items-center gap-1 rounded-md border border-unjong-border px-2 py-1 text-xs text-unjong-muted transition-colors hover:border-unjong-accent hover:text-unjong-accent"
                    >
                      바로가기 <ExternalLink size={11} />
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-unjong-border text-unjong-muted hover:border-unjong-accent disabled:opacity-40"
            aria-label="이전"
          >
            <ChevronLeft size={15} />
          </button>
          {pageNumbers().map((p, idx) =>
            p === '…' ? (
              <span key={`e${idx}`} className="px-1 text-xs text-unjong-muted">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`h-8 min-w-[2rem] rounded-md px-2 text-sm font-medium transition-colors ${
                  p === page ? 'bg-unjong-primary text-white' : 'border border-unjong-border text-unjong-muted hover:border-unjong-accent'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-unjong-border text-unjong-muted hover:border-unjong-accent disabled:opacity-40"
            aria-label="다음"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      ) : null}

      {/* 신고 모달 */}
      {reporting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-unjong-border bg-unjong-surface p-4 shadow-xl">
            <div className="mb-3 flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-unjong-primary">신고하기</h3>
                <p className="mt-0.5 truncate text-xs text-unjong-muted">{reporting.company_name}</p>
              </div>
              <button type="button" onClick={() => setReporting(null)} aria-label="닫기" className="text-unjong-muted hover:text-unjong-primary">
                <X size={18} />
              </button>
            </div>

            {reportDone ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-unjong-primary">신고가 접수되었습니다.</p>
                <p className="mt-1 text-xs text-unjong-muted">확인 후 필요 시 금융감독원에 전달됩니다.</p>
                <button type="button" onClick={() => setReporting(null)} className="mt-4 rounded-lg bg-unjong-primary px-4 py-2 text-sm font-semibold text-white">
                  닫기
                </button>
              </div>
            ) : (
              <>
                <label className="mb-1 block text-xs font-medium text-unjong-muted">신고 사유</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="mb-3 w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
                >
                  <option value="">선택하세요</option>
                  {REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <label className="mb-1 block text-xs font-medium text-unjong-muted">상세 내용 (선택)</label>
                <textarea
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  rows={4}
                  placeholder="구체적인 피해 내용·정황을 적어주세요."
                  className="mb-1 w-full resize-none rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
                />
                <p className="mb-3 text-[11px] leading-relaxed text-unjong-muted">
                  허위 신고는 무고가 될 수 있습니다. 사실에 근거해 작성해주세요. (로그인·본인확인은 추후 적용 예정)
                </p>

                {reportError ? <p className="mb-2 text-xs text-red-500">{reportError}</p> : null}

                <div className="flex gap-2">
                  <button type="button" onClick={() => setReporting(null)} className="flex-1 rounded-lg border border-unjong-border py-2 text-sm font-medium text-unjong-muted hover:bg-unjong-background">
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={submitReport}
                    disabled={!reportReason || reportSubmitting}
                    className="flex-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {reportSubmitting ? '제출 중…' : '신고하기'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
