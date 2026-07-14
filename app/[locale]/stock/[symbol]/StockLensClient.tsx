'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation'; // useParams는 로케일 무관 — next/navigation 그대로
import { useRouter } from '@/i18n/navigation';
import { LENS_COPY, DETAIL_LABELS, pickLocale, type Locale } from '@/lib/lensCopy';
import { AiLensBadge } from '@/components/AiLensBadge';
import { AlertTriangle, Info, ExternalLink, Sparkles } from 'lucide-react';

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

// 근거 수치 라벨 — 엔진이 주는 stable 키(rsi14·ma200vs…)를 언어별 표시로. 라벨 없는 키는 키 그대로(새 렌즈가 와도 안 깨짐).
function detailLabel(locale: Locale, k: string): string {
  return (DETAIL_LABELS[locale] as Record<string, string>)[k] ?? k;
}

// 판정(reading) 색조 — pos=민트(우호적 읽기)·warn=앰버(주의 읽기)·flat=중립(기본색). '이 기법 시각'일 뿐 예측 아님(상단 전제).
function verdictColor(tone?: string): string {
  if (tone === 'pos') return 'text-unjong-accent';
  if (tone === 'warn') return 'text-amber-400';
  return 'text-unjong-primary';
}
function toneText(tone?: string): string {
  return tone === 'pos' ? 'text-unjong-accent' : tone === 'warn' ? 'text-amber-400' : 'text-unjong-muted';
}

// 신뢰도 배지 색 — strong=다크틸(검증·AA)·partial=앰버·ref=회색
function gradeBadgeClass(tier: string): string {
  if (tier === 'strong') return 'bg-unjong-accent/12 text-unjong-success';
  if (tier === 'partial') return 'bg-amber-400/10 text-amber-300';
  return 'bg-unjong-background text-unjong-muted';
}

