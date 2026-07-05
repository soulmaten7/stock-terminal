'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LENS_COPY } from '@/lib/lensCopy';
import { AlertTriangle, Info, ExternalLink } from 'lucide-react';

type LensRead = {
  key: string;
  nameEn: string;
  name: string;
  summary: string;
  about: string;
  grade: string;
  gradeTier: 'strong' | 'partial' | 'ref';
  horizon: 'short' | 'mid' | 'long';
  short: string | null;
  long: string | null;
  detail: Record<string, number | null>;
  note?: string;
  verdict?: { phrase: string; plain: string; tone: 'pos' | 'warn' | 'flat' } | null;
  spectrum?: { labels: [string, string, string]; active: number } | null;
  headline?: string | null;
  outlook?: string | null;
  percentile?: number | null;
};
type FCriterion = { key: string; label: string; pass: boolean; note: string; group: string; plain: string };
type FScoreResp = { supported: boolean; reason?: string; score: number; max: number; grade: string; criteria: FCriterion[]; asOf?: string };
type LensResp = { symbol: string; name?: string; price?: number | null; lenses?: LensRead[]; fscore?: FScoreResp | null; error?: string };
type EventDef = { item: string; label: string; klass: 'A' | 'B' | 'general'; lenses: string[]; severity: 'info' | 'watch' | 'serious'; flagLens: boolean };
type Flag = { klass: 'A' | 'B'; label: string; date: string };
type MatEvent = { date: string; items: string[]; defs: EventDef[]; link: string };
type EventsResp = { symbol: string; events?: MatEvent[] };

// 판정(reading) 색조 — pos=민트(우호적 읽기)·warn=앰버(주의 읽기)·flat=중립(기본색). '이 기법 시각'일 뿐 예측 아님(상단 전제).
function verdictColor(tone?: string): string {
  if (tone === 'pos') return 'text-unjong-accent';
  if (tone === 'warn') return 'text-amber-600';
  return 'text-unjong-primary';
}
function toneText(tone?: string): string {
  return tone === 'pos' ? 'text-unjong-accent' : tone === 'warn' ? 'text-amber-600' : 'text-unjong-muted';
}

// 신뢰도 배지 색 — strong=민트(검증)·partial=앰버(조건부/해석)·ref=회색(참고)
function gradeBadgeClass(tier: string): string {
  if (tier === 'strong') return 'bg-unjong-accent/15 text-unjong-accent';
  if (tier === 'partial') return 'bg-amber-50 text-amber-600';
  return 'bg-unjong-background text-unjong-muted';
}

// 3구간 스펙트럼 — 퍼센타일이 없을 때(비US·유니버스 밖) 폴백. 켜지는 칸만 색조.
function Spectrum({ labels, active, tone }: { labels: [string, string, string]; active: number; tone?: string }) {
  const on = tone === 'pos' ? 'border-unjong-accent bg-unjong-accent/10 text-unjong-accent'
    : tone === 'warn' ? 'border-amber-400 bg-amber-50 text-amber-600'
    : 'border-unjong-muted bg-unjong-background text-unjong-primary';
  return (
    <div className="mt-2.5 flex gap-1.5">
      {labels.map((l, i) => (
        <span key={i} className={`flex-1 rounded-md border py-1 text-center text-[12px] ${i === active ? `font-medium ${on}` : 'border-unjong-border text-unjong-muted'}`}>{l}</span>
      ))}
    </div>
  );
}

// 팩터 퍼센타일 게이지 — 시총 상위 1,000 대비 순위(0~100·오른쪽=우호 방향). 팩터 5종 공통(Stockopedia식).
const FACTOR_ENDS: Record<string, { lo: string; hi: string }> = {
  momentum: { lo: '약세', hi: '강세' },
  quality: { lo: '평범', hi: '알짜' },
  valuation: { lo: '비쌈', hi: '쌈' },
  lowvol: { lo: '출렁', hi: '차분' },
  assetgrowth: { lo: '공격적', hi: '보수적' },
};
function PctGauge({ pctl, tone, lo, hi }: { pctl: number; tone?: string; lo: string; hi: string }) {
  const p = Math.max(0, Math.min(100, Math.round(pctl)));
  const fill = tone === 'pos' ? 'bg-unjong-accent/25' : tone === 'warn' ? 'bg-amber-100' : 'bg-unjong-border';
  const mk = tone === 'pos' ? 'bg-unjong-accent' : tone === 'warn' ? 'bg-amber-400' : 'bg-unjong-muted';
  return (
    <div className="mt-2.5">
      <div className="relative h-2 rounded-full bg-unjong-background">
        <div className={`absolute left-0 top-0 h-2 rounded-full ${fill}`} style={{ width: `${p}%` }} />
        <div className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${mk}`} style={{ left: `${p}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-unjong-muted"><span>{lo}</span><span>{hi}</span></div>
      <p className="mt-1 text-[11px] text-unjong-muted">랭크 <span className="tabular-nums text-unjong-primary">{p}</span>/100 · 오른쪽(높을수록) {hi} · 시총 상위 1,000 중</p>
    </div>
  );
}

