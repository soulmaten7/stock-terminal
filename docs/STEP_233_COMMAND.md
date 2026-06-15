<!-- 2026-06-14 -->
# STEP 233 — 홈: 실시간 속보 카드 제거 + 랭킹 탭 정리 + 리딩방 리스트(맨 끝)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_233_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 확정)
1. 홈 **🔴 실시간 속보 카드 제거** → 아래 실시간차트(성적표)가 자연스럽게 최상단으로 reflow.
2. 홈 랭킹 탭 **3개 제거**: '지금 뜨는 카테고리' · '국내 투자자 동향' · '주식 관련 채널 랭킹'.
3. '리딩방 랭킹' → **'리딩방 리스트'** 개명 + **맨 끝**으로 이동 (앞에 얇은 구분선).
4. 결과 탭: **실시간 차트 · 투자상품 랭킹 · | · 리딩방 리스트**

> ※ '기간 성적표 칼럼(현재가 + 1일~1년 등락률 + 시총)'과 '주식/ETF/ETN 카테고리 분리'는
> **기간별 등락률·시총 데이터 레이어가 필요**해서 다음 STEP(234)으로 분리한다.
> (지금 기간 칩이 '실시간' 빼고 disabled인 이유 = 그 데이터가 아직 없어서임.)

## 전제 상태
- 현재 HEAD: STEP 232 상태 (홈에 `<HomeBreakingNews />` 존재, 랭킹 탭 6개)
- 변경 2파일: `components/home-v6/HomeClientV6.tsx` · `components/home-v6/HomeRankingTabs.tsx`
- DB 변경 0 / 데이터 레이어 변경 0 (UI 구조만)
- 삭제 파일 없음 (`HomeBreakingNews.tsx`는 미사용으로 남겨둠 — 추후 재활용 가능)

---

## 작업 1/2 — `components/home-v6/HomeClientV6.tsx` (속보 카드 제거 + 최상단 reflow)

**① 찾기 (import 한 줄 삭제):**
```tsx
import HomeBreakingNews from "./HomeBreakingNews";
```
**바꾸기:** (이 줄을 완전히 삭제 — 빈 줄도 남기지 말 것)

**② 찾기 (왼쪽 컬럼 블록 — 주석 포함 정확히):**
```tsx
        {/* 왼쪽: 실시간 속보 + (랭킹 | 상세 2:1) */}
        <div className="min-w-0">
          {/* 🔴 실시간 속보 (옛 인기토론 카드 자리) */}
          <HomeBreakingNews />

          {/* 랭킹 + (xl) 종목 상세 패널(2:1) */}
          <div className="mt-5">
            <HomeRankingTabs onHover={setHovered} detailSlot={<HomeStockDetail stock={hovered} wide />} />
          </div>
        </div>
```
**바꾸기:**
```tsx
        {/* 왼쪽: 랭킹(성적표) | 상세 2:1 — 속보 제거로 최상단 */}
        <div className="min-w-0">
          <HomeRankingTabs onHover={setHovered} detailSlot={<HomeStockDetail stock={hovered} wide />} />
        </div>
```

> `HomeBreakingNews` import·렌더 둘 다 사라짐 → 미사용 import 없음(빌드 안전).
> `mt-5` 래퍼 제거로 랭킹이 지수 strip 바로 밑(최상단)에 붙음.

---

## 작업 2/2 — `components/home-v6/HomeRankingTabs.tsx` (탭 3개 제거 + 리딩방 리스트 맨 끝 + 구분선)

**① 찾기 (import 묶음 — 정확히):**
```tsx
import { useState, type ReactNode } from "react";
import MarketClient, { type HoverStock } from "@/components/market/MarketClient";
import SectorRanking from "./SectorRanking";
import InvestorTrend from "./InvestorTrend";
import HomeEtfRanking from "./HomeEtfRanking";
import HomeRoomRanking from "./HomeRoomRanking";
```
**바꾸기:**
```tsx
import { useState, Fragment, type ReactNode } from "react";
import MarketClient, { type HoverStock } from "@/components/market/MarketClient";
import HomeEtfRanking from "./HomeEtfRanking";
import HomeRoomRanking from "./HomeRoomRanking";
```
> `SectorRanking`·`InvestorTrend` import 제거(탭 삭제로 미사용) + `Fragment` 추가(구분선용).

