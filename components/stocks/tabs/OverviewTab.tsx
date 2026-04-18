'use client';

import { useEffect, useState } from 'react';
import type { Stock } from '@/types/stock';

type OverviewData = {
  kpis: {
    marketCap: string;
    per: string;
    pbr: string;
    eps: string;
    bps: string;
    roe: string;
    dividendYield: string;
    yearRange: string;
  };
  meta: {
    latestFinancialPeriod: string | null;
    latestFinancialType: string | null;
    priceDataPoints: number;
  };
};

type CompanyData = {
  name?: string;
  ceo?: string;
  address?: string;
  homepage?: string;
  phone?: string;
  industry?: string;
  established?: string;
  error?: string;
  fallback?: boolean;
};

const KPI_ORDER: Array<{ key: keyof OverviewData['kpis']; label: string }> = [
  { key: 'marketCap', label: '시가총액' },
  { key: 'per', label: 'PER' },
  { key: 'pbr', label: 'PBR' },
  { key: 'eps', label: 'EPS' },
  { key: 'bps', label: 'BPS' },
  { key: 'roe', label: 'ROE' },
  { key: 'dividendYield', label: '배당수익률' },
  { key: 'yearRange', label: '52주 범위' },
];

export default function OverviewTab({ stock }: { stock: Stock }) {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch(`/api/stocks/overview?symbol=${stock.symbol}`).then((r) => r.json()),
      stock.country === 'KR'
        ? fetch(`/api/dart/company?symbol=${stock.symbol}`).then((r) => r.json())
        : Promise.resolve({ error: 'not korean stock', fallback: true }),
    ])
      .then(([ov, co]) => {
        if (cancelled) return;
        setOverview(ov.kpis ? ov : null);
        setCompany(co);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stock.symbol, stock.country]);

  return (
    <div className="space-y-6">
      {/* KPI 그리드 */}
      <div>
        <h2 className="text-base font-bold text-black mb-3">핵심 지표</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {KPI_ORDER.map(({ key, label }) => (
            <div
              key={key}
              className="bg-[#F5F7FA] border border-[#E5E7EB] rounded p-3"
            >
              <p className="text-[#666666] text-xs font-bold mb-1">{label}</p>
              <p className="text-black font-mono-price font-bold text-base">
                {loading ? '...' : overview?.kpis[key] ?? '—'}
              </p>
            </div>
          ))}
        </div>
        {overview?.meta.latestFinancialPeriod && (
          <p className="text-[10px] text-[#999999] mt-2">
            재무 지표 기준: {overview.meta.latestFinancialPeriod} ({overview.meta.latestFinancialType}) /
            가격 데이터 포인트: {overview.meta.priceDataPoints}
          </p>
        )}
      </div>

      {/* 기업개황 */}
      <div>
        <h2 className="text-base font-bold text-black mb-3">기업개황</h2>
        <div className="bg-white border border-[#E5E7EB] rounded p-4 text-sm">
          {loading ? (
            <p className="text-[#999999]">불러오는 중…</p>
          ) : company?.error ? (
            <div>
              <p className="text-[#666666] text-xs mb-2">
                {company.fallback
                  ? 'DART 연동 미설정 — 기본 정보만 표시'
                  : `기업개황을 불러올 수 없습니다: ${company.error}`}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="font-bold text-black">종목코드: </span>{stock.symbol}</div>
                <div><span className="font-bold text-black">시장: </span>{stock.market}</div>
                <div><span className="font-bold text-black">섹터: </span>{stock.sector ?? '—'}</div>
                <div><span className="font-bold text-black">국가: </span>{stock.country}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <Info label="기업명" value={company?.name} />
              <Info label="대표이사" value={company?.ceo} />
              <Info label="본사 주소" value={company?.address} />
              <Info label="전화번호" value={company?.phone} />
              <Info label="홈페이지" value={company?.homepage} link />
              <Info label="설립일" value={company?.established} />
              <Info label="종목코드" value={stock.symbol} />
              <Info label="시장" value={stock.market} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, link }: { label: string; value?: string; link?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <span className="font-bold text-black">{label}: </span>
      {link ? (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0ABAB5] hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        <span className="text-[#666666] break-words">{value}</span>
      )}
    </div>
  );
}
