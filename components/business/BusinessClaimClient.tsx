'use client';

import { useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { formatBizNo } from '@/lib/utils/format';

type Biz = { biz_no: string; company_name: string; representative: string | null; valid_from: string | null; valid_to: string | null; address: string | null };

export default function BusinessClaimClient() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Biz[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Biz | null>(null);
  const [startDt, setStartDt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [contact, setContact] = useState('');
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

  function pick(b: Biz) {
    setSelected((cur) => (cur?.biz_no === b.biz_no ? null : b));
    setStartDt(''); setFile(null); setContact(''); setError('');
  }

  async function claim(b: Biz) {
    if (startDt.replace(/\D/g, '').length !== 8) { setError('개업일자를 YYYYMMDD 형식(8자리)으로 입력해주세요.'); return; }
    if (!file) { setError('사업자등록증 파일을 첨부해주세요.'); return; }
    if (!contact.trim()) { setError('담당자 연락처를 입력해주세요.'); return; }
    setClaiming(true); setError('');
    try {
      const fd = new FormData();
      fd.append('biz_no', b.biz_no);
      fd.append('contact', contact.trim());
      fd.append('start_dt', startDt.replace(/\D/g, ''));
      fd.append('file', file);
      const r = await fetch('/api/business/claim', { method: 'POST', body: fd });
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
        <p className="mt-1 text-xs leading-relaxed text-unjong-muted">국세청 진위확인 통과 + 서류 제출 완료. 관리자 최종 확인 후 게재됩니다.<br />보통 영업일 기준 1~2일 내 처리됩니다.</p>
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
          금감원 신고 명부에서 못 찾았어요. <strong className="text-unjong-primary">신고된 업체만</strong> 게재할 수 있습니다.
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((b) => {
            const isSel = selected?.biz_no === b.biz_no;
            return (
              <li key={b.biz_no} className={`overflow-hidden rounded-lg border transition-colors ${isSel ? 'border-unjong-accent bg-unjong-accent/5' : 'border-unjong-border hover:bg-unjong-background'}`}>
                <button type="button" onClick={() => pick(b)} className="w-full px-4 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
                    <span className="font-semibold text-unjong-primary">{b.company_name}</span>
                    <span className="text-xs text-unjong-muted">{formatBizNo(b.biz_no)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-unjong-muted">대표 {b.representative ?? '—'} · 신고기간 {b.valid_from ?? '—'} ~ {b.valid_to ?? '—'}</p>
                </button>
                {isSel ? (
                  <div className="border-t border-unjong-accent/30 px-4 py-3">
                    <p className="text-sm text-unjong-primary"><b>{b.company_name}</b>의 대표/담당자이신가요?</p>
                    <p className="mt-1 text-xs leading-relaxed text-unjong-muted">개업일자로 <b>국세청 진위확인</b>을 거치고, <b>사업자등록증</b>을 첨부하면 관리자 확인 후 게재됩니다. 허위 신청은 제재될 수 있어요.</p>
                    <div className="mt-3 space-y-2">
                      <label className="block text-xs font-medium text-unjong-muted">개업일자 (사업자등록증 기재)
                        <input type="text" inputMode="numeric" value={startDt} onChange={(e) => setStartDt(e.target.value.replace(/[^\d-]/g, '').slice(0, 10))} placeholder="YYYYMMDD (예: 20150320)"
                          className="mt-1 block w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
                      </label>
                      <label className="block text-xs font-medium text-unjong-muted">사업자등록증 (또는 대표 증빙)
                        <input type="file" accept="image/png,image/jpeg,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                          className="mt-1 block w-full text-xs text-unjong-muted file:mr-3 file:rounded-md file:border-0 file:bg-unjong-background file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-unjong-primary" />
                      </label>
                      <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="담당자 연락처 (전화 또는 이메일)"
                        className="w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
                      <button type="button" onClick={() => claim(b)} disabled={claiming} className="w-full rounded-lg bg-unjong-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                        {claiming ? '확인 중…' : '사업자 인증 승인요청'}
                      </button>
                    </div>
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
