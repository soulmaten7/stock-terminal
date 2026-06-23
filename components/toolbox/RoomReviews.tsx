'use client';

import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';

type Review = { id: number; rating: number; content: string | null; created_at: string; nickname: string; mine: boolean };
type Mine = { id: number; rating: number; content: string | null } | null;

const REPORT_REASONS = ['욕설·비방', '허위·사실무근', '광고·스팸', '도배·중복', '기타'];

function timeAgo(s: string): string {
  const t = new Date(s).getTime();
  if (!t) return '';
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function Stars({ value, onPick, size = 14 }: { value: number; onPick?: (n: number) => void; size?: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onPick}
          onClick={() => onPick?.(n)}
          className={onPick ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${n}점`}
        >
          <Star size={size} className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-unjong-border'} />
        </button>
      ))}
    </span>
  );
}

export default function RoomReviews({ bizNo, isLoggedIn, onRequireLogin }: { bizNo: string; isLoggedIn: boolean; onRequireLogin: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [mine, setMine] = useState<Mine>(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [reportingId, setReportingId] = useState<number | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<number>>(new Set());

  async function sendReport(reviewId: number, reason: string) {
    setReportingId(null);
    setReportedIds((s) => new Set(s).add(reviewId));
    try {
      await fetch('/api/reviews/report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId, reason }),
      });
    } catch { /* 낙관적 유지 */ }
  }

  async function load() {
    setLoading(true);
    try {
      const j = await (await fetch(`/api/reviews?target_id=${encodeURIComponent(bizNo)}`)).json();
      setReviews(j.reviews ?? []);
      setAvg(j.avg ?? 0);
      setCount(j.count ?? 0);
      setMine(j.mine ?? null);
      if (j.mine) { setRating(j.mine.rating); setContent(j.mine.content ?? ''); }
      else { setRating(0); setContent(''); }
    } catch {
      setReviews([]); setAvg(0); setCount(0); setMine(null);
    } finally {
      setLoading(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setOpen(false); load(); }, [bizNo]);

  async function submit() {
    if (!isLoggedIn) { onRequireLogin(); return; }
    if (!(rating >= 1 && rating <= 5)) return;
    setSubmitting(true);
    try {
      const r = await fetch('/api/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: bizNo, target_type: 'fss_advisor', rating, content }),
      });
      if (!r.ok) throw new Error();
      setOpen(false);
      await load();
    } catch {
      onRequireLogin();
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!mine) return;
    setSubmitting(true);
    try {
      await fetch('/api/reviews', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: mine.id }) });
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 border-t border-unjong-border pt-3">
      {/* 평균 (②) */}
      <div className="mb-2 flex items-center gap-2">
        <Stars value={Math.round(avg)} />
        <span className="text-sm font-bold text-unjong-primary">{avg ? avg.toFixed(1) : '-'}</span>
        <span className="text-xs text-unjong-muted">· 리뷰 {count}</span>
        {!open ? (
          <button type="button" onClick={() => { if (!isLoggedIn) { onRequireLogin(); return; } setOpen(true); }} className="ml-auto text-xs font-semibold text-unjong-accent">
            {mine ? '내 리뷰 수정' : '리뷰 쓰기'}
          </button>
        ) : null}
      </div>

      {/* 작성 (③) */}
      {open ? (
        <div className="mb-3 rounded-lg border border-unjong-border p-2.5">
          <div className="mb-2 flex items-center gap-2">
            <Stars value={rating} onPick={setRating} size={18} />
            <span className="text-xs text-unjong-muted">{rating ? `${rating}점` : '별점 선택'}</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="경험을 남겨주세요 (선택)"
            className="w-full resize-none rounded-lg border border-unjong-border bg-unjong-surface px-2.5 py-2 text-xs text-unjong-primary outline-none focus:border-unjong-accent"
          />
          <div className="mt-2 flex items-center gap-2">
            {mine ? (
              <button type="button" onClick={remove} disabled={submitting} className="mr-auto flex items-center gap-1 text-xs text-unjong-muted hover:text-red-500">
                <Trash2 size={13} /> 삭제
              </button>
            ) : null}
            <button type="button" onClick={() => setOpen(false)} className="ml-auto rounded-lg border border-unjong-border px-3 py-1.5 text-xs font-medium text-unjong-muted hover:bg-unjong-background">취소</button>
            <button type="button" onClick={submit} disabled={!rating || submitting} className="rounded-lg bg-unjong-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{submitting ? '저장 중…' : '등록'}</button>
          </div>
        </div>
      ) : null}

      {/* 목록 (④) */}
      {loading ? (
        <p className="py-3 text-center text-xs text-unjong-muted">리뷰 불러오는 중…</p>
      ) : reviews.length === 0 ? (
        <p className="py-3 text-center text-xs text-unjong-muted">아직 리뷰가 없어요. 첫 리뷰를 남겨보세요.</p>
      ) : (
        <ul className="space-y-2">
          {reviews.map((rv) => (
            <li key={rv.id} className="border-t border-unjong-border pt-2 first:border-0 first:pt-0">
              <div className="flex items-center gap-1.5">
                <Stars value={rv.rating} size={12} />
                <span className="text-xs font-semibold text-unjong-primary">{rv.nickname}{rv.mine ? ' (나)' : ''}</span>
                <span className="ml-auto text-[11px] text-unjong-muted">{timeAgo(rv.created_at)}</span>
              </div>
              {rv.content ? <p className="mt-1 text-xs leading-relaxed text-unjong-muted">{rv.content}</p> : null}
              {!rv.mine ? (
                reportedIds.has(rv.id) ? (
                  <span className="mt-1 inline-block text-[11px] text-unjong-muted">신고됨</span>
                ) : reportingId === rv.id ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {REPORT_REASONS.map((rs) => (
                      <button key={rs} type="button" onClick={() => sendReport(rv.id, rs)} className="rounded-md border border-unjong-border px-1.5 py-0.5 text-[11px] text-unjong-muted transition-colors hover:border-red-400 hover:text-red-500">{rs}</button>
                    ))}
                    <button type="button" onClick={() => setReportingId(null)} className="px-1 text-[11px] text-unjong-muted">취소</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => { if (!isLoggedIn) { onRequireLogin(); return; } setReportingId(rv.id); }} className="mt-1 text-[11px] text-unjong-muted hover:text-red-500">신고</button>
                )
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
