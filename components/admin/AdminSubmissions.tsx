'use client';

import { useState } from 'react';

type Submission = { id: number; room_name: string; company_name: string | null; platform: string; homepage: string; fss_matched: boolean; status: string; created_at: string };

function fmt(ts: string) {
  return new Date(ts).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}
const STATUS_LABEL: Record<string, string> = { pending: '대기', public: '공개', rejected: '반려' };

export default function AdminSubmissions({ initial }: { initial: Submission[] }) {
  const [subs, setSubs] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);

  async function setAction(id: number, action: 'approve' | 'reject') {
    setBusy(id);
    try {
      const r = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!r.ok) throw new Error();
      setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, status: action === 'approve' ? 'public' : 'rejected' } : s)));
    } catch {
      alert('처리 실패');
    } finally {
      setBusy(null);
    }
  }

  if (subs.length === 0) {
    return <p className="rounded-lg border border-unjong-border bg-unjong-surface p-6 text-center text-sm text-unjong-muted">아직 등록이 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-unjong-border">
      <table className="w-full text-sm">
        <thead className="bg-unjong-background text-xs text-unjong-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium">접수</th>
            <th className="px-3 py-2 text-left font-medium">리딩방명</th>
            <th className="px-3 py-2 text-left font-medium">업체명</th>
            <th className="px-3 py-2 text-left font-medium">플랫폼</th>
            <th className="px-3 py-2 text-left font-medium">FSS대조</th>
            <th className="px-3 py-2 text-left font-medium">링크</th>
            <th className="px-3 py-2 text-left font-medium">상태</th>
            <th className="px-3 py-2 text-left font-medium">처리</th>
          </tr>
        </thead>
        <tbody>
          {subs.map((s) => (
            <tr key={s.id} className="border-t border-unjong-border align-top">
              <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{fmt(s.created_at)}</td>
              <td className="px-3 py-2 font-medium text-unjong-primary">{s.room_name}</td>
              <td className="px-3 py-2 text-unjong-primary">{s.company_name || '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-unjong-muted">{s.platform}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">{s.fss_matched ? '✅ 일치' : '—'}</td>
              <td className="max-w-[200px] truncate px-3 py-2 text-xs">
                <a href={s.homepage} target="_blank" rel="noopener noreferrer nofollow" className="text-unjong-accent hover:underline">{s.homepage}</a>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">
                <span className={s.status === 'public' ? 'font-semibold text-emerald-600' : s.status === 'rejected' ? 'text-unjong-muted line-through' : 'font-medium text-amber-600'}>
                  {STATUS_LABEL[s.status] ?? s.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                <div className="flex gap-1">
                  <button type="button" disabled={busy === s.id || s.status === 'public'} onClick={() => setAction(s.id, 'approve')} className="rounded-md border border-emerald-500/40 px-2 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-40">승인</button>
                  <button type="button" disabled={busy === s.id || s.status === 'rejected'} onClick={() => setAction(s.id, 'reject')} className="rounded-md border border-unjong-border px-2 py-1 text-xs font-medium text-unjong-muted transition-colors hover:bg-unjong-background disabled:opacity-40">반려</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
