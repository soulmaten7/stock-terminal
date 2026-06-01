'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { StockPrice } from '@/types/stock';
import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import {
  LineChart, Line, Bar, ComposedChart, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid, ReferenceLine,
} from 'recharts';
import { Activity, TrendingUp, BarChart3, LineChart as LineChartIcon } from 'lucide-react';

interface Props {
  stockId: number;
}

function formatNum(n: number | null | undefined, digits = 0, suffix = ''): string {
  if (n == null || isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('ko-KR', { maximumFractionDigits: digits })}${suffix}`;
}

function sma(arr: (number | null)[], window: number): (number | null)[] {
  return arr.map((_, i) => {
    if (i < window - 1) return null;
    const slice = arr.slice(i - window + 1, i + 1);
    if (slice.some(v => v == null)) return null;
    const sum = (slice as number[]).reduce((a, b) => a + b, 0);
    return sum / window;
  });
}

function bollinger(arr: (number | null)[], window = 20, k = 2): {
  upper: (number | null)[];
  lower: (number | null)[];
} {
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (i < window - 1) { upper.push(null); lower.push(null); continue; }
    const slice = arr.slice(i - window + 1, i + 1);
    if (slice.some(v => v == null)) { upper.push(null); lower.push(null); continue; }
    const nums = slice as number[];
    const mean = nums.reduce((a, b) => a + b, 0) / window;
    const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / window;
    const std = Math.sqrt(variance);
    upper.push(mean + k * std);
    lower.push(mean - k * std);
  }
  return { upper, lower };
}

function rsi(closes: (number | null)[], window = 14): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < window + 1) return out;
  const changes: (number | null)[] = [null];
  for (let i = 1; i < closes.length; i++) {
    const c = closes[i], p = closes[i - 1];
    changes.push(c == null || p == null ? null : c - p);
  }
  let avgGain = 0, avgLoss = 0, validCount = 0;
  for (let i = 1; i <= window; i++) {
    const ch = changes[i];
    if (ch == null) continue;
    if (ch > 0) avgGain += ch; else avgLoss += -ch;
    validCount++;
  }
  if (validCount < window) return out;
  avgGain /= window; avgLoss /= window;
  out[window] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = window + 1; i < closes.length; i++) {
    const ch = changes[i];
    if (ch == null) { out[i] = out[i - 1]; continue; }
    const gain = ch > 0 ? ch : 0, loss = ch < 0 ? -ch : 0;
    avgGain = (avgGain * (window - 1) + gain) / window;
    avgLoss = (avgLoss * (window - 1) + loss) / window;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export default function TechnicalAnalysis({ stockId }: Props) {
  const [prices, setPrices] = useState<StockPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('stock_prices')
        .select('*')
        .eq('stock_id', stockId)
        .order('trade_date', { ascending: true });
      if (data) setPrices(data as StockPrice[]);
      setLoading(false);
    }
    load();
  }, [stockId]);

  const chartData = useMemo(() => {
    if (prices.length === 0) return [];
    const closes = prices.map(p => p.close ?? null);
    const ma5 = sma(closes, 5);
    const ma20 = sma(closes, 20);
    const ma60 = sma(closes, 60);
    const ma120 = sma(closes, 120);
    const { upper, lower } = bollinger(closes, 20, 2);
    const rsiArr = rsi(closes, 14);
    return prices.map((p, i) => ({
      date: p.trade_date,
      close: p.close,
      volume: p.volume,
      ma5: ma5[i],
      ma20: ma20[i],
      ma60: ma60[i],
      ma120: ma120[i],
      bbUpper: upper[i],
      bbLower: lower[i],
      rsi: rsiArr[i],
    }));
  }, [prices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (prices.length < 20) {
    return (
      <div className="space-y-6">
        <div className="bg-dark-700 rounded-lg p-10 border border-dashed border-border text-center">
          <LineChartIcon className="w-12 h-12 mx-auto text-text-secondary mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">
            기술적 분석 — 데이터 부족
          </h3>
          <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
            해당 종목은 아직 일봉 시계열이 부족합니다. 시총 TOP 200 + 테마 관심종목 우선 커버 중이며 확장 예정입니다.
          </p>
        </div>
        <DisclaimerBanner />
      </div>
    );
  }

  const latest = chartData[chartData.length - 1];
  const metrics = [
    { label: '종가', value: latest.close, digits: 0, suffix: '원' },
    { label: 'MA 20', value: latest.ma20, digits: 0, suffix: '원' },
    { label: 'MA 60', value: latest.ma60, digits: 0, suffix: '원' },
    { label: 'RSI(14)', value: latest.rsi, digits: 1, suffix: '' },
    { label: 'BB 상단', value: latest.bbUpper, digits: 0, suffix: '원' },
  ];

  return (
    <div className="space-y-6">
      {/* 핵심 기술 지표 요약 */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          핵심 기술 지표 (최근 거래일 기준)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="bg-dark-700 rounded-lg p-4 border border-border">
              <p className="text-sm text-text-secondary mb-1">{m.label}</p>
              <p className="text-2xl font-bold font-mono-price mt-1 text-text-primary">
                {formatNum(m.value, m.digits, m.suffix)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm text-text-secondary/70 mt-2">
          기준일: {latest.date} · 일봉 {chartData.length}개
        </p>
      </div>

      {/* 이동평균선 + 볼린저밴드 */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          이동평균선 & 볼린저밴드 (단위: 원)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} minTickGap={50} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#F9FAFB' }}
              />
              <Legend />
              <Line type="monotone" dataKey="close" name="종가" stroke="#FFFFFF" strokeWidth={1.8} dot={false} />
              <Line type="monotone" dataKey="ma5" name="MA 5" stroke="#F59E0B" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="ma20" name="MA 20" stroke="#0ABAB5" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="ma60" name="MA 60" stroke="#EF4444" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="ma120" name="MA 120" stroke="#8B5CF6" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="bbUpper" name="BB 상단" stroke="#6B7280" strokeDasharray="3 3" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="bbLower" name="BB 하단" stroke="#6B7280" strokeDasharray="3 3" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RSI */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          RSI (14일)
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} minTickGap={50} />
              <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#F9FAFB' }}
              />
              <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="rsi" name="RSI" stroke="#0ABAB5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-text-secondary mt-2">
          70 이상 = 과매수(매도 압력), 30 이하 = 과매도(매수 압력). 참고 지표이며 매매 조언 아님.
        </p>
      </div>

      {/* 거래량 */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent" />
          거래량 추이
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} minTickGap={50} />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickFormatter={v => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : `${(v / 1_000).toFixed(0)}K`)}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#F9FAFB' }}
                formatter={(value) => value != null ? Number(value).toLocaleString('ko-KR') : '—'}
              />
              <Bar dataKey="volume" name="거래량" fill="#0ABAB5" opacity={0.7} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