// 기술(RSI) 존 게이지 — 침체–중립–과열. 높다고 좋은 게 아니라 '과열' 조심 신호(퍼센타일 아님).
function RsiZone({ rsi, maPct }: { rsi: number | null; maPct: number | null }) {
  const r = rsi == null ? null : Math.max(0, Math.min(100, Math.round(rsi)));
  const mk = r == null ? 'bg-unjong-muted' : r >= 70 ? 'bg-amber-400' : r <= 30 ? 'bg-unjong-down' : 'bg-unjong-muted';
  const zone = r == null ? '—' : r >= 70 ? '과매수' : r <= 30 ? '과매도' : '중립';
  return (
    <div className="mt-2.5">
      <div className="relative h-2.5">
        <div className="flex h-2.5 overflow-hidden rounded-full">
          <div className="bg-unjong-down/25" style={{ width: '30%' }} />
          <div className="bg-unjong-background" style={{ width: '40%' }} />
          <div className="bg-amber-200" style={{ width: '30%' }} />
        </div>
        {r != null ? <div className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${mk}`} style={{ left: `${r}%` }} /> : null}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-unjong-muted"><span>침체 30</span><span>중립</span><span>70 과열</span></div>
      <p className="mt-1 text-[11px] leading-relaxed text-unjong-muted">RSI <span className="tabular-nums text-unjong-primary">{r ?? '—'}</span> · {zone} — 높다고 좋은 게 아니라 &apos;과열&apos; 조심 신호{maPct != null ? ` · 200일선 ${maPct >= 0 ? '위' : '아래'}(${maPct > 0 ? '+' : ''}${maPct}%)` : ''}</p>
    </div>
  );
}

// 시간축 스트립 — 단기(RSI)·중기(모멘텀 퍼센타일)·장기(팩터 묶음+개수). 각 칸 자기 축으로 정직하게(하나로 안 뭉침).
function HorizonStrip({ lenses, fscore }: { lenses: LensRead[]; fscore: FScoreResp | null }) {
  const find = (k: string) => lenses.find((L) => L.key === k) || null;
  const tech = find('technical');
  const mom = find('momentum');
  const longs = lenses.filter((L) => L.horizon === 'long');

  const rsiV = tech?.detail?.['RSI(14)'] != null ? Math.round(tech.detail['RSI(14)'] as number) : null;
  const sWord = rsiV == null ? '—' : rsiV >= 70 ? '과매수' : rsiV <= 30 ? '과매도' : '중립';
  const sTone = rsiV != null && (rsiV >= 70 || rsiV <= 30) ? 'warn' : 'flat';

  const mTone = mom?.verdict?.tone ?? 'flat';
  const mWord = mTone === 'pos' ? '강세' : mTone === 'warn' ? '약세' : '중립';

  const longPills = longs.map((L) => ({ label: L.name, tone: L.verdict?.tone ?? 'flat' }));
  if (fscore?.supported) longPills.push({ label: 'F-Score', tone: fscore.score >= 7 ? 'pos' : fscore.score <= 3 ? 'warn' : 'flat' });
  const favN = longPills.filter((p) => p.tone === 'pos').length;
  const unfavN = longPills.filter((p) => p.tone === 'warn').length;
  const lStrong = Math.ceil(longPills.length * 0.6);
  let lWord = '—';
  let lTone: 'pos' | 'warn' | 'flat' = 'flat';
  if (longPills.length) {
    if (favN >= lStrong) { lWord = '대체로 우호적'; lTone = 'pos'; }
    else if (unfavN >= lStrong) { lWord = '대체로 비우호적'; lTone = 'warn'; }
    else if (favN === 0 && unfavN === 0) { lWord = '뚜렷하지 않음'; }
    else { lWord = '엇갈림'; }
  }
  const pillClass = (t: string) => t === 'pos' ? 'bg-unjong-accent/15 text-unjong-accent' : t === 'warn' ? 'bg-amber-50 text-amber-600' : 'bg-unjong-background text-unjong-muted';

  return (
    <div className="rounded-2xl border border-unjong-border bg-white p-3.5 shadow-sm">
      <div className="mb-2.5 flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-unjong-primary">시간축으로 한눈에</span>      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {/* 단기 */}
        <div className="rounded-xl border border-unjong-border bg-unjong-background/40 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-unjong-primary">단기 <span className="text-[11px] font-normal text-unjong-muted">며칠~주</span></span>
            <span className="rounded bg-unjong-background px-1.5 py-0.5 text-[10px] text-unjong-muted">참고</span>
          </div>
          <div className="mt-0.5 text-[11px] text-unjong-muted">기술 · RSI</div>
          <div className="relative mt-2 h-2">
            <div className="flex h-2 overflow-hidden rounded-full"><div className="bg-unjong-down/25" style={{ width: '30%' }} /><div className="bg-unjong-background" style={{ width: '40%' }} /><div className="bg-amber-200" style={{ width: '30%' }} /></div>
            {rsiV != null ? <div className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${rsiV >= 70 ? 'bg-amber-400' : rsiV <= 30 ? 'bg-unjong-down' : 'bg-unjong-muted'}`} style={{ left: `${rsiV}%` }} /> : null}
          </div>
          <p className={`mt-2 text-[12px] font-medium ${toneText(sTone)}`}>{sWord}{rsiV != null ? <span className="font-normal text-unjong-muted"> · RSI {rsiV}</span> : null}</p>
        </div>
        {/* 중기 */}
        <div className="rounded-xl border border-unjong-border bg-unjong-background/40 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-unjong-primary">중기 <span className="text-[11px] font-normal text-unjong-muted">수개월</span></span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] ${mom ? gradeBadgeClass(mom.gradeTier) : 'bg-unjong-background text-unjong-muted'}`}>{mom?.grade ?? '—'}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-unjong-muted">모멘텀 · 12-1</div>
          {mom?.percentile != null ? (
            <div className="relative mt-2 h-2 rounded-full bg-unjong-background">
              <div className={`absolute left-0 top-0 h-2 rounded-full ${mTone === 'pos' ? 'bg-unjong-accent/25' : mTone === 'warn' ? 'bg-amber-100' : 'bg-unjong-border'}`} style={{ width: `${mom.percentile}%` }} />
              <div className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${mTone === 'pos' ? 'bg-unjong-accent' : mTone === 'warn' ? 'bg-amber-400' : 'bg-unjong-muted'}`} style={{ left: `${mom.percentile}%` }} />
            </div>
          ) : <div className="mt-2 h-2 rounded-full bg-unjong-background" />}
          <p className={`mt-2 text-[12px] font-medium ${toneText(mTone)}`}>{mWord}{mom?.percentile != null ? <span className="font-normal text-unjong-muted"> · 상위 {100 - mom.percentile}%</span> : null}</p>
        </div>
        {/* 장기 */}
        <div className="rounded-xl border border-unjong-border bg-unjong-background/40 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-unjong-primary">장기 <span className="text-[11px] font-normal text-unjong-muted">분기~년</span></span>
            <span className="rounded bg-unjong-background px-1.5 py-0.5 text-[10px] text-unjong-muted">재무·팩터</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {longPills.length ? longPills.map((p, i) => <span key={i} className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${pillClass(p.tone)}`}>{p.label}</span>) : <span className="text-[11px] text-unjong-muted">—</span>}
          </div>
          {longPills.length ? <p className={`mt-2 text-[12px] font-medium ${toneText(lTone)}`}>{lWord} <span className="font-normal text-unjong-muted">· {longPills.length}개 중 {favN}개 우호</span></p> : null}
        </div>
      </div>
      <div className="mt-2.5 rounded-lg bg-unjong-background px-3 py-2 text-[12px] leading-relaxed text-unjong-muted">
        단기 <b className={toneText(sTone)}>{sWord}</b> · 중기 <b className={toneText(mTone)}>{mWord}</b> · 장기 <b className={toneText(lTone)}>{lWord}</b> — 시간축마다 결이 달라요.
      </div>
    </div>
  );
}

const SUMMARY_CLASS = 'cursor-pointer list-none text-[11px] text-unjong-muted hover:text-unjong-accent [&::-webkit-details-marker]:hidden';
const LEARN_CLASS = 'cursor-pointer list-none text-[11px] font-medium text-unjong-accent hover:opacity-80 [&::-webkit-details-marker]:hidden';

// 렌즈 플래그 칩(헤더) — A 있으면 ⚠️ 자료 갱신 우선, 아니면 📌 새 소식.
function FlagChip({ flags }: { flags?: Flag[] }) {
  if (!flags?.length) return null;
  const a = flags.some((x) => x.klass === 'A');
  return <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${a ? 'bg-amber-50 text-amber-600' : 'bg-unjong-accent/10 text-unjong-accent'}`}>{a ? <AlertTriangle size={10} /> : <Info size={10} />}{a ? '자료 갱신' : '새 소식'}</span>;
}

