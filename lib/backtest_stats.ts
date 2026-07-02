// 백테스트 통계 유틸 — 여러 렌즈 백테스트가 공유(플레이북 §0-3: 엔진=검증 일치).
// 핵심: 스프레드 "숫자" 하나만이 아니라 월별 수익률 시계열의 **유의성(t값)·위험대비(샤프)**까지 봐서
//       "관찰"을 "방어 가능한 근거"로 올린다(무료 데이터로 논문급 '방법론'에 근접 — 단 생존편향은 별개 한계).

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
}

export function stdev(xs: number[], sample = true): number {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  const ss = xs.reduce((a, b) => a + (b - m) ** 2, 0);
  return Math.sqrt(ss / (xs.length - (sample ? 1 : 0)));
}

// 수익률 시계열의 t값 (H0: 평균=0). 비중첩(1기간 보유) 가정 시 정직. |t|>2 ≈ 5% 유의.
export function tStat(xs: number[]): number {
  const s = stdev(xs);
  if (!isFinite(s) || s === 0) return NaN;
  return mean(xs) / (s / Math.sqrt(xs.length));
}

// Newey-West 보정 t값 (중첩 보유로 자기상관 있을 때). lags=보유기간−1 권장. Bartlett 커널.
export function neweyWestT(xs: number[], lags: number): number {
  const n = xs.length;
  if (n < 2) return NaN;
  const m = mean(xs);
  const d = xs.map((x) => x - m);
  let variance = d.reduce((a, b) => a + b * b, 0) / n; // gamma_0
  for (let l = 1; l <= lags; l++) {
    let g = 0;
    for (let i = l; i < n; i++) g += d[i] * d[i - l];
    g /= n;
    variance += 2 * (1 - l / (lags + 1)) * g;
  }
  const se = Math.sqrt(variance / n);
  return se === 0 || !isFinite(se) ? NaN : m / se;
}

// 기간수익률(예: 월) → 연율 산술평균 (ppy=연간 기간수, 월=12).
export function annualizedMean(perPeriod: number[], ppy = 12): number {
  return mean(perPeriod) * ppy;
}
// 기간수익률 → 연율 변동성.
export function annualizedVol(perPeriod: number[], ppy = 12): number {
  return stdev(perPeriod) * Math.sqrt(ppy);
}
// 연율 샤프. 롱숏 스프레드는 자기금융(초과수익 자체)이라 무위험 0 가정. %·소수 스케일 불변.
export function sharpe(perPeriod: number[], ppy = 12): number {
  const s = stdev(perPeriod);
  if (!isFinite(s) || s === 0) return NaN;
  return (mean(perPeriod) / s) * Math.sqrt(ppy);
}

// 양(+)의 비율 — 예: 롱숏이 플러스였던 달 비율(꾸준함 진단).
export function fracPositive(xs: number[]): number {
  return xs.length ? xs.filter((x) => x > 0).length / xs.length : NaN;
}

// 리밸런스별 관측 {signal, ret}[] (한 달 = 배열 1개) → 월별 롱숏(상위−하위 분위 동일가중 평균) 시계열.
// signal 오름차순 정렬 → 상위 분위(고signal)=long, 하위 분위(저signal)=short. frac=분위 비율.
// minStocks 미만인 달은 건너뜀(분위 형성 불가).
export function tertileLongShort(
  months: { signal: number; ret: number }[][],
  frac = 1 / 3,
  minStocks = 15,
): { ls: number[]; hi: number[]; lo: number[]; kept: number } {
  const ls: number[] = [], hi: number[] = [], lo: number[] = [];
  let kept = 0;
  for (const obs of months) {
    if (obs.length < minStocks) continue;
    const sorted = obs.slice().sort((a, b) => a.signal - b.signal);
    const n = sorted.length, t = Math.max(1, Math.floor(n * frac));
    const low = sorted.slice(0, t).map((o) => o.ret);
    const high = sorted.slice(n - t).map((o) => o.ret);
    const hm = mean(high), lm = mean(low);
    hi.push(hm); lo.push(lm); ls.push(hm - lm); kept++;
  }
  return { ls, hi, lo, kept };
}

// ── 다중 선형회귀(OLS, 절편 포함) — 팩터 알파 계산용 ──
// y = a + b1·x1 + ... + bk·xk. 반환 coef[0]=절편(알파)·이하 베타, t[]=동순서 t값.
// 롱숏(자기금융) 수익을 팩터에 회귀 → 절편 알파가 "기존 팩터 노출을 넘는 초과수익"인지 검정.
export function ols(y: number[], Xcols: number[][]): { coef: number[]; t: number[]; n: number; k: number; r2: number } {
  const n = y.length;
  const k = Xcols.length + 1;
  const A: number[][] = [];
  for (let i = 0; i < n; i++) { const row = [1]; for (const col of Xcols) row.push(col[i]); A.push(row); }
  const AtA: number[][] = Array.from({ length: k }, () => new Array(k).fill(0));
  const Aty: number[] = new Array(k).fill(0);
  for (let i = 0; i < n; i++) for (let a = 0; a < k; a++) {
    Aty[a] += A[i][a] * y[i];
    for (let b = 0; b < k; b++) AtA[a][b] += A[i][a] * A[i][b];
  }
  const inv = invMatrix(AtA);
  const coef = new Array(k).fill(0);
  for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) coef[a] += inv[a][b] * Aty[b];
  const ybar = mean(y);
  let sse = 0, sst = 0;
  for (let i = 0; i < n; i++) {
    let yhat = 0; for (let a = 0; a < k; a++) yhat += A[i][a] * coef[a];
    sse += (y[i] - yhat) ** 2; sst += (y[i] - ybar) ** 2;
  }
  const sigma2 = sse / (n - k);
  const t = coef.map((c, a) => c / Math.sqrt(sigma2 * inv[a][a]));
  return { coef, t, n, k, r2: sst ? 1 - sse / sst : NaN };
}

// 정방행렬 역행렬 (Gauss-Jordan) — OLS 내부용.
function invMatrix(M: number[][]): number[][] {
  const k = M.length;
  const A = M.map((row, i) => [...row, ...Array.from({ length: k }, (_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < k; col++) {
    let piv = col;
    for (let r = col + 1; r < k; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    [A[col], A[piv]] = [A[piv], A[col]];
    const d = A[col][col];
    for (let j = 0; j < 2 * k; j++) A[col][j] /= d;
    for (let r = 0; r < k; r++) if (r !== col) { const f = A[r][col]; for (let j = 0; j < 2 * k; j++) A[r][j] -= f * A[col][j]; }
  }
  return A.map((row) => row.slice(k));
}
