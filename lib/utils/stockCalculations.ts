// 이동평균선 계산
export function calculateMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// RSI 계산 (14일 기본)
export function calculateRSI(prices: number[], period = 14): number | null {
  if (prices.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

// MACD 계산
export function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    ema.push(prices[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

export function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } | null {
  if (prices.length < 26) return null;
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]).slice(26);
  if (macdLine.length < 9) return null;
  const signalLine = calculateEMA(macdLine, 9);
  const macd = macdLine[macdLine.length - 1];
  const signal = signalLine[signalLine.length - 1];
  return { macd, signal, histogram: macd - signal };
}

// 볼린저밴드 계산
export function calculateBollingerBands(prices: number[], period = 20, stdDev = 2): { upper: number; middle: number; lower: number } | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, p) => sum + (p - mean) ** 2, 0) / period;
  const sd = Math.sqrt(variance);
  return { upper: mean + stdDev * sd, middle: mean, lower: mean - stdDev * sd };
}

// 스토캐스틱 계산
export function calculateStochastic(highs: number[], lows: number[], closes: number[], period = 14): { k: number; d: number } | null {
  if (closes.length < period) return null;
  const recentHighs = highs.slice(-period);
  const recentLows = lows.slice(-period);
  const hh = Math.max(...recentHighs);
  const ll = Math.min(...recentLows);
  if (hh === ll) return { k: 50, d: 50 };
  const k = ((closes[closes.length - 1] - ll) / (hh - ll)) * 100;
  return { k, d: k }; // simplified; real %D uses 3-period SMA of %K
}

// 그레이엄 안전마진
export function calculateGrahamValue(eps: number | null, bps: number | null): number | null {
  if (!eps || !bps || eps <= 0 || bps <= 0) return null;
  return Math.sqrt(22.5 * eps * bps);
}

// 안전마진 비율
export function calculateSafetyMargin(intrinsicValue: number, currentPrice: number): number {
  return ((intrinsicValue - currentPrice) / intrinsicValue) * 100;
}

// CAGR 계산
export function calculateCAGR(startValue: number, endValue: number, years: number): number | null {
  if (startValue <= 0 || years <= 0) return null;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}
