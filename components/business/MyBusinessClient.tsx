'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Trash2, ExternalLink, Plus, UserPlus, X, Siren } from 'lucide-react';

type Link = { id: string; type: string; url: string; label: string | null; status: string; is_paid?: boolean };
type Manager = { id: string; email: string; status: string };
type Biz = {
  biz_no: string;
  company_name: string;
  representative: string | null;
  address: string | null;
  valid_from: string | null;
  valid_to: string | null;
  homepage: string | null;
  report_count: number;
  intro: string;
  links: Link[];
  myRole: string;
  managers: Manager[];
};

const TYPE_LABEL: Record<string, string> = { room: '리딩방', youtube: '유튜브', site: '사이트' };
const TYPE_OPTIONS = [
  { value: 'room', label: '리딩방' },
  { value: 'youtube', label: '유튜브' },
  { value: 'site', label: '사이트' },
];

export default function MyBusinessClient() {
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/business/mine');
      const j = await r.json();
      setBusinesses(j.businesses ?? []);
    } catch { setBusinesses([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</p>;
  if (businesses.length === 0) {
    return (
      <div className="rounded-xl border border-unjong-border bg-unjong-surface p-8 text-center">
        <p className="text-sm text-unjong-muted">아직 인증한 업체가 없어요.</p>
        <a href="/business" className="mt-2 inline-block text-sm font-semibold text-unjong-accent">업체 인증하기 →</a>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-unjong-muted">금감원 신고 정보는 자동 표시되며 수정할 수 없어요. 소개·링크·관리자만 관리할 수 있어요.</p>
      {businesses.map((b) => <BizCard key={b.biz_no} biz={b} onChange={load} />)}
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex gap-2">
      <dt className="w-16 shrink-0 text-unjong-muted">{k}</dt>
      <dd className="min-w-0 flex-1 text-unjong-primary">{v || '—'}</dd>
    </div>
  );
}

function BizCard({ biz, onChange }: { biz: Biz; onChange: () => void }) {
  const isOwner = biz.myRole === 'owner';
  const [intro, setIntro] = useState(biz.intro);
  const [savingIntro, setSavingIntro] = useState(false);
  const [introMsg, setIntroMsg] = useState('');
  const [payNote, setPayNote] = useState(false);
  const [mgrEmail, setMgrEmail] = useState('');
  const [mgrErr, setMgrErr] = useState('');
  const [mgrBusy, setMgrBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [lType, setLType] = useState('room');
  const [lUrl, setLUrl] = useState('');
  const [lLabel, setLLabel] = useState('');
  const [lErr, setLErr] = useState('');
  const [lBusy, setLBusy] = useState(false);

  const FREE_LIMIT = 1;
  const canAddFree = biz.links.length < FREE_LIMIT;

  async function saveIntro() {
    setSavingIntro(true); setIntroMsg('');
    try { const r = await fetch('/api/business/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setIntro', biz_no: biz.biz_no, intro }) }); setIntroMsg(r.ok ? '저장됨' : '실패'); }
    catch { setIntroMsg('실패'); } finally { setSavingIntro(false); }
  }
  async function delLink(id: string) {
    await fetch('/api/business/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delLink', biz_no: biz.biz_no, id }) });
    onChange();
  }
  async function addFreeLink() {
    if (!/^https?:\/\//.test(lUrl.trim())) { setLErr('http로 시작하는 링크 주소를 입력해주세요.'); return; }
    setLBusy(true); setLErr('');
    try {
      const r = await fetch('/api/business/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'addLink', biz_no: biz.biz_no, type: lType, url: lUrl.trim(), label: lLabel.trim() }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? '추가 실패');
      setLUrl(''); setLLabel(''); setAddOpen(false); onChange();
    } catch (e) { setLErr(e instanceof Error ? e.message : '추가 실패'); }
    finally { setLBusy(false); }
  }
  async function addManager() {
    if (!mgrEmail.trim()) { setMgrErr('이메일을 입력해주세요.'); return; }
    setMgrBusy(true); setMgrErr('');
    try {
      const r = await fetch('/api/business/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'addManager', biz_no: biz.biz_no, email: mgrEmail.trim() }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? '추가 실패');
      setMgrEmail(''); onChange();
    } catch (e) { setMgrErr(e instanceof Error ? e.message : '추가 실패'); }
    finally { setMgrBusy(false); }
  }
  async function removeManager(id: string) {
    await fetch('/api/business/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'removeManager', biz_no: biz.biz_no, id }) });
    onChange();
  }

  return (
    <div className="rounded-xl border border-unjong-border bg-unjong-surface p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ShieldCheck size={16} className="text-emerald-600" />
        <h3 className="font-bold text-unjong-primary">{biz.company_name}</h3>
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-600">인증됨</span>
        {!isOwner ? <span className="rounded bg-unjong-background px-1.5 py-0.5 text-[11px] text-unjong-muted">관리자</span> : null}
        <span className="text-xs text-unjong-muted">{biz.biz_no}</span>
      </div>

      {/* ── 금감원 검증 사실 (읽기 전용 · 디렉토리에 보이는 그대로) ── */}
      <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
        <div className="mb-2 inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
          <ShieldCheck size={12} /> 유사투자자문 신고 · 자동 표시
        </div>
        <dl className="space-y-1 text-xs">
          <InfoRow k="등록업체" v={biz.company_name} />
          <InfoRow k="대표" v={biz.representative} />
          <InfoRow k="주소" v={biz.address} />
          <InfoRow k="신고기간" v={`${biz.valid_from ?? '—'} ~ ${biz.valid_to ?? '—'}`} />
        </dl>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-unjong-muted"><Siren size={12} /> 신고 {biz.report_count}</span>
          {biz.homepage ? (
            <a href={biz.homepage} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 text-unjong-muted hover:text-unjong-accent">바로가기 <ExternalLink size={11} /></a>
          ) : null}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-unjong-muted">위 정보는 금감원 신고 데이터라 수정할 수 없어요. 사용자에게 이 모습 그대로 표시됩니다.</p>
      </div>

      {/* 소개 (편집 가능) */}
      <label className="mb-1 block text-xs font-medium text-unjong-muted">소개</label>
      <div className="mb-1 flex gap-2">
        <textarea value={intro} onChange={(e) => { setIntro(e.target.value); setIntroMsg(''); }} rows={2} maxLength={200} placeholder="업체·리딩방 한 줄 소개" className="flex-1 resize-none rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
        <button type="button" onClick={saveIntro} disabled={savingIntro} className="shrink-0 self-start rounded-lg bg-unjong-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{savingIntro ? '저장…' : '저장'}</button>
      </div>
      {introMsg ? <p className="mb-3 text-[11px] text-emerald-600">{introMsg}</p> : <div className="mb-3" />}

      {/* ── 업체 제공 링크 ── */}
      <label className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-unjong-muted">
        업체 제공 링크 <span className="rounded bg-unjong-background px-1 py-0.5 text-[10px] font-normal">업체가 직접 등록</span>
      </label>
      <ul className="mb-2 space-y-1.5">
        {biz.links.length === 0 ? <li className="text-xs text-unjong-muted">아직 등록한 링크가 없어요. 무료 링크 1개를 등록할 수 있어요.</li> : null}
        {biz.links.map((l) => (
          <li key={l.id} className="flex items-center gap-2 rounded-lg border border-unjong-border px-3 py-2 text-sm">
            <span className="shrink-0 rounded bg-unjong-background px-1.5 py-0.5 text-[11px] font-medium text-unjong-muted">{TYPE_LABEL[l.type] ?? l.type}</span>
            {l.is_paid
              ? <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">광고</span>
              : <span className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">무료</span>}
            <span className="min-w-0 flex-1 truncate text-unjong-primary">{l.label || l.url}</span>
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-unjong-muted hover:text-unjong-accent"><ExternalLink size={14} /></a>
            <button type="button" onClick={() => delLink(l.id)} aria-label="삭제" className="shrink-0 text-unjong-muted hover:text-red-500"><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>

      {/* 무료 링크 1개 → 실제 추가 폼 / 그 이상 → 유료 스텁 */}
      {canAddFree ? (
        addOpen ? (
          <div className="mb-4 space-y-1.5 rounded-lg border border-unjong-border p-3">
            <div className="flex gap-2">
              <select value={lType} onChange={(e) => setLType(e.target.value)} className="shrink-0 rounded-lg border border-unjong-border bg-unjong-surface px-2 py-2 text-sm text-unjong-primary outline-none" style={{ colorScheme: 'light' }}>
                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input value={lUrl} onChange={(e) => { setLUrl(e.target.value); setLErr(''); }} placeholder="https://… 링크 주소" className="min-w-0 flex-1 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
            </div>
            <input value={lLabel} onChange={(e) => setLLabel(e.target.value)} maxLength={60} placeholder="표시 이름 (선택)" className="w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
            {lErr ? <p className="text-xs text-red-500">{lErr}</p> : null}
            <div className="flex gap-2">
              <button type="button" onClick={addFreeLink} disabled={lBusy} className="flex-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white disabled:opacity-50">{lBusy ? '등록…' : '무료 링크 등록'}</button>
              <button type="button" onClick={() => { setAddOpen(false); setLErr(''); }} className="shrink-0 rounded-lg border border-unjong-border px-3 py-2 text-sm text-unjong-muted">취소</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setAddOpen(true)} className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-unjong-accent py-2 text-sm font-semibold text-unjong-accent transition-colors hover:bg-unjong-accent hover:text-white">
            <Plus size={14} /> 링크 추가 <span className="text-[11px]">(무료 · 1개)</span>
          </button>
        )
      ) : payNote ? (
        <p className="mb-4 rounded-lg border border-dashed border-unjong-accent/40 bg-unjong-accent/5 px-3 py-2.5 text-center text-xs leading-relaxed text-unjong-muted">추가 링크 결제 기능 <b className="text-unjong-accent">준비 중</b>이에요 — 곧 링크당 광고(유료)로 게재할 수 있어요.</p>
      ) : (
        <button type="button" onClick={() => setPayNote(true)} className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-unjong-accent py-2 text-sm font-semibold text-unjong-accent transition-colors hover:bg-unjong-accent hover:text-white">
          <Plus size={14} /> 링크 추가 <span className="text-[11px]">(광고 · 유료 · 링크당)</span>
        </button>
      )}

      {isOwner ? (
        <div className="border-t border-unjong-border pt-3">
          <label className="mb-1.5 block text-xs font-medium text-unjong-muted">관리자 공유 (1명까지)</label>
          {biz.managers.length > 0 ? (
            biz.managers.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg border border-unjong-border px-3 py-2 text-sm">
                <UserPlus size={13} className="shrink-0 text-unjong-muted" />
                <span className="min-w-0 flex-1 truncate text-unjong-primary">{m.email}</span>
                <button type="button" onClick={() => removeManager(m.id)} aria-label="해제" className="shrink-0 text-unjong-muted hover:text-red-500"><X size={14} /></button>
              </div>
            ))
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input value={mgrEmail} onChange={(e) => { setMgrEmail(e.target.value); setMgrErr(''); }} placeholder="공유할 사람의 가입 이메일" className="min-w-0 flex-1 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
                <button type="button" onClick={addManager} disabled={mgrBusy} className="shrink-0 rounded-lg bg-unjong-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{mgrBusy ? '추가…' : '공유'}</button>
              </div>
              {mgrErr ? <p className="text-xs text-red-500">{mgrErr}</p> : <p className="text-[11px] text-unjong-muted">공유받은 사람도 이 업체의 소개·링크를 관리할 수 있어요(가입 계정 필요).</p>}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