// 3구간 스펙트럼 — 퍼센타일이 없을 때(비US·유니버스 밖) 폴백. 켜지는 칸만 색조.
function Spectrum({ labels, active, tone }: { labels: [string, string, string]; active: number; tone?: string }) {
  const on = tone === 'pos' ? 'border-unjong-accent bg-unjong-accent/10 text-unjong-accent'
    : tone === 'warn' ? 'border-amber-400 bg-amber-400/10 text-amber-300'
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
// 모듈 상수 → 값=ko.json 키. 렌더 지점(renderCard)에서 t()로 해석.
const FACTOR_ENDS: Record<string, { lo: string; hi: string }> = {
  momentum: { lo: 'factorEnds.momentumLo', hi: 'factorEnds.momentumHi' },
  quality: { lo: 'factorEnds.qualityLo', hi: 'factorEnds.qualityHi' },
  valuation: { lo: 'factorEnds.valuationLo', hi: 'factorEnds.valuationHi' },
  lowvol: { lo: 'factorEnds.lowvolLo', hi: 'factorEnds.lowvolHi' },
  assetgrowth: { lo: 'factorEnds.assetgrowthLo', hi: 'factorEnds.assetgrowthHi' },
};
function PctGauge({ pctl, tone, lo, hi }: { pctl: number; tone?: string; lo: string; hi: string }) {
  const t = useTranslations('StockLens');
  const p = Math.max(0, Math.min(100, Math.round(pctl)));
  const fill = tone === 'pos' ? 'bg-unjong-accent/25' : tone === 'warn' ? 'bg-amber-400/45' : 'bg-unjong-border';
  const mk = tone === 'pos' ? 'bg-unjong-accent' : tone === 'warn' ? 'bg-amber-400' : 'bg-unjong-muted';
  return (
    <div className="mt-2.5">
      <div className="relative h-2 rounded-full bg-unjong-background">
        <div className={`absolute left-0 top-0 h-2 rounded-full ${fill}`} style={{ width: `${p}%` }} />
        <div className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${mk}`} style={{ left: `${p}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-unjong-muted"><span>{lo}</span><span>{hi}</span></div>
      <p className="mt-1 text-[11px] text-unjong-muted">{t.rich('gauge.rank', { p, hi, v: (c) => <span className="tabular-nums text-unjong-primary">{c}</span> })}</p>
    </div>
  );
}

// 기술(RSI) 존 게이지 — 침체–중립–과열. 높다고 좋은 게 아니라 '과열' 조심 신호(퍼센타일 아님).
function RsiZone({ rsi, maPct }: { rsi: number | null; maPct: number | null }) {
  const t = useTranslations('StockLens');
  const r = rsi == null ? null : Math.max(0, Math.min(100, Math.round(rsi)));
  const mk = r == null ? 'bg-unjong-muted' : r >= 70 ? 'bg-amber-400' : r <= 30 ? 'bg-unjong-down' : 'bg-unjong-muted';
  const zone = r == null ? '—' : r >= 70 ? t('word.overbought') : r <= 30 ? t('word.oversold') : t('word.neutral');
  const ma = maPct != null ? t('rsi.ma', { dir: maPct >= 0 ? t('rsi.above') : t('rsi.below'), pct: `${maPct > 0 ? '+' : ''}${maPct}` }) : '';
  return (
    <div className="mt-2.5">
      <div className="relative h-2.5">
        <div className="flex h-2.5 overflow-hidden rounded-full">
          <div className="bg-unjong-down/25" style={{ width: '30%' }} />
          <div className="bg-unjong-background" style={{ width: '40%' }} />
          <div className="bg-amber-400/45" style={{ width: '30%' }} />
        </div>
        {r != null ? <div className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${mk}`} style={{ left: `${r}%` }} /> : null}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-unjong-muted"><span>{t('rsi.low')}</span><span>{t('rsi.mid')}</span><span>{t('rsi.high')}</span></div>
      <p className="mt-1 text-[11px] leading-relaxed text-unjong-muted">{t.rich('rsi.line', { r: r ?? '—', zone, ma, v: (c) => <span className="tabular-nums text-unjong-primary">{c}</span> })}</p>
    </div>
  );
}

// 시간축 스트립 — 단기(RSI)·중기(모멘텀 퍼센타일)·장기(팩터 묶음+개수). 각 칸 자기 축으로 정직하게(하나로 안 뭉침).
function HorizonStrip({ lenses, fscore }: { lenses: LensRead[]; fscore: FScoreResp | null }) {
  const t = useTranslations('StockLens');
  const find = (k: string) => lenses.find((L) => L.key === k) || null;
  const tech = find('technical');
  const mom = find('momentum');
  const longs = lenses.filter((L) => L.horizon === 'long');

  const rsiV = tech?.detail?.rsi14 != null ? Math.round(tech.detail.rsi14 as number) : null;
  const sWord = rsiV == null ? '—' : rsiV >= 70 ? t('word.overbought') : rsiV <= 30 ? t('word.oversold') : t('word.neutral');
  const sTone = rsiV != null && (rsiV >= 70 || rsiV <= 30) ? 'warn' : 'flat';

  const mTone = mom?.verdict?.tone ?? 'flat';
  const mWord = mTone === 'pos' ? t('word.bull') : mTone === 'warn' ? t('word.bear') : t('word.neutral');

  const longPills = longs.map((L) => ({ label: L.name, tone: L.verdict?.tone ?? 'flat' }));
  if (fscore?.supported) longPills.push({ label: 'F-Score', tone: fscore.score >= 7 ? 'pos' : fscore.score <= 3 ? 'warn' : 'flat' });
  const favN = longPills.filter((p) => p.tone === 'pos').length;
  const unfavN = longPills.filter((p) => p.tone === 'warn').length;
  const lStrong = Math.ceil(longPills.length * 0.6);
  let lWord = '—';
  let lTone: 'pos' | 'warn' | 'flat' = 'flat';
  if (longPills.length) {
    if (favN >= lStrong) { lWord = t('word.mostlyFav'); lTone = 'pos'; }
    else if (unfavN >= lStrong) { lWord = t('word.mostlyUnfav'); lTone = 'warn'; }
    else if (favN === 0 && unfavN === 0) { lWord = t('word.unclear'); }
    else { lWord = t('word.mixed'); }
  }
  const pillClass = (tone: string) => tone === 'pos' ? 'bg-unjong-accent/15 text-unjong-accent' : tone === 'warn' ? 'bg-amber-400/10 text-amber-300' : 'bg-unjong-background text-unjong-muted';

  return (
    <div className="rounded-2xl border border-unjong-border bg-unjong-surface p-3.5 shadow-sm">
      <div className="mb-2.5 flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-unjong-primary">{t('horizon.title')}</span>      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {/* 단기 */}
        <div className="rounded-xl border border-unjong-border bg-unjong-background/40 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-unjong-primary">{t('horizon.short')} <span className="text-[11px] font-normal text-unjong-muted">{t('horizon.shortSub')}</span></span>
            <span className="rounded bg-unjong-background px-1.5 py-0.5 text-[10px] text-unjong-muted">{t('horizon.refBadge')}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-unjong-muted">{t('horizon.techRsi')}</div>
          <div className="relative mt-2 h-2">
            <div className="flex h-2 overflow-hidden rounded-full"><div className="bg-unjong-down/25" style={{ width: '30%' }} /><div className="bg-unjong-background" style={{ width: '40%' }} /><div className="bg-amber-400/45" style={{ width: '30%' }} /></div>
            {rsiV != null ? <div className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${rsiV >= 70 ? 'bg-amber-400' : rsiV <= 30 ? 'bg-unjong-down' : 'bg-unjong-muted'}`} style={{ left: `${rsiV}%` }} /> : null}
          </div>
          <p className={`mt-2 text-[12px] font-medium ${toneText(sTone)}`}>{sWord}{rsiV != null ? <span className="font-normal text-unjong-muted">{t('horizon.rsiSuffix', { v: rsiV })}</span> : null}</p>
        </div>
        {/* 중기 */}
        <div className="rounded-xl border border-unjong-border bg-unjong-background/40 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-unjong-primary">{t('horizon.mid')} <span className="text-[11px] font-normal text-unjong-muted">{t('horizon.midSub')}</span></span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] ${mom ? gradeBadgeClass(mom.gradeTier) : 'bg-unjong-background text-unjong-muted'}`}>{mom?.grade ?? '—'}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-unjong-muted">{t('horizon.momentum')}</div>
          {mom?.percentile != null ? (
            <div className="relative mt-2 h-2 rounded-full bg-unjong-background">
              <div className={`absolute left-0 top-0 h-2 rounded-full ${mTone === 'pos' ? 'bg-unjong-accent/25' : mTone === 'warn' ? 'bg-amber-400/45' : 'bg-unjong-border'}`} style={{ width: `${mom.percentile}%` }} />
              <div className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${mTone === 'pos' ? 'bg-unjong-accent' : mTone === 'warn' ? 'bg-amber-400' : 'bg-unjong-muted'}`} style={{ left: `${mom.percentile}%` }} />
            </div>
          ) : <div className="mt-2 h-2 rounded-full bg-unjong-background" />}
          <p className={`mt-2 text-[12px] font-medium ${toneText(mTone)}`}>{mWord}{mom?.percentile != null ? <span className="font-normal text-unjong-muted">{t('horizon.topPct', { v: 100 - mom.percentile })}</span> : null}</p>
        </div>
        {/* 장기 */}
        <div className="rounded-xl border border-unjong-border bg-unjong-background/40 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-unjong-primary">{t('horizon.long')} <span className="text-[11px] font-normal text-unjong-muted">{t('horizon.longSub')}</span></span>
            <span className="rounded bg-unjong-background px-1.5 py-0.5 text-[10px] text-unjong-muted">{t('horizon.factorBadge')}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {longPills.length ? longPills.map((p, i) => <span key={i} className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${pillClass(p.tone)}`}>{p.label}</span>) : <span className="text-[11px] text-unjong-muted">—</span>}
          </div>
          {longPills.length ? <p className={`mt-2 text-[12px] font-medium ${toneText(lTone)}`}>{lWord} <span className="font-normal text-unjong-muted">{t('horizon.favCount', { total: longPills.length, fav: favN })}</span></p> : null}
        </div>
      </div>
      <div className="mt-2.5 rounded-lg bg-unjong-background px-3 py-2 text-[12px] leading-relaxed text-unjong-muted">
        {t.rich('horizon.summary', {
          short: sWord, mid: mWord, long: lWord,
          s: (c) => <b className={toneText(sTone)}>{c}</b>,
          m: (c) => <b className={toneText(mTone)}>{c}</b>,
          l: (c) => <b className={toneText(lTone)}>{c}</b>,
        })}
      </div>
    </div>
  );
}

const SUMMARY_CLASS = 'cursor-pointer list-none text-[11px] text-unjong-muted hover:text-unjong-accent [&::-webkit-details-marker]:hidden';
const LEARN_CLASS = 'cursor-pointer list-none text-[11px] font-medium text-unjong-accent hover:opacity-80 [&::-webkit-details-marker]:hidden';

// 렌즈 플래그 칩(헤더) — A 있으면 ⚠️ 자료 갱신 우선, 아니면 📌 새 소식.
function FlagChip({ flags }: { flags?: Flag[] }) {
  const t = useTranslations('StockLens');
  if (!flags?.length) return null;
  const a = flags.some((x) => x.klass === 'A');
  return <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${a ? 'bg-amber-400/10 text-amber-300' : 'bg-unjong-accent/10 text-unjong-accent'}`}>{a ? <AlertTriangle size={10} /> : <Info size={10} />}{a ? t('flag.update') : t('flag.news')}</span>;
}

