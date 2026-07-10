'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Layers } from 'lucide-react';

type Holding = { sym: string; name: string; weight: number };
type Sector = { key: string; weight: number };
type EtfData = {
  isFund: boolean;
  fundType?: 'etf' | 'etn' | 'stock';
  symbol: string;
  family: string | null;
  category: string | null;
  expenseRatio: number | null;
  holdings: Holding[];
  sectors: Sector[];
  source?: string;
  sourceUrl?: string;
};

const SECTOR_KO: Record<string, string> = {
  // Yahoo(US)
  realestate: '부동산', consumer_cyclical: '경기소비재', basic_materials: '소재',
  consumer_defensive: '필수소비재', technology: '기술', financial_services: '금융',
  healthcare: '헬스케어', industrials: '산업재', communication_services: '커뮤니케이션',
  energy: '에너지', utilities: '유틸리티',
  // 네이버(KR)
  it: 'IT·기술', financials: '금융', materials: '소재', health_care: '헬스케어',
  consumer_discretionary: '경기소비재', consumer_staples: '필수소비재',
  communication: '커뮤니케이션', real_estate: '부동산', unclassified: '기타', etc: '기타',
};
const sectorLabel = (k: string) => SECTOR_KO[(k ?? '').toLowerCase()] ?? k;
const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

