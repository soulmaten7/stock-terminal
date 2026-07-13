'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Layers } from 'lucide-react';
import { StockLogo } from '@/components/ui/StockLogo';
import { TLensLogo } from '@/components/AiLensBadge';
import { formatPrice } from '@/lib/currency';

function pct(v?: number | null): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function pctColor(v?: number | null): string {
  if (v == null) return 'text-unjong-muted';
  return v >= 0 ? 'text-unjong-up' : 'text-unjong-down';
}
function gradeBadgeClass(tier: string): string {
  if (tier === 'strong') return 'bg-unjong-accent/12 text-unjong-success';
  if (tier === 'partial') return 'bg-amber-50 text-amber-600';
  return 'bg-unjong-background text-unjong-muted';
}

type LensItem = { key: string; name: string; grade: string; gradeTier: string; verdict?: { phrase: string; tone: string } | null };
export type LensRow = { symbol: string; name: string; price?: number | null; changePercent?: number | null; r1w?: number | null; r1m?: number | null; r3m?: number | null; r6m?: number | null; r1y?: number | null };

export default function LensPreview({ stock, market, compact = false }: { stock: LensRow | null; market: string; compact?: boolean }) {
  const [lenses, setLenses] = useState<LensItem[] | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [brief, setBrief] = useState('');
  const [briefState, setBriefState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [etf, setEtf] = useState<{ isFund?: boolean; fundType?: string; category?: string | null; expenseRatio?: number | null; holdings?: { sym: string; name: string; weight: number }[] } | null>(null);

  useEffect(() => {
    if (!stock) { setState('idle'); setLenses(null); return; }
    let alive = true; setState('loading');
    fetch('/api/lens?symbol=' + encodeURIComponent(stock.symbol))
      .then((r) => r.json())
      .then((j) => { if (!alive) return; setLenses(j.lenses || []); setState('done'); })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [stock?.symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  // ETF/펀드면 구성 요약(렌즈 대신) — /api/etf-holdings
  useEffect(() => {
    if (!stock) { setEtf(null); return; }
    let alive = true; setEtf(null);
    fetch('/api/etf-holdings?symbol=' + encodeURIComponent(stock.symbol))
      .then((r) => r.json())
      .then((j) => { if (alive) setEtf(j); })
      .catch(() => {});
    return () => { alive = false; };
  }, [stock?.symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!stock) { setBriefState('idle'); setBrief(''); return; }
    let alive = true; setBriefState('idle');
    const t = setTimeout(() => {
      setBriefState('loading');
      fetch('/api/brief?symbol=' + encodeURIComponent(stock.symbol))
        .then((r) => r.json())
        .then((j) => { if (!alive) return; if (j.brief) { setBrief(j.brief); setBriefState('done'); } else setBriefState('error'); })
        .catch(() => { if (alive) setBriefState('error'); });
    }, 700);
    return () => { alive = false; clearTimeout(t); };
  }, [stock?.symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stock) {
    if (compact) return null;
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface p-4 text-center">
        <TLensLogo size={22} color="#2DD4BF" />
        <p className="mt-2 text-sm font-semibold text-unjong-primary">종목을 선택하면 TR-AI 렌즈가 읽어드려요</p>
        <p className="mt-1 text-[12px] leading-relaxed text-unjong-muted">검증된 기법(모멘텀·밸류·퀄리티 등)이 이 종목을 저마다 어떻게 보는지 요약해요. 사고팔 신호가 아니라, 스스로 판단할 재료예요.</p>
      </div>
    );
  }
  return (
    <div className={compact ? '' : 'rounded-2xl border border-unjong-border bg-unjong-surface p-4'}>
      {!compact && (
        <>
          <div className="flex items-center gap-2.5">
            <StockLogo code={stock.symbol} name={stock.name} size={32} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-unjong-primary">{stock.name}</p>
              <p className="text-[12px] tabular-nums text-unjong-muted">{stock.price ? formatPrice(stock.price, market) : '—'}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-y-2">
            {([
              ['1일전', stock.changePercent],
              ['1주일전', stock.r1w],
              ['1개월전', stock.r1m],
              ['3개월전', stock.r3m],
              ['6개월전', stock.r6m],
              ['1년전', stock.r1y],
            ] as [string, number | null | undefined][]).map(([l, v]) => (
              <div key={l} className="flex flex-col">
                <span className="whitespace-nowrap text-[11px] text-unjong-muted">{l}</span>
                <span className={`text-sm font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {etf?.isFund ? (
        <div className={compact ? 'mt-3' : 'mt-3 border-t border-unjong-border pt-3'}>
          <div className="mb-1.5 flex items-center gap-1">
            <Layers size={12} className="text-unjong-accent" />
            <span className="text-[12px] font-semibold text-unjong-primary">{etf.fundType === 'etn' ? '상품 정보' : '상품 구성'}</span>
            <span className="ml-auto text-[10px] text-unjong-muted">AI 분석 아님</span>
          </div>
          {etf.fundType === 'etn' ? (
            <p className="text-[12px] leading-5 text-unjong-muted">ETN(전략형 상품)이라 개별 구성종목이 없어요. 발행사 신용·레버리지 특성은 자세히 보기에서.</p>
          ) : (
            <>
              {etf.category ? <p className="text-[12px] text-unjong-muted">추종·유형 <span className="font-medium text-unjong-primary">{etf.category}</span></p> : null}
              <ul className="mt-1 space-y-1">
                {(etf.holdings ?? []).slice(0, 3).map((h) => (
                  <li key={h.sym || h.name} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="min-w-0 truncate text-unjong-primary">{h.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-unjong-primary">{(h.weight * 100).toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
              {etf.expenseRatio != null ? <p className="mt-1 text-[11px] text-unjong-muted">보수율 {(etf.expenseRatio * 100).toFixed(2)}%</p> : null}
            </>
          )}
        </div>
      ) : (
        <>
      <div className={compact ? 'mt-3' : 'mt-3 border-t border-unjong-border pt-3'}>
        <div className="mb-1.5 flex items-center gap-1">
          <TLensLogo size={12} color="#2DD4BF" />
          <span className="text-[12px] font-semibold text-unjong-primary">TR-AI 렌즈</span>
        </div>
        {state === 'loading' ? (
          <p className="text-[12px] text-unjong-muted">렌즈 읽는 중…</p>
        ) : state === 'error' ? (
          <p className="text-[12px] text-unjong-muted">지금은 렌즈를 불러올 수 없어요. 잠시 후 다시 시도해 주세요.</p>
        ) : lenses?.length ? (
          <div className="space-y-2">
          <ul className="space-y-1">
            {lenses.map((l) => (
              <li key={l.key} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="text-unjong-primary">{l.name}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {l.verdict?.phrase ? (
                    <span className={`font-medium ${l.verdict.tone === 'pos' ? 'text-unjong-accent' : l.verdict.tone === 'warn' ? 'text-amber-600' : 'text-unjong-muted'}`}>{l.verdict.phrase}</span>
                  ) : null}
                  <span className={`rounded px-1 py-0.5 text-[10px] font-medium ${gradeBadgeClass(l.gradeTier)}`}>{l.grade}</span>
                </span>
              </li>
            ))}
            {/* 재무 데이터 없는 종목: 재무 기반 렌즈(퀄리티·자산성장)를 숨기지 않고 "재무 데이터 없음"으로 정직하게 표시(왜 못 주는지 명시) */}
            {([['quality', '퀄리티'], ['assetgrowth', '자산성장']] as [string, string][])
              .filter(([k]) => !lenses.some((l) => l.key === k))
              .map(([k, label]) => (
                <li key={k} className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="text-unjong-muted">{label}</span>
                  <span className="shrink-0 text-[11px] text-unjong-muted">재무 데이터 없음</span>
                </li>
              ))}
          </ul>
          <p className="text-[11px] leading-snug text-unjong-muted">사고팔 신호가 아니라, 스스로 판단할 재료예요.</p>
          </div>
        ) : (
          <p className="text-[12px] leading-5 text-unjong-muted">데이터 부족 — 상장·거래 이력이 짧아 렌즈를 산출할 수 없어요.</p>
        )}
      </div>
      {briefState !== 'idle' && briefState !== 'error' && (
        <div className="mt-3 border-t border-unjong-border pt-3">
          <div className="mb-1.5 flex items-center gap-1">
            <Sparkles size={12} className="text-unjong-accent" />
            <span className="text-[12px] font-semibold text-unjong-accent">이 종목 브리핑</span>
            <span className="ml-auto text-[10px] text-unjong-muted">TR-AI · 사실만</span>
          </div>
          {briefState === 'loading' ? (
            <p className="text-[12px] text-unjong-muted">브리핑 만드는 중…</p>
          ) : (
            <p className="text-[13px] leading-6 text-unjong-primary">{brief}</p>
          )}
        </div>
      )}
        </>
      )}
      <Link href={`/stock/${stock.symbol}`} className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-unjong-accent/10 py-2 text-[12px] font-semibold text-unjong-accent hover:bg-unjong-accent/15">
        {etf?.isFund ? (etf.fundType === 'etn' ? '상품 정보 자세히 보기' : '상품 구성 자세히 보기') : 'TR-AI 렌즈·근거 보기'} →
      </Link>
    </div>
  );
}
