'use client';

import { useState } from 'react';

type BizClaim = { id: string; biz_no: string; company_name: string; contact: string | null; doc_signed: string | null; status: string; created_at: string };

function fmt(ts: string) {
  return new Date(ts).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}
const STATUS_LABEL: Record<string, string> = { pending: '대기', approved: '승인', rejected: '반려' };

export default function AdminBusinessClaims({ initial }: { initial: BizClaim[] }) {
  const [claims, setClaims] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function setAction(id: string, action: 'approve' | 'reject') {
    setBusy(id);
    try {
      const r = await fetch('/api/admin/business-claims', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!r.ok) throw new Error();
      setClaims((prev) => prev.map((c) => (c.id === id ? { ...c, status: action === 'approve' ? 'approved' : 'rejected' } : c)));
    } catch { alert('처리 실패'); }
    finally { setBusy(null); }
  }

  if (claims.length === 0) {
    return <p className="rounded-lg border border-unjong-border bg-unjong-surface p-6 text-center text-sm text-unjong-muted">아직 인증 신청이 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-unjong-border">
      <table className="w-full text-sm">
        <thead className="bg-unjong-background text-xs text-unjong-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium">접수</th>
            <th className="px-3 py-2 text-left font-medium">업체명</th>
            <th className="px-3 py-2 text-left font-medium">사업자번호</th>
            <th className="px-3 py-2 text-left font-medium">연락처</th>
            <th className="px-3 py-2 text-left font-medium">서류</th>
            <th className="px-3 py-2 text-left font-medium">상태</th>
            <th className="px-3 py-2 text-left font-medium">처리</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((c) => (
            <tr key={c.id} className="border-t border-unjong-border align-top">
              <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{fmt(c.created_at)}</td>
              <td className="px-3 py-2 font-medium text-unjong-primary">{c.company_name}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{c.biz_no}</td>
              <td className="px-3 py-2 text-xs text-unjong-primary">{c.contact || '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">
                {c.doc_signed ? <a href={c.doc_signed} target="_blank" rel="noopener noreferrer" className="text-unjong-accent hover:underline">서류 보기</a> : '—'}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">
                <span className={c.status === 'approved' ? 'font-semibold text-emerald-600' : c.status === 'rejected' ? 'text-unjong-muted line-through' : 'font-medium text-amber-600'}>
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                <div className="flex gap-1">
                  <button type="button" disabled={busy === c.id || c.status === 'approved'} onClick={() => setAction(c.id, 'approve')} className="rounded-md border border-emerald-500/40 px-2 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-40">승인</button>
                  <button type="button" disabled={busy === c.id || c.status === 'rejected'} onClick={() => setAction(c.id, 'reject')} className="rounded-md border border-unjong-border px-2 py-1 text-xs font-medium text-unjong-muted transition-colors hover:bg-unjong-background disabled:opacity-40">반려</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
