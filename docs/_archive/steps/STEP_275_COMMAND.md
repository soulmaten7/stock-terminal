<!-- 2026-06-18 -->
# STEP 275 — 미리보기 차트 짤림 수정 + ETN 차트 미렌더(토론만) + 로그인 문구 단축

## 🔧 실행 (Sonnet — 정확한 find/replace 명세 제공)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_275_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: `4f9cbf0` (STEP 274). 빌드 ✓.
- **결과 커밋 예정**: STEP 275.

---

## 🎯 목표 (3가지)

1. **차트 "짤림" 수정** — STEP 274에서 봉 너비를 60봉 기준으로 고정하면서, 봉이 적은 신규상장 종목은 오른쪽에 몰리고 **왼쪽이 비어 짤린 것처럼** 보였다. → **차트폭을 꽉 채우되**(빈 여백 제거), 봉이 적어도 **봉 몸통이 너무 두꺼워지지 않게 너비 상한**(6px)을 둔다. (짤림·뚱뚱 둘 다 해결)
2. **ETN 차트 미렌더** — KIS·Yahoo 모두 ETN 일봉을 제공하지 않음(실측 확인: ETN은 KIS rt=0이지만 데이터 0, ETF 대조군 정상). 없는 데이터를 흉내내지 않고 **ETN 미리보기는 차트 블록 자체를 그리지 않고 "종목 토론"만** 표시한다. (운종 = 정확한 정보)
3. **로그인 문구 단축** — `토론 글쓰기는 로그인 후 가능 · 카카오 로그인 →` → **`토론 글쓰기 로그인후 가능`**.

> ETF·주식·리츠 차트는 그대로 유지(KIS 실데이터 정상). **ETN만** 차트 숨김.

---

## 📄 파일 1 — `components/home-v6/HomeStockDetail.tsx`

### (1-A) 봉 너비: 고정 → 꽉 채움
**찾기:**
```tsx
  // 봉 너비를 60봉 기준으로 고정 — 종목마다(신규상장 등) 봉 개수가 달라도 두께 동일.
  // 봉이 60개보다 적으면 오른쪽(최근)부터 정렬하고 왼쪽은 여백으로 둔다.
  const cw = w / 60;
  const offset = w - data.length * cw;
```
**바꾸기:**
```tsx
  // 차트폭을 꽉 채우되(빈 여백 없음), 봉이 적어도 몸통이 너무 두꺼워지지 않게 너비 상한(6px).
  const cw = w / data.length;
```

### (1-B) 봉 몸통 너비 상한
**찾기:**
```tsx
  const bw = Math.max(1.2, cw * 0.6);
```
**바꾸기:**
```tsx
  const bw = Math.max(1.2, Math.min(cw * 0.6, 6));
```

### (1-C) x 좌표에서 offset 제거 (3곳 — find&replace 전체치환)
- **찾기:** `const x = offset + i * cw + cw / 2;`
- **바꾸기:** `const x = i * cw + cw / 2;`
> 라벨·캔들·거래량 3곳 모두 동일 문자열이라 전체치환. (offset 변수는 이 교체 후 더 이상 쓰이지 않으므로 (1-A)에서 정의를 지운 것과 맞아떨어진다.)

### (1-D) noChart prop 추가 (시그니처)
**찾기:**
```tsx
export default function HomeStockDetail({ stock, wide = false }: { stock: HoverStock | null; wide?: boolean }) {
```
**바꾸기:**
```tsx
export default function HomeStockDetail({ stock, wide = false, noChart = false }: { stock: HoverStock | null; wide?: boolean; noChart?: boolean }) {
```

### (1-E) 차트 fetch: ETN(noChart)이면 건너뜀
**찾기:**
```tsx
  useEffect(() => {
    if (!stock) { setCandles([]); return; }
    const code = stock.symbol;
    const isKr = isKrxCode(code);
```
**바꾸기:**
```tsx
  useEffect(() => {
    if (!stock || noChart) { setCandles([]); return; }
    const code = stock.symbol;
    const isKr = isKrxCode(code);
```

