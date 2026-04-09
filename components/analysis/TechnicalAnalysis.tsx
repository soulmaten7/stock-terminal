'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber } from '@/lib/utils/format';
import {
  calculateMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateStochastic,
} from '@/lib/utils/stockCalculations';
import type { AIAnalysis } from '@/types/stock';
import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import { Activity, TrendingUp, TrendingDown, Brain } from 'lucide-react';

interface Props {
  stockId: number;
}

// Placeholder price data (130 days) for when no price table exists
function generatePlaceholderPrices(): { close: number; high: number; low: number }[] {
  const data: { close: number; high: number; low: number }[] = [];
  let price = 52000;
  for (let i = 0; i < 130; i++) {
    const change = (Math.random() - 0.48) * 1200;
    price = Math.max(40000, price + change);
    const high = price + Math.random() * 800;
    const low = price - Math.random() * 800;
    data.push({ close: Math.round(price), high: Math.round(high), low: Math.round(low) });
  }
  return data;
}

export default function TechnicalAnalysis({ stockId }: Props) {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<{ close: number; high: number; low: number }[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Attempt to load price data
      const { data: prices } = await supabase
        .from('stock_prices')
        .select('close, high, low')
        .eq('stock_id', stockId)
        .order('trade_date', { ascending: true })
        .limit(130);

      if (prices && prices.length > 30) {
        setPriceData(prices as { close: number; high: number; low: number }[]);
      } else {
        setPriceData(generatePlaceholderPrices());
      }

      const { data: ai } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('stock_id', stockId)
        .eq('analysis_type', 'technical')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (ai) setAiAnalysis(ai as AIAnalysis);
      setLoading(false);
    }
    load();
  }, [stockId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const closes = priceData.map((d) => d.close);
  const highs = priceData.map((d) => d.high);
  const lows = priceData.map((d) => d.low);
  const currentPrice = closes[closes.length - 1] ?? 0;

  // Moving Averages
  const ma5 = calculateMA(closes, 5);
  const ma20 = calculateMA(closes, 20);
  const ma60 = calculateMA(closes, 60);
  const ma120 = calculateMA(closes, 120);
  const maValues = [ma5, ma20, ma60, ma120].filter((v) => v !== null) as number[];
  const isBullishAlignment = maValues.length >= 3 && maValues.every((v, i) => i === 0 || v <= maValues[i - 1]);
  const isBearishAlignment = maValues.length >= 3 && maValues.every((v, i) => i === 0 || v >= maValues[i - 1]);

  // RSI
  const rsi = calculateRSI(closes);

  // MACD
  const macd = calculateMACD(closes);

  // Bollinger Bands
  const bb = calculateBollingerBands(closes);

  // Stochastic
  const stoch = calculateStochastic(highs, lows, closes);

  // Support / Resistance (simple: recent 20-day low / high)
  const recent20Closes = closes.slice(-20);
  const support = Math.min(...recent20Closes);
  const resistance = Math.max(...recent20Closes);

  function getRsiColor(value: number): string {
    if (value >= 70) return 'text-up';
    if (value <= 30) return 'text-down';
    return 'text-text-primary';
  }

  function getRsiLabel(value: number): string {
    if (value >= 70) return '과매수';
    if (value <= 30) return '과매도';
    return '중립';
  }

  return (
    <div className="space-y-6">
      {/* Moving Average Status */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          이동평균선
        </h2>
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`px-3 py-1 text-sm font-bold rounded-full ${
              isBullishAlignment
                ? 'bg-up/10 text-up'
                : isBearishAlignment
                ? 'bg-down/10 text-down'
                : 'bg-dark-800 text-text-secondary'
            }`}
          >
            {isBullishAlignment ? '정배열' : isBearishAlignment ? '역배열' : '혼조'}
          </span>
          <span className="text-xs text-text-secondary">
            {isBullishAlignment
              ? '단기 > 중기 > 장기 (상승 추세)'
              : isBearishAlignment
              ? '장기 > 중기 > 단기 (하락 추세)'
              : '이동평균선이 혼재된 상태'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '5일', value: ma5 },
            { label: '20일', value: ma20 },
            { label: '60일', value: ma60 },
            { label: '120일', value: ma120 },
          ].map((item) => (
            <div key={item.label} className="bg-dark-800 rounded-lg p-3">
              <p className="text-xs text-text-secondary">{item.label} 이동평균</p>
              <p className="font-mono-price text-lg font-bold mt-1">
                {item.value != null ? formatNumber(Math.round(item.value)) : '-'}
              </p>
              {item.value != null && (
                <p className={`text-xs font-mono-price ${currentPrice > item.value ? 'text-up' : 'text-down'}`}>
                  {currentPrice > item.value ? (
                    <span className="inline-flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> 상회</span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> 하회</span>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RSI Gauge */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4">RSI (14일)</h3>
        {rsi != null ? (
          <div>
            <div className="flex items-end gap-4 mb-3">
              <p className={`text-4xl font-bold font-mono-price ${getRsiColor(rsi)}`}>
                {rsi.toFixed(1)}
              </p>
              <span className={`text-sm font-bold mb-1 ${getRsiColor(rsi)}`}>
                {getRsiLabel(rsi)}
              </span>
            </div>
            <div className="relative w-full h-4 bg-dark-800 rounded-full overflow-hidden">
              {/* Gradient zones */}
              <div className="absolute inset-0 flex">
                <div className="w-[30%] bg-down/20" />
                <div className="w-[40%] bg-dark-800" />
                <div className="w-[30%] bg-up/20" />
              </div>
              {/* Marker */}
              <div
                className="absolute top-0 h-full w-1 bg-accent rounded-full"
                style={{ left: `${Math.min(Math.max(rsi, 0), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-text-secondary mt-1">
              <span>0 (과매도)</span>
              <span>50</span>
              <span>100 (과매수)</span>
            </div>
          </div>
        ) : (
          <p className="text-text-secondary text-sm">데이터 부족</p>
        )}
      </div>

      {/* MACD */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4">MACD</h3>
        {macd ? (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-dark-800 rounded-lg p-3 text-center">
                <p className="text-xs text-text-secondary">MACD</p>
                <p className={`font-mono-price text-lg font-bold mt-1 ${macd.macd >= 0 ? 'text-up' : 'text-down'}`}>
                  {macd.macd.toFixed(0)}
                </p>
              </div>
              <div className="bg-dark-800 rounded-lg p-3 text-center">
                <p className="text-xs text-text-secondary">Signal</p>
                <p className="font-mono-price text-lg font-bold mt-1 text-text-primary">
                  {macd.signal.toFixed(0)}
                </p>
              </div>
              <div className="bg-dark-800 rounded-lg p-3 text-center">
                <p className="text-xs text-text-secondary">Histogram</p>
                <p className={`font-mono-price text-lg font-bold mt-1 ${macd.histogram >= 0 ? 'text-up' : 'text-down'}`}>
                  {macd.histogram.toFixed(0)}
                </p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg text-sm font-bold text-center ${
              macd.histogram > 0
                ? 'bg-up/10 text-up'
                : 'bg-down/10 text-down'
            }`}>
              {macd.histogram > 0
                ? 'MACD > Signal: 매수 시그널'
                : 'MACD < Signal: 매도 시그널'}
            </div>
          </div>
        ) : (
          <p className="text-text-secondary text-sm">데이터 부족 (최소 26일 필요)</p>
        )}
      </div>

      {/* Bollinger Bands + Stochastic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bollinger Bands */}
        <div className="bg-dark-700 rounded-lg p-5 border border-border">
          <h3 className="text-base font-bold mb-4">볼린저밴드 (20일, 2sd)</h3>
          {bb ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">상단</span>
                <span className="font-mono-price text-sm font-bold">{formatNumber(Math.round(bb.upper))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">중심</span>
                <span className="font-mono-price text-sm font-bold">{formatNumber(Math.round(bb.middle))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">하단</span>
                <span className="font-mono-price text-sm font-bold">{formatNumber(Math.round(bb.lower))}</span>
              </div>
              <div className="mt-3 bg-dark-800 rounded-lg p-3">
                <p className="text-xs text-text-secondary mb-1">현재 위치</p>
                <div className="relative w-full h-3 bg-dark-900 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 h-full w-1.5 bg-accent rounded-full"
                    style={{
                      left: `${Math.min(Math.max(((currentPrice - bb.lower) / (bb.upper - bb.lower)) * 100, 0), 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                  <span>하단</span>
                  <span>중심</span>
                  <span>상단</span>
                </div>
                <p className={`text-xs font-bold mt-2 ${
                  currentPrice > bb.upper ? 'text-up' : currentPrice < bb.lower ? 'text-down' : 'text-text-primary'
                }`}>
                  {currentPrice > bb.upper
                    ? '상단 돌파 (과매수 가능성)'
                    : currentPrice < bb.lower
                    ? '하단 이탈 (과매도 가능성)'
                    : '밴드 내 위치'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-text-secondary text-sm">데이터 부족</p>
          )}
        </div>

        {/* Stochastic */}
        <div className="bg-dark-700 rounded-lg p-5 border border-border">
          <h3 className="text-base font-bold mb-4">스토캐스틱 (14일)</h3>
          {stoch ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-text-secondary">%K</p>
                  <p className={`font-mono-price text-2xl font-bold mt-1 ${
                    stoch.k > 80 ? 'text-up' : stoch.k < 20 ? 'text-down' : 'text-text-primary'
                  }`}>
                    {stoch.k.toFixed(1)}
                  </p>
                </div>
                <div className="bg-dark-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-text-secondary">%D</p>
                  <p className="font-mono-price text-2xl font-bold mt-1 text-text-primary">
                    {stoch.d.toFixed(1)}
                  </p>
                </div>
              </div>
              <div className="relative w-full h-3 bg-dark-800 rounded-full overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="w-[20%] bg-down/20" />
                  <div className="w-[60%] bg-dark-800" />
                  <div className="w-[20%] bg-up/20" />
                </div>
                <div
                  className="absolute top-0 h-full w-1 bg-accent rounded-full"
                  style={{ left: `${Math.min(Math.max(stoch.k, 0), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-secondary">
                <span>0 (과매도)</span>
                <span>50</span>
                <span>100 (과매수)</span>
              </div>
            </div>
          ) : (
            <p className="text-text-secondary text-sm">데이터 부족</p>
          )}
        </div>
      </div>

      {/* Support / Resistance */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4">지지/저항선 (20일 기준)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-dark-800 rounded-lg p-3 text-center">
            <p className="text-xs text-text-secondary">저항선</p>
            <p className="font-mono-price text-lg font-bold text-up mt-1">{formatNumber(Math.round(resistance))}</p>
          </div>
          <div className="bg-dark-800 rounded-lg p-3 text-center">
            <p className="text-xs text-text-secondary">현재가</p>
            <p className="font-mono-price text-lg font-bold text-accent mt-1">{formatNumber(currentPrice)}</p>
          </div>
          <div className="bg-dark-800 rounded-lg p-3 text-center">
            <p className="text-xs text-text-secondary">지지선</p>
            <p className="font-mono-price text-lg font-bold text-down mt-1">{formatNumber(Math.round(support))}</p>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-premium" />
          AI 기술적분석 요약
        </h3>
        {aiAnalysis ? (
          <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {aiAnalysis.content_ko}
          </div>
        ) : (
          <div className="bg-dark-800 rounded-lg p-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              이동평균선은 {isBullishAlignment ? '정배열로 상승 추세를 보이고 있습니다' : isBearishAlignment ? '역배열로 하락 추세를 보이고 있습니다' : '혼조세를 보이고 있습니다'}.
              RSI는 {rsi?.toFixed(1) ?? '-'}으로 {rsi ? getRsiLabel(rsi) : '-'} 구간이며,
              MACD는 {macd ? (macd.histogram > 0 ? '매수 시그널' : '매도 시그널') : '산출 불가'}을 나타내고 있습니다.
              종합적으로 기술적 지표들을 참고하여 매매 타이밍을 판단하시기 바랍니다.
            </p>
            <p className="text-xs text-text-secondary/50 mt-2">* AI 분석이 아직 생성되지 않아 자동 요약을 표시합니다.</p>
          </div>
        )}
      </div>

      <DisclaimerBanner />
    </div>
  );
}
