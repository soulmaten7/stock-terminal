<!-- 2026-06-07 -->
# STEP 208 — 종목 상세 토스급 보강 (색버그 + 캔들색 + 기본탭 + 전일대비 절대값)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_208_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (점검 결과 — 버그 2 + 다듬기 2)
1. 🐛 `StockInfoPanel` 헤더: **상승 가격 색이 파랑→빨강**(STEP 189 sed가 삼항 양쪽을 `#3182F6`으로 망가뜨림)
2. 🐛 좌측 일봉 캔들 색: 옛날 `#0E7C7B`/`#C73E3A` → 한국식 **상승 `#F04452`·하락 `#3182F6`**
3. `StockTabs` 기본 탭 **'토론' → '차트·시세'**(종목 페이지는 시세 먼저)
4. 가격 헤더: **전일대비 절대 변화량** 추가(가격·등락률에서 역산) + 가격 글씨 키움

## 전제 상태
- HEAD: STEP 207 상태
- 변경: `components/stock/StockInfoPanel.tsx`(3곳) + `components/stock/StockTabs.tsx`(1곳)

---

## 작업 1/4 — `StockInfoPanel.tsx` 전일대비 절대값 계산 추가

**찾기:**
```tsx
  const isUp = data.changePct >= 0;
  const isUS = !isKr;
```
**바꾸기:**
```tsx
  const isUp = data.changePct >= 0;
  const isUS = !isKr;
  const denom = 1 + data.changePct / 100;
  const changeAbs = Math.abs(denom !== 0 ? data.price - data.price / denom : 0);
  const changeAbsText = isUS ? `$${changeAbs.toFixed(2)}` : Math.round(changeAbs).toLocaleString();
```

## 작업 2/4 — `StockInfoPanel.tsx` 헤더 가격 블록 (색버그 + 절대값 + 키움)

**찾기:**
```tsx
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-unjong-primary tabular-nums">
            {isUS ? `$${data.price.toFixed(2)}` : data.price.toLocaleString()}
          </span>
          <span className={`flex items-center gap-0.5 text-sm font-semibold ${isUp ? "text-[#3182F6]" : "text-[#3182F6]"}`}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isUp ? "+" : ""}{data.changePct.toFixed(2)}%
          </span>
        </div>
```
**바꾸기:**
```tsx
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-2xl font-bold tabular-nums text-unjong-primary">
            {isUS ? `$${data.price.toFixed(2)}` : data.price.toLocaleString()}
          </span>
          <span className={`flex items-center gap-1 text-sm font-semibold tabular-nums ${isUp ? "text-[#F04452]" : "text-[#3182F6]"}`}>
            {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {changeAbsText} ({isUp ? "+" : ""}{data.changePct.toFixed(2)}%)
          </span>
        </div>
```

## 작업 3/4 — `StockInfoPanel.tsx` 캔들 색 한국식

**찾기:**
```tsx
        const series = chart.addCandlestickSeries({
          upColor: "#0E7C7B",
          downColor: "#C73E3A",
          borderUpColor: "#0E7C7B",
          borderDownColor: "#C73E3A",
          wickUpColor: "#0E7C7B",
          wickDownColor: "#C73E3A",
        });
```
**바꾸기:**
```tsx
        const series = chart.addCandlestickSeries({
          upColor: "#F04452",
          downColor: "#3182F6",
          borderUpColor: "#F04452",
          borderDownColor: "#3182F6",
          wickUpColor: "#F04452",
          wickDownColor: "#3182F6",
        });
```

## 작업 4/4 — `StockTabs.tsx` 기본 탭 차트·시세

**찾기:**
```tsx
  const [active, setActive] = useState<Tab>("discussion");
```
**바꾸기:**
```tsx
  const [active, setActive] = useState<Tab>("chart");
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/stock/StockInfoPanel.tsx components/stock/StockTabs.tsx && git commit -m "fix(v7): 종목 상세 토스급 — 상승가 색버그(파랑→빨강)+캔들 한국식 색+기본탭 차트·시세+전일대비 절대값 (STEP 208)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 종목 상세 좌측 헤더: **상승 가격·등락률이 빨강**(파랑 버그 사라짐), 하락은 파랑
- [ ] 가격 옆 **전일대비 절대값 + (%)** 표시(예: `+1,500 (+2.30%)`), 가격 글씨 커짐
- [ ] 좌측 일봉 캔들 **양봉 빨강·음봉 파랑**(청록/암적 사라짐)
- [ ] 종목 페이지 들어가면 기본 탭이 **차트·시세**(토론 아님)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 전일대비 절대값은 현재가·등락률로 역산(별도 API 불필요). 등락률 0%면 0.
- 중앙 탭의 큰 차트(`StockChartSection`) 캔들 색도 같은 옛날 색일 수 있음 → **다음 점검**(STEP 209 후보).
- 미국 종목 뒤로가기 라벨이 "한국주식"인 건 사소 — 추후.
- **문서 TODO**(다음 갱신): STEP 207~208.

---
> STEP 208 = 종목 상세 색버그·기본탭·전일대비. 전제 STEP 207. 다음: StockChartSection 색 점검 등. 문서 묶어 갱신.
