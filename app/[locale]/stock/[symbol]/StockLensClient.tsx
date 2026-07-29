'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation'; // useParams는 로케일 무관 — next/navigation 그대로
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { LENS_COPY, DETAIL_LABELS, pickLocale, lensQuestion, lensShortLabel, type Locale } from '@/lib/lensCopy';
import { AiLensBadge } from '@/components/AiLensBadge';
import { formatPrice, formatTradeValue } from '@/lib/currency';
import { TONE_DOT_CLASS as TONE_DOT, changeColorClass } from '@/lib/lensTones';
import { useAuthStore } from '@/stores/authStore';
import { AlertTriangle, Info, ExternalLink, Sparkles, Lock, ArrowLeft, Star } from 'lucide-react';

// 현재가 통화기호용 국가 코드(보드의 formatPrice 키와 동일 — KR/US/JP/HK/CN/VN/GB).
// 기존 isCN은 HK를 합쳐놔 formatPrice엔 못 씀(HK≠CN 통화) → 별도 도출.
const countryOf = (s: string) =>
  /^\d{6}(\.(KS|KQ))?$/i.test(s) ? 'KR'
  : /\.T$/i.test(s) ? 'JP'
  : /\.HK$/i.test(s) ? 'HK'
  : /\.(SS|SZ)$/i.test(s) ? 'CN'
  : /\.VN$/i.test(s) ? 'VN'
  : /\.L$/i.test(s) ? 'GB' : 'US';

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
  cutoffs?: { lo: number; hi: number } | null;
  cutSource?: { market: string; n: number; asOf: string | null } | null; // 컷 출처(STEP 805 §6)
  valueBasis?: 'ttm' | 'annual' | null; // PER 기준(STEP 809 §1)
  state?: string | null;
};
type FCriterion = { key: string; label: string; pass: boolean; note: string; group: string; plain: string };
type FScoreResp = { supported: boolean; reason?: string; score: number; max: number; grade: string; criteria: FCriterion[]; asOf?: string };
type LensResp = { symbol: string; name?: string; price?: number | null; changePercent?: number | null; tradeAmount?: number | null; lenses?: LensRead[]; fscore?: FScoreResp | null; error?: string };
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
        <span key={i} className={`flex-1 rounded-md border py-1 text-center text-[13px] sm:text-[12px] ${i === active ? `font-medium ${on}` : 'border-unjong-border text-unjong-muted'}`}>{l}</span>
      ))}
    </div>
  );
}

// 팩터 퍼센타일 게이지 — 시장 유니버스 대비 순위(0~100·오른쪽=우호 방향). 모집단 표현은 근거줄(시장별 라벨)이 단일 정본(STEP 809 §2). 팩터 5종 공통(Stockopedia식).
// 🔴 STEP 810 §3·§4 / 819 §2: '수익 우호' 축으로 셀 수 있는 렌즈(수익 신호 검증된 것)만. 저변동(위험 축)·기술(참고용)·F-스코어(건전성 축)는 제외.
//   종합 닫는 카드(returnEvidence·강점 나열)와 시간축 장기 칸이 **같은 모집단**을 쓰도록 모듈 상수로 공유(페이지 내 집계 불일치 방지).
const RETURN_LENS = new Set(['momentum', 'valuation', 'quality', 'assetgrowth']);

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
      <div className="mt-1 flex justify-between text-[13px] sm:text-[11px] text-unjong-muted"><span>{lo}</span><span>{hi}</span></div>
      <p className="mt-1 text-[13px] sm:text-[11px] text-unjong-muted">{t.rich('gauge.rank', { p, hi, v: (c) => <span className="tabular-nums text-unjong-primary">{c}</span> })}</p>
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
      <div className="mt-1 flex justify-between text-[13px] sm:text-[11px] text-unjong-muted"><span>{t('rsi.low')}</span><span>{t('rsi.mid')}</span><span>{t('rsi.high')}</span></div>
      <p className="mt-1 text-[13px] sm:text-[11px] leading-relaxed text-unjong-muted">{t.rich('rsi.line', { r: r ?? '—', zone, ma, v: (c) => <span className="tabular-nums text-unjong-primary">{c}</span> })}</p>
    </div>
  );
}

// 렌즈 이름/컷 문구 i18n 키 조회표(STEP 782/783) — 렌즈키→키 매핑만 다르고 로직은 공용(STEP 787에서 일반화·중복 제거).
const NARRATIVE_METHOD_KEY: Record<string, string> = {
  momentum: 'narrativeMethodMomentum', lowvol: 'narrativeMethodLowvol', valuation: 'narrativeMethodValuation',
  quality: 'narrativeMethodQuality', assetgrowth: 'narrativeMethodAssetgrowth', technical: 'narrativeMethodTechnical',
};
const NARRATIVE_CUTOFF_KEY: Record<string, string> = {
  momentum: 'narrativeCutoffMomentum', lowvol: 'narrativeCutoffLowvol', valuation: 'narrativeCutoffValuation',
  quality: 'narrativeCutoffQuality', assetgrowth: 'narrativeCutoffAssetgrowth', technical: 'narrativeCutoffTechnical',
};

// 렌즈 계산 서사(STEP 782/783 파일럿·확산 → STEP 787 상시 노출로 전환) — 접힘 제거, 카드 본문에 그대로.
// 결정론 템플릿만(LLM 금지) — 전부 이미 계산된 detail/percentile/cutoffs 재사용(새 계산 없음).
// 핵심 값 결측/미지원(state na 또는 null)이면 통째로 생략(정직 결측). 근거 줄은 L.detail 전량을 한 줄로 압축(772/783의 중복 목록·이중 %기호 표기를 여기서 정리).
// F-Score는 별도(FScoreCard 내부 — 9항목 중복 노출 금지·과적재 방지).
// 서사 렌더 가능 여부(STEP 789 §2) — LensNarrative 내부 게이트와 renderCard의 verdict.plain 안전망이 같은 조건을 공유해야
// "서사도 없고 안전망도 없어 본문이 비는" 케이스가 안 생긴다(예: na 상태는 outlook은 non-null이라도 서사는 없음).
function hasLensNarrative(L: LensRead): boolean {
  return !!NARRATIVE_METHOD_KEY[L.key] && !!L.state && L.state !== 'na';
}

function LensNarrative({ L, loc, market }: { L: LensRead; loc: Locale; market: string }) {
  const t = useTranslations('StockLens');
  const tMaterial = useTranslations('LensPreview');
  if (!hasLensNarrative(L)) return null;
  const methodKey = NARRATIVE_METHOD_KEY[L.key];
  const verdict = L.verdict?.phrase ?? null;
  const topPct = L.percentile != null ? Math.max(1, 100 - L.percentile) : null; // 최상위(percentile 100)가 "상위 0%"로 나오지 않게 최소 1%(STEP 802 §5)

  const stockLine = L.key === 'technical'
    ? (L.detail.ma200vs != null && verdict ? t('narrativeStockTechnical', { pct: L.detail.ma200vs, verdict }) : null)
    : (verdict ? (topPct != null ? t('narrativeStock', { pct: topPct, verdict }) : t('narrativeStockNoPctl', { verdict })) : null);

  // 근거 줄 — detail 전 항목(라벨에 %가 이미 포함돼 있어 값 뒤에 별도 % 안 붙임: "12-1모멘텀%: 458.2") + 백분위 + 판정 컷, 한 줄로.
  const evidenceParts = Object.entries(L.detail)
    .filter((entry): entry is [string, number] => entry[1] != null)
    .map(([k, v]) => `${detailLabel(loc, k)}: ${v}`);
  // §4(STEP 807): 백분위 모집단 라벨 = 시장별(US=시총 상위 ~1000 / KR=거래대금 상위). 시장에 맞게.
  if (topPct != null) evidenceParts.push(`${t(market === 'US' ? 'narrativePercentileLabelUs' : 'narrativePercentileLabel')}: ${t('narrativePercentile', { v: topPct })}`);
  const cutoffKey = NARRATIVE_CUTOFF_KEY[L.key];
  const r1 = (v: number) => Math.round(v * 10) / 10; // 컷 표시 반올림(분포 컷은 소수라)
  if (L.cutoffs && cutoffKey) evidenceParts.push(t(cutoffKey, { hi: r1(L.cutoffs.hi), lo: r1(L.cutoffs.lo) }));
  // STEP 805 §6: 실제 사용한 컷 출처(시장 분포·표본·기준일).
  if (L.cutSource) evidenceParts.push(t('narrativeCutSource', { market: L.cutSource.market, n: L.cutSource.n, date: L.cutSource.asOf ?? '—' }));

  return (
    <div className="mt-2.5 space-y-1.5">
      <p className="text-[14px] leading-7 text-unjong-primary/90">{t(methodKey)}{stockLine ? ` ${stockLine}` : ''}</p>
      <p className="text-[11px] leading-relaxed text-unjong-muted">{evidenceParts.join(' · ')}</p>
      {/* STEP 809 §1: PER 산출 기준 — 실제 사용값(TTM=야후 trailingPE / 연간=재무 폴백)에 맞게 문구 분기(거짓 단정 제거) */}
      {L.key === 'valuation' && L.detail.per != null && L.valueBasis ? (
        <p className="text-[11px] text-unjong-muted">{t(L.valueBasis === 'ttm' ? 'narrativePerBasisTtm' : 'narrativePerBasisAnnual')}</p>
      ) : null}
      {/* STEP 805 §4·807 §6: 검증 범위 — US는 백테스트 유니버스 '자신'이라 자체검증됨 / 비US(KR 등)는 "이 시장 자체검증 없음" / RSI·F-스코어는 고정 표준값 */}
      {L.cutSource ? <p className="text-[11px] text-unjong-muted">{t(market === 'US' ? 'narrativeScopeVerifiedUs' : 'narrativeScopeVerified')}</p> : null}
      {L.key === 'technical' ? <p className="text-[11px] text-unjong-muted">{t('narrativeScopeFixed')}</p> : null}
      <p className="text-[11px] text-unjong-muted">{tMaterial('material')}</p>
    </div>
  );
}

