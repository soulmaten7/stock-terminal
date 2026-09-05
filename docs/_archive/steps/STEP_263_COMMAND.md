<!-- 2026-06-15 -->
# STEP 263 — ETN 탭 기간칩 전환 + /market ETN 전 기간 합류

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_263_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (ETN도 다른 탭처럼 — 2단계: UI)
STEP 262 `/api/krx/etn-performance`가 1일~1년 전부 줌(확인 완료: 1년 전 20250617·378개). 이제:
- **ETN 탭**: `HomeEtnRanking`(거래대금순/1일) → **`HomePerfRanking`(리츠와 동일, 기간칩 1일~1년)**. 다른 탭과 완전 일관.
- **/market ETN**: 소스를 `/api/krx/etn`(1일) → `/api/krx/etn-performance`(전 기간)로. ETN이 1일뿐 아니라 1주~1년 비교에도 합류 → "1일만" 안내 제거.
- `HomeEtnRanking.tsx` 삭제(미사용).

## 전제 상태
- 현재 HEAD: STEP 262 적용 후(`98a3118`)
- 변경:
  - `components/home-v6/HomeRankingTabs.tsx` (ETN → HomePerfRanking, import 정리)
  - `components/market/MarketDirectoryClient.tsx` (ETN 소스 교체 + 1일전용 안내 제거)
  - **파일 삭제**: `components/home-v6/HomeEtnRanking.tsx`

---

## 작업 1/3 — `components/home-v6/HomeRankingTabs.tsx`

**① import 제거 — 찾기:**
```tsx
import HomeRoomRanking from "./HomeRoomRanking";
import HomeEtnRanking from "./HomeEtnRanking";
```
**바꾸기:**
```tsx
import HomeRoomRanking from "./HomeRoomRanking";
```

**② ETN 렌더 교체 — 찾기:**
```tsx
      {tab === "etn" && <HomeEtnRanking />}
```
**바꾸기:**
```tsx
      {tab === "etn" && <HomePerfRanking apiPath="/api/krx/etn-performance" emptyLabel="ETN" />}
```

---

## 작업 2/3 — `components/market/MarketDirectoryClient.tsx`

**① grabEtn 제거 + ETN 소스 교체 — 찾기:**
```tsx
      const grabEtn = (): Promise<PerfItem[]> =>
        fetch("/api/krx/etn")
          .then((r) => r.json())
          .then((j) => {
            const arr = (j.etns ?? []) as Array<{ symbol: string; name: string; price: number; changePercent: number; tradeAmount?: number }>;
            return [...arr]
              .sort((a, b) => (b.tradeAmount ?? 0) - (a.tradeAmount ?? 0))
              .slice(0, 40)
              .map((e) => ({ symbol: e.symbol, name: e.name, price: e.price, changePercent: e.changePercent })) as PerfItem[];
          })
          .catch(() => [] as PerfItem[]);

      const [kr, etf, reit, us, etn] = await Promise.all([
        grab("/api/yahoo/kr-performance"),
        grab("/api/yahoo/etf-performance"),
        grab("/api/yahoo/reit-performance"),
        grab("/api/yahoo/us-performance"),
        grabEtn(),
      ]);
```
**바꾸기:**
```tsx
      const [kr, etf, reit, us, etn] = await Promise.all([
        grab("/api/yahoo/kr-performance"),
        grab("/api/yahoo/etf-performance"),
        grab("/api/yahoo/reit-performance"),
        grab("/api/yahoo/us-performance"),
        grab("/api/krx/etn-performance"),
      ]);
```

**② 1일전용 안내 상수 제거 — 찾기:**
```tsx
  const previewStock = hovered ?? (rows[0] ? toHover(rows[0]) : null);

  // ETN은 1일 시세만 → 기간 선택 시 빈 결과 안내
  const etnPeriodNote = typeFilter === "ETN" && period !== "1d";

```
**바꾸기:**
```tsx
  const previewStock = hovered ?? (rows[0] ? toHover(rows[0]) : null);

```

**③ 1일전용 안내 분기 제거 — 찾기:**
```tsx
          {loading ? (
            <LoadingState className="py-10" />
          ) : etnPeriodNote ? (
            <EmptyState title="ETN은 1일 시세만 제공돼요" description="ETN은 기간 수익률 데이터가 없어요. '1일'로 보세요." className="py-10" />
          ) : rows.length === 0 ? (
```
**바꾸기:**
```tsx
          {loading ? (
            <LoadingState className="py-10" />
          ) : rows.length === 0 ? (
```

---

## 작업 3/3 — `HomeEtnRanking.tsx` 삭제

```bash
cd ~/stock-terminal && git rm components/home-v6/HomeEtnRanking.tsx
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeRankingTabs.tsx components/market/MarketDirectoryClient.tsx && git commit -m "feat(v7): ETN 탭 기간칩 전환(HomePerfRanking) + /market ETN 전 기간 합류 (STEP 263)" && git push
```
> `git rm`이 삭제를 스테이징 → 위 커밋에 포함.

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 재시작 + 홈 ETN 탭** → 거래대금순 대신 **기간칩(1일·1주일·1개월·3개월·6개월·1년)**, 주식·ETF·리츠와 동일한 모양
- [ ] **/market** → ETN 필터 + 1주~1년 선택 시에도 ETN이 표에 나옴(전엔 "1일만" 안내였음)
- [ ] 빌드 미사용 경고 0(HomeEtnRanking 삭제·import 제거 정상)

## 주의·예상 이슈
- `/api/krx/etn` (1일 프로브)는 이제 미사용이지만 남겨둠(무해). `/api/krx/etn-performance`가 본 소스.
- 첫 로드 시 etn-performance 6스냅샷 조회로 잠깐 늦을 수 있음(30분 캐시).
- **문서 TODO**(다음 갱신): STEP 262·263.

---
> STEP 263 = ETN 기간칩 전환 + /market 전 기간 합류. 전제 STEP 262(`98a3118`).
> 이걸로 주식·ETF·ETN·리츠·미국 전부 동일한 기간 수익률 방식 — 완전 일관.