export default function EtfLensClient({ symbol, initialName }: { symbol: string; initialName?: string }) {
  const router = useRouter();
  const ticker = symbol.split('.')[0];
  const [data, setData] = useState<EtfData | null>(null);
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    let alive = true;
    setState('loading');
    fetch('/api/etf-holdings?symbol=' + encodeURIComponent(symbol))
      .then((r) => r.json())
      .then((j) => { if (alive) { setData(j); setState('done'); } })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [symbol]);

  const hasHoldings = (data?.holdings?.length ?? 0) > 0;
  const maxW = hasHoldings ? Math.max(...data!.holdings.map((h) => h.weight)) : 1;
  const isEtn = data?.fundType === 'etn';
  const leveraged = /레버리지|인버스|\dX/i.test(initialName ?? '');

  return (
    // 너비·뒤로가기는 종목 상세(StockLensClient)와 동일하게 — max-w-7xl main + max-w-4xl 콘텐츠 + router.back()
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <button type="button" onClick={() => { if (typeof window !== 'undefined' && window.history.length > 1) router.back(); else router.push('/'); }} className="text-sm text-unjong-muted hover:text-unjong-accent">← 목록으로</button>

      <div className="mt-3 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-unjong-primary">{initialName || ticker}</h1>
        <span className="rounded bg-unjong-background px-1.5 py-0.5 text-[11px] font-medium text-unjong-muted">{isEtn ? 'ETN · 상품 정보' : 'ETF · 구성'}</span>
      </div>
      <p className="mt-0.5 text-[12px] tabular-nums text-unjong-muted">{ticker}</p>

      {isEtn ? (
        /* ETN = 전략형(바스켓 없음) → 상품 정보 + 주의 */
        <div className="mt-4 rounded-2xl border border-unjong-border bg-white p-5">
          <div className="mb-2 flex items-center gap-1.5">
            <Layers size={14} className="text-unjong-accent" />
            <span className="text-[13px] font-semibold text-unjong-primary">상품 정보</span>
            <span className="ml-auto text-[10px] text-unjong-muted">ETN · AI 분석 아님</span>
          </div>
          <p className="text-[13px] leading-6 text-unjong-primary">이 상품은 <b>ETN(상장지수증권)</b>이에요. 발행 증권사가 기초지수 수익률을 약정해 지급하는 <b>전략형 상품</b>으로, ETF와 달리 <b>개별 구성종목(바스켓)이 없어요.</b> 상품명에 발행사·추종 지수·유형(레버리지·인버스)이 담겨 있어요.</p>
          <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-[12px] leading-5 text-amber-700">⚠️ ETN은 발행사 신용위험이 있어요.{leveraged ? ' 레버리지·인버스형은 기초지수를 배수·반대로 추종해 장기 보유 시 가치가 깎일 수 있어요(변동성 손실).' : ''}</p>
        </div>
      ) : (
        <>
      {/* 개요 카드 */}
      <div className="mt-4 rounded-2xl border border-unjong-border bg-white p-4">
        <div className="mb-2 flex items-center gap-1.5">
          <Layers size={14} className="text-unjong-accent" />
          <span className="text-[13px] font-semibold text-unjong-primary">상품 구성</span>
          <span className="ml-auto text-[10px] text-unjong-muted">운용사 공시 · AI 분석 아님</span>
        </div>
        <div className="grid grid-cols-3 gap-y-2 text-center">
          <div><p className="text-[11px] text-unjong-muted">운용사</p><p className="truncate text-sm font-semibold text-unjong-primary">{data?.family ?? '—'}</p></div>
          <div><p className="text-[11px] text-unjong-muted">추종·유형</p><p className="truncate text-sm font-semibold text-unjong-primary">{data?.category ?? '—'}</p></div>
          <div><p className="text-[11px] text-unjong-muted">보수율(연)</p><p className="text-sm font-semibold text-unjong-primary">{data?.expenseRatio != null ? pct(data.expenseRatio) : '—'}</p></div>
        </div>
      </div>

      {state === 'loading' ? (
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-unjong-background" />
      ) : !hasHoldings ? (
        <div className="mt-4 rounded-2xl border border-unjong-border bg-white p-6 text-center">
          <p className="text-sm font-medium text-unjong-primary">구성종목 데이터 준비 중</p>
          <p className="mt-1 text-[12px] text-unjong-muted">이 상품은 아직 구성종목 소스가 연동되지 않았어요(국내 ETF는 KRX 연동 예정).</p>
        </div>
      ) : (
        <>
          {/* 상위 보유종목 */}
          <div className="mt-4 rounded-2xl border border-unjong-border bg-white p-4">
            <p className="mb-2 text-[13px] font-semibold text-unjong-primary">상위 보유종목 <span className="font-normal text-unjong-muted">(상위 {data!.holdings.length})</span></p>
            <ul className="space-y-2">
              {data!.holdings.map((h) => (
                <li key={h.sym || h.name} className="flex items-center gap-2 text-[13px]">
                  <span className="w-16 shrink-0 truncate tabular-nums text-unjong-muted">{h.sym}</span>
                  <span className="min-w-0 flex-1 truncate text-unjong-primary">{h.name}</span>
                  <span className="relative h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-unjong-background">
                    <span className="absolute inset-y-0 left-0 rounded-full bg-unjong-accent/60" style={{ width: `${Math.max(6, (h.weight / maxW) * 100)}%` }} />
                  </span>
                  <span className="w-14 shrink-0 text-right font-semibold tabular-nums text-unjong-primary">{pct(h.weight)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 섹터 비중 */}
          {data!.sectors.length > 0 && (
            <div className="mt-4 rounded-2xl border border-unjong-border bg-white p-4">
              <p className="mb-2 text-[13px] font-semibold text-unjong-primary">섹터 비중</p>
              <ul className="space-y-1.5">
                {[...data!.sectors].sort((a, b) => b.weight - a.weight).map((s) => (
                  <li key={s.key} className="flex items-center gap-2 text-[12px]">
                    <span className="w-20 shrink-0 truncate text-unjong-muted">{sectorLabel(s.key)}</span>
                    <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-unjong-background">
                      <span className="absolute inset-y-0 left-0 rounded-full bg-unjong-primary/30" style={{ width: `${s.weight * 100}%` }} />
                    </span>
                    <span className="w-12 shrink-0 text-right tabular-nums text-unjong-primary">{pct(s.weight)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
        </>
      )}

      {/* 출처 */}
      {data?.sourceUrl && (
        <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex items-center gap-1 text-[11px] text-unjong-muted hover:text-unjong-accent">
          정보 출처: {data.source} <ExternalLink size={11} />
        </a>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-unjong-muted">상품 정보이며 어디서 거래하든 동일합니다. 사고팔 신호가 아니라 스스로 판단할 재료예요.</p>
      </div>
    </div>
  );
}
