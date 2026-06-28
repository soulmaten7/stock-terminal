'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

type Fss = { biz_no: string; company_name: string; representative: string | null; phone: string | null; valid_from: string | null; valid_to: string | null; address: string | null };

export default function AdminFssLookup() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Fss[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function run() {
    const query = q.trim();
    if (query.length < 2) return;
    setLoading(true); setSearched(true);
    try {
      const r = await fetch(`/api/business/search?q=${encodeURIComponent(query)}`);
      const j = await r.json();
      setResults(j.results ?? []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }

  return (
    <div className="rounded-lg border border-unjong-border bg-unjong-surface p-4">
      <div className="relative mb-3">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
          placeholder="사업자번호 또는 업체명으로 금감원 신고 조회 (하이픈 무관)"
          className="w-full rounded-lg border border-unjong-border bg-unjong-surface py-2.5 pl-9 pr-20 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
        />
        <button type="button" onClick={run} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-unjong-primary px-3 py-1.5 text-xs font-semibold text-white">조회</button>
      </div>
      {loading ? (
        <p className="py-4 text-center text-sm text-unjong-muted">조회 중…</p>
      ) : searched && results.length === 0 ? (
        <p className="py-4 text-center text-sm text-unjong-muted">금감원 신고 목록에 없습니다. <b className="text-amber-600">미신고 — 게재 불가</b></p>
      ) : results.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-unjong-border">
          <table className="w-full text-sm">
            <thead className="bg-unjong-background text-xs text-unjong-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">업체명</th>
                <th className="px-3 py-2 text-left font-medium">사업자번호</th>
                <th className="px-3 py-2 text-left font-medium">대표</th>
                <th className="px-3 py-2 text-left font-medium">연락처</th>
                <th className="px-3 py-2 text-left font-medium">신고기간</th>
              </tr>
            </thead>
            <tbody>
              {results.map((f) => (
                <tr key={f.biz_no} className="border-t border-unjong-border">
                  <td className="px-3 py-2 font-medium text-unjong-primary">{f.company_name}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{f.biz_no}</td>
                  <td className="px-3 py-2 text-xs text-unjong-primary">{f.representative || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{f.phone || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{f.valid_from ?? '—'} ~ {f.valid_to ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