// 렌즈 플래그 박스(펼침) — A(근거 흔듦)/B(새 사실) 분리. 방향 판정 아님.
function FlagBox({ flags }: { flags?: Flag[] }) {
  const t = useTranslations('StockLens');
  if (!flags?.length) return null;
  const aFlags = flags.filter((x) => x.klass === 'A');
  const bFlags = flags.filter((x) => x.klass === 'B');
  return (
    <div className="mb-3 space-y-2">
      {aFlags.length ? (
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-2.5 py-2">
          <p className="flex items-center gap-1 text-[11px] font-medium text-amber-300"><AlertTriangle size={11} /> {t('flag.aTitle')}</p>
          {aFlags.map((f, i) => <p key={i} className="mt-0.5 text-[11px] text-unjong-muted">{f.date} · {f.label}</p>)}
        </div>
      ) : null}
      {bFlags.length ? (
        <div className="rounded-lg border border-unjong-accent/30 bg-unjong-accent/5 px-2.5 py-2">
          <p className="flex items-center gap-1 text-[11px] font-medium text-unjong-accent"><Info size={11} /> {t('flag.bTitle')}</p>
          {bFlags.map((f, i) => <p key={i} className="mt-0.5 text-[11px] text-unjong-muted">{f.date} · {f.label}</p>)}
        </div>
      ) : null}
      <p className="text-[10px] text-unjong-muted">{t('flag.source')}</p>
    </div>
  );
}

