'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, ShieldCheck } from 'lucide-react';
import { formatBizNo } from '@/lib/utils/format';

type Biz = { biz_no: string; company_name: string; representative: string | null; valid_from: string | null; valid_to: string | null; address: string | null };

export default function BusinessClaimClient() {
  const t = useTranslations('Business');
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
    } catch { setError(t('errSearch')); }
    finally { setSearching(false); }
  }

  function pick(b: Biz) {
    setSelected((cur) => (cur?.biz_no === b.biz_no ? null : b));
    setStartDt(''); setFile(null); setContact(''); setError('');
  }

  async function claim(b: Biz) {
    if (startDt.replace(/\D/g, '').length !== 8) { setError(t('errStartDt')); return; }
    if (!file) { setError(t('errFile')); return; }
    if (!contact.trim()) { setError(t('errContact')); return; }
    setClaiming(true); setError('');
    try {
      const fd = new FormData();
      fd.append('biz_no', b.biz_no);
      fd.append('contact', contact.trim());
      fd.append('start_dt', startDt.replace(/\D/g, ''));
      fd.append('file', file);
      const r = await fetch('/api/business/claim', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error === 'login_required' ? t('errLogin') : (j.error ?? t('claimFail')));
      setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : t('claimFail')); }
    finally { setClaiming(false); }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-unjong-border bg-unjong-surface p-6 text-center">
        <ShieldCheck className="mx-auto mb-2 text-emerald-400" size={28} />
        <p className="text-sm font-semibold text-unjong-primary">{t('claimDone')}</p>
        <p className="mt-1 text-xs leading-relaxed text-unjong-muted">{t.rich('claimDoneDesc', { br: () => <br /> })}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
          placeholder={t('searchPh')}
          className="w-full rounded-lg border border-unjong-border bg-unjong-surface py-2.5 pl-9 pr-20 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
        />
        <button type="button" onClick={search} disabled={searching} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-unjong-strong px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          {searching ? t('searching') : t('search')}
        </button>
      </div>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}

      {searched && results.length === 0 ? (
        <p className="rounded-lg border border-unjong-border bg-unjong-background px-3 py-4 text-center text-sm text-unjong-muted">
          {t.rich('notFound', { b: (c) => <strong className="text-unjong-primary">{c}</strong> })}
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
                    <ShieldCheck size={14} className="shrink-0 text-emerald-400" />
                    <span className="font-semibold text-unjong-primary">{b.company_name}</span>
                    <span className="text-xs text-unjong-muted">{formatBizNo(b.biz_no)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-unjong-muted">{t('repPeriod', { rep: b.representative ?? '—', from: b.valid_from ?? '—', to: b.valid_to ?? '—' })}</p>
                </button>
                {isSel ? (
                  <div className="border-t border-unjong-accent/30 px-4 py-3">
                    <p className="text-sm text-unjong-primary">{t.rich('askOwner', { name: b.company_name, b: (c) => <b>{c}</b> })}</p>
                    <p className="mt-1 text-xs leading-relaxed text-unjong-muted">{t.rich('askOwnerDesc', { b: (c) => <b>{c}</b> })}</p>
                    <div className="mt-3 space-y-2">
                      <label className="block text-xs font-medium text-unjong-muted">{t('startDtLabel')}
                        <input type="text" inputMode="numeric" value={startDt} onChange={(e) => setStartDt(e.target.value.replace(/[^\d-]/g, '').slice(0, 10))} placeholder={t('startDtPh')}
                          className="mt-1 block w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
                      </label>
                      <label className="block text-xs font-medium text-unjong-muted">{t('fileLabel')}
                        <input type="file" accept="image/png,image/jpeg,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                          className="mt-1 block w-full text-xs text-unjong-muted file:mr-3 file:rounded-md file:border-0 file:bg-unjong-background file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-unjong-primary" />
                      </label>
                      <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t('contactPh')}
                        className="w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
                      <button type="button" onClick={() => claim(b)} disabled={claiming} className="w-full rounded-lg bg-unjong-strong py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                        {claiming ? t('claiming') : t('claimSubmit')}
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