**② 찾기 (TABS 정의):**
```tsx
const TABS = [
  { key: "chart", label: "실시간 차트" },
  { key: "category", label: "지금 뜨는 카테고리" },
  { key: "investor", label: "국내 투자자 동향" },
  { key: "etf", label: "투자상품 랭킹" },
  { key: "room", label: "리딩방 랭킹" },
  { key: "channel", label: "주식 관련 채널 랭킹" },
] as const;
```
**바꾸기:**
```tsx
const TABS = [
  { key: "chart", label: "실시간 차트" },
  { key: "etf", label: "투자상품 랭킹" },
  { key: "room", label: "리딩방 리스트" },
] as const;
```
> `TabKey` 타입은 `(typeof TABS)[number]["key"]`로 자동 추론 → "chart"|"etf"|"room". 별도 타입 수정 불필요.

**③ 찾기 (탭 버튼 map 전체):**
```tsx
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "-mb-px border-b-2 border-unjong-primary px-3 py-2 text-sm font-bold text-unjong-primary"
                : "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-unjong-muted hover:text-unjong-primary"
            }
          >
            {t.label}
          </button>
        ))}
```
**바꾸기:**
```tsx
        {TABS.map((t) => (
          <Fragment key={t.key}>
            {/* 리딩방 리스트 앞 구분선 — '상품 성적표'와 '검증 디렉토리' 경계 */}
            {t.key === "room" && <span className="mx-1 h-4 w-px bg-unjong-border" aria-hidden />}
            <button
              type="button"
              onClick={() => setTab(t.key)}
              className={
                tab === t.key
                  ? "-mb-px border-b-2 border-unjong-primary px-3 py-2 text-sm font-bold text-unjong-primary"
                  : "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-unjong-muted hover:text-unjong-primary"
              }
            >
              {t.label}
            </button>
          </Fragment>
        ))}
```
> `key`를 `<button>` → `<Fragment>`로 이동(중복 key 경고 방지). 구분선은 room 탭 앞에만 1개.

**④ 찾기 (탭 컨텐츠 렌더 6줄):**
```tsx
      {tab === "chart" && <MarketClient embedded onHover={onHover} detailSlot={detailSlot} />}
      {tab === "category" && <SectorRanking />}
      {tab === "investor" && <InvestorTrend />}
      {tab === "etf" && <HomeEtfRanking />}
      {tab === "room" && <HomeRoomRanking platforms={["telegram", "kakao"]} kind="room" />}
      {tab === "channel" && (
        <HomeRoomRanking platforms={["youtube", "discord", "instagram", "facebook", "naver_band", "naver_cafe", "other"]} kind="channel" />
      )}
```
**바꾸기:**
```tsx
      {tab === "chart" && <MarketClient embedded onHover={onHover} detailSlot={detailSlot} />}
      {tab === "etf" && <HomeEtfRanking />}
      {tab === "room" && <HomeRoomRanking platforms={["telegram", "kakao"]} kind="room" />}
```
> category·investor·channel 렌더 제거. 남은 렌더는 chart·etf·room 셋뿐 → 제거된 import 참조 0(빌드 안전).

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeClientV6.tsx components/home-v6/HomeRankingTabs.tsx && git commit -m "feat(v7): 홈 속보 카드 제거+랭킹 탭 3개 정리+리딩방 리스트 맨끝 (STEP 233)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 (미사용 import/변수 에러 없음) / 커밋·push 완료
- [ ] 홈에서 **🔴 실시간 속보 카드 사라짐** → 실시간차트(성적표)가 지수 strip 바로 밑 최상단
- [ ] 랭킹 탭이 **3개**만: 실시간 차트 · 투자상품 랭킹 · 리딩방 리스트
- [ ] '지금 뜨는 카테고리' · '국내 투자자 동향' · '주식 관련 채널 랭킹' **안 보임**
- [ ] '리딩방 리스트'가 **맨 끝**, 앞에 얇은 세로 구분선
- ⚠️ 클라이언트 컴포넌트 → 화면 그대로면 하드 새로고침(Cmd+Shift+R).

## 주의·예상 이슈
- 구분선이 불필요하면 작업 2/2 ③의 `{t.key === "room" && <span ... />}` **한 줄만** 지우면 됨(나머지 그대로).
- `HomeBreakingNews.tsx` · `/api/news/market` 는 **안 지움**(미사용으로 남음, 무해). 정리 원하면 추후 별도.
- `SectorRanking.tsx` · `InvestorTrend.tsx` 파일도 **남겨둠**(다른 곳 미참조 확인되면 다음에 정리).
- **문서 TODO**(다음 세션 갱신): STEP 228~233 (현재 문서 마지막 반영 = STEP 227).

---
> STEP 233 = 홈 속보 제거 + 탭 3개 정리 + 리딩방 리스트(맨끝). 전제 STEP 232.
> 다음(234) = 기간 성적표 칼럼(현재가 + 1일~1년 등락률 + 시총) + 주식/ETF/ETN 카테고리 = **데이터 레이어 STEP**.