function FScoreCard({ f, flags }: { f: FScoreResp; flags?: Flag[] }) {
  const t = useTranslations('StockLens');
  const locale = pickLocale(useLocale()); // 렌즈 카피는 언어별 맵 — ko 고정하면 en 화면에 한국어가 샌다
  const [open, setOpen] = useState(false);
  if (!f.supported) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface p-4 shadow-sm">
        <div className="font-bold text-unjong-primary">Piotroski F-Score</div>
        <div className="mt-0.5 text-xs text-unjong-accent">{t('fscore.subtitle')}</div>
        <p className="mt-2 text-sm text-unjong-muted">{f.reason || t('fscore.unsupported')}</p>
      </div>
    );
  }
  const band = f.score >= 7 ? t('fscore.bandGood') : f.score <= 3 ? t('fscore.bandWeak') : t('fscore.bandMid');
  // key = API의 c.group 값(데이터 매칭용·번역 금지) / label·sub = 표시용
  const GROUPS: Array<{ key: string; label: string; sub: string }> = [
    { key: '수익성', label: t('fscore.groupProfitability'), sub: t('fscore.groupProfitabilitySub') },
    { key: '재무 안정성', label: t('fscore.groupStability'), sub: t('fscore.groupStabilitySub') },
    { key: '효율성', label: t('fscore.groupEfficiency'), sub: t('fscore.groupEfficiencySub') },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-sm">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-unjong-background/40">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-lg font-bold text-unjong-primary">Piotroski F-Score</span>
            <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-300">{t('fscore.badge')}</span>
            <span className="text-xs text-unjong-muted">{t('fscore.tagline')}</span>
            <FlagChip flags={flags} />
          </div>
          {!open ? <p className="mt-1.5 text-[13px] leading-relaxed text-unjong-muted">{LENS_COPY[locale].fscore.what}</p> : null}
        </div>
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-unjong-border bg-unjong-surface text-unjong-muted">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
        </span>
      </button>
      {open ? (
        <div className="border-t border-unjong-border bg-unjong-background/50 px-4 pb-4 pt-3.5">
          <FlagBox flags={flags} />
          {/* 이게 뭐예요? — 지금 뭘 하는지만 */}
          <div className="rounded-xl border border-unjong-border bg-unjong-surface p-3">
            <p className="text-[12px] font-medium text-unjong-accent">{t('fscore.whatIsIt')}</p>
            <p className="mt-1 text-sm leading-relaxed text-unjong-primary">{LENS_COPY[locale].fscore.what}</p>
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
          <p className="mt-2 text-[13px] leading-relaxed text-unjong-primary">{t.rich('fscore.scoreLine', {
            score: f.score,
            band,
            asOf: f.asOf ? t('fscore.asOf', { d: f.asOf }) : '',
            m: (c) => <span className="text-unjong-muted">{c}</span>,
          })}</p>

          {/* 자세히 — 9항목 3그룹 */}
          <details className="mt-3.5 border-t border-unjong-border pt-3">
            <summary className={SUMMARY_CLASS}>{t('fscore.detailsItems')}</summary>
            <div className="mt-2.5 space-y-3">
              {GROUPS.map((g) => {
                const items = f.criteria.filter((c) => c.group === g.key);
                const passed = items.filter((c) => c.pass).length;
                return (
                  <div key={g.key}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[12px] font-medium text-unjong-primary">{g.label} <span className="font-normal text-unjong-muted">{g.sub}</span></span>
                      <span className="text-[11px] text-unjong-muted">{t.rich('fscore.passed', {
                        passed,
                        total: items.length,
                        n: (c) => <span className={passed > 0 ? 'font-medium text-unjong-accent' : 'font-medium text-amber-400'}>{c}</span>,
                      })}</span>
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
            <summary className={SUMMARY_CLASS}>{t('fscore.detailsBasis')}</summary>
            <div className="mt-2 space-y-2 border-l-2 border-unjong-border pl-2.5">
              <div>
                <p className="text-[11.5px] font-medium text-unjong-primary">{t('fscore.howToRead')}</p>
                <p className="text-[12px] leading-relaxed text-unjong-muted">{t.rich('fscore.howToReadBody', { s: (c) => <span className="text-unjong-primary">{c}</span> })}</p>
              </div>
              <div>
                <p className="text-[11.5px] font-medium text-unjong-primary">{t('fscore.whyFinHealth')}</p>
                <p className="text-[12px] leading-relaxed text-unjong-muted">{t.rich('fscore.whyFinHealthBody', { s: (c) => <span className="text-unjong-primary">{c}</span> })}</p>
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
// R1-KR: DART 공시 원문 AI 요약(지연·전역 캐시). US AiFilingSummary의 KR 짝.
function KrFilingSummary({ rcept, symbol, nm }: { rcept: string; symbol: string; nm: string }) {
  const t = useTranslations('StockLens');
  const [text, setText] = useState('');
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  useEffect(() => {
    let alive = true;
    if (!/^\d{14}$/.test(rcept)) { setState('error'); return; }
    const q = new URLSearchParams({ rcept, symbol, nm }).toString();
    fetch('/api/kr-events/summary?' + q)
      .then((r) => r.json())
      .then((j) => { if (!alive) return; if (j.summary) { setText(j.summary); setState('done'); } else setState('error'); })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [rcept]); // eslint-disable-line react-hooks/exhaustive-deps
  if (state === 'error') return null; // 실패 시 조용히 숨김(원문 링크는 위에)
  return (
    <div className="mt-1.5 rounded-lg bg-unjong-accent/5 px-2.5 py-2">
      <div className="mb-1 flex items-center gap-1">
        <Sparkles size={11} className="text-unjong-accent" />
        <span className="text-[10px] font-medium text-unjong-accent">{t('ai.summary')}</span>
        <span className="ml-auto text-[10px] text-unjong-muted">{t('ai.fromSource')}</span>
      </div>
      {state === 'loading'
        ? <p className="text-[11px] text-unjong-muted">{t('ai.reading')}</p>
        : <p className="text-[12px] leading-relaxed text-unjong-primary">{text}</p>}
    </div>
  );
}

// STEP 595: KR 공시 이벤트 층(DART). US EventLayer(EDGAR)의 KR 짝. 원문 요약(R1-KR)은 이후 STEP.
type KrEvent = { date: string; report_nm: string; rcept_no: string; url: string };
function KrEventLayer({ symbol }: { symbol: string }) {
  const [events, setEvents] = useState<KrEvent[]>([]);
  const t = useTranslations('StockLens');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/kr-events?symbol=' + encodeURIComponent(symbol))
      .then((r) => r.json())
      .then((j) => { if (!alive) return; setEvents(j.events || []); setLoaded(true); })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [symbol]);
  if (!loaded || !events.length) return null;
  const fmtD = (s: string) => (/^\d{8}$/.test(s) ? `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}` : s);
  return (
    <div className="mt-3 rounded-2xl border border-unjong-border bg-unjong-surface p-3.5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-unjong-primary">{t('events.recentFilings')}</span>
        <span className="text-[11px] text-unjong-muted">{t('events.srcDart')}</span>
      </div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-unjong-muted">{t.rich('events.notReflected', { b: (c) => <b className="text-unjong-primary">{c}</b> })}</p>
      <ul className="mt-2.5 space-y-1.5">
        {events.map((e, i) => (
          <li key={i}>
            <a href={e.url} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-start gap-2 rounded-lg border border-unjong-border px-2.5 py-2 transition-colors hover:bg-unjong-background/40">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-unjong-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug text-unjong-primary">{e.report_nm}</p>
                <p className="mt-0.5 text-[11px] text-unjong-muted">{fmtD(e.date)}</p>
              </div>
              <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
            <KrFilingSummary rcept={e.rcept_no} symbol={symbol} nm={e.report_nm} />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] leading-relaxed text-unjong-muted">{t('events.goDart')}</p>
    </div>
  );
}

// STEP 650: JP 공시 이벤트 층(EDINET·미리계산). US EventLayer(EDGAR)·KR KrEventLayer(DART)의 JP 짝.
// 원문 = /api/jp-events/doc 프록시(키 서버측 PDF). R1 한국어 요약은 STEP 651.
type JpEvent = { doc_id: string; title: string; date: string; reason: string | null; material: boolean; type_code: string | null };
// R1-JP: EDINET 원문(CSV) AI 한국어 요약(지연·전역 캐시). KR KrFilingSummary의 JP 짝.
function JpFilingSummary({ docid, symbol, nm }: { docid: string; symbol: string; nm: string }) {
  const t = useTranslations('StockLens');
  const [text, setText] = useState('');
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  useEffect(() => {
    let alive = true;
    const q = new URLSearchParams({ docid, symbol, nm }).toString();
    fetch('/api/jp-events/summary?' + q)
      .then((r) => r.json())
      .then((j) => { if (!alive) return; if (j.summary) { setText(j.summary); setState('done'); } else setState('error'); })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [docid]); // eslint-disable-line react-hooks/exhaustive-deps
  if (state === 'error') return null; // 실패 시 조용히 숨김(원문 PDF 링크는 위에)
  return (
    <div className="mt-1.5 rounded-lg bg-unjong-accent/5 px-2.5 py-2">
      <div className="mb-1 flex items-center gap-1">
        <Sparkles size={11} className="text-unjong-accent" />
        <span className="text-[10px] font-medium text-unjong-accent">{t('ai.summary')}</span>
        <span className="ml-auto text-[10px] text-unjong-muted">{t('ai.fromSource')}</span>
      </div>
      {state === 'loading'
        ? <p className="text-[11px] text-unjong-muted">{t('ai.reading')}</p>
        : <p className="text-[12px] leading-relaxed text-unjong-primary">{text}</p>}
    </div>
  );
}
function JpEventLayer({ symbol }: { symbol: string }) {
  const [events, setEvents] = useState<JpEvent[]>([]);
  const t = useTranslations('StockLens');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/jp-events?symbol=' + encodeURIComponent(symbol))
      .then((r) => r.json())
      .then((j) => { if (!alive) return; setEvents(j.events || []); setLoaded(true); })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [symbol]);
  if (!loaded || !events.length) return null;
  const fmtD = (s: string) => { const d = new Date(s); return isNaN(+d) ? s : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
  return (
    <div className="mt-3 rounded-2xl border border-unjong-border bg-unjong-surface p-3.5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-unjong-primary">{t('events.recentFilings')}</span>
        <span className="text-[11px] text-unjong-muted">{t('events.srcEdinet')}</span>
      </div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-unjong-muted">{t.rich('events.notReflected', { b: (c) => <b className="text-unjong-primary">{c}</b> })}</p>
      <ul className="mt-2.5 space-y-1.5">
        {events.map((e, i) => (
          <li key={i}>
            <a href={`/api/jp-events/doc?docid=${encodeURIComponent(e.doc_id)}`} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-start gap-2 rounded-lg border border-unjong-border px-2.5 py-2 transition-colors hover:bg-unjong-background/40">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${e.material ? 'bg-unjong-accent' : 'bg-unjong-muted/40'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug text-unjong-primary">{e.title}{e.material && <span className="ml-1.5 rounded bg-unjong-accent/10 px-1 py-0.5 text-[10px] font-semibold text-unjong-accent">{t('events.material')}</span>}</p>
                {e.reason && <p className="mt-0.5 truncate text-[11px] text-unjong-muted">{e.reason}</p>}
                <p className="mt-0.5 text-[11px] text-unjong-muted">{fmtD(e.date)}</p>
              </div>
              <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
            <JpFilingSummary docid={e.doc_id} symbol={symbol} nm={e.title} />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] leading-relaxed text-unjong-muted">{t('events.goEdinet')}</p>
    </div>
  );
}

// STEP 653: GB 공시 이벤트 층(RNS via Investegate·온디맨드). US/KR/JP 이벤트층의 GB 짝.
// 제목은 영어(RNS 원문). R1 한국어 요약은 STEP 654. 원문=Investegate 링크(귀속).
type GbEvent = { id: string; title: string; date: string; time: string; source: string; url: string; material: boolean };
// R1-GB: RNS 공시(Investegate 상세) 원문 AI 한국어 요약(지연·전역 캐시). KR/JP FilingSummary의 GB 짝.
function GbFilingSummary({ url, symbol, nm }: { url: string; symbol: string; nm: string }) {
  const t = useTranslations('StockLens');
  const [text, setText] = useState('');
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  useEffect(() => {
    let alive = true;
    const q = new URLSearchParams({ url, symbol, nm }).toString();
    fetch('/api/gb-events/summary?' + q)
      .then((r) => r.json())
      .then((j) => { if (!alive) return; if (j.summary) { setText(j.summary); setState('done'); } else setState('error'); })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps
  if (state === 'error') return null; // 실패 시 조용히 숨김(원문 링크는 위에)
  return (
    <div className="mt-1.5 rounded-lg bg-unjong-accent/5 px-2.5 py-2">
      <div className="mb-1 flex items-center gap-1">
        <Sparkles size={11} className="text-unjong-accent" />
        <span className="text-[10px] font-medium text-unjong-accent">{t('ai.summary')}</span>
        <span className="ml-auto text-[10px] text-unjong-muted">{t('ai.fromSource')}</span>
      </div>
      {state === 'loading'
        ? <p className="text-[11px] text-unjong-muted">{t('ai.reading')}</p>
        : <p className="text-[12px] leading-relaxed text-unjong-primary">{text}</p>}
    </div>
  );
}
function GbEventLayer({ symbol }: { symbol: string }) {
  const [events, setEvents] = useState<GbEvent[]>([]);
  const t = useTranslations('StockLens');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/gb-events?symbol=' + encodeURIComponent(symbol))
      .then((r) => r.json())
      .then((j) => { if (!alive) return; setEvents(j.events || []); setLoaded(true); })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [symbol]);
  if (!loaded || !events.length) return null;
  return (
    <div className="mt-3 rounded-2xl border border-unjong-border bg-unjong-surface p-3.5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-unjong-primary">{t('events.recentFilings')}</span>
        <span className="text-[11px] text-unjong-muted">{t('events.srcRns')}</span>
      </div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-unjong-muted">{t.rich('events.notReflected', { b: (c) => <b className="text-unjong-primary">{c}</b> })}</p>
      <ul className="mt-2.5 space-y-1.5">
        {events.map((e) => (
          <li key={e.id}>
            <a href={e.url} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-start gap-2 rounded-lg border border-unjong-border px-2.5 py-2 transition-colors hover:bg-unjong-background/40">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${e.material ? 'bg-unjong-accent' : 'bg-unjong-muted/40'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug text-unjong-primary">{e.title}{e.material && <span className="ml-1.5 rounded bg-unjong-accent/10 px-1 py-0.5 text-[10px] font-semibold text-unjong-accent">{t('events.material')}</span>}</p>
                <p className="mt-0.5 text-[11px] text-unjong-muted">{e.date}</p>
              </div>
              <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
            <GbFilingSummary url={e.url} symbol={symbol} nm={e.title} />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] leading-relaxed text-unjong-muted">{t('events.goRns')}</p>
    </div>
  );
}

type CnEvent = { id: string; title: string; date: string; source: string; url: string; pdf: string; material: boolean };
function CnFilingSummary({ pdf, symbol, nm, id }: { pdf: string; symbol: string; nm: string; id: string }) {
  const t = useTranslations('StockLens');
  const [text, setText] = useState('');
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  useEffect(() => {
    let alive = true;
    if (!pdf) { setState('error'); return; }
    const q = new URLSearchParams({ pdf, symbol, nm, id }).toString();
    fetch('/api/cn-events/summary?' + q)
      .then((r) => r.json())
      .then((j) => { if (!alive) return; if (j.summary) { setText(j.summary); setState('done'); } else setState('error'); })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [pdf]); // eslint-disable-line react-hooks/exhaustive-deps
  if (state === 'error') return null;
  return (
    <div className="mt-1.5 rounded-lg bg-unjong-accent/5 px-2.5 py-2">
      <div className="mb-1 flex items-center gap-1">
        <Sparkles size={11} className="text-unjong-accent" />
        <span className="text-[10px] font-medium text-unjong-accent">{t('ai.summary')}</span>
        <span className="ml-auto text-[10px] text-unjong-muted">{t('ai.fromSource')}</span>
      </div>
      {state === 'loading'
        ? <p className="text-[11px] text-unjong-muted">{t('ai.reading')}</p>
        : <p className="text-[12px] leading-relaxed text-unjong-primary">{text}</p>}
    </div>
  );
}
function CnEventLayer({ symbol }: { symbol: string }) {
  const [events, setEvents] = useState<CnEvent[]>([]);
  const t = useTranslations('StockLens');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/cn-events?symbol=' + encodeURIComponent(symbol))
      .then((r) => r.json())
      .then((j) => { if (!alive) return; setEvents(j.events || []); setLoaded(true); })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [symbol]);
  if (!loaded || !events.length) return null;
  return (
    <div className="mt-3 rounded-2xl border border-unjong-border bg-unjong-surface p-3.5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-unjong-primary">{t('events.recentFilings')}</span>
        <span className="text-[11px] text-unjong-muted">{events[0]?.source === 'HKEXnews' ? t('events.srcHkex') : t('events.srcCninfo')}</span>
      </div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-unjong-muted">{t.rich('events.notReflected', { b: (c) => <b className="text-unjong-primary">{c}</b> })}</p>
      <ul className="mt-2.5 space-y-1.5">
        {events.map((e) => (
          <li key={e.id}>
            <a href={e.url} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-start gap-2 rounded-lg border border-unjong-border px-2.5 py-2 transition-colors hover:bg-unjong-background/40">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${e.material ? 'bg-unjong-accent' : 'bg-unjong-muted/40'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug text-unjong-primary">{e.title}{e.material && <span className="ml-1.5 rounded bg-unjong-accent/10 px-1 py-0.5 text-[10px] font-semibold text-unjong-accent">{t('events.material')}</span>}</p>
                <p className="mt-0.5 text-[11px] text-unjong-muted">{e.date}</p>
              </div>
              <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
            <CnFilingSummary pdf={e.pdf} symbol={symbol} nm={e.title} id={e.id} />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] leading-relaxed text-unjong-muted">{events[0]?.source === 'HKEXnews' ? t('events.goHkex') : t('events.goCninfo')}</p>
    </div>
  );
}
type VnEvent = { id: string; title: string; date: string; source: string; url: string; material: boolean };
function VnFilingSummary({ url, symbol, nm, id }: { url: string; symbol: string; nm: string; id: string }) {
  const t = useTranslations('StockLens');
  const [text, setText] = useState('');
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  useEffect(() => {
    let alive = true;
    const q = new URLSearchParams({ url, symbol, nm, id }).toString();
    fetch('/api/vn-events/summary?' + q)
      .then((r) => r.json())
      .then((j) => { if (!alive) return; if (j.summary) { setText(j.summary); setState('done'); } else setState('error'); })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps
  if (state === 'error') return null;
  return (
    <div className="mt-1.5 rounded-lg bg-unjong-accent/5 px-2.5 py-2">
      <div className="mb-1 flex items-center gap-1">
        <Sparkles size={11} className="text-unjong-accent" />
        <span className="text-[10px] font-medium text-unjong-accent">{t('ai.summary')}</span>
        <span className="ml-auto text-[10px] text-unjong-muted">{t('ai.fromSource')}</span>
      </div>
      {state === 'loading'
        ? <p className="text-[11px] text-unjong-muted">{t('ai.reading')}</p>
        : <p className="text-[12px] leading-relaxed text-unjong-primary">{text}</p>}
    </div>
  );
}
function VnEventLayer({ symbol }: { symbol: string }) {
  const [events, setEvents] = useState<VnEvent[]>([]);
  const t = useTranslations('StockLens');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/vn-events?symbol=' + encodeURIComponent(symbol))
      .then((r) => r.json())
      .then((j) => { if (!alive) return; setEvents(j.events || []); setLoaded(true); })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [symbol]);
  if (!loaded || !events.length) return null;
  return (
    <div className="mt-3 rounded-2xl border border-unjong-border bg-unjong-surface p-3.5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-unjong-primary">{t('events.recentNews')}</span>
        <span className="text-[11px] text-unjong-muted">{t('events.srcGnews')}</span>
      </div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-unjong-muted">{t.rich('events.notReflectedNews', { b: (c) => <b className="text-unjong-primary">{c}</b> })}</p>
      <ul className="mt-2.5 space-y-1.5">
        {events.map((e) => (
          <li key={e.id}>
            <a href={e.url} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-start gap-2 rounded-lg border border-unjong-border px-2.5 py-2 transition-colors hover:bg-unjong-background/40">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${e.material ? 'bg-unjong-accent' : 'bg-unjong-muted/40'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug text-unjong-primary">{e.title}{e.material && <span className="ml-1.5 rounded bg-unjong-accent/10 px-1 py-0.5 text-[10px] font-semibold text-unjong-accent">{t('events.major')}</span>}</p>
                <p className="mt-0.5 text-[11px] text-unjong-muted">{e.date}</p>
              </div>
              <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
            <VnFilingSummary url={e.url} symbol={symbol} nm={e.title} id={e.id} />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] leading-relaxed text-unjong-muted">{t('events.goNews')}</p>
    </div>
  );
}

// R3: 종목 최근 뉴스 요약 + 중립 토픽 태그(지연·조건부·헤드라인 없으면 숨김). 뉴스=사실 브리핑, 감성 점수 아님.
function StockNewsBrief({ symbol }: { symbol: string }) {
  const t = useTranslations('StockLens');
  const [d, setD] = useState<{ summary: string; tags: string[] } | null>(null);
  const [state, setState] = useState<'loading' | 'done' | 'hide'>('loading');
  useEffect(() => {
    let alive = true;
    fetch('/api/news-brief?symbol=' + encodeURIComponent(symbol))
      .then((r) => r.json())
      .then((j) => { if (!alive) return; if (j.summary) { setD({ summary: j.summary, tags: j.tags || [] }); setState('done'); } else setState('hide'); })
      .catch(() => { if (alive) setState('hide'); });
    return () => { alive = false; };
  }, [symbol]);
  if (state === 'hide') return null;
  return (
    <div className="mt-3 rounded-2xl border border-unjong-accent/20 bg-unjong-accent/5 p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Sparkles size={13} className="text-unjong-accent" />
        <span className="text-[13px] font-bold text-unjong-accent">{t('newsBrief.title')}</span>
        <span className="ml-auto text-[10px] text-unjong-muted">{t('newsBrief.badge')}</span>
      </div>
      {state === 'loading' || !d
        ? <p className="text-[12px] text-unjong-muted">{t('newsBrief.loading')}</p>
        : (<>
            <p className="text-[13px] leading-relaxed text-unjong-primary">{d.summary}</p>
            {d.tags.length ? <div className="mt-2 flex flex-wrap gap-1.5">{d.tags.map((tag, i) => <span key={i} className="rounded-full border border-unjong-border bg-unjong-surface px-2 py-0.5 text-[10px] text-unjong-muted">{tag}</span>)}</div> : null}
          </>)}
    </div>
  );
}

// R2: 종목 브리핑(지연 로드·하루 1회 캐시). LLM이 결정론 판정+공시 사실로 '핵심 긴장+지켜볼 것'을 1문단 — 예측·판정 아님.
function StockBrief({ symbol }: { symbol: string }) {
  const t = useTranslations('StockLens');
  const [brief, setBrief] = useState('');
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  useEffect(() => {
    let alive = true;
    setState('loading');
    fetch('/api/brief?symbol=' + encodeURIComponent(symbol))
      .then((r) => r.json())
      .then((j) => { if (!alive) return; if (j.brief) { setBrief(j.brief); setState('done'); } else setState('error'); })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [symbol]);
  if (state === 'error') return null; // 실패 시 조용히 숨김
  return (
    <div className="mb-3 rounded-2xl border border-unjong-accent/20 bg-unjong-accent/5 p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Sparkles size={14} className="text-unjong-accent" />
        <span className="text-[13px] font-bold text-unjong-accent">{t('brief.title')}</span>
        <span className="ml-auto text-[10px] text-unjong-muted">{t('brief.badge')}</span>
      </div>
      {state === 'loading'
        ? <p className="text-[12px] text-unjong-muted">{t('brief.loading')}</p>
        : <p className="text-[13px] leading-relaxed text-unjong-primary">{brief}</p>}
      {state === 'done' ? <p className="mt-1.5 text-[10px] leading-relaxed text-unjong-muted">{t('brief.footer')}</p> : null}
    </div>
  );
}

function buildLensFlags(events: MatEvent[]): Record<string, Flag[]> {
  const map: Record<string, Flag[]> = {};
  for (const e of events) for (const d of e.defs) {
    if (d.klass === 'general' || !d.flagLens) continue; // 확실히 영향 주는 이벤트만 렌즈 플래그(애매한 건 리스트에만)
    for (const key of d.lenses) (map[key] ||= []).push({ klass: d.klass, label: d.label, date: e.date });
  }
  return map;
}

// 이벤트 사실 레이어 — 최근 중대 8-K(사실만·예측 없음). 렌즈 점수엔 안 섞임.
// R1: 8-K accession을 SEC 링크에서 추출.
function accFromLink(link: string): string {
  const m = link.match(/edgar\/data\/\d+\/([^/]+)\//);
  return m ? m[1] : '';
}

// R1: 공시 원문 AI 요약(지연 로드·전역 캐시). LLM은 원문을 읽어 '사실'만 — 예측·판정 아님.
function AiFilingSummary({ symbol, link, items }: { symbol: string; link: string; items: string[] }) {
  const t = useTranslations('StockLens');
  const [text, setText] = useState('');
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  useEffect(() => {
    let alive = true;
    if (!accFromLink(link)) { setState('error'); return; }
    const q = new URLSearchParams({ symbol, link, items: items.join(',') }).toString();
    fetch('/api/events/summary?' + q)
      .then((r) => r.json())
      .then((j) => { if (!alive) return; if (j.summary) { setText(j.summary); setState('done'); } else setState('error'); })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [symbol, link]); // eslint-disable-line react-hooks/exhaustive-deps
  if (state === 'error') return null; // 실패 시 조용히 숨김(원문 링크는 위에 있음)
  return (
    <div className="mt-1.5 rounded-lg bg-unjong-accent/5 px-2.5 py-2">
      <div className="mb-1 flex items-center gap-1">
        <Sparkles size={11} className="text-unjong-accent" />
        <span className="text-[10px] font-medium text-unjong-accent">{t('ai.summary')}</span>
        <span className="ml-auto text-[10px] text-unjong-muted">{t('ai.fromSource')}</span>
      </div>
      {state === 'loading'
        ? <p className="text-[11px] text-unjong-muted">{t('ai.reading')}</p>
        : <p className="text-[12px] leading-relaxed text-unjong-primary">{text}</p>}
    </div>
  );
}

function EventLayer({ events, symbol }: { events: MatEvent[]; symbol: string }) {
  const t = useTranslations('StockLens');
  const [showRoutine, setShowRoutine] = useState(false);
  if (!events.length) return null;
  const sevRank = (e: MatEvent) => e.defs.reduce((m, d) => Math.max(m, d.severity === 'serious' ? 2 : d.severity === 'watch' ? 1 : 0), 0);
  const material = events.filter((e) => sevRank(e) >= 1).sort((a, b) => sevRank(b) - sevRank(a)); // 중대(serious/watch)=기본 노출
  const routine = events.filter((e) => sevRank(e) === 0); // 루틴(info)=묶어 접힘
  const groups: { label: string; count: number }[] = [];
  for (const e of routine) {
    const l = e.defs[0]?.label ?? t('events.etcLabel');
    const g = groups.find((x) => x.label === l);
    if (g) g.count += 1; else groups.push({ label: l, count: 1 });
  }
  const row = (e: MatEvent, i: number, withAi = false) => {
    const d = e.defs[0];
    if (!d) return null;
    const why = d.klass === 'A' ? t('events.whyA') : d.klass === 'B' ? t('events.whyB') : t('events.whyGeneral');
    return (
      <li key={i}>
        <a href={e.link} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-start gap-2 rounded-lg border border-unjong-border px-2.5 py-2 transition-colors hover:bg-unjong-background/40">
          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${sevDot(d.severity)}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="text-[13px] font-medium text-unjong-primary">{d.label}</span>
              {e.defs.length > 1 ? <span className="text-[11px] text-unjong-muted">{t('events.andMore', { n: e.defs.length - 1 })}</span> : null}
              <span className="rounded bg-unjong-background px-1 py-0.5 text-[10px] text-unjong-muted">{e.defs.map((x) => x.item).join('·')}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-unjong-muted">{e.date} · {why}</p>
          </div>
          <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
        {withAi ? <AiFilingSummary symbol={symbol} link={e.link} items={e.items} /> : null}
      </li>
    );
  };
  return (
    <div className="mt-3 rounded-2xl border border-unjong-border bg-unjong-surface p-3.5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-unjong-primary">{t('events.recentFilingsUs')}</span>
        <span className="text-[11px] text-unjong-muted">{t('events.srcSec')}</span>
      </div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-unjong-muted">{t.rich('events.notReflected', { b: (c) => <b className="text-unjong-primary">{c}</b> })}</p>
      {material.length ? (
        <ul className="mt-2.5 space-y-1.5">{material.map((e, i) => row(e, i, true))}</ul>
      ) : (
        <p className="mt-2.5 rounded-lg border border-unjong-border bg-unjong-background/40 px-2.5 py-2 text-[12px] text-unjong-muted">{t.rich('events.noMaterial', { b: (c) => <b className="text-unjong-primary">{c}</b> })}</p>
      )}
      {routine.length ? (
        <div className="mt-2">
          <button type="button" onClick={() => setShowRoutine((v) => !v)} className="flex w-full items-center gap-1 text-left text-[11px] text-unjong-muted hover:text-unjong-accent">
            <span className={`inline-block transition-transform ${showRoutine ? 'rotate-90' : ''}`}>▸</span>
            <span>{t('events.routine', { n: routine.length })} <span className="text-unjong-muted/80">· {groups.map((g) => `${g.label} ${g.count}`).join(' · ')}</span></span>
          </button>
          {showRoutine ? <ul className="mt-1.5 space-y-1.5">{routine.map((e, i) => row(e, i))}</ul> : null}
        </div>
      ) : null}
      <p className="mt-2 text-[10px] leading-relaxed text-unjong-muted">{t('events.goSec')}</p>
    </div>
  );
}

const H_TITLE: Record<string, string> = { short: 'horizon.short', mid: 'horizon.mid', long: 'horizon.long' };
const H_SUB: Record<string, string> = { short: 'horizon.shortSub', mid: 'horizon.midSub', long: 'horizon.longSub' };

export default function StockLensClient({ initialName }: { initialName?: string }) {
  const t = useTranslations('StockLens');
  const locale = pickLocale(useLocale()); // 렌즈 엔진 언어(?lang=) + 배지 — 안 넘기면 en 화면에 한국어 렌즈가 온다
  const params = useParams();
  const router = useRouter();
  const symbol = decodeURIComponent(String(params?.symbol || ''));
  const isKR = /^\d{6}(\.(KS|KQ))?$/i.test(symbol); // KR 6자리(±.KS/.KQ) → DART 공시 층
  const isJP = /^\d{4}\.T$/i.test(symbol); // JP 4자리.T → EDINET 공시 층
  const isGB = /\.L$/i.test(symbol); // GB {TIDM}.L → RNS(Investegate) 공시 층
  const isVN = /\.VN$/i.test(symbol); // VN {TICKER}.VN → 공시(Google News RSS·vi) 층
  const isCN = /(\d{6}\.(SS|SZ)|\d{1,5}\.HK)$/i.test(symbol); // A주 cninfo + HK HKEXnews
  const [data, setData] = useState<LensResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<MatEvent[]>([]);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    fetch('/api/lens?symbol=' + encodeURIComponent(symbol) + '&lang=' + locale)
      .then((r) => r.json())
      .then((j) => { setData(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol, locale]);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    fetch('/api/events?symbol=' + encodeURIComponent(symbol) + '&lang=' + locale) // 공시 라벨도 언어별 — 안 넘기면 en 화면에 한국어 라벨
      .then((r) => r.json())
      .then((j: EventsResp) => { if (!cancelled) setEvents(j.events ?? []); })
      .catch(() => { if (!cancelled) setEvents([]); });
    return () => { cancelled = true; };
  }, [symbol, locale]);

  const [openLens, setOpenLens] = useState<Set<string>>(new Set());
  const lenses = data?.lenses ?? [];
  const lensFlags = buildLensFlags(events);
  const ticker = symbol.replace(/\.(KS|KQ|T|HK|SS|SZ|VN|L)$/, '');
  const toggleLens = (k: string) => setOpenLens((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const renderCard = (L: LensRead) => {
    const isOpen = openLens.has(L.key);
    const cardFlags = lensFlags[L.key];
    const viz = L.key === 'technical'
      ? <RsiZone rsi={L.detail.rsi14 ?? null} maPct={L.detail.ma200vs ?? null} />
      : (L.percentile != null && FACTOR_ENDS[L.key])
        ? <PctGauge pctl={L.percentile} tone={L.verdict?.tone} lo={t(FACTOR_ENDS[L.key].lo)} hi={t(FACTOR_ENDS[L.key].hi)} />
        : (L.spectrum ? <Spectrum labels={L.spectrum.labels} active={L.spectrum.active} tone={L.verdict?.tone} /> : null);
    return (
      <div key={L.key} className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-sm">
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
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-unjong-border bg-unjong-surface text-unjong-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
          </span>
        </button>
        {isOpen ? (
          <div className="border-t border-unjong-border bg-unjong-background/50 px-4 pb-4 pt-3.5">
            <FlagBox flags={cardFlags} />
            <div className="mb-3.5 rounded-xl border border-unjong-border bg-unjong-surface p-3">
              <p className="text-[12px] font-medium text-unjong-accent">{t('whatIsIt')}</p>
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
                <p className="text-[11px] font-medium text-unjong-muted">{t('lensDirection')}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-unjong-primary/90">{L.outlook}</p>
              </div>
            ) : (L.verdict ? <p className="mt-2.5 text-[13px] leading-relaxed text-unjong-primary/90">{L.verdict.plain}</p> : null)}
            {L.about ? (
              <details className="mt-2.5">
                <summary className={LEARN_CLASS}>{t('learnMore', { name: L.name })}</summary>
                <p className="mt-1.5 text-xs leading-relaxed text-unjong-muted">{L.about}</p>
              </details>
            ) : null}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-unjong-border pt-2.5 text-[12px] text-unjong-muted">
              <span className="font-medium text-unjong-primary/70">{t('evidence')}</span>
              {Object.entries(L.detail).map(([k, v]) => (
                <span key={k}>{detailLabel(locale, k)}: <span className="tabular-nums text-unjong-primary">{v ?? '—'}</span></span>
              ))}
            </div>
            {L.note ? (
              <details className="mt-2.5">
                <summary className={SUMMARY_CLASS}>{t('detailsNote')}</summary>
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
      <button type="button" onClick={() => { if (typeof window !== 'undefined' && window.history.length > 1) router.back(); else router.push('/'); }} className="text-sm text-unjong-muted hover:text-unjong-accent">{t('back')}</button>

      <div className="mt-3 max-w-4xl">
        <div className="mb-1.5 flex items-center gap-2">
          <AiLensBadge pill lang={locale} />
          <span className="text-[11px] text-unjong-muted">{t('headerNote')}</span>
        </div>
        <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
          <h1 className="text-xl font-bold text-unjong-primary">{initialName || data?.name || ticker}</h1>
          <span className="text-sm text-unjong-muted">{ticker}</span>
        </div>
        {data?.price != null ? (
          <p className="text-sm text-unjong-muted">{t('currentPrice')} {data.price.toLocaleString()}</p>
        ) : null}

        <p className="mt-3 text-xs leading-relaxed text-unjong-muted">{t.rich('intro', { b: (c) => <b className="text-unjong-primary">{c}</b> })}</p>
        <details className="mt-1">
          <summary className={LEARN_CLASS}>{t('readingGuideSummary')}</summary>
          <p className="mt-1.5 text-xs leading-relaxed text-unjong-muted">{t.rich('readingGuide', {
            b: (c) => <b className="text-unjong-primary">{c}</b>,
            v: (c) => <span className="text-unjong-accent">{c}</span>,
            w: (c) => <span className="text-amber-400">{c}</span>,
            r: (c) => <span className="text-unjong-muted">{c}</span>,
            f: (c) => <span className="text-amber-400">{c}</span>,
          })}</p>
        </details>
      </div>

      {loading ? (
        <div className="mt-4 max-w-4xl space-y-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-unjong-background" />)}
        </div>
      ) : lenses.length === 0 && !data?.fscore ? (
        <p className="mt-6 text-center text-sm text-unjong-muted">{t('loadError')}</p>
      ) : (
        <div className="mt-4 max-w-4xl">
          <StockBrief symbol={symbol} />
          {lenses.length ? <HorizonStrip lenses={lenses} fscore={data?.fscore ?? null} /> : null}
          {isKR ? <KrEventLayer symbol={symbol} /> : isJP ? <JpEventLayer symbol={symbol} /> : isGB ? <GbEventLayer symbol={symbol} /> : isVN ? <VnEventLayer symbol={symbol} /> : isCN ? <CnEventLayer symbol={symbol} /> : <EventLayer events={events} symbol={symbol} />}
          <StockNewsBrief symbol={symbol} />{/* R3: KR 포함 전 국가 — 라우트가 KR이면 한글명·한국 뉴스로 분기 */}
          {(['short', 'mid', 'long'] as const).map((h) => {
            const group = lenses.filter((L) => L.horizon === h);
            const showFs = h === 'long' && !!(data && data.fscore);
            if (!group.length && !showFs) return null;
            return (
              <section key={h}>
                <div className="mb-2 mt-5 flex items-baseline gap-2">
                  <h2 className="text-sm font-bold text-unjong-primary">{t(H_TITLE[h])}</h2>
                  <span className="text-[11px] text-unjong-muted">{t(H_SUB[h])}</span>
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
