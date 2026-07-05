'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LENS_COPY } from '@/lib/lensCopy';

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
  const pillClass = (t: string) => t === 'pos' ? 'bg-unjong-accent/15 text-unjong-accent' : t === 'warn' ? 'bg-amber-50 text-amber-600' : 'bg-unjong-background text-unjong-muted';

  return (
    <div className="rounded-2xl border border-unjong-border bg-white p-3.5 shadow-sm">
      <div className="mb-2.5 flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-unjong-primary">시간축으로 한눈에</span>
        <span className="text-[11px] text-unjong-muted">방향이지 정답 아님</span>
      </div>
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
          {longPills.length ? <p className="mt-2 text-[12px] font-medium text-unjong-primary">{longPills.length}중 <span className="text-unjong-accent">{favN}</span> 우호 <span className="font-normal text-unjong-muted">· 종합점수 아님(개수)</span></p> : null}
        </div>
      </div>
      <div className="mt-2.5 rounded-lg bg-unjong-background px-3 py-2 text-[12px] leading-relaxed text-unjong-muted">
        단기 <b className={toneText(sTone)}>{sWord}</b> · 중기 <b className={toneText(mTone)}>{mWord}</b> · 장기 <b className="text-unjong-primary">{longPills.length}중 {favN} 우호</b> — 시간축마다 결이 달라요. 어떻게 볼지는 당신 몫.
      </div>
    </div>
  );
}

const SUMMARY_CLASS = 'cursor-pointer list-none text-[11px] text-unjong-muted hover:text-unjong-accent [&::-webkit-details-marker]:hidden';
const LEARN_CLASS = 'cursor-pointer list-none text-[11px] font-medium text-unjong-accent hover:opacity-80 [&::-webkit-details-marker]:hidden';

function FScoreCard({ f }: { f: FScoreResp }) {
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
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-600">건전성</span>
            <span className="text-xs text-unjong-muted">· 부실 위험 체크</span>
          </div>
          {!open ? <p className="mt-1.5 text-[13px] leading-relaxed text-unjong-muted">{LENS_COPY.ko.fscore.what}</p> : null}
        </div>
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-unjong-border bg-white text-unjong-muted">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
        </span>
      </button>
      {open ? (
        <div className="border-t border-unjong-border bg-unjong-background/50 px-4 pb-4 pt-3.5">
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
            <summary className={SUMMARY_CLASS}>▾ 점수 기준 · 유래 · 왜 &apos;건전성&apos; 등급인지</summary>
            <div className="mt-2 space-y-2 border-l-2 border-unjong-border pl-2.5">
              <div>
                <p className="text-[11.5px] font-medium text-unjong-primary">점수 읽는 법</p>
                <p className="text-[12px] leading-relaxed text-unjong-muted">실무에선 보통 <span className="text-unjong-primary">7점↑ 양호 · 4~6 중간 · 0~3 취약</span>으로 봐요. 피오트로스키가 만든 9개 신호를 더한 값이에요(높을수록 튼튼).</p>
              </div>
              <div>
                <p className="text-[11.5px] font-medium text-unjong-primary">왜 &apos;건전성&apos; 등급이에요?</p>
                <p className="text-[12px] leading-relaxed text-unjong-muted">회계학자 피오트로스키가 2000년, 저평가 가치주 중 <span className="text-unjong-primary">진짜 부실한 곳을 걸러내려</span> 만든 지표예요. 다만 우리 넓은 표본·12년 백테스트에선 점수와 이후 수익률에 유효한 관계가 없었어요(t≈0.7). 그래서 &apos;수익 예측&apos;이 아니라 <span className="text-unjong-primary">재무 건전성 해석</span>으로만 써요 — 그게 이 렌즈 등급이 &apos;건전성&apos;인 이유예요.</p>
              </div>
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}

const H_TITLE: Record<string, string> = { short: '단기', mid: '중기', long: '장기' };
const H_SUB: Record<string, string> = { short: '며칠~주 · 지금 눌릴 수 있는지', mid: '수개월 · 흐름의 관성', long: '분기~년 · 오래 봐도 될 몸인지' };

export default function StockLensPage() {
  const params = useParams();
  const symbol = decodeURIComponent(String(params?.symbol || ''));
  const [data, setData] = useState<LensResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    fetch('/api/lens?symbol=' + encodeURIComponent(symbol))
      .then((r) => r.json())
      .then((j) => { setData(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  const [openLens, setOpenLens] = useState<Set<string>>(new Set());
  const lenses = data?.lenses ?? [];
  const ticker = symbol.replace(/\.(KS|KQ|T|HK|SS|SZ)$/, '');
  const toggleLens = (k: string) => setOpenLens((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const renderCard = (L: LensRead) => {
    const isOpen = openLens.has(L.key);
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
            </div>
            {!isOpen ? <p className="mt-1.5 text-[13px] leading-relaxed text-unjong-muted">{L.summary}</p> : null}
          </div>
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-unjong-border bg-white text-unjong-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
          </span>
        </button>
        {isOpen ? (
          <div className="border-t border-unjong-border bg-unjong-background/50 px-4 pb-4 pt-3.5">
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
        <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
          <h1 className="text-xl font-bold text-unjong-primary">{data?.name || ticker}</h1>
          <span className="text-sm text-unjong-muted">{ticker}</span>
        </div>
        {data?.price != null ? (
          <p className="text-sm text-unjong-muted">현재가 {data.price.toLocaleString()}</p>
        ) : null}

        <div className="mt-3 rounded-lg bg-unjong-background px-3 py-2.5">
          <p className="text-[11px] font-medium text-unjong-muted">이 화면 읽는 법</p>
          <p className="mt-1 text-xs leading-relaxed text-unjong-muted">각 렌즈는 <b className="text-unjong-primary">&apos;예측&apos;이 아니라</b>, 검증된 기법이 이 종목을 어떻게 읽는지예요. <b className="text-unjong-primary">시간축(단기·중기·장기)</b>마다 결이 다를 수 있고 그 차이가 정보예요. 카드마다 <b className="text-unjong-primary">신뢰도 등급</b>이 붙어요 — <span className="text-unjong-accent">검증</span> · <span className="text-amber-600">표본약함</span> · <span className="text-unjong-muted">참고용</span> · <span className="text-amber-600">건전성</span>. 우리는 &quot;사라/사지마라&quot; 안 해요.</p>
        </div>

        <p className="mt-2 text-[11px] text-unjong-muted">각 렌즈를 눌러 상세(쉬운 해석·유래·검증 근거)를 펼쳐 보세요.</p>
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
                  {showFs && data && data.fscore ? <FScoreCard f={data.fscore} /> : null}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-6 max-w-4xl text-center text-[11px] text-unjong-muted">
        검증된 기법 렌즈로 이 종목을 읽어드려요 — 예측도, 권유도 아니에요. 판단은 당신 몫이에요.
      </p>
    </main>
  );
}
