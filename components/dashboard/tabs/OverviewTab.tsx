'use client';

import { useState, useEffect } from 'react';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';
import type { DetailTab } from '../DetailTabs';
import type { PriceData } from '../StockDetailPanel';

interface Props {
  priceData: PriceData | null;
  onNavigateTab: (tab: DetailTab) => void;
}

// ── 포맷 헬퍼 ────────────────────────────────────────────────────────────────
function fmtNum(n: number | null | undefined, suffix = ''): string {
  if (n == null || Number.isNaN(n) || n === 0) return '—';
  return `${n.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}${suffix}`;
}
function fmtMarketCap(n: number): string {
  if (!n) return '—';
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}조`;
  return `${n.toLocaleString('ko-KR')}억`;
}
function fmtPrice(n: number): string {
  return n > 0 ? n.toLocaleString('ko-KR') : '—';
}
function fmtNetBuy(n: number): string {
  const abs = Math.abs(n);
  const sign = n >= 0 ? '+' : '-';
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(1)}억주`;
  if (abs >= 10_000) return `${sign}${(abs / 10_000).toFixed(1)}만주`;
  return `${sign}${abs.toLocaleString('ko-KR')}주`;
}
function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}
function isStale(iso: string | null): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() > 14 * 86_400_000;
}
function fmtFinancial(n: number | null): string {
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)}조`;
  if (abs >= 100_000_000) return `${(n / 100_000_000).toFixed(0)}억`;
  return n.toLocaleString('ko-KR');
}

// ── 블록 1: 핵심 투자지표 ───────────────────────────────────────────────────
function Block1Metrics({ priceData }: { priceData: PriceData | null }) {
  if (!priceData) return <p className="text-[11px] text-[#BBB] py-2">로딩 중…</p>;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
      <Metric label="PER" value={fmtNum(priceData.per, '배')} />
      <Metric label="PBR" value={fmtNum(priceData.pbr, '배')} />
      <Metric label="시총" value={fmtMarketCap(priceData.marketCap)} />
      <Metric label="배당수익률" value={priceData.dividendYield ? `${priceData.dividendYield.toFixed(2)}%` : '—'} />
      <Metric label="52주 신고" value={fmtPrice(priceData.high52w)} />
      <Metric label="52주 신저" value={fmtPrice(priceData.low52w)} />
    </dl>
  );
}

// ── 블록 2: 투자자 수급 미니 🇰🇷 ────────────────────────────────────────────
interface InvestorData {
  date: string;
  foreignBuy: number;
  institutionBuy: number;
  individualBuy: number;
}

function Block2Supply({ symbol }: { symbol: string }) {
  const [rows, setRows] = useState<InvestorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/kis/investor?symbol=${symbol}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setRows(d?.investors ?? []); setLoading(false); })
      .catch(() => { setRows([]); setLoading(false); });
  }, [symbol]);

  if (loading) return <p className="text-[11px] text-[#BBB] py-1">로딩 중…</p>;
  if (!rows.length) return <p className="text-[11px] text-[#BBB] py-1">데이터 없음</p>;

  const today = rows[0];
  const five = rows.slice(0, 5);
  const sumFgn = five.reduce((a, r) => a + r.foreignBuy, 0);
  const sumOrg = five.reduce((a, r) => a + r.institutionBuy, 0);
  const sumPrs = five.reduce((a, r) => a + r.individualBuy, 0);

  return (
    <div className="text-[11px]">
      <div className="grid grid-cols-4 gap-0 mb-1 text-[#999]">
        <span />
        <span className="text-center">외인</span>
        <span className="text-center">기관</span>
        <span className="text-center">개인</span>
      </div>
      <SupplyRow label="당일" fgn={today.foreignBuy} org={today.institutionBuy} prs={today.individualBuy} />
      <SupplyRow label="5일" fgn={sumFgn} org={sumOrg} prs={sumPrs} />
    </div>
  );
}

function SupplyRow({ label, fgn, org, prs }: { label: string; fgn: number; org: number; prs: number }) {
  return (
    <div className="grid grid-cols-4 gap-0 py-0.5">
      <span className="text-[#999]">{label}</span>
      <span className={`text-center tabular-nums ${fgn >= 0 ? 'text-[#0ABAB5]' : 'text-[#FF4D4D]'}`}>{fmtNetBuy(fgn)}</span>
      <span className={`text-center tabular-nums ${org >= 0 ? 'text-[#0ABAB5]' : 'text-[#FF4D4D]'}`}>{fmtNetBuy(org)}</span>
      <span className={`text-center tabular-nums ${prs >= 0 ? 'text-[#0ABAB5]' : 'text-[#FF4D4D]'}`}>{fmtNetBuy(prs)}</span>
    </div>
  );
}

// ── 블록 3: 뉴스 하이라이트 ─────────────────────────────────────────────────
interface NewsItem { title: string; link: string; publishedAt: string | null; source: string; }

function Block3News({ symbol, onMore }: { symbol: string; onMore: () => void }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stocks/news?symbol=${symbol}&limit=10`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setItems(d?.items ?? []); setLoading(false); })
      .catch(() => { setItems([]); setLoading(false); });
  }, [symbol]);

  if (loading) return <p className="text-[11px] text-[#BBB] py-1">로딩 중…</p>;

  const recent = items
    .filter((item) => !isStale(item.publishedAt))
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, 3);

  if (!recent.length) return (
    <div className="py-3 text-center">
      <p className="text-[11px] text-[#BBB]">최근 14일 내 뉴스 없음</p>
      <button onClick={onMore} className="text-[11px] text-[#0ABAB5] hover:underline mt-1">전체 뉴스 보기 →</button>
    </div>
  );

  return (
    <div className="space-y-2">
      {recent.map((item, i) => (
        <a
          key={i}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:bg-[#F8F9FA] -mx-1 px-1 py-0.5 rounded"
        >
          <div className="flex items-start gap-1.5">
            <span className="shrink-0 mt-0.5 text-[9px] font-bold px-1 py-0.5 rounded bg-[#0ABAB5]/10 text-[#0ABAB5]">{symbol}</span>
            <p className="text-xs font-medium text-black leading-tight line-clamp-2">{item.title}</p>
          </div>
          <p className="text-[10px] text-[#999] mt-0.5 pl-[calc(1ch+10px+6px)]">
            {item.source}{item.publishedAt ? ` · ${timeAgo(item.publishedAt)}` : ''}
          </p>
        </a>
      ))}
      <button onClick={onMore} className="text-[11px] text-[#0ABAB5] hover:underline">
        뉴스 전체 보기 →
      </button>
    </div>
  );
}

