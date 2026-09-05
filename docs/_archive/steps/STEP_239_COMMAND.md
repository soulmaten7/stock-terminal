<!-- 2026-06-14 -->
# STEP 239 — 기간칩에서 '전' 제거 (1일·1주일·…·1년), 칼럼 헤더는 '…전 대비' 유지

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_239_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 확정)
- **기간칩 라벨에서 '전' 제거**: 1일전→**1일**, 1주일전→**1주일**, 1개월전→**1개월**, 3개월전→**3개월**, 6개월전→**6개월**, 1년전→**1년** (칩이 조잡해 보이는 것 정리)
- **칼럼 헤더는 '…전 대비' 유지** (예: "1일전 대비"). → 헤더 코드를 `{periodLabel} 대비` → `{periodLabel}전 대비`로 (라벨에서 '전'을 뺐으니 헤더에 '전'을 붙여 동일 결과).

## 전제 상태
- 현재 HEAD: STEP 238 상태
- 변경 **2파일** (각 2곳 find/replace):
  - `components/market/MarketClient.tsx`
  - `components/home-v6/HomeEtfRanking.tsx`
- DB·API 변경 0

---

## 작업 1/2 — `components/market/MarketClient.tsx`

**① 찾기 (PERIODS 라벨 — '전' 제거):**
```tsx
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "1d", label: "1일전" },
  { key: "1w", label: "1주일전" },
  { key: "1m", label: "1개월전" },
  { key: "3m", label: "3개월전" },
  { key: "6m", label: "6개월전" },
  { key: "1y", label: "1년전" },
];
```
**바꾸기:**
```tsx
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "1d", label: "1일" },
  { key: "1w", label: "1주일" },
  { key: "1m", label: "1개월" },
  { key: "3m", label: "3개월" },
  { key: "6m", label: "6개월" },
  { key: "1y", label: "1년" },
];
```

**② 찾기 (칼럼 헤더 — '전' 붙이기):**
```tsx
{periodLabel} 대비</th>
```
**바꾸기:**
```tsx
{periodLabel}전 대비</th>
```

---

## 작업 2/2 — `components/home-v6/HomeEtfRanking.tsx`

**① 찾기 (PERIODS 라벨 — '전' 제거):**
```tsx
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "1d", label: "1일전" },
  { key: "1w", label: "1주일전" },
  { key: "1m", label: "1개월전" },
  { key: "3m", label: "3개월전" },
  { key: "6m", label: "6개월전" },
  { key: "1y", label: "1년전" },
];
```
**바꾸기:**
```tsx
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "1d", label: "1일" },
  { key: "1w", label: "1주일" },
  { key: "1m", label: "1개월" },
  { key: "3m", label: "3개월" },
  { key: "6m", label: "6개월" },
  { key: "1y", label: "1년" },
];
```

**② 찾기 (칼럼 헤더 — '전' 붙이기):**
```tsx
{periodLabel} 대비</th>
```
**바꾸기:**
```tsx
{periodLabel}전 대비</th>
```

> `periodLabel`이 이제 "1일"이라 헤더는 `"1일"+"전 대비"` = **"1일전 대비"**로 그대로. 칩만 "1일"로 짧아짐.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx components/home-v6/HomeEtfRanking.tsx && git commit -m "style(v7): 기간칩 '전' 제거(1일·1주일·…·1년), 헤더는 '…전 대비' 유지 (STEP 239)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 주식·ETF 탭 기간칩 = **1일 · 1주일 · 1개월 · 3개월 · 6개월 · 1년** ('전' 없음)
- [ ] 칼럼 헤더는 여전히 **"1일전 대비"** (칩 누르면 "1주일전 대비" 등)
- ⚠️ 하드 새로고침(Cmd+Shift+R).

## 주의·예상 이슈
- 헤더 find `{periodLabel} 대비</th>`는 두 파일에 각 1곳뿐이라 안전.
- **문서 TODO**(다음 갱신): STEP 228~239.

---
> STEP 239 = 기간칩 '전' 제거(헤더는 유지). 전제 STEP 238.