그리고 그 차트 useEffect의 의존성 배열도 교체:
**찾기:**
```tsx
    return () => { cancelled = true; clearTimeout(t); };
  }, [stock?.symbol]);
```
**바꾸기:**
```tsx
    return () => { cancelled = true; clearTimeout(t); };
  }, [stock?.symbol, noChart]);
```
> ⚠️ `}, [stock?.symbol]);`는 **차트 useEffect에만** 있음(토론 useEffect는 `[stock?.symbol, reloadN]`). 정확히 이 한 곳만 교체.

### (1-F) 차트 블록 조건부 렌더 (ETN은 안 그림)
**찾기:**
```tsx
            {/* 캔들차트 */}
            <div className="border-b border-unjong-border px-2 py-3">
              <p className="px-2 pb-1 text-xs text-unjong-muted">일봉</p>
              <CandleChart candles={candles} />
            </div>
```
**바꾸기:**
```tsx
            {/* 캔들차트 — ETN 등 차트 미제공 종목은 블록 자체를 그리지 않음 */}
            {!noChart && (
              <div className="border-b border-unjong-border px-2 py-3">
                <p className="px-2 pb-1 text-xs text-unjong-muted">일봉</p>
                <CandleChart candles={candles} />
              </div>
            )}
```

### (1-G) 로그인 문구 단축
**찾기:**
```tsx
                  토론 글쓰기는 로그인 후 가능 · 카카오 로그인 →
```
**바꾸기:**
```tsx
                  토론 글쓰기 로그인후 가능
```

---

## 📄 파일 2 — `components/home-v6/HomePerfRanking.tsx` (ETN·리츠 공용)

### (2-A) noChart prop 받기
**찾기:**
```tsx
export default function HomePerfRanking({ apiPath, emptyLabel }: { apiPath: string; emptyLabel: string }) {
```
**바꾸기:**
```tsx
export default function HomePerfRanking({ apiPath, emptyLabel, noChart = false }: { apiPath: string; emptyLabel: string; noChart?: boolean }) {
```

### (2-B) 미리보기에 noChart 전달
**찾기:**
```tsx
        <HomeStockDetail stock={previewStock} wide />
```
**바꾸기:**
```tsx
        <HomeStockDetail stock={previewStock} wide noChart={noChart} />
```

---

## 📄 파일 3 — `components/home-v6/HomeRankingTabs.tsx` (ETN 탭만 noChart)

**찾기:**
```tsx
      {tab === "etn" && <HomePerfRanking apiPath="/api/krx/etn-performance" emptyLabel="ETN" />}
```
**바꾸기:**
```tsx
      {tab === "etn" && <HomePerfRanking apiPath="/api/krx/etn-performance" emptyLabel="ETN" noChart />}
```
> 리츠 탭(`/api/yahoo/reit-performance`)은 **그대로 둠** — 리츠는 KRX 상장 종목이라 KIS 차트 정상.

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러 + 미사용 변수(`offset` 등) 경고 없을 것.

개발 서버(`npm run dev`, 포트 3333) 눈 확인:
1. **ETF/주식 미리보기 차트** → 신규상장 종목(예: KODEX SK하이닉스레버리지 0193T0)도 **차트폭을 꽉 채우고**, 봉이 과하게 두껍지 않은지(짤림 사라짐).
2. **ETN 탭** → 종목 클릭 시 미리보기에 **차트 블록이 아예 없고** "종목 토론"만 보이는지("차트 데이터 없음"도 안 뜸).
3. **리츠 탭** → 차트는 그대로 정상인지.
4. **비로그인 문구** → "토론 글쓰기 로그인후 가능"으로 짧아졌는지.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "fix: 미리보기 차트 꽉채움+봉두께상한, ETN 차트블록 미렌더(토론만), 로그인 문구 단축 (STEP 275)" && git push
```

---

> **한 줄 요약**: 차트는 폭을 꽉 채우되 봉 두께 상한으로 짤림·뚱뚱 해결, ETN은 데이터가 없으니 차트 블록 자체를 빼고 종목 토론만, 로그인 문구 단축.