// ── 블록 4: 공시 하이라이트 ─────────────────────────────────────────────────
interface DisclosureItem { report_nm: string; rcept_dt: string; source_url: string; }

function Block4Disclosures({ symbol, market, onMore }: { symbol: string; market: string; onMore: () => void }) {
  const [items, setItems] = useState<DisclosureItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (market !== 'KR') { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/stocks/disclosures?symbol=${symbol}&months=3&limit=20`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setItems(d?.items ?? []); setLoading(false); })
      .catch(() => { setItems([]); setLoading(false); });
  }, [symbol, market]);

  if (market !== 'KR') return <p className="text-[11px] text-[#BBB] py-1">SEC 공시 연결 예정 (STEP 73)</p>;
  if (loading) return <p className="text-[11px] text-[#BBB] py-1">로딩 중…</p>;

  const recent = items
    .filter((item) => {
      if (!item.rcept_dt || item.rcept_dt.length < 8) return true;
      const d = new Date(`${item.rcept_dt.slice(0,4)}-${item.rcept_dt.slice(4,6)}-${item.rcept_dt.slice(6)}`);
      return Date.now() - d.getTime() <= 14 * 86_400_000;
    })
    .slice(0, 3);

  if (!recent.length) return (
    <div className="py-3 text-center">
      <p className="text-[11px] text-[#BBB]">최근 14일 내 공시 없음</p>
      <button onClick={onMore} className="text-[11px] text-[#0ABAB5] hover:underline mt-1">전체 공시 보기 →</button>
    </div>
  );

  return (
    <div className="space-y-2">
      {recent.map((item, i) => {
        const dt = item.rcept_dt ? `${item.rcept_dt.slice(0,4)}.${item.rcept_dt.slice(4,6)}.${item.rcept_dt.slice(6)}` : '';
        return (
          <a
            key={i}
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:bg-[#F8F9FA] -mx-1 px-1 py-0.5 rounded"
          >
            <div className="flex items-start gap-1.5">
              <span className="shrink-0 mt-0.5 text-[9px] font-bold px-1 py-0.5 rounded bg-[#FF3B30]/10 text-[#FF3B30]">{symbol}</span>
              <p className="text-xs font-medium text-black leading-tight line-clamp-2">{item.report_nm}</p>
            </div>
            {dt && <p className="text-[10px] text-[#999] mt-0.5 pl-[calc(1ch+10px+6px)]">{dt}</p>}
          </a>
        );
      })}
      <button onClick={onMore} className="text-[11px] text-[#0ABAB5] hover:underline">
        공시 전체 보기 →
      </button>
    </div>
  );
}

// ── 블록 5: 재무 미니 ────────────────────────────────────────────────────────
interface Quarter { period: string; revenue: number | null; operatingIncome: number | null; }

function Block5Financial({ symbol, market, onMore }: { symbol: string; market: string; onMore: () => void }) {
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (market !== 'KR') { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/stocks/earnings?symbol=${symbol}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setQuarters((d?.quarters ?? []).slice(-4)); setLoading(false); })
      .catch(() => { setQuarters([]); setLoading(false); });
  }, [symbol, market]);

  if (market !== 'KR') return <p className="text-[11px] text-[#BBB] py-1">US 재무 연결 예정 (STEP 73)</p>;
  if (loading) return <p className="text-[11px] text-[#BBB] py-1">로딩 중…</p>;
  if (!quarters.length) return <p className="text-[11px] text-[#BBB] py-1">재무 데이터 없음</p>;

  const maxRev = Math.max(...quarters.map((q) => q.revenue ?? 0));
  const maxOp = Math.max(...quarters.map((q) => Math.abs(q.operatingIncome ?? 0)));

  return (
    <div>
      <div className="space-y-2">
        {quarters.map((q) => {
          const revPct = maxRev > 0 ? ((q.revenue ?? 0) / maxRev) * 100 : 0;
          const opPct = maxOp > 0 ? (Math.abs(q.operatingIncome ?? 0) / maxOp) * 100 : 0;
          return (
            <div key={q.period} className="text-[10px]">
              <div className="text-[#999] mb-0.5">{q.period}</div>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="w-8 text-right text-[#999] shrink-0">매출</span>
                <div
                  className="h-1.5 bg-[#0ABAB5] rounded-sm"
                  style={{ width: `${revPct}%`, minWidth: revPct > 0 ? '4px' : '0' }}
                  title={fmtFinancial(q.revenue)}
                />
                <span className="text-[#666] shrink-0">{fmtFinancial(q.revenue)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-8 text-right text-[#999] shrink-0">영업익</span>
                <div
                  className={`h-1.5 rounded-sm ${(q.operatingIncome ?? 0) >= 0 ? 'bg-[#5B6670]' : 'bg-[#FF4D4D]'}`}
                  style={{ width: `${opPct}%`, minWidth: opPct > 0 ? '4px' : '0' }}
                  title={fmtFinancial(q.operatingIncome)}
                />
                <span className="text-[#666] shrink-0">{fmtFinancial(q.operatingIncome)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={onMore} className="mt-2 text-[11px] text-[#0ABAB5] hover:underline">
        재무 전체 보기 →
      </button>
    </div>
  );
}

// ── 공통 서브컴포넌트 ────────────────────────────────────────────────────────
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-[#999]">{label}</dt>
      <dd className="font-medium text-black tabular-nums">{value}</dd>
    </div>
  );
}

function BlockSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-3">
      <h4 className="text-[11px] font-bold text-[#444] mb-2 tracking-wide">{title}</h4>
      {children}
    </section>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function OverviewTab({ priceData, onNavigateTab }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const _selected = useSelectedSymbolStore((s) => s.selected);
  const selected = mounted ? _selected : null;

  if (!selected) {
    return (
      <div className="py-8 text-center text-xs text-[#999]">
        좌측에서 종목을 선택하세요
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#E5E7EB]">
      <BlockSection title="핵심 투자지표">
        <Block1Metrics priceData={priceData} />
      </BlockSection>

      {selected.market === 'KR' && (
        <BlockSection title="투자자 수급 🇰🇷">
          <Block2Supply symbol={selected.code} />
        </BlockSection>
      )}

      <BlockSection title="뉴스 하이라이트">
        <Block3News symbol={selected.code} onMore={() => onNavigateTab('news')} />
      </BlockSection>

      <BlockSection title="공시 하이라이트">
        <Block4Disclosures symbol={selected.code} market={selected.market} onMore={() => onNavigateTab('disclosures')} />
      </BlockSection>

      <BlockSection title="재무 미니">
        <Block5Financial symbol={selected.code} market={selected.market} onMore={() => onNavigateTab('financials')} />
      </BlockSection>
    </div>
  );
}
