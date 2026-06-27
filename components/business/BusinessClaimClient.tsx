'use client';

import { useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';

type Biz = { biz_no: string; company_name: string; representative: string | null; valid_from: string | null; valid_to: string | null; address: string | null };

export default function BusinessClaimClient() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Biz[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Biz | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function search() {
    if (q.trim().length < 2) return;
    setSearching(true); setError(''); setSelected(null);
    try {
      const r = await fetch(`/api/business/search?q=${encodeURIComponent(q.trim())}`);
      const j = await r.json();
      setResults(j.results ?? []); setSearched(true);
    } catch { setError('검색에 실패했어요.'); }
    finally { setSearching(false); }
  }

  async function claim() {
    if (!selected) return;
    setClaiming(true); setError('');
    try {
      const r = await fetch('/api/business/claim', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biz_no: selected.biz_no }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error === 'login_required' ? '로그인이 필요합니다.' : (j.error ?? '신청 실패'));
      setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : '신청 실패'); }
    finally { setClaiming(false); }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-unjong-border bg-unjong-surface p-6 text-center">
        <ShieldCheck className="mx-auto mb-2 text-emerald-600" size={28} />
        <p className="text-sm font-semibold text-unjong-primary">인증 신청이 접수되었습니다.</p>
        <p className="mt-1 text-xs leading-relaxed text-unjong-muted">관리자가 금감원 등록·대표 본인 여부를 확인한 뒤 게재됩니다.<br />(다음 단계: 사업자등록증·대표 신분 확인)</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
          placeholder="업체명 또는 사업자등록번호로 검색"
          className="w-full rounded-lg border border-unjong-border bg-unjong-surface py-2.5 pl-9 pr-20 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
        />
        <button type="button" onClick={search} disabled={searching} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-unjong-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          {searching ? '검색 중…' : '검색'}
        </button>
      </div>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}

      {searched && results.length === 0 ? (
        <p className="rounded-lg border border-unjong-border bg-unjong-background px-3 py-4 text-center text-sm text-unjong-muted">
          금감원 등록 명부에서 못 찾았어요. <strong className="text-unjong-primary">등록된 업체만</strong> 게재할 수 있습니다.
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((b) => {
            const isSel = selected?.biz_no === b.biz_no;
            return (
              <li key={b.biz_no} className={`overflow-hidden rounded-lg border transition-colors ${isSel ? 'border-unjong-accent bg-unjong-accent/5' : 'border-unjong-border hover:bg-unjong-background'}`}>
                <button type="button" onClick={() => setSelected(isSel ? null : b)} className="w-full px-4 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
                    <span className="font-semibold text-unjong-primary">{b.company_name}</span>
                    <span className="text-xs text-unjong-muted">{b.biz_no}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-unjong-muted">대표 {b.representative ?? '—'} · 신고기간 {b.valid_from ?? '—'} ~ {b.valid_to ?? '—'}</p>
                </button>
                {isSel ? (
                  <div className="border-t border-unjong-accent/30 px-4 py-3">
                    <p className="text-sm text-unjong-primary"><b>{b.company_name}</b>의 대표/담당자이신가요?</p>
                    <p className="mt-1 text-xs leading-relaxed text-unjong-muted">인증 신청 후 관리자가 금감원 등록·대표 본인 여부를 확인해 게재됩니다. 허위 신청은 제재될 수 있어요.</p>
                    <button type="button" onClick={claim} disabled={claiming} className="mt-2 rounded-lg bg-unjong-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                      {claiming ? '신청 중…' : '이 업체로 인증 신청'}
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
