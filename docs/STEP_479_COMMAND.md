<!-- 2026-07-01 -->
# STEP 479 — 일본 탭 배관 (국가 토글에 🇯🇵 일본 추가)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_479_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (2파일: `stores/countryStore.ts` + `components/toolbox/ToolboxClient.tsx`)
국가 토글에 **🇯🇵 일본**을 추가해 일본 탭을 켠다. **JP `link_hub` 59행은 이미 DB에 있고 서버가 국가 필터 없이 전부 로딩** → 토글만 추가하면 링크가 자동 표시됨(page.tsx 수정 불필요).
- 이번 단계 = **링크 허브 탭만** 일본 노출. **종목·상품 = "준비 중" 플레이스홀더**(JpMarketBoard·데이터는 다음 STEP). 모아보기(피드)도 다음 STEP(일본은 아직 `FEED_COUNTRY_SUPPORT`에 없음 → 링크만).
- 유튜브·리딩방 탭은 원래 KR 전용이라 일본에선 자동으로 안 보임(기존 `country === 'KR'` 가드).

> 클라이언트/스토어만 수정 → HMR 즉시. (page.tsx 서버 컴포넌트는 안 건드리므로 클린 재시작 불필요.)

---

## 1) `stores/countryStore.ts` — 유니언에 'JP' 추가

**찾을 것:**
```ts
export type Country = 'KR' | 'US';
```
**바꿀 것:**
```ts
export type Country = 'KR' | 'US' | 'JP';
```

---

## 2) `components/toolbox/ToolboxClient.tsx`

### 2-A. 국가 토글 배열에 일본 추가
**찾을 것:**
```tsx
const COUNTRIES: { code: Country; label: string }[] = [
  { code: 'KR', label: '🇰🇷 한국' },
  { code: 'US', label: '🇺🇸 미국' },
];
```
**바꿀 것:**
```tsx
const COUNTRIES: { code: Country; label: string }[] = [
  { code: 'KR', label: '🇰🇷 한국' },
  { code: 'US', label: '🇺🇸 미국' },
  { code: 'JP', label: '🇯🇵 일본' },
];
```

### 2-B. `FEED_COUNTRY_SUPPORT` 타입 넓히기 (JP는 아직 미포함 = 링크만)
**찾을 것:**
```tsx
const FEED_COUNTRY_SUPPORT: Record<string, ('KR' | 'US')[]> = {
```
**바꿀 것:**
```tsx
const FEED_COUNTRY_SUPPORT: Record<string, Country[]> = {
```

### 2-C. `feedSupports` 파라미터 타입
**찾을 것:**
```tsx
function feedSupports(tab: string, c: 'KR' | 'US') { return FEED_COUNTRY_SUPPORT[tab]?.includes(c) ?? false; }
```
**바꿀 것:**
```tsx
function feedSupports(tab: string, c: Country) { return FEED_COUNTRY_SUPPORT[tab]?.includes(c) ?? false; }
```

### 2-D. `feedFor` — 파라미터 타입 + 일본 가드
**찾을 것:**
```tsx
function feedFor(tab: string, country: 'KR' | 'US') {
  switch (tab) {
```
**바꿀 것:** (JP는 피드 미구현 → null. 이후 switch에서 country는 'KR'|'US'로 좁혀짐)
```tsx
function feedFor(tab: string, country: Country) {
  if (country === 'JP') return null; // 일본 피드는 후속 STEP
  switch (tab) {
```

### 2-E. `countryLabel` — 삼항 → 매핑 (국가 3개+)
**찾을 것:**
```tsx
  const countryLabel = country === 'KR' ? '한국' : '미국';
```
**바꿀 것:**
```tsx
  const countryLabel = ({ KR: '한국', US: '미국', JP: '일본' } as Record<Country, string>)[country];
```

### 2-F. 종목·상품(market) 렌더 — 일본은 준비중 플레이스홀더
**찾을 것:**
```tsx
        {activeTab === 'market' ? (
          country === 'KR' ? (
            <MarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <UsMarketBoard isLoggedIn={isLoggedIn} />
          )
        ) : activeTab === 'youtube' ? (
```
**바꿀 것:**
```tsx
        {activeTab === 'market' ? (
          country === 'KR' ? (
            <MarketBoard isLoggedIn={isLoggedIn} />
          ) : country === 'US' ? (
            <UsMarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <Placeholder emoji="🇯🇵" title="일본 종목 — 준비 중" desc="종목·시세는 다음 업데이트에 추가돼요." />
          )
        ) : activeTab === 'youtube' ? (
```

---

## 3) 빌드 + 검증
```bash
npm run build
```
- [ ] 국가 토글에 **🇯🇵 일본** 노출, 클릭 시 전환.
- [ ] 일본 탭에서 **뉴스·공시·신용·리포트·기업재무·거시경제·ETF·공모주·거래소·커뮤니티·차트** 각 탭에 **일본 링크(EDINET·JPX·Kabutan·Nikkei·BOJ 등) 표시**.
- [ ] 종목·상품 = "일본 종목 — 준비 중" 플레이스홀더.
- [ ] 유튜브·리딩방 탭은 일본에서 안 보임(정상). KR/US는 기존 그대로.

## 4) 커밋
```bash
git add stores/countryStore.ts components/toolbox/ToolboxClient.tsx && git commit -m "feat(jp): 일본 국가 탭 배관 — 국가 토글 🇯🇵 추가, link_hub 자동 표시(종목·피드는 후속) (STEP 479)" && git push
```

## ⚠️ 다음 (일본 완성까지 남은 것)
- **종목·상품**: `JpMarketBoard` + 데이터 라우트(JPX/Yahoo `^N225`) + 크론 스냅샷(`jp_stock_snapshot`) — 플레이북 §4-2.
- **모아보기(피드)**: 뉴스(Google News `hl=ja&gl=JP`)·공시(EDINET)·거시(BOJ/e-Stat) → `FEED_COUNTRY_SUPPORT`에 JP 추가 + `feedFor` 일본 분기(STEP 473/474 미러).
- **인덱스 티커**: 닛케이225(`^N225`) 추가 · **통화**: 엔(¥) `lib/currency`.
