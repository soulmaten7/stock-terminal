'use client';

import { useState } from 'react';

type Review = { id: number; target_id: string; nickname: string | null; rating: number; content: string | null; status: string; report_count: number; created_at: string };

function fmt(ts: string) {
  return new Date(ts).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function AdminReviews({ initial }: { initial: Review[] }) {
  const [reviews, setReviews] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);

  async function setAction(id: number, action: 'hide' | 'show') {
    setBusy(id);
    try {
      const r = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!r.ok) throw new Error();
      setReviews((prev) => prev.map((x) => (x.id === id ? { ...x, status: action === 'hide' ? 'hidden' : 'visible' } : x)));
    } catch {
      alert('처리 실패');
    } finally {
      setBusy(null);
    }
  }

  if (reviews.length === 0) {
    return <p className="rounded-lg border border-unjong-border bg-unjong-surface p-6 text-center text-sm text-unjong-muted">아직 리뷰가 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-unjong-border">
      <table className="w-full text-sm">
        <thead className="bg-unjong-background text-xs text-unjong-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium">접수</th>
            <th className="px-3 py-2 text-left font-medium">작성자</th>
            <th className="px-3 py-2 text-left font-medium">별점</th>
            <th className="px-3 py-2 text-left font-medium">내용</th>
            <th className="px-3 py-2 text-left font-medium">신고</th>
            <th className="px-3 py-2 text-left font-medium">상태</th>
            <th className="px-3 py-2 text-left font-medium">처리</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id} className="border-t border-unjong-border align-top">
              <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{fmt(r.created_at)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-unjong-primary">{r.nickname || '익명'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-amber-500">{'★'.repeat(r.rating)}</td>
              <td className="px-3 py-2 text-unjong-muted">{r.content || '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">{r.report_count > 0 ? <span className="font-semibold text-red-500">{r.report_count}</span> : '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">
                <span className={r.status === 'hidden' ? 'text-unjong-muted line-through' : 'font-medium text-emerald-600'}>{r.status === 'hidden' ? '숨김' : '공개'}</span>
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {r.status === 'hidden' ? (
                  <button type="button" disabled={busy === r.id} onClick={() => setAction(r.id, 'show')} className="rounded-md border border-emerald-500/40 px-2 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-40">공개</button>
                ) : (
                  <button type="button" disabled={busy === r.id} onClick={() => setAction(r.id, 'hide')} className="rounded-md border border-red-400/50 px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40">숨김</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