// 렌즈 플래그 박스(펼침) — A(근거 흔듦)/B(새 사실) 분리. 방향 판정 아님.
function FlagBox({ flags }: { flags?: Flag[] }) {
  if (!flags?.length) return null;
  const aFlags = flags.filter((x) => x.klass === 'A');
  const bFlags = flags.filter((x) => x.klass === 'B');
  return (
    <div className="mb-3 space-y-2">
      {aFlags.length ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-2.5 py-2">
          <p className="flex items-center gap-1 text-[11px] font-medium text-amber-600"><AlertTriangle size={11} /> 최근 새 공시가 나왔어요 (이 점수엔 아직 반영 전)</p>
          {aFlags.map((f, i) => <p key={i} className="mt-0.5 text-[11px] text-unjong-muted">{f.date} · {f.label}</p>)}
        </div>
      ) : null}
      {bFlags.length ? (
        <div className="rounded-lg border border-unjong-accent/30 bg-unjong-accent/5 px-2.5 py-2">
          <p className="flex items-center gap-1 text-[11px] font-medium text-unjong-accent"><Info size={11} /> 이 점수엔 아직 안 들어간 최근 소식이에요</p>
          {bFlags.map((f, i) => <p key={i} className="mt-0.5 text-[11px] text-unjong-muted">{f.date} · {f.label}</p>)}
        </div>
      ) : null}
      <p className="text-[10px] text-unjong-muted">원문은 위 &apos;최근 공시&apos;에서 볼 수 있어요.</p>
    </div>
  );
}