// 🔴 STEP 810 §1: "이 기법이 검증한 것" 블록 — 검증 범위·알려진 한계·적용 조건(원전 기반 정적 카피). 로그인 게이트 밖(무료).
function ScopeBlock({ lensKey, loc }: { lensKey: string; loc: Locale }) {
  const t = useTranslations('StockLens');
  const copy = (LENS_COPY[loc] as Record<string, { scope?: { verified: string; failure: string; when: string } }>)[lensKey];
  const scope = copy?.scope;
  if (!scope) return null;
  return (
    <div className="border-t border-unjong-border bg-unjong-background/40 px-4 py-3.5">
      <p className="mb-2 text-[12px] font-bold text-unjong-primary">{t('scopeTitle')}</p>
      <dl className="space-y-2 text-[13px] sm:text-[12px] leading-relaxed">
        <div><dt className="font-semibold text-unjong-primary">{t('scopeVerified')}</dt><dd className="text-unjong-muted">{scope.verified}</dd></div>
        <div><dt className="font-semibold text-unjong-primary">{t('scopeFailure')}</dt><dd className="text-unjong-muted">{scope.failure}</dd></div>
        <div><dt className="font-semibold text-unjong-primary">{t('scopeWhen')}</dt><dd className="text-unjong-muted">{scope.when}</dd></div>
      </dl>
    </div>
  );
}

// 시간축 스트립 — 단기(RSI)·중기(모멘텀 퍼센타일)·장기(팩터 묶음+개수). 각 칸 자기 축으로 정직하게(하나로 안 뭉침).
function HorizonStrip({ lenses }: { lenses: LensRead[] }) {
  const t = useTranslations('StockLens');
  const find = (k: string) => lenses.find((L) => L.key === k) || null;
  const tech = find('technical');
  const mom = find('momentum');
  // STEP 808 §5: pending·na(판정 아님)는 시간축 집계에서 제외 — pending verdict.tone이 'flat'이라 "중립"으로 새던 것 차단.
  const scored = (L: LensRead | null | undefined): boolean => !!L && L.state !== 'pending' && L.state !== 'na';
  // 🔴 STEP 819 §2-1: 장기 칸의 '우호' 집계는 닫는 카드(810 §4)와 동일하게 **수익 렌즈만**(밸류·퀄리티·자산성장).
  //   저변동(위험 축)·F-스코어(건전성 축)는 '수익 우호'로 세지 않는다(범주 오류 제거·같은 페이지 모집단 통일). 각 렌즈는 자기 카드에 그대로 표시됨.
  const longs = lenses.filter((L) => L.horizon === 'long' && RETURN_LENS.has(L.key) && scored(L));

  const rsiV = tech?.detail?.rsi14 != null ? Math.round(tech.detail.rsi14 as number) : null;
  const sWord = rsiV == null ? '—' : rsiV >= 70 ? t('word.overbought') : rsiV <= 30 ? t('word.oversold') : t('word.neutral');
  const sTone = rsiV != null && (rsiV >= 70 || rsiV <= 30) ? 'warn' : 'flat';

  const mTone = scored(mom) ? (mom?.verdict?.tone ?? 'flat') : 'flat'; // pending/na 모멘텀은 중기 축을 '중립'으로 세지 않음
  // STEP 809 §3: 중기 축=모멘텀(분포 순위·상대)이라 "강세/약세"(절대) 금지 → "상위권/하위권/중간권"으로 카드 verdict와 정합.
  const mWord = !scored(mom) ? '—' : mTone === 'pos' ? t('word.topRank') : mTone === 'warn' ? t('word.bottomRank') : t('word.neutral');

  const longPills = longs.map((L) => ({ label: L.name, tone: L.verdict?.tone ?? 'flat' })); // longs는 이미 scored+RETURN_LENS 필터됨
  // STEP 819 §2-1: F-스코어는 '수익 우호' 축이 아니라 장기 칸 집계에서 제외(닫는 카드와 동일 규칙) — F-스코어 카드에 그대로 표시됨.
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
            <span className="text-sm font-bold text-unjong-primary">{t('horizon.short')} <span className="text-[13px] sm:text-[11px] font-normal text-unjong-muted">{t('horizon.shortSub')}</span></span>
            <span className="rounded bg-unjong-background px-1.5 py-0.5 text-[13px] sm:text-[10px] text-unjong-muted">{t('horizon.refBadge')}</span>
          </div>
          <div className="mt-0.5 text-[13px] sm:text-[11px] text-unjong-muted">{t('horizon.techRsi')}</div>
          <div className="relative mt-2 h-2">
            <div className="flex h-2 overflow-hidden rounded-full"><div className="bg-unjong-down/25" style={{ width: '30%' }} /><div className="bg-unjong-background" style={{ width: '40%' }} /><div className="bg-amber-400/45" style={{ width: '30%' }} /></div>
            {rsiV != null ? <div className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${rsiV >= 70 ? 'bg-amber-400' : rsiV <= 30 ? 'bg-unjong-down' : 'bg-unjong-muted'}`} style={{ left: `${rsiV}%` }} /> : null}
          </div>
          <p className={`mt-2 text-[13px] sm:text-[12px] font-medium ${toneText(sTone)}`}>{sWord}{rsiV != null ? <span className="font-normal text-unjong-muted">{t('horizon.rsiSuffix', { v: rsiV })}</span> : null}</p>
        </div>
        {/* 중기 */}
        <div className="rounded-xl border border-unjong-border bg-unjong-background/40 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-unjong-primary">{t('horizon.mid')} <span className="text-[13px] sm:text-[11px] font-normal text-unjong-muted">{t('horizon.midSub')}</span></span>
            <span className={`rounded px-1.5 py-0.5 text-[13px] sm:text-[10px] ${mom ? gradeBadgeClass(mom.gradeTier) : 'bg-unjong-background text-unjong-muted'}`}>{mom?.grade ?? '—'}</span>
          </div>
          <div className="mt-0.5 text-[13px] sm:text-[11px] text-unjong-muted">{t('horizon.momentum')}</div>
          {mom?.percentile != null ? (
            <div className="relative mt-2 h-2 rounded-full bg-unjong-background">
              <div className={`absolute left-0 top-0 h-2 rounded-full ${mTone === 'pos' ? 'bg-unjong-accent/25' : mTone === 'warn' ? 'bg-amber-400/45' : 'bg-unjong-border'}`} style={{ width: `${mom.percentile}%` }} />
              <div className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${mTone === 'pos' ? 'bg-unjong-accent' : mTone === 'warn' ? 'bg-amber-400' : 'bg-unjong-muted'}`} style={{ left: `${mom.percentile}%` }} />
            </div>
          ) : <div className="mt-2 h-2 rounded-full bg-unjong-background" />}
          <p className={`mt-2 text-[13px] sm:text-[12px] font-medium ${toneText(mTone)}`}>{mWord}{mom?.percentile != null ? <span className="font-normal text-unjong-muted">{t('horizon.topPct', { v: Math.max(1, 100 - mom.percentile) })}</span> : null}</p>
        </div>
        {/* 장기 */}
        <div className="rounded-xl border border-unjong-border bg-unjong-background/40 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-unjong-primary">{t('horizon.long')} <span className="text-[13px] sm:text-[11px] font-normal text-unjong-muted">{t('horizon.longSub')}</span></span>
            <span className="rounded bg-unjong-background px-1.5 py-0.5 text-[13px] sm:text-[10px] text-unjong-muted">{t('horizon.factorBadge')}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {longPills.length ? longPills.map((p, i) => <span key={i} className={`rounded-full px-1.5 py-0.5 text-[13px] sm:text-[10px] font-medium ${pillClass(p.tone)}`}>{p.label}</span>) : <span className="text-[13px] sm:text-[11px] text-unjong-muted">—</span>}
          </div>
          {longPills.length ? <p className={`mt-2 text-[13px] sm:text-[12px] font-medium ${toneText(lTone)}`}>{lWord} <span className="font-normal text-unjong-muted">{t('horizon.favCount', { total: longPills.length, fav: favN })}</span></p> : null}
        </div>
      </div>
      <div className="mt-2.5 rounded-lg bg-unjong-background px-3 py-2 text-[13px] sm:text-[12px] leading-relaxed text-unjong-muted">
        {/* STEP 809 §3: 세 축 톤이 실제로 갈릴 때만 "결이 달라요" — 동일하면 "비슷하게 정렬" (무조건 '달라요' 거짓 제거). */}
        {t.rich(new Set([sTone, mTone, lTone]).size > 1 ? 'horizon.summary' : 'horizon.summarySame', {
          short: sWord, mid: mWord, long: lWord,
          s: (c) => <b className={toneText(sTone)}>{c}</b>,
          m: (c) => <b className={toneText(mTone)}>{c}</b>,
          l: (c) => <b className={toneText(lTone)}>{c}</b>,
        })}
      </div>
    </div>
  );
}

const SUMMARY_CLASS = 'cursor-pointer list-none text-[13px] sm:text-[11px] text-unjong-muted hover:text-unjong-accent [&::-webkit-details-marker]:hidden';

