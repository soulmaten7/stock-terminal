'use client';

import { useState } from 'react';

type Report = { id: number; target_name: string; reason: string; content: string | null; status: string; created_at: string };

function fmt(ts: string) {
  return new Date(ts).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}

const STATUS_LABEL: Record<string, string> = { pending: '대기', confirmed: '확인됨', dismissed: '기각됨' };

const ADMIN_PAGE_SIZE = 50;

export default function AdminReports({ initial }: { initial: Report[] }) {
  const [reports, setReports] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(reports.length / ADMIN_PAGE_SIZE));
  const pageReports = reports.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);

  async function setStatus(id: number, status: string) {
    setBusy(id);
    try {
      const r = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!r.ok) throw new Error();
      setReports((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch {
      alert('처리 실패');
    } finally {
      setBusy(null);
    }
  }

  if (reports.length === 0) {
    return <p className="rounded-lg border border-unjong-border bg-unjong-surface p-6 text-center text-sm text-unjong-muted">아직 신고가 없습니다.</p>;
  }

  return (
    <>
    <div className="overflow-x-auto rounded-lg border border-unjong-border">
      <table className="w-full text-sm">
        <thead className="bg-unjong-background text-xs text-unjong-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium">접수</th>
            <th className="px-3 py-2 text-left font-medium">대상</th>
            <th className="px-3 py-2 text-left font-medium">사유</th>
            <th className="px-3 py-2 text-left font-medium">내용</th>
            <th className="px-3 py-2 text-left font-medium">상태</th>
            <th className="px-3 py-2 text-left font-medium">처리</th>
          </tr>
        </thead>
        <tbody>
          {pageReports.map((r) => (
            <tr key={r.id} className="border-t border-unjong-border align-top">
              <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{fmt(r.created_at)}</td>
              <td className="px-3 py-2 font-medium text-unjong-primary">{r.target_name}</td>
              <td className="whitespace-nowrap px-3 py-2 text-unjong-primary">{r.reason}</td>
              <td className="px-3 py-2 text-unjong-muted">{r.content || '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">
                <span className={r.status === 'confirmed' ? 'font-semibold text-emerald-400' : r.status === 'dismissed' ? 'text-unjong-muted line-through' : 'font-medium text-amber-400'}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={busy === r.id || r.status === 'confirmed'}
                    onClick={() => setStatus(r.id, 'confirmed')}
                    className="rounded-md border border-emerald-500/40 px-2 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-400/10 disabled:opacity-40"
                  >
                    확인
                  </button>
                  <button
                    type="button"
                    disabled={busy === r.id || r.status === 'dismissed'}
                    onClick={() => setStatus(r.id, 'dismissed')}
                    className="rounded-md border border-unjong-border px-2 py-1 text-xs font-medium text-unjong-muted transition-colors hover:bg-unjong-background disabled:opacity-40"
                  >
                    기각
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {totalPages > 1 ? (
      <div className="mt-3 flex items-center justify-center gap-3 text-sm">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-md border border-unjong-border px-3 py-1 text-unjong-muted transition-colors hover:border-unjong-accent disabled:opacity-40">이전</button>
        <span className="text-xs text-unjong-muted">{page} / {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-md border border-unjong-border px-3 py-1 text-unjong-muted transition-colors hover:border-unjong-accent disabled:opacity-40">다음</button>
      </div>
    ) : null}
    </>
  );
}