function FScoreCard({ f, flags }: { f: FScoreResp; flags?: Flag[] }) {
  const [open, setOpen] = useState(false);
  if (!f.supported) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-white p-4 shadow-sm">
        <div className="font-bold text-unjong-primary">Piotroski F-Score</div>
        <div className="mt-0.5 text-xs text-unjong-accent">F-스코어 · 재무 건전성</div>
        <p className="mt-2 text-sm text-unjong-muted">{f.reason || '이 종목은 F-Score를 적용할 수 없어요.'}</p>
      </div>
    );
  }
  const band = f.score >= 7 ? '양호' : f.score <= 3 ? '취약' : '중간';
  const GROUPS: Array<[string, string]> = [['수익성', '돈 버는 힘'], ['재무 안정성', '빚·자금'], ['효율성', '장사 효율']];
  return (
    <div className="overflow-hidden rounded-2xl border border-unjong-border bg-white shadow-sm">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-unjong-background/40">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-lg font-bold text-unjong-primary">Piotroski F-Score</span>
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-600">재무 건전성</span>
            <span className="text-xs text-unjong-muted">· 부실 위험 체크</span>
            <FlagChip flags={flags} />
          </div>
          {!open ? <p className="mt-1.5 text-[13px] leading-relaxed text-unjong-muted">{LENS_COPY.ko.fscore.what}</p> : null}
        </div>
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-unjong-border bg-white text-unjong-muted">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
        </span>
      </button>
      {open ? (
        <div className="border-t border-unjong-border bg-unjong-background/50 px-4 pb-4 pt-3.5">
          <FlagBox flags={flags} />
          {/* 이게 뭐예요? — 지금 뭘 하는지만 */}
          <div className="rounded-xl border border-unjong-border bg-white p-3">
            <p className="text-[12px] font-medium text-unjong-accent">이게 뭐예요?</p>
            <p className="mt-1 text-sm leading-relaxed text-unjong-primary">{LENS_COPY.ko.fscore.what}</p>
          </div>

          {/* 판정 — 9칸 트래커 + 점수 */}
          <div className="mt-3.5 flex items-center justify-between gap-3">
            <div className="flex flex-1 gap-[3px]" style={{ maxWidth: 240 }}>
              {Array.from({ length: f.max }, (_, i) => (
                <span key={i} className={`h-3 flex-1 rounded-sm ${i < f.score ? 'bg-unjong-accent' : 'border border-unjong-border bg-unjong-background'}`} />
              ))}
            </div>
            <span className="whitespace-nowrap text-base font-bold text-unjong-primary">{f.score}<span className="text-xs font-normal text-unjong-muted"> / {f.max}</span></span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-unjong-primary">9개 중 {f.score}개 양호 — 점수가 높을수록 재무가 튼튼해요. <span className="text-unjong-muted">지금은 {band} 구간이에요.{f.asOf ? ` (${f.asOf} 기준)` : ''}</span></p>

          {/* 자세히 — 9항목 3그룹 */}
          <details className="mt-3.5 border-t border-unjong-border pt-3">
            <summary className={SUMMARY_CLASS}>▾ 9개 항목 — 세 갈래로 보기</summary>
            <div className="mt-2.5 space-y-3">
              {GROUPS.map(([g, sub]) => {
                const items = f.criteria.filter((c) => c.group === g);
                const passed = items.filter((c) => c.pass).length;
                return (
                  <div key={g}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[12px] font-medium text-unjong-primary">{g} <span className="font-normal text-unjong-muted">{sub}</span></span>
                      <span className="text-[11px] text-unjong-muted"><span className={passed > 0 ? 'font-medium text-unjong-accent' : 'font-medium text-amber-600'}>{passed}</span>/{items.length} 통과</span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {items.map((c) => (
                        <div key={c.key} className="flex items-baseline gap-1.5 text-[12px]">
                          <span className={c.pass ? 'text-unjong-up' : 'text-unjong-muted'}>{c.pass ? '✓' : '✗'}</span>
                          <span className="text-unjong-primary">{c.label} <span className="text-unjong-muted">({c.plain})</span></span>
                          <span className="ml-auto whitespace-nowrap tabular-nums text-unjong-muted">{c.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>

          {/* 자세히 — 점수 기준·유래·왜 건전성 */}
          <details className="mt-2.5">
            <summary className={SUMMARY_CLASS}>▾ 점수 기준 · 유래 · 왜 &apos;재무 건전성&apos;인지</summary>
            <div className="mt-2 space-y-2 border-l-2 border-unjong-border pl-2.5">
              <div>
                <p className="text-[11.5px] font-medium text-unjong-primary">점수 읽는 법</p>
                <p className="text-[12px] leading-relaxed text-unjong-muted">실무에선 보통 <span className="text-unjong-primary">7점↑ 양호 · 4~6 중간 · 0~3 취약</span>으로 봐요. 피오트로스키가 만든 9개 신호를 더한 값이에요(높을수록 튼튼).</p>
              </div>
              <div>
                <p className="text-[11.5px] font-medium text-unjong-primary">왜 &apos;재무 건전성&apos;이에요?</p>
                <p className="text-[12px] leading-relaxed text-unjong-muted">회계학자 피오트로스키가 2000년, 저평가 가치주 중 <span className="text-unjong-primary">진짜 부실한 곳을 걸러내려</span> 만든 지표예요. 다만 우리 넓은 표본·12년 백테스트에선 점수와 이후 수익률에 유효한 관계가 없었어요(t≈0.7). 그래서 &apos;수익 예측&apos;이 아니라 <span className="text-unjong-primary">재무 건전성 해석</span>으로만 써요 — 그게 이 렌즈 등급이 &apos;재무 건전성&apos;인 이유예요.</p>
              </div>
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}

// 이벤트 severity → 점 색(사실의 무게지 방향 아님)
function sevDot(sev: string): string {
  return sev === 'serious' ? 'bg-unjong-danger' : sev === 'watch' ? 'bg-amber-400' : 'bg-unjong-muted';
}

// 이벤트 → 렌즈별 플래그 맵. A(근거 흔듦)/B(새 맥락)만, general은 리스트에만.
function buildLensFlags(events: MatEvent[]): Record<string, Flag[]> {
  const map: Record<string, Flag[]> = {};
  for (const e of events) for (const d of e.defs) {
    if (d.klass === 'general' || !d.flagLens) continue; // 확실히 영향 주는 이벤트만 렌즈 플래그(애매한 건 리스트에만)
    for (const key of d.lenses) (map[key] ||= []).push({ klass: d.klass, label: d.label, date: e.date });
  }
  return map;
}

// 이벤트 사실 레이어 — 최근 중대 8-K(사실만·예측 없음). 렌즈 점수엔 안 섞임.
function EventLayer({ events }: { events: MatEvent[] }) {
  const [showRoutine, setShowRoutine] = useState(false);
  if (!events.length) return null;
  const sevRank = (e: MatEvent) => e.defs.reduce((m, d) => Math.max(m, d.severity === 'serious' ? 2 : d.severity === 'watch' ? 1 : 0), 0);
  const material = events.filter((e) => sevRank(e) >= 1).sort((a, b) => sevRank(b) - sevRank(a)); // 중대(serious/watch)=기본 노출
  const routine = events.filter((e) => sevRank(e) === 0); // 루틴(info)=묶어 접힘
  const groups: { label: string; count: number }[] = [];
  for (const e of routine) {
    const l = e.defs[0]?.label ?? '기타';
    const g = groups.find((x) => x.label === l);
    if (g) g.count += 1; else groups.push({ label: l, count: 1 });
  }
  const row = (e: MatEvent, i: number) => {
    const d = e.defs[0];
    if (!d) return null;
    const why = d.klass === 'A' ? '이 종목 재무 렌즈 근거를 흔들 수 있어요' : d.klass === 'B' ? '렌즈엔 아직 없는 새 사실' : '참고 사실';
    return (
      <li key={i}>
        <a href={e.link} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-start gap-2 rounded-lg border border-unjong-border px-2.5 py-2 transition-colors hover:bg-unjong-background/40">
          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${sevDot(d.severity)}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="text-[13px] font-medium text-unjong-primary">{d.label}</span>
              {e.defs.length > 1 ? <span className="text-[11px] text-unjong-muted">외 {e.defs.length - 1}건</span> : null}
              <span className="rounded bg-unjong-background px-1 py-0.5 text-[10px] text-unjong-muted">{e.defs.map((x) => x.item).join('·')}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-unjong-muted">{e.date} · {why}</p>
          </div>
          <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
      </li>
    );
  };
  return (
    <div className="mt-3 rounded-2xl border border-unjong-border bg-white p-3.5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-unjong-primary">최근 중대 공시·이벤트</span>
        <span className="text-[11px] text-unjong-muted">SEC EDGAR · 실시간</span>
      </div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-unjong-muted"><b className="text-unjong-primary">렌즈 점수엔 아직 안 반영</b>된 최신 공시예요.</p>
      {material.length ? (
        <ul className="mt-2.5 space-y-1.5">{material.map(row)}</ul>
      ) : (
        <p className="mt-2.5 rounded-lg border border-unjong-border bg-unjong-background/40 px-2.5 py-2 text-[12px] text-unjong-muted">최근 <b className="text-unjong-primary">중대한 사건은 없어요</b> — 정기 공시만 있어요.</p>
      )}
      {routine.length ? (
        <div className="mt-2">
          <button type="button" onClick={() => setShowRoutine((v) => !v)} className="flex w-full items-center gap-1 text-left text-[11px] text-unjong-muted hover:text-unjong-accent">
            <span className={`inline-block transition-transform ${showRoutine ? 'rotate-90' : ''}`}>▸</span>
            <span>정기 공시 {routine.length}건 <span className="text-unjong-muted/80">· {groups.map((g) => `${g.label} ${g.count}`).join(' · ')}</span></span>
          </button>
          {showRoutine ? <ul className="mt-1.5 space-y-1.5">{routine.map(row)}</ul> : null}
        </div>
      ) : null}
      <p className="mt-2 text-[10px] leading-relaxed text-unjong-muted">클릭하면 SEC 원문으로 가요.</p>
    </div>
  );
}

const H_TITLE: Record<string, string> = { short: '단기', mid: '중기', long: '장기' };
const H_SUB: Record<string, string> = { short: '며칠~주', mid: '수개월', long: '분기~년' };

export default function StockLensPage() {
  const params = useParams();
  const symbol = decodeURIComponent(String(params?.symbol || ''));
  const [data, setData] = useState<LensResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<MatEvent[]>([]);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    fetch('/api/lens?symbol=' + encodeURIComponent(symbol))
      .then((r) => r.json())
      .then((j) => { setData(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    fetch('/api/events?symbol=' + encodeURIComponent(symbol))
      .then((r) => r.json())
      .then((j: EventsResp) => { if (!cancelled) setEvents(j.events ?? []); })
      .catch(() => { if (!cancelled) setEvents([]); });
    return () => { cancelled = true; };
  }, [symbol]);

  const [openLens, setOpenLens] = useState<Set<string>>(new Set());
  const lenses = data?.lenses ?? [];
  const lensFlags = buildLensFlags(events);
  const ticker = symbol.replace(/\.(KS|KQ|T|HK|SS|SZ)$/, '');
  const toggleLens = (k: string) => setOpenLens((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const renderCard = (L: LensRead) => {
    const isOpen = openLens.has(L.key);
    const cardFlags = lensFlags[L.key];
    const viz = L.key === 'technical'
      ? <RsiZone rsi={L.detail['RSI(14)'] ?? null} maPct={L.detail['200일선대비%'] ?? null} />
      : (L.percentile != null && FACTOR_ENDS[L.key])
        ? <PctGauge pctl={L.percentile} tone={L.verdict?.tone} lo={FACTOR_ENDS[L.key].lo} hi={FACTOR_ENDS[L.key].hi} />
        : (L.spectrum ? <Spectrum labels={L.spectrum.labels} active={L.spectrum.active} tone={L.verdict?.tone} /> : null);
    return (
      <div key={L.key} className="overflow-hidden rounded-2xl border border-unjong-border bg-white shadow-sm">
        <button type="button" onClick={() => toggleLens(L.key)} aria-expanded={isOpen} className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-unjong-background/40">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-lg font-bold text-unjong-primary">{L.nameEn}</span>
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${gradeBadgeClass(L.gradeTier)}`}>{L.grade}</span>
              <span className="text-xs text-unjong-muted">· {L.name}</span>
              <FlagChip flags={cardFlags} />
            </div>
            {!isOpen ? (L.verdict ? (
              <div className="mt-1.5 flex items-baseline gap-x-2">
                <span className={`text-[15px] font-bold ${verdictColor(L.verdict.tone)}`}>{L.verdict.phrase}</span>
                {L.headline ? <span className="text-[12px] tabular-nums text-unjong-muted">{L.headline}</span> : null}
              </div>
            ) : <p className="mt-1.5 text-[13px] leading-relaxed text-unjong-muted">{L.summary}</p>) : null}
          </div>
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-unjong-border bg-white text-unjong-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
          </span>
        </button>
        {isOpen ? (
          <div className="border-t border-unjong-border bg-unjong-background/50 px-4 pb-4 pt-3.5">
            <FlagBox flags={cardFlags} />
            <div className="mb-3.5 rounded-xl border border-unjong-border bg-white p-3">
              <p className="text-[12px] font-medium text-unjong-accent">이게 뭐예요?</p>
              <p className="mt-1 text-sm leading-relaxed text-unjong-primary">{L.summary}</p>
            </div>
            {L.verdict ? (
              <div className="flex items-baseline justify-between gap-2">
                <p className={`text-base font-bold ${verdictColor(L.verdict.tone)}`}>{L.verdict.phrase}</p>
                {L.headline ? <span className="whitespace-nowrap text-[12px] text-unjong-muted">{L.headline}</span> : null}
              </div>
            ) : null}
            {viz}
            {L.outlook ? (
              <div className="mt-2.5">
                <p className="text-[11px] font-medium text-unjong-muted">이 기법 방향</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-unjong-primary/90">{L.outlook}</p>
              </div>
            ) : (L.verdict ? <p className="mt-2.5 text-[13px] leading-relaxed text-unjong-primary/90">{L.verdict.plain}</p> : null)}
            {L.about ? (
              <details className="mt-2.5">
                <summary className={LEARN_CLASS}>▾ {L.name} 알아보기</summary>
                <p className="mt-1.5 text-xs leading-relaxed text-unjong-muted">{L.about}</p>
              </details>
            ) : null}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-unjong-border pt-2.5 text-[12px] text-unjong-muted">
              <span className="font-medium text-unjong-primary/70">근거 수치</span>
              {Object.entries(L.detail).map(([k, v]) => (
                <span key={k}>{k}: <span className="tabular-nums text-unjong-primary">{v ?? '—'}</span></span>
              ))}
            </div>
            {L.note ? (
              <details className="mt-2.5">
                <summary className={SUMMARY_CLASS}>▾ 자세히 · 검증 근거·한계</summary>
                <p className="mt-2 text-[11px] leading-relaxed text-unjong-muted">{L.note}</p>
              </details>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Link href="/" className="text-sm text-unjong-muted hover:text-unjong-accent">← 홈</Link>

      <div className="mt-3 max-w-4xl">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="rounded-md bg-unjong-primary px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">AI LENS</span>
          <span className="text-[11px] text-unjong-muted">검증된 기법으로 이 종목을 읽는 여러 관점</span>
        </div>
        <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
          <h1 className="text-xl font-bold text-unjong-primary">{data?.name || ticker}</h1>
          <span className="text-sm text-unjong-muted">{ticker}</span>
        </div>
        {data?.price != null ? (
          <p className="text-sm text-unjong-muted">현재가 {data.price.toLocaleString()}</p>
        ) : null}

        <p className="mt-3 text-xs leading-relaxed text-unjong-muted">검증된 기법들이 이 종목을 저마다 어떻게 보는지 보여드려요. <b className="text-unjong-primary">사고팔 신호가 아니라, 스스로 판단할 재료</b>예요.</p>
        <details className="mt-1">
          <summary className={LEARN_CLASS}>▾ 이 화면 읽는 법 · 신뢰도 등급</summary>
          <p className="mt-1.5 text-xs leading-relaxed text-unjong-muted">카드마다 <b className="text-unjong-primary">신뢰도 등급</b>이 붙어요 — <span className="text-unjong-accent">검증</span>은 수익 신호까지 확인된 것, <span className="text-amber-600">약한 신호</span>는 유명하지만 우리 데이터론 약한 것, <span className="text-unjong-muted">참고용</span>은 상태만, <span className="text-amber-600">재무 건전성</span>은 재무 체력(수익 신호 아님)이에요. 렌즈를 누르면 왜 그렇게 봤는지까지 펼쳐져요.</p>
        </details>
      </div>

      {loading ? (
        <div className="mt-4 max-w-4xl space-y-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-unjong-background" />)}
        </div>
      ) : lenses.length === 0 && !data?.fscore ? (
        <p className="mt-6 text-center text-sm text-unjong-muted">데이터를 불러오지 못했어요. (일부 종목은 아직 지원되지 않을 수 있어요)</p>
      ) : (
        <div className="mt-4 max-w-4xl">
          {lenses.length ? <HorizonStrip lenses={lenses} fscore={data?.fscore ?? null} /> : null}
          <EventLayer events={events} />
          {(['short', 'mid', 'long'] as const).map((h) => {
            const group = lenses.filter((L) => L.horizon === h);
            const showFs = h === 'long' && !!(data && data.fscore);
            if (!group.length && !showFs) return null;
            return (
              <section key={h}>
                <div className="mb-2 mt-5 flex items-baseline gap-2">
                  <h2 className="text-sm font-bold text-unjong-primary">{H_TITLE[h]}</h2>
                  <span className="text-[11px] text-unjong-muted">{H_SUB[h]}</span>
                </div>
                <div className="space-y-4">
                  {group.map(renderCard)}
                  {showFs && data && data.fscore ? <FScoreCard f={data.fscore} flags={lensFlags['fscore']} /> : null}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* 페이지 하단 디스클레이머 제거 — 법적 문구는 전역 푸터에 있음(반복 제거) */}
    </main>
  );
}