// 렌즈 플래그 칩(헤더) — A 있으면 ⚠️ 자료 갱신 우선, 아니면 📌 새 소식.
function FlagChip({ flags }: { flags?: Flag[] }) {
  const t = useTranslations('StockLens');
  if (!flags?.length) return null;
  const a = flags.some((x) => x.klass === 'A');
  return <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[13px] sm:text-[10px] font-medium ${a ? 'bg-amber-400/10 text-amber-300' : 'bg-unjong-accent/10 text-unjong-accent'}`}>{a ? <AlertTriangle size={10} /> : <Info size={10} />}{a ? t('flag.update') : t('flag.news')}</span>;
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
          <p className="flex items-center gap-1 text-[13px] sm:text-[11px] font-medium text-amber-300"><AlertTriangle size={11} /> {t('flag.aTitle')}</p>
          {aFlags.map((f, i) => <p key={i} className="mt-0.5 text-[13px] sm:text-[11px] text-unjong-muted">{f.date} · {f.label}</p>)}
        </div>
      ) : null}
      {bFlags.length ? (
        <div className="rounded-lg border border-unjong-accent/30 bg-unjong-accent/5 px-2.5 py-2">
          <p className="flex items-center gap-1 text-[13px] sm:text-[11px] font-medium text-unjong-accent"><Info size={11} /> {t('flag.bTitle')}</p>
          {bFlags.map((f, i) => <p key={i} className="mt-0.5 text-[13px] sm:text-[11px] text-unjong-muted">{f.date} · {f.label}</p>)}
        </div>
      ) : null}
      <p className="text-[13px] sm:text-[10px] text-unjong-muted">{t('flag.source')}</p>
    </div>
  );
}

function FScoreCard({ f, flags }: { f: FScoreResp; flags?: Flag[] }) {
  const t = useTranslations('StockLens');
  const tMaterial = useTranslations('LensPreview');
  const locale = pickLocale(useLocale()); // 렌즈 카피는 언어별 맵 — ko 고정하면 en 화면에 한국어가 샌다
  const [open, setOpen] = useState(false);
  if (!f.supported) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface p-4 shadow-sm">
        <p className="text-[15px] font-medium text-unjong-primary">{lensQuestion(locale, 'fscore')}</p>
        <p className="mt-0.5 text-[11px] text-unjong-muted">{LENS_COPY[locale].fscore.name} · Piotroski F-Score</p>
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
          <p className="text-[15px] font-medium text-unjong-primary">{lensQuestion(locale, 'fscore')}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="text-[11px] text-unjong-muted">{LENS_COPY[locale].fscore.name} · Piotroski F-Score</span>
            <FlagChip flags={flags} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="whitespace-nowrap rounded bg-amber-400/10 px-1.5 py-0.5 text-[13px] sm:text-[11px] font-medium text-amber-300">{t('fscore.badge')}</span>
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-unjong-border bg-unjong-surface text-unjong-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
          </span>
        </div>
      </button>
      {/* STEP 819 §1: F-스코어도 다른 6렌즈와 동일하게 scope(검증 범위·한계·조건)를 노출 — 로그인 게이트 밖(무료). 818이 쓴 scope가 dead copy였던 것 수정. */}
      {open ? <ScopeBlock lensKey="fscore" loc={locale} /> : null}
      {open ? (
        <div className="border-t border-unjong-border bg-unjong-background/50 px-4 pb-4 pt-3.5">
          <FlagBox flags={flags} />
          {/* 판정 — 9칸 트래커 + 점수 */}
          <div className="mt-3.5 flex items-center justify-between gap-3">
            <div className="flex flex-1 gap-[3px]" style={{ maxWidth: 240 }}>
              {Array.from({ length: f.max }, (_, i) => (
                <span key={i} className={`h-3 flex-1 rounded-sm ${i < f.score ? 'bg-unjong-accent' : 'border border-unjong-border bg-unjong-background'}`} />
              ))}
            </div>
            <span className="whitespace-nowrap text-base font-bold text-unjong-primary">{f.score}<span className="text-[13px] sm:text-xs font-normal text-unjong-muted"> / {f.max}</span></span>
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
                      <span className="text-[13px] sm:text-[12px] font-medium text-unjong-primary">{g.label} <span className="font-normal text-unjong-muted">{g.sub}</span></span>
                      <span className="text-[13px] sm:text-[11px] text-unjong-muted">{t.rich('fscore.passed', {
                        passed,
                        total: items.length,
                        n: (c) => <span className={passed > 0 ? 'font-medium text-unjong-accent' : 'font-medium text-amber-400'}>{c}</span>,
                      })}</span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {items.map((c) => (
                        <div key={c.key} className="flex items-baseline gap-1.5 text-[13px] sm:text-[12px]">
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
                <p className="text-[13px] sm:text-[12px] leading-relaxed text-unjong-muted">{t.rich('fscore.howToReadBody', { s: (c) => <span className="text-unjong-primary">{c}</span> })}</p>
              </div>
              <div>
                <p className="text-[11.5px] font-medium text-unjong-primary">{t('fscore.whyFinHealth')}</p>
                <p className="text-[13px] sm:text-[12px] leading-relaxed text-unjong-muted">{t.rich('fscore.whyFinHealthBody', { s: (c) => <span className="text-unjong-primary">{c}</span> })}</p>
              </div>
            </div>
          </details>

          {/* 렌즈 계산 서사(STEP 787 — 상시 노출, 접힘 제거). 9항목은 위에 이미 있으니 중복 노출 없이 서사만(과적재 금지). */}
          <div className="mt-2.5 space-y-1.5 border-t border-unjong-border pt-2.5">
            <p className="text-[14px] leading-7 text-unjong-primary/90">
              {t('narrativeMethodFscore')}{' '}{t('narrativeStockFscore', { score: f.score, max: f.max, band })}
            </p>
            <p className="text-[11px] text-unjong-muted">{tMaterial('material')}</p>
          </div>
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

// ── 공시 카드 정리(STEP 792) — 6개국(KR/JP/GB/CN/VN/US) 공용 원료 ──────────────────────────────
// 배경: 공시 행이 마운트 즉시 요약 API를 호출해 페이지 로드 시 LLM 호출이 건수만큼(최대 6~7회) 나가고,
// 요약이 한꺼번에 펼쳐져 텍스트 벽이 됐다. 온디맨드(펼칠 때 1회만)+기본 5건+동일날짜·제목 그룹핑으로 해결.
type NormalizedFiling = {
  key: string;
  title: string; // 트림 전 원본 — 표시는 항상 trimTitle() 거침(원본 데이터 자체는 불변)
  date: string; // 그룹핑 키(국가별 포맷 그대로 — 정확히 같을 때만 묶어 과다묶임 방지)
  dateLabel: string; // 화면 표시용(국가별 포맷 적용 완료)
  href: string;
  material?: boolean;
  extraSub?: string; // JP reason처럼 제목 아래 보조 한 줄
  summaryUrl: string | null; // null=요약 불가(원문 식별자 없음 등) → 펼쳐도 조용히 숨김
};

function trimTitle(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}

// 같은 (키) 값을 가진 항목을 대표(rep)+나머지(extra)로 묶는다 — "임의 dedupe 금지": 건수는 그대로 보존하고 표시만 묶음.
function groupByKey<T>(items: T[], keyFn: (t: T) => string): { rep: T; extra: T[] }[] {
  const groups: { rep: T; extra: T[] }[] = [];
  const index = new Map<string, number>();
  for (const it of items) {
    const k = keyFn(it);
    const gi = index.get(k);
    if (gi != null) groups[gi].extra.push(it);
    else { index.set(k, groups.length); groups.push({ rep: it, extra: [] }); }
  }
  return groups;
}

type SummaryState = { state: 'idle' | 'loading' | 'done' | 'error'; text: string };
// 펼칠 때 최초 1회만 fetch — fetchedRef가 재펼침 시 재호출을 막는다(닫아도 이 컴포넌트는 언마운트되지 않음 = 상태 보존).
function useOnDemandSummaries(urls: (string | null)[], open: boolean): SummaryState[] {
  const fetchedRef = useRef<boolean[]>(urls.map(() => false));
  const [states, setStates] = useState<SummaryState[]>(() => urls.map(() => ({ state: 'idle', text: '' })));
  useEffect(() => {
    if (!open) return;
    urls.forEach((url, idx) => {
      if (fetchedRef.current[idx]) return;
      fetchedRef.current[idx] = true;
      if (!url) { setStates((prev) => { const n = [...prev]; n[idx] = { state: 'error', text: '' }; return n; }); return; }
      setStates((prev) => { const n = [...prev]; n[idx] = { state: 'loading', text: '' }; return n; });
      fetch(url).then((r) => r.json())
        .then((j) => { setStates((prev) => { const n = [...prev]; n[idx] = j.summary ? { state: 'done', text: j.summary } : { state: 'error', text: '' }; return n; }); })
        .catch(() => { setStates((prev) => { const n = [...prev]; n[idx] = { state: 'error', text: '' }; return n; }); });
    });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  return states;
}

// 공시 원문 AI 요약 표시 전용 — fetch는 useOnDemandSummaries가 담당, 여긴 상태만 그린다.
function SummaryBox({ s }: { s: SummaryState }) {
  const t = useTranslations('StockLens');
  if (s.state === 'error') return null;
  return (
    <div className="mt-1.5 rounded-lg bg-unjong-accent/5 px-2.5 py-2">
      <div className="mb-1 flex items-center gap-1">
        <Sparkles size={11} className="text-unjong-accent" />
        <span className="text-[13px] sm:text-[10px] font-medium text-unjong-accent">{t('ai.summary')}</span>
        <span className="ml-auto text-[13px] sm:text-[10px] text-unjong-muted">{t('ai.fromSource')}</span>
      </div>
      {s.state === 'loading' || s.state === 'idle'
        ? <p className="text-[13px] sm:text-[11px] text-unjong-muted">{t('ai.reading')}</p>
        : <p className="text-[13px] sm:text-[12px] leading-relaxed text-unjong-primary">{s.text}</p>}
    </div>
  );
}

// 공시 1행(또는 동일날짜·동일제목 그룹) — 온디맨드 펼침(44px 토글). 링크(제목 영역)와 펼침(토글 버튼)을 형제로 분리해
// 클릭 충돌 없음. KR/JP/GB/CN/VN 5개국 공용(US는 defs 다중분류 구조가 달라 별도 UsMaterialRow).
function FilingRow({ group, materialLabel }: { group: { rep: NormalizedFiling; extra: NormalizedFiling[] }; materialLabel?: string }) {
  const t = useTranslations('StockLens');
  const items = [group.rep, ...group.extra];
  const [open, setOpen] = useState(false);
  const states = useOnDemandSummaries(items.map((it) => it.summaryUrl), open);
  const rep = group.rep;
  const isGroup = group.extra.length > 0;
  const isMaterial = materialLabel !== undefined && items.some((it) => it.material);
  const dotClass = materialLabel !== undefined ? (isMaterial ? 'bg-unjong-accent' : 'bg-unjong-muted/40') : 'bg-unjong-accent';
  return (
    <li>
      <div className="flex items-start gap-2 rounded-lg border border-unjong-border">
        <a href={rep.href} target="_blank" rel="noopener noreferrer nofollow" className="group flex min-w-0 flex-1 items-start gap-2 px-2.5 py-2 transition-colors hover:bg-unjong-background/40">
          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium leading-snug text-unjong-primary">
              {trimTitle(rep.title)}
              {isMaterial ? <span className="ml-1.5 rounded bg-unjong-accent/10 px-1 py-0.5 text-[13px] sm:text-[10px] font-semibold text-unjong-accent">{materialLabel}</span> : null}
              {isGroup ? <span className="ml-1.5 rounded bg-unjong-background px-1 py-0.5 text-[13px] sm:text-[10px] text-unjong-muted">{t('events.groupCount', { n: items.length })}</span> : null}
            </p>
            {rep.extraSub ? <p className="mt-0.5 truncate text-[13px] sm:text-[11px] text-unjong-muted">{rep.extraSub}</p> : null}
            <p className="mt-0.5 text-[13px] sm:text-[11px] text-unjong-muted">{rep.dateLabel}</p>
          </div>
          <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={t('events.expandAria')} className="flex h-11 w-11 shrink-0 items-center justify-center text-unjong-muted hover:text-unjong-accent">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </div>
      {open ? (
        <div className="space-y-1.5 py-1.5 pl-1">
          {items.map((it, idx) => (
            <div key={it.key}>
              {isGroup ? <a href={it.href} target="_blank" rel="noopener noreferrer nofollow" className="text-[13px] sm:text-[11px] font-medium text-unjong-accent hover:underline">{t('events.original', { n: idx + 1 })}</a> : null}
              <SummaryBox s={states[idx]} />
            </div>
          ))}
        </div>
      ) : null}
    </li>
  );
}

// 5개국(KR/JP/GB/CN/VN) 공용 공시 카드 — 기본 5건+더보기, 동일날짜·제목 그룹핑, 요약 온디맨드.
function FilingsCard({ titleLabel, srcLabel, noticeNode, footerText, items, materialLabel, emptyNode }: {
  titleLabel: string; srcLabel: string; noticeNode: ReactNode; footerText: string; items: NormalizedFiling[]; materialLabel?: string; emptyNode?: ReactNode;
}) {
  const t = useTranslations('StockLens');
  const [expanded, setExpanded] = useState(false);
  // 빈 상태 안내(emptyNode)가 있으면 0건이어도 "공시 없음" 카드를 띄운다(정직한 결측·STEP 795 §5). 없으면 기존처럼 숨김(로딩 실패 등).
  if (!items.length && !emptyNode) return null;
  const groups = groupByKey(items, (it) => it.date + '|' + trimTitle(it.title));
  const visible = expanded ? groups : groups.slice(0, 5);
  const remaining = groups.length - 5;
  return (
    <div className="mt-3 rounded-2xl border border-unjong-border bg-unjong-surface p-3.5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-unjong-primary">{titleLabel}</span>
        <span className="text-[13px] sm:text-[11px] text-unjong-muted">{srcLabel}</span>
      </div>
      {items.length ? (
        <>
          {/* noticeNode("아직 렌즈에 안 반영된 최신 공시")는 공시가 있다는 전제 — 0건일 땐 출력 금지(STEP 797 §1). */}
          <p className="mt-0.5 text-[13px] sm:text-[11px] leading-relaxed text-unjong-muted">{noticeNode}</p>
          <ul className="mt-2.5 space-y-1.5">
            {visible.map((g) => <FilingRow key={g.rep.key} group={g} materialLabel={materialLabel} />)}
          </ul>
          {!expanded && remaining > 0 ? (
            <button type="button" onClick={() => setExpanded(true)} className="mt-2 text-[13px] sm:text-[11px] font-medium text-unjong-accent hover:underline">
              {t('events.showMore', { n: remaining })}
            </button>
          ) : null}
        </>
      ) : (
        <p className="mt-2.5 rounded-lg border border-unjong-border bg-unjong-background/40 px-2.5 py-2 text-[13px] sm:text-[12px] text-unjong-muted">{emptyNode}</p>
      )}
      <p className="mt-2 text-[13px] sm:text-[10px] leading-relaxed text-unjong-muted">{footerText}</p>
    </div>
  );
}

// STEP 595: KR 공시 이벤트 층(DART). US EventLayer(EDGAR)의 KR 짝.
type KrEvent = { date: string; report_nm: string; rcept_no: string; url: string };
function KrEventLayer({ symbol }: { symbol: string }) {
  const t = useTranslations('StockLens');
  const locale = pickLocale(useLocale()); // 공시요약도 로케일별 생성·캐시(?lang=) — 안 넘기면 en 화면에 한국어 요약이 온다
  const [events, setEvents] = useState<KrEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/kr-events?symbol=' + encodeURIComponent(symbol))
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((j) => { if (!alive) return; if (j.error) { setError(true); setLoaded(true); return; } setEvents(j.events || []); setLoaded(true); }) // error(fetch_failed·unsupported)면 숨김(STEP 797)
      .catch(() => { if (alive) { setError(true); setLoaded(true); } });
    return () => { alive = false; };
  }, [symbol]);
  if (!loaded || error) return null;
  const fmtD = (s: string) => (/^\d{8}$/.test(s) ? `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}` : s);
  const items: NormalizedFiling[] = events.map((e, i) => ({
    key: e.rcept_no || String(i),
    title: e.report_nm,
    date: e.date,
    dateLabel: fmtD(e.date),
    href: e.url,
    summaryUrl: /^\d{14}$/.test(e.rcept_no) ? '/api/kr-events/summary?' + new URLSearchParams({ rcept: e.rcept_no, symbol, nm: e.report_nm, lang: locale }).toString() : null,
  }));
  return (
    <FilingsCard
      titleLabel={t('events.recentFilings')}
      srcLabel={t('events.srcDart')}
      noticeNode={t.rich('events.notReflected', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
      footerText={t('events.goDart')}
      items={items}
      emptyNode={t.rich('events.noMaterial', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
    />
  );
}

// STEP 650: JP 공시 이벤트 층(EDINET·미리계산). US EventLayer(EDGAR)·KR KrEventLayer(DART)의 JP 짝.
// 원문 = /api/jp-events/doc 프록시(키 서버측 PDF).
type JpEvent = { doc_id: string; title: string; date: string; reason: string | null; material: boolean; type_code: string | null };
function JpEventLayer({ symbol }: { symbol: string }) {
  const t = useTranslations('StockLens');
  const locale = pickLocale(useLocale()); // 공시요약도 로케일별 생성·캐시(?lang=) — 안 넘기면 en 화면에 한국어 요약이 온다
  const [events, setEvents] = useState<JpEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/jp-events?symbol=' + encodeURIComponent(symbol))
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((j) => { if (!alive) return; if (j.error) { setError(true); setLoaded(true); return; } setEvents(j.events || []); setLoaded(true); }) // error(fetch_failed·unsupported)면 숨김(STEP 797)
      .catch(() => { if (alive) { setError(true); setLoaded(true); } });
    return () => { alive = false; };
  }, [symbol]);
  if (!loaded || error) return null;
  const fmtD = (s: string) => { const d = new Date(s); return isNaN(+d) ? s : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
  const items: NormalizedFiling[] = events.map((e) => ({
    key: e.doc_id,
    title: e.title,
    date: e.date,
    dateLabel: fmtD(e.date),
    href: `/api/jp-events/doc?docid=${encodeURIComponent(e.doc_id)}`,
    material: e.material,
    extraSub: e.reason ?? undefined,
    summaryUrl: '/api/jp-events/summary?' + new URLSearchParams({ docid: e.doc_id, symbol, nm: e.title, lang: locale }).toString(),
  }));
  return (
    <FilingsCard
      titleLabel={t('events.recentFilings')}
      srcLabel={t('events.srcEdinet')}
      noticeNode={t.rich('events.notReflected', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
      footerText={t('events.goEdinet')}
      items={items}
      materialLabel={t('events.material')}
      emptyNode={t.rich('events.noMaterial', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
    />
  );
}

// STEP 653: GB 공시 이벤트 층(RNS via Investegate·온디맨드). US/KR/JP 이벤트층의 GB 짝.
// 제목은 영어(RNS 원문). 원문=Investegate 링크(귀속).
type GbEvent = { id: string; title: string; date: string; time: string; source: string; url: string; material: boolean };
function GbEventLayer({ symbol }: { symbol: string }) {
  const t = useTranslations('StockLens');
  const locale = pickLocale(useLocale()); // 공시요약도 로케일별 생성·캐시(?lang=) — 안 넘기면 en 화면에 한국어 요약이 온다
  const [events, setEvents] = useState<GbEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/gb-events?symbol=' + encodeURIComponent(symbol))
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((j) => { if (!alive) return; if (j.error) { setError(true); setLoaded(true); return; } setEvents(j.events || []); setLoaded(true); }) // error(fetch_failed·unsupported)면 숨김(STEP 797)
      .catch(() => { if (alive) { setError(true); setLoaded(true); } });
    return () => { alive = false; };
  }, [symbol]);
  if (!loaded || error) return null;
  const items: NormalizedFiling[] = events.map((e) => ({
    key: e.id,
    title: e.title,
    date: e.date,
    dateLabel: e.date,
    href: e.url,
    material: e.material,
    summaryUrl: '/api/gb-events/summary?' + new URLSearchParams({ url: e.url, symbol, nm: e.title, lang: locale }).toString(),
  }));
  return (
    <FilingsCard
      titleLabel={t('events.recentFilings')}
      srcLabel={t('events.srcRns')}
      noticeNode={t.rich('events.notReflected', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
      footerText={t('events.goRns')}
      items={items}
      materialLabel={t('events.material')}
      emptyNode={t.rich('events.noMaterial', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
    />
  );
}

type CnEvent = { id: string; title: string; date: string; source: string; url: string; pdf: string; material: boolean };
function CnEventLayer({ symbol }: { symbol: string }) {
  const t = useTranslations('StockLens');
  const locale = pickLocale(useLocale()); // 공시요약도 로케일별 생성·캐시(?lang=) — 안 넘기면 en 화면에 한국어 요약이 온다
  const [events, setEvents] = useState<CnEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/cn-events?symbol=' + encodeURIComponent(symbol))
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((j) => { if (!alive) return; if (j.error) { setError(true); setLoaded(true); return; } setEvents(j.events || []); setLoaded(true); }) // error(fetch_failed·unsupported)면 숨김(STEP 797)
      .catch(() => { if (alive) { setError(true); setLoaded(true); } });
    return () => { alive = false; };
  }, [symbol]);
  if (!loaded || error) return null;
  const items: NormalizedFiling[] = events.map((e) => ({
    key: e.id,
    title: e.title,
    date: e.date,
    dateLabel: e.date,
    href: e.url,
    material: e.material,
    summaryUrl: e.pdf ? '/api/cn-events/summary?' + new URLSearchParams({ pdf: e.pdf, symbol, nm: e.title, id: e.id, lang: locale }).toString() : null,
  }));
  const srcLabel = events[0]?.source === 'HKEXnews' ? t('events.srcHkex') : t('events.srcCninfo');
  const footerText = events[0]?.source === 'HKEXnews' ? t('events.goHkex') : t('events.goCninfo');
  return (
    <FilingsCard
      titleLabel={t('events.recentFilings')}
      srcLabel={srcLabel}
      noticeNode={t.rich('events.notReflected', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
      footerText={footerText}
      items={items}
      materialLabel={t('events.material')}
      emptyNode={t.rich('events.noMaterial', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
    />
  );
}
type VnEvent = { id: string; title: string; date: string; source: string; url: string; material: boolean };
function VnEventLayer({ symbol }: { symbol: string }) {
  const t = useTranslations('StockLens');
  const locale = pickLocale(useLocale()); // 공시요약도 로케일별 생성·캐시(?lang=) — 안 넘기면 en 화면에 한국어 요약이 온다
  const [events, setEvents] = useState<VnEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/vn-events?symbol=' + encodeURIComponent(symbol))
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((j) => { if (!alive) return; if (j.error) { setError(true); setLoaded(true); return; } setEvents(j.events || []); setLoaded(true); }) // error(fetch_failed·unsupported)면 숨김(STEP 797)
      .catch(() => { if (alive) { setError(true); setLoaded(true); } });
    return () => { alive = false; };
  }, [symbol]);
  if (!loaded || error) return null;
  const items: NormalizedFiling[] = events.map((e) => ({
    key: e.id,
    title: e.title,
    date: e.date,
    dateLabel: e.date,
    href: e.url,
    material: e.material,
    summaryUrl: '/api/vn-events/summary?' + new URLSearchParams({ url: e.url, symbol, nm: e.title, id: e.id, lang: locale }).toString(),
  }));
  return (
    <FilingsCard
      titleLabel={t('events.recentNews')}
      srcLabel={t('events.srcGnews')}
      noticeNode={t.rich('events.notReflectedNews', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
      footerText={t('events.goNews')}
      items={items}
      materialLabel={t('events.major')}
      emptyNode={t.rich('events.noRecentNews', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
    />
  );
}

// R3: 종목 최근 뉴스 요약 + 중립 토픽 태그(지연·조건부·헤드라인 없으면 숨김). 뉴스=사실 브리핑, 감성 점수 아님.
function StockNewsBrief({ symbol }: { symbol: string }) {
  const t = useTranslations('StockLens');
  const locale = pickLocale(useLocale()); // 뉴스요약도 로케일별 생성·캐시(?lang=) — 안 넘기면 en 화면에 한국어 요약이 온다
  const [d, setD] = useState<{ summary: string; tags: string[] } | null>(null);
  // STEP 809 §6: 실패(429·502·500)를 조용히 숨기지 않는다 — 진짜 '뉴스 없음'(200+summary:null)만 숨기고 실패는 결측 1줄(StockBrief와 동일).
  const [state, setState] = useState<'loading' | 'done' | 'hide' | 'error'>('loading');
  useEffect(() => {
    let alive = true;
    setState('loading');
    fetch('/api/news-brief?symbol=' + encodeURIComponent(symbol) + '&lang=' + locale)
      .then(async (r) => {
        const j = await r.json().catch(() => ({} as Record<string, unknown>));
        if (!alive) return;
        if (r.ok && j.summary) { setD({ summary: j.summary as string, tags: (j.tags as string[]) || [] }); setState('done'); }
        else if (r.ok && !j.error) setState('hide'); // 진짜 뉴스 없음(200·summary null·error 없음) → 숨김
        else setState('error'); // 429(레이트리밋)·502(LLM)·500(키) 등 → 실패 표시
      })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [symbol, locale]);
  if (state === 'hide') return null;
  return (
    <div className="mt-3 rounded-2xl border border-unjong-accent/20 bg-unjong-accent/5 p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Sparkles size={13} className="text-unjong-accent" />
        <span className="text-[13px] font-bold text-unjong-accent">{t('newsBrief.title')}</span>
        <span className="ml-auto text-[13px] sm:text-[10px] text-unjong-muted">{t('newsBrief.badge')}</span>
      </div>
      {state === 'error'
        ? <p className="text-[13px] sm:text-[12px] text-unjong-muted">{t('loadError')}</p>
        : state === 'loading' || !d
        ? <p className="text-[13px] sm:text-[12px] text-unjong-muted">{t('newsBrief.loading')}</p>
        : (<>
            <p className="text-[15px] leading-relaxed sm:text-[13px] text-unjong-primary">{d.summary}</p>
            {d.tags.length ? <div className="mt-2 flex flex-wrap gap-1.5">{d.tags.map((tag, i) => <span key={i} className="rounded-full border border-unjong-border bg-unjong-surface px-2 py-0.5 text-[13px] sm:text-[10px] text-unjong-muted">{tag}</span>)}</div> : null}
          </>)}
    </div>
  );
}

// R2: 종목 브리핑(지연 로드·하루 1회 캐시). LLM이 결정론 판정+공시 사실로 '핵심 긴장+지켜볼 것'을 1문단 — 예측·판정 아님.
function StockBrief({ symbol }: { symbol: string }) {
  const t = useTranslations('StockLens');
  const locale = pickLocale(useLocale()); // 브리핑도 로케일별 생성·캐시(?lang=) — 안 넘기면 en 화면에 한국어 브리핑이 온다
  const [brief, setBrief] = useState('');
  // STEP 797 §5: 실패를 무음 처리하지 않는다(공시는 "없어요"라 말하는데 브리핑만 사라지는 정책 불일치 제거).
  // nodata=데이터 자체 없음(생성 전·비대상)→숨김 / error=실패→결측 1줄(loadError 재사용).
  const [state, setState] = useState<'loading' | 'done' | 'error' | 'nodata'>('loading');
  useEffect(() => {
    let alive = true;
    setState('loading');
    fetch('/api/brief?symbol=' + encodeURIComponent(symbol) + '&lang=' + locale)
      .then((r) => r.json())
      .then((j) => { if (!alive) return; if (j.brief) { setBrief(j.brief); setState('done'); } else if (j.error === 'no_data') setState('nodata'); else setState('error'); })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [symbol, locale]);
  if (state === 'nodata') return null; // 데이터 자체가 없음(생성 전·비대상) — 숨김
  return (
    <div className="mb-3 rounded-2xl border border-unjong-accent/20 bg-unjong-accent/5 p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Sparkles size={14} className="text-unjong-accent" />
        <span className="text-[13px] font-bold text-unjong-accent">{t('brief.title')}</span>
        <span className="ml-auto text-[13px] sm:text-[10px] text-unjong-muted">{t('brief.badge')}</span>
      </div>
      {state === 'loading'
        ? <p className="text-[13px] sm:text-[12px] text-unjong-muted">{t('brief.loading')}</p>
        : state === 'error'
        ? <p className="text-[13px] sm:text-[12px] text-unjong-muted">{t('loadError')}</p>
        : <p className="text-[15px] leading-relaxed sm:text-[13px] text-unjong-primary">{brief}</p>}
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

// US 중대 이벤트(material) 1행(또는 동일날짜·동일라벨 그룹) — FilingRow의 US 짝. defs 다중분류(severity·item 배지·"왜")
// 구조가 5개국 공용 NormalizedFiling과 달라 별도 컴포넌트지만, 온디맨드 요약(useOnDemandSummaries)·SummaryBox·
// trimTitle·그룹 배지는 그대로 공유한다(STEP 792 — "추출이 위험하면 6벌 동일 수정" 조항에 따른 절충).
function UsMaterialRow({ group, symbol, locale }: { group: { rep: MatEvent; extra: MatEvent[] }; symbol: string; locale: string }) {
  const t = useTranslations('StockLens');
  const items = [group.rep, ...group.extra];
  const [open, setOpen] = useState(false);
  const buildUrl = (e: MatEvent): string | null =>
    accFromLink(e.link) ? '/api/events/summary?' + new URLSearchParams({ symbol, link: e.link, items: e.items.join(','), lang: locale }).toString() : null;
  const states = useOnDemandSummaries(items.map(buildUrl), open);
  const rep = group.rep;
  const d = rep.defs[0];
  if (!d) return null;
  const why = d.klass === 'A' ? t('events.whyA') : d.klass === 'B' ? t('events.whyB') : t('events.whyGeneral');
  const isGroup = group.extra.length > 0;
  return (
    <li>
      <div className="flex items-start gap-2 rounded-lg border border-unjong-border">
        <a href={rep.link} target="_blank" rel="noopener noreferrer nofollow" className="group flex min-w-0 flex-1 items-start gap-2 px-2.5 py-2 transition-colors hover:bg-unjong-background/40">
          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${sevDot(d.severity)}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="text-[13px] font-medium text-unjong-primary">{trimTitle(d.label)}</span>
              {rep.defs.length > 1 ? <span className="text-[13px] sm:text-[11px] text-unjong-muted">{t('events.andMore', { n: rep.defs.length - 1 })}</span> : null}
              <span className="rounded bg-unjong-background px-1 py-0.5 text-[13px] sm:text-[10px] text-unjong-muted">{rep.defs.map((x) => x.item).join('·')}</span>
              {isGroup ? <span className="rounded bg-unjong-background px-1 py-0.5 text-[13px] sm:text-[10px] text-unjong-muted">{t('events.groupCount', { n: items.length })}</span> : null}
            </div>
            <p className="mt-0.5 text-[13px] sm:text-[11px] text-unjong-muted">{rep.date} · {why}</p>
          </div>
          <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={t('events.expandAria')} className="flex h-11 w-11 shrink-0 items-center justify-center text-unjong-muted hover:text-unjong-accent">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </div>
      {open ? (
        <div className="space-y-1.5 py-1.5 pl-1">
          {items.map((e, idx) => (
            <div key={e.link + idx}>
              {isGroup ? <a href={e.link} target="_blank" rel="noopener noreferrer nofollow" className="text-[13px] sm:text-[11px] font-medium text-unjong-accent hover:underline">{t('events.original', { n: idx + 1 })}</a> : null}
              <SummaryBox s={states[idx]} />
            </div>
          ))}
        </div>
      ) : null}
    </li>
  );
}

function EventLayer({ events, symbol }: { events: MatEvent[]; symbol: string }) {
  const t = useTranslations('StockLens');
  const locale = pickLocale(useLocale()); // 공시요약도 로케일별 생성·캐시(?lang=) — 안 넘기면 en 화면에 한국어 요약이 온다
  const [showRoutine, setShowRoutine] = useState(false);
  const [expandedMaterial, setExpandedMaterial] = useState(false);
  if (!events.length) return null;
  const sevRank = (e: MatEvent) => e.defs.reduce((m, d) => Math.max(m, d.severity === 'serious' ? 2 : d.severity === 'watch' ? 1 : 0), 0);
  const material = events.filter((e) => sevRank(e) >= 1).sort((a, b) => sevRank(b) - sevRank(a)); // 중대(serious/watch)=기본 노출
  const routine = events.filter((e) => sevRank(e) === 0); // 루틴(info)=묶어 접힘(기존 그대로 — 이미 요약 자동호출 없었음)
  const groups: { label: string; count: number }[] = [];
  for (const e of routine) {
    const l = e.defs[0]?.label ?? t('events.etcLabel');
    const g = groups.find((x) => x.label === l);
    if (g) g.count += 1; else groups.push({ label: l, count: 1 });
  }
  const routineRow = (e: MatEvent, i: number) => {
    const d = e.defs[0];
    if (!d) return null;
    const why = d.klass === 'A' ? t('events.whyA') : d.klass === 'B' ? t('events.whyB') : t('events.whyGeneral');
    return (
      <li key={i}>
        <a href={e.link} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-start gap-2 rounded-lg border border-unjong-border px-2.5 py-2 transition-colors hover:bg-unjong-background/40">
          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${sevDot(d.severity)}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="text-[13px] font-medium text-unjong-primary">{trimTitle(d.label)}</span>
              {e.defs.length > 1 ? <span className="text-[13px] sm:text-[11px] text-unjong-muted">{t('events.andMore', { n: e.defs.length - 1 })}</span> : null}
              <span className="rounded bg-unjong-background px-1 py-0.5 text-[13px] sm:text-[10px] text-unjong-muted">{e.defs.map((x) => x.item).join('·')}</span>
            </div>
            <p className="mt-0.5 text-[13px] sm:text-[11px] text-unjong-muted">{e.date} · {why}</p>
          </div>
          <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
      </li>
    );
  };
  const materialGroups = groupByKey(material, (e) => e.date + '|' + trimTitle(e.defs[0]?.label ?? ''));
  const visibleMaterialGroups = expandedMaterial ? materialGroups : materialGroups.slice(0, 5);
  const remainingMaterial = materialGroups.length - 5;
  return (
    <div className="mt-3 rounded-2xl border border-unjong-border bg-unjong-surface p-3.5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-unjong-primary">{t('events.recentFilingsUs')}</span>
        <span className="text-[13px] sm:text-[11px] text-unjong-muted">{t('events.srcSec')}</span>
      </div>
      <p className="mt-0.5 text-[13px] sm:text-[11px] leading-relaxed text-unjong-muted">{t.rich('events.notReflected', { b: (c) => <b className="text-unjong-primary">{c}</b> })}</p>
      {material.length ? (
        <>
          <ul className="mt-2.5 space-y-1.5">{visibleMaterialGroups.map((g) => <UsMaterialRow key={g.rep.link} group={g} symbol={symbol} locale={locale} />)}</ul>
          {!expandedMaterial && remainingMaterial > 0 ? (
            <button type="button" onClick={() => setExpandedMaterial(true)} className="mt-2 text-[13px] sm:text-[11px] font-medium text-unjong-accent hover:underline">
              {t('events.showMore', { n: remainingMaterial })}
            </button>
          ) : null}
        </>
      ) : (
        <p className="mt-2.5 rounded-lg border border-unjong-border bg-unjong-background/40 px-2.5 py-2 text-[13px] sm:text-[12px] text-unjong-muted">{t.rich('events.noMaterial', { b: (c) => <b className="text-unjong-primary">{c}</b> })}</p>
      )}
      {routine.length ? (
        <div className="mt-2">
          <button type="button" onClick={() => setShowRoutine((v) => !v)} className="flex w-full items-center gap-1 text-left text-[13px] sm:text-[11px] text-unjong-muted hover:text-unjong-accent">
            <span className={`inline-block transition-transform ${showRoutine ? 'rotate-90' : ''}`}>▸</span>
            <span>{t('events.routine', { n: routine.length })} <span className="text-unjong-muted/80">· {groups.map((g) => `${g.label} ${g.count}`).join(' · ')}</span></span>
          </button>
          {showRoutine ? <ul className="mt-1.5 space-y-1.5">{routine.map((e, i) => routineRow(e, i))}</ul> : null}
        </div>
      ) : null}
      <p className="mt-2 text-[13px] sm:text-[10px] leading-relaxed text-unjong-muted">{t('events.goSec')}</p>
    </div>
  );
}

const H_TITLE: Record<string, string> = { short: 'horizon.short', mid: 'horizon.mid', long: 'horizon.long' };
const H_SUB: Record<string, string> = { short: 'horizon.shortSub', mid: 'horizon.midSub', long: 'horizon.longSub' };


// 상세 헤더 아이콘 전용 관심 별(STEP 771 §2) — 모바일 리스트 별 제거의 대체 진입점. market 관례=KR만 'KRX', 그 외는 country와 동일(보드 컴포넌트들과 동일 규칙).
function WatchStarToggle({ symbol, name, country }: { symbol: string; name: string; country: string }) {
  const tb = useTranslations('Board'); // '관심종목 추가/해제' 재사용(dedup)
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname(); // 로케일 무관 경로 — 로그인 후 이 종목으로 복귀(next)
  const [watched, setWatched] = useState<boolean | null>(null); // null=조회 전
  const [pop, setPop] = useState(false);
  const inFlight = useRef(false); // 연타 방지(STEP 804 §5)

  useEffect(() => {
    if (!user) { setWatched(false); return; }
    let alive = true;
    fetch('/api/watchlist').then((r) => r.json()).then((j) => {
      if (!alive) return;
      const set = new Set(((j.watchlist ?? []) as { symbol: string }[]).map((w) => w.symbol));
      setWatched(set.has(symbol));
    }).catch(() => { if (alive) setWatched(false); });
    return () => { alive = false; };
  }, [user, symbol]);

  function toggle() {
    if (authLoading) return; // 하이드레이션 중엔 판단 보류(로그인 사용자가 로그인 페이지로 튕기지 않게·STEP 804 §6)
    if (!user) { router.push(`/auth/login?next=${encodeURIComponent(pathname)}`); return; }
    if (inFlight.current) return; // 연타 방지
    inFlight.current = true;
    const next = !watched;
    setWatched(next);
    setPop(true);
    setTimeout(() => setPop(false), 200);
    const market = country === 'KR' ? 'KRX' : country;
    fetch('/api/watchlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, name_ko: name, market, country, add: next }),
    }).then((r) => { if (!r.ok) setWatched(!next); }) // 400(비대상 시장 거부 등) 응답은 throw하지 않아 res.ok로 별도 확인 필요(STEP 799)
      .catch(() => setWatched(!next))
      .finally(() => { inFlight.current = false; });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={watched ? tb('watchRemove') : tb('watchAdd')}
      className={`flex h-11 w-11 shrink-0 items-center justify-center transition-transform duration-200 ${pop ? 'scale-125' : 'scale-100'} ${watched ? 'text-unjong-accent' : 'text-unjong-muted'}`}
    >
      <Star size={24} fill={watched ? 'currentColor' : 'none'} />
    </button>
  );
}

export default function StockLensClient({ initialName }: { initialName?: string }) {
  const t = useTranslations('StockLens');
  const tf = useTranslations('Favorites'); // 헤더 요약 카운트·로딩 라벨 재사용(신규 키 없이 패리티 무리스크)
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
  const { user, isLoading: authLoading } = useAuthStore(); // 렌즈 카드 펼침(근거 상세) 로그인 게이트(STEP 760) — 접힘 상태는 비로그인에도 그대로

  useEffect(() => {
    if (!symbol) return;
    let alive = true;
    setLoading(true);
    setData(null); // 심볼·로케일 변경 시 옛 데이터 즉시 비움 — 실패해도 이전 종목 렌즈가 새 종목 화면에 남지 않게(STEP 800 §3)
    fetch('/api/lens?symbol=' + encodeURIComponent(symbol) + '&lang=' + locale)
      .then((r) => r.json())
      .then((j) => { if (alive) { setData(j); setLoading(false); } }) // 이전 요청 응답 무시(레이스)
      .catch(() => { if (alive) setLoading(false); }); // 실패 = loading 끝 + data null → 기존 loadError 경로
    return () => { alive = false; };
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

  // 헤더 압축 렌즈 요약(30초 글랜스) — WatchlistClient tone 추출과 동일 로직(pos/warn/flat + fscore).
  // STEP 802 §4: 결측(state==='na', 예: 은행 GP/A·적자 PER)은 verdict tone이 'flat'이라 예전엔 "보통 1표"로 섞였음
  // → "판단할 근거 없음"이 "중립으로 판단됨"으로 오독. 집계(헤더·닫는카드·시간축)에선 na를 세지 않고 개수만 따로 표기.
  const headerTones: ('pos' | 'warn' | 'flat')[] = [];
  let naCount = 0;
  let pendingCount = 0; // STEP 806 §2: 컷 없음(기준 준비 중)은 판정한 게 아니라 집계 제외 + 별도 표기
  for (const l of lenses) {
    // STEP 809 §6: 가격계열 부족(모멘텀 252봉·저변동 120봉 미만)이면 state=null(값도 null) — na와 함께 '결측'으로 세고(집계 제외) 카드에 명시 표시.
    if (l.state === 'na' || l.state == null) { naCount++; continue; } // 카드엔 "산출 불가"로 여전히 표시 · 집계에서만 제외
    if (l.state === 'pending') { pendingCount++; continue; } // '기준 준비 중'을 '보통'으로 세지 않음(자기모순 방지)
    const tone = l.verdict?.tone;
    if (tone === 'pos' || tone === 'warn' || tone === 'flat') headerTones.push(tone);
  }
  // STEP 829 §7: supported=true여도 score 없으면 0으로 날조 금지(804 §1 잔여·관심화면과 동일 버그) — 실수치일 때만 도트.
  if (data?.fscore?.supported && typeof data.fscore.score === 'number') {
    const score = data.fscore.score;
    headerTones.push(score >= 7 ? 'pos' : score <= 3 ? 'warn' : 'flat');
  }
  const headerPos = headerTones.filter((x) => x === 'pos').length;
  const headerWarn = headerTones.filter((x) => x === 'warn').length;
  const headerFlat = headerTones.filter((x) => x === 'flat').length;

  // "7가지 방법을 종합하면" 닫는 카드 재료(STEP 788) — 전부 이미 계산된 verdict.tone 재사용(새 계산 없음).
  // 카운트는 위 headerPos/Warn/Flat을 그대로 재사용해 상단 헤더와 100% 동일 보장(별도 계산 안 함).
  const closingPosLabels: string[] = [];
  const closingWarnLabels: string[] = [];
  const byHorizon: Record<'short' | 'mid' | 'long', ('pos' | 'warn' | 'flat')[]> = { short: [], mid: [], long: [] };
  // 🔴 STEP 810 §3·§4: 저변동·기술은 '수익 우호'가 아니라 종합 verdict·강점 나열에서 제외(범주 오류 방지). RETURN_LENS = 모듈 상수(819 §2·시간축과 공유).
  for (const l of lenses) {
    if (l.state === 'na' || l.state === 'pending') continue; // 결측·기준 준비 중 제외(STEP 802 §4·806 §2)
    if (!RETURN_LENS.has(l.key)) continue; // 저변동·기술 제외(수익 신호 아님)
    const tone = l.verdict?.tone;
    if (tone === 'pos') closingPosLabels.push(lensShortLabel(locale, l.key));
    else if (tone === 'warn') closingWarnLabels.push(lensShortLabel(locale, l.key));
    if (tone) byHorizon[l.horizon].push(tone);
  }
  // F-Score(재무 건전성)는 '수익 우호' 축이 아니라 종합 verdict에서 제외(§4 범주 오류 방지) — 개별 카드·헤더 카운트엔 그대로.
  const returnEvidence = byHorizon.short.length + byHorizon.mid.length + byHorizon.long.length; // 종합 판정을 뒷받침한 수익 렌즈 수(§4)
  function axisMajority(tones: ('pos' | 'warn' | 'flat')[]): 'pos' | 'warn' | 'flat' | null {
    if (!tones.length) return null;
    const pos = tones.filter((x) => x === 'pos').length;
    const warn = tones.filter((x) => x === 'warn').length;
    const flat = tones.length - pos - warn;
    if (pos > warn && pos > flat) return 'pos';
    if (warn > pos && warn > flat) return 'warn';
    return 'flat';
  }
  const shortAxisTone = axisMajority(byHorizon.short);
  const midAxisTone = axisMajority(byHorizon.mid);
  const longAxisTone = axisMajority(byHorizon.long);
  const closingAxes = [shortAxisTone, midAxisTone, longAxisTone].filter((x): x is 'pos' | 'warn' | 'flat' => x != null);
  // 분기 4개 + 혼재 폴백(총 5개) — 데이터 자체가 없으면(closingAxes 0) 문장 생략(정직 결측).
  // STEP 802 §4: 계산된 렌즈(na 제외)가 3개 미만이면 종합 판단을 내리지 않고 "근거 부족"으로(근거 1개로 '대체로 유리' 방지).
  // 🔴 STEP 810 §4: 종합 문장은 '수익 렌즈' 근거가 3개 이상일 때만 — 1~2개면 "근거 적어 종합 안 함"(기술 1개로 '짧게 보든' 방지).
  let closingSentenceKey: string | null = null;
  if (returnEvidence < 3) {
    closingSentenceKey = returnEvidence > 0 ? 'closingInsufficient' : null;
  } else if (closingAxes.length > 0) {
    if (closingAxes.every((x) => x === 'pos')) closingSentenceKey = 'closingAllPos';
    else if (closingAxes.every((x) => x === 'warn')) closingSentenceKey = 'closingAllWarn';
    else if (longAxisTone === 'pos' && (shortAxisTone === 'warn' || midAxisTone === 'warn')) closingSentenceKey = 'closingLongPosShortWarn';
    else if (longAxisTone === 'warn' && (shortAxisTone === 'pos' || midAxisTone === 'pos')) closingSentenceKey = 'closingLongWarnShortPos';
    else closingSentenceKey = 'closingMixed';
  }

  // 파트 헤더 목록 줄(STEP 791) — "7가지가 뭔지" 명시. 실제 렌더 순서(호라이즌 그룹 short→mid→long, 그룹 내부는
  // 카운트 = 실제 렌더되는 카드 수와 같은 소스에서 도출(STEP 798 §4). F-Score 카드는 supported가 아니어도
  // "데이터 부족" 카드로 렌더되므로(아래 showFs = !!(data&&data.fscore)), 라벨/개수도 그 조건과 동일하게 센다.
  // (예전엔 supported일 때만 세서 "6가지인데 카드 7장"·극단적으로 "0가지" 불일치가 났음.)
  const partHeaderLabels: string[] = [];
  (['short', 'mid', 'long'] as const).forEach((h) => {
    for (const l of lenses) {
      if (l.horizon === h) partHeaderLabels.push(lensShortLabel(locale, l.key));
    }
    if (h === 'long' && data?.fscore) partHeaderLabels.push(lensShortLabel(locale, 'fscore'));
  });
  const partHeaderCount = partHeaderLabels.length;

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
        {/* 초보 우선 헤더(STEP 787) — 질문형 제목 주연·학술명은 작은 앵커 줄로. 모바일=세로 2행·sm+=3열 그리드(786 구조 유지). */}
        <button type="button" onClick={() => toggleLens(L.key)} aria-expanded={isOpen} className="flex w-full flex-col gap-1.5 p-4 text-left transition-colors hover:bg-unjong-background/40 sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-x-3 sm:gap-y-0">
          <div className="flex items-center justify-between gap-3 sm:contents">
            <div className="min-w-0">
              <p className="text-[15px] font-medium text-unjong-primary">{lensQuestion(locale, L.key)}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="text-[11px] text-unjong-muted">{L.name} · {L.nameEn}</span>
                <FlagChip flags={cardFlags} />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:order-last sm:justify-self-end">
              <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[13px] sm:text-[11px] font-medium ${gradeBadgeClass(L.gradeTier)}`}>{L.grade}</span>
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-unjong-border bg-unjong-surface text-unjong-muted">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
              </span>
            </div>
          </div>
          <div className="min-w-0">
            {!isOpen && L.verdict ? (
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className={`text-[15px] font-bold ${verdictColor(L.verdict.tone)}`}>{L.verdict.phrase}</span>
                {L.headline ? <span className="text-[13px] sm:text-[12px] tabular-nums text-unjong-muted">{L.headline}</span> : null}
              </span>
            ) : null}
          </div>
        </button>
        {/* 🔴 STEP 810 §1: "이 기법이 검증한 것"(검증 범위·한계·조건) — 로그인 게이트 밖(무료). 가장 강한 주장의 단서를 무료로 공개. */}
        {isOpen ? <ScopeBlock lensKey={L.key} loc={locale} /> : null}
        {isOpen && !authLoading && !user ? ( // 하이드레이션 중 게이트 번쩍 방지(STEP 804 §6)
          <div className="border-t border-unjong-border bg-unjong-background/50 px-4 pb-4 pt-3.5">
            {/* 🔴 STEP 827 §3: 비로그인이 펼쳐도 판정·headline·읽는법은 유지(정보를 빼지 않는다) — 게이트는 근거 상세(서사·컷·detail)에만. 810 §1 비대칭 제거와 같은 방향. */}
            {L.verdict ? (
              <div className="mb-3">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className={`text-base font-bold ${verdictColor(L.verdict.tone)}`}>{L.verdict.phrase}</span>
                  {L.headline ? <span className="text-[13px] sm:text-[12px] tabular-nums text-unjong-muted">{L.headline}</span> : null}
                </span>
                {L.verdict.plain ? <p className="mt-1 text-[13px] leading-relaxed text-unjong-muted">{L.verdict.plain}</p> : null}
              </div>
            ) : null}
            <div className="flex flex-col items-center gap-2 rounded-xl border border-unjong-border bg-unjong-surface p-5 text-center">
              <Lock size={18} className="text-unjong-muted" />
              <p className="text-sm font-semibold text-unjong-primary">{t('gateTitle')}</p>
              <p className="text-[13px] leading-relaxed text-unjong-muted">{t('gateBody')}</p>
              <Link
                href={`/auth/login?next=${encodeURIComponent('/stock/' + symbol)}`}
                className="mt-1 rounded-lg bg-unjong-accent px-4 py-2 text-[13px] font-semibold text-unjong-strong hover:bg-unjong-accent/90"
              >
                {t('gateCta')}
              </Link>
            </div>
          </div>
        ) : isOpen ? (
          <div className="border-t border-unjong-border bg-unjong-background/50 px-4 pb-4 pt-3.5">
            <FlagBox flags={cardFlags} />
            {/* PC(lg+) 2단: 좌=결과(판정+게이지) · 우=설명(서사+근거+한계). 헤더가 이미 질문·학술명·등급을 보여줘 여기선 반복 안 함(STEP 789 §1 — 중복 제거). */}
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-4">
              <div className="min-w-0">
                {L.verdict ? (
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`text-base font-bold ${verdictColor(L.verdict.tone)}`}>{L.verdict.phrase}</p>
                    {L.headline ? <span className="whitespace-nowrap text-[13px] sm:text-[12px] text-unjong-muted">{L.headline}</span> : null}
                  </div>
                ) : null}
                {viz}
              </div>
              <div className="mt-3.5 min-w-0 lg:mt-0">
                {/* "이 기법 방향"(outlook) 라벨·블록 제거(서사에 흡수·STEP 789 §2) — 서사가 안 뜨는 렌즈만(na 포함) verdict.plain 안전망으로 대체. */}
                {!hasLensNarrative(L) && L.verdict ? <p className="text-[15px] sm:text-[13px] leading-relaxed text-unjong-primary/90">{L.verdict.plain}</p> : null}
                {/* STEP 809 §6: verdict·서사 둘 다 없는 결측(가격계열 부족 등) — 빈 카드 대신 명시적 결측 문구 */}
                {!hasLensNarrative(L) && !L.verdict ? <p className="text-[13px] sm:text-[12px] leading-relaxed text-unjong-muted">{t('insufficient')}</p> : null}
                <LensNarrative L={L} loc={locale} market={countryOf(symbol)} />
                {L.note ? <p className="mt-2.5 border-t border-unjong-border pt-2.5 text-[13px] sm:text-[11px] leading-relaxed text-unjong-muted">{L.note}</p> : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <main className="mx-auto max-w-[1040px] px-4 py-6 sm:px-6">
      <button type="button" onClick={() => { if (typeof window !== 'undefined' && window.history.length > 1) router.back(); else router.push('/'); }} className="inline-flex min-h-11 items-center gap-1.5 text-sm text-unjong-muted hover:text-unjong-accent">
        <ArrowLeft size={20} />
        {t('back')}
      </button>

      <div className="mt-3 max-w-4xl">
        <div className="mb-1.5 flex items-center gap-2">
          <AiLensBadge pill lang={locale} />
        </div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
              <h1 className="text-xl font-bold text-unjong-primary">{initialName || data?.name || ticker}</h1>
              <span className="text-sm text-unjong-muted">{ticker}</span>
            </div>
            {data?.price != null ? (
              <p className="text-[15px] tabular-nums text-unjong-muted sm:text-sm">
                {formatPrice(data.price, countryOf(symbol))}
                {data.changePercent != null ? (
                  <span className={changeColorClass(data.changePercent, locale)}> {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%</span>
                ) : null}
                {/* STEP 809 §7: 거래대금=전 거래일 스냅샷 / 등락률=실시간 → 시점 다름을 표기(한 줄에 시점 혼재 정직화) */}
                {data.tradeAmount != null ? <span> · {t('tradeAmount')} {formatTradeValue(data.tradeAmount, countryOf(symbol))} <span className="text-[11px]">{t('tradeAmountBasis')}</span></span> : null}
              </p>
            ) : null}
          </div>
          <WatchStarToggle symbol={symbol} name={initialName || data?.name || ticker} country={countryOf(symbol)} />
        </div>

        {loading || !data ? (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex shrink-0 items-center gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className="h-[7px] w-[7px] shrink-0 rounded-full bg-unjong-border" />
              ))}
            </div>
            <span className="text-[13px] sm:text-[11px] text-unjong-muted">{tf('lensLoading')}</span>
          </div>
        ) : headerTones.length > 0 ? (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex shrink-0 items-center gap-1">
                {headerTones.map((tone, i) => (
                  <span key={i} className={`h-[7px] w-[7px] shrink-0 rounded-full ${TONE_DOT[tone]}`} />
                ))}
              </div>
              <span className="text-[13px] sm:text-[11px] font-medium text-unjong-muted">{tf('lensSummary', { pos: headerPos, warn: headerWarn, flat: headerFlat })}{naCount > 0 ? ` · ${t('naNote', { n: naCount })}` : ''}{pendingCount > 0 ? ` · ${t('pendingNote', { n: pendingCount })}` : ''}</span>
            </div>
          </div>
        ) : null}

        {/* 상단 안내 4→1 통합(STEP 790) — "판단은 당신" 역할은 이 한 줄이 전담(788 닫는 카드 푸터에도 별도 1회 있어 페이지 상·하단 각 1회). */}
        <details className="mt-3">
          <summary className="cursor-pointer list-none text-[13px] sm:text-xs leading-relaxed text-unjong-muted [&::-webkit-details-marker]:hidden">
            {t('intro')} <span className="font-medium text-unjong-accent">{t('readingGuideSummary')}</span>
          </summary>
          <p className="mt-1.5 text-[13px] sm:text-xs leading-relaxed text-unjong-muted">{t.rich('readingGuide', {
            b: (c) => <b className="text-unjong-primary">{c}</b>,
            v: (c) => <span className="text-unjong-accent">{c}</span>,
            d: (c) => <span className="text-unjong-success">{c}</span>, // STEP 819 §4: 검증(방어) 배지 = 저변동(위험 방어). 배지 색(strong tier=success)과 맞춤.
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
          {lenses.length ? <HorizonStrip lenses={lenses} /> : null}
          {isKR ? <KrEventLayer symbol={symbol} /> : isJP ? <JpEventLayer symbol={symbol} /> : isGB ? <GbEventLayer symbol={symbol} /> : isVN ? <VnEventLayer symbol={symbol} /> : isCN ? <CnEventLayer symbol={symbol} /> : <EventLayer events={events} symbol={symbol} />}
          <StockNewsBrief symbol={symbol} />{/* R3: KR 포함 전 국가 — 라우트가 KR이면 한글명·한국 뉴스로 분기 */}
          {/* 파트 구분 헤더(STEP 788) + 목록 노출(STEP 791) — 시간축 요약(위)과 렌즈 하나하나(아래) 사이. 접힘 아님.
              카운트 0이면(카드 0장) 헤더 자체를 안 그림(결측 문법·STEP 798 §4). */}
          {partHeaderCount > 0 ? (
            <div className="mb-1 mt-6 border-t border-unjong-border pt-5">
              <h2 className="text-base font-bold text-unjong-primary">{t('partHeaderTitle', { n: partHeaderCount })}</h2>
              <p className="mt-1 text-[13px] sm:text-[11px] leading-relaxed text-unjong-primary/90">{partHeaderLabels.join(' · ')}</p>
              <p className="mt-1 text-[13px] sm:text-[11px] text-unjong-muted">{t.rich('partHeaderSub', {
                n: partHeaderCount,
                a: (chunks) => <Link href="/about" className="text-unjong-accent hover:underline">{chunks}</Link>,
              })}</p>
            </div>
          ) : null}
          {(['short', 'mid', 'long'] as const).map((h) => {
            const group = lenses.filter((L) => L.horizon === h);
            const showFs = h === 'long' && !!(data && data.fscore);
            if (!group.length && !showFs) return null;
            return (
              <section key={h}>
                <div className="mb-2 mt-5 flex items-baseline gap-2">
                  <h2 className="text-sm font-bold text-unjong-primary">{t(H_TITLE[h])}</h2>
                  <span className="text-[13px] sm:text-[11px] text-unjong-muted">{t(H_SUB[h])}</span>
                </div>
                <div className="space-y-4">
                  {group.map(renderCard)}
                  {showFs && data && data.fscore ? <FScoreCard f={data.fscore} flags={lensFlags['fscore']} /> : null}
                </div>
              </section>
            );
          })}
          {/* 닫는 카드 "{n}가지 방법을 종합하면"(STEP 788) — 전부 이미 계산된 값 재조립(LLM 금지). 상단 헤더와 카운트 동일. */}
          {partHeaderCount > 0 ? (
            <div className="mt-5 rounded-2xl border-2 border-unjong-accent/40 bg-unjong-surface p-4 shadow-sm">
              <h2 className="text-base font-bold text-unjong-primary">{t('closingTitle', { n: partHeaderCount })}</h2>
              <p className="mt-1.5 text-[13px] sm:text-[12px] font-medium text-unjong-muted">{tf('lensSummary', { pos: headerPos, warn: headerWarn, flat: headerFlat })}{naCount > 0 ? ` · ${t('naNote', { n: naCount })}` : ''}{pendingCount > 0 ? ` · ${t('pendingNote', { n: pendingCount })}` : ''}</p>
              <div className="mt-2.5 space-y-1 text-[13px] sm:text-[12px]">
                {closingPosLabels.length ? <p className="text-unjong-accent">{t('closingPosLine', { list: closingPosLabels.join(', ') })}</p> : null}
                {closingWarnLabels.length ? <p className="text-amber-400">{t('closingWarnLine', { list: closingWarnLabels.join(', ') })}</p> : null}
              </div>
              {closingSentenceKey ? <p className="mt-2.5 text-[15px] sm:text-[13px] leading-relaxed text-unjong-primary/90">{t(closingSentenceKey)}</p> : null}
              {/* STEP 810 §4: 종합 문장이 몇 개 수익 렌즈에 근거했는지 명시(축 혼합·범주 오류 방지) */}
              {closingSentenceKey && closingSentenceKey !== 'closingInsufficient' ? <p className="mt-1 text-[12px] sm:text-[11px] text-unjong-muted">{t('closingEvidence', { n: returnEvidence })}</p> : null}
              <p className="mt-2.5 border-t border-unjong-border pt-2.5 text-[13px] sm:text-[11px] text-unjong-muted">{t('closingFooter')}</p>
            </div>
          ) : null}
        </div>
      )}

      {/* 페이지 하단 디스클레이머 제거 — 법적 문구는 전역 푸터에 있음(반복 제거) */}
    </main>
  );
}
