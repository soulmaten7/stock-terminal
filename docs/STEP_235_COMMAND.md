<!-- 2026-06-14 -->
# STEP 235 — 홈 랭킹 탭을 '상품 타입 카테고리'로 재편 (주식·ETF·ETN·펀드·리츠·리딩방 리스트)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_235_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 확정)
탭을 **상품 타입**으로 바꾼다. 옛 라벨(실시간 차트 / 투자상품 랭킹)을 제거하고:
- **주식 · ETF · ETN · 펀드 · 리츠 · | · 리딩방 리스트** (맨 끝 구분선 유지)
- 매핑: 실시간 차트 → **주식**(MarketClient) / 투자상품 랭킹 → **ETF**(HomeEtfRanking) / **ETN·펀드·리츠** = '준비 중' placeholder
- ETF 탭에서는 내부 'ETF/펀드' 토글을 **숨김**(펀드는 별도 탭이 됐으므로) → `HomeEtfRanking`에 `fixedAsset` prop 추가.

> ETN·펀드·리츠는 데이터 소스가 아직 없어 **placeholder('준비 중')**로 자리만. 실제 데이터·칼럼 통일 = 다음 STEP(236~).

## 전제 상태
- 현재 HEAD: STEP 234 상태 (`6480fed`)
- 변경 **2파일**:
  - `components/home-v6/HomeRankingTabs.tsx` (**전체 교체**)
  - `components/home-v6/HomeEtfRanking.tsx` (**find/replace 2곳** — prop 추가 + 토글 숨김)
- DB·API 변경 0

---

## 작업 1/2 — `components/home-v6/HomeRankingTabs.tsx` (파일 전체 교체)

```tsx
"use client";

import { useState, Fragment, type ReactNode } from "react";
import MarketClient, { type HoverStock } from "@/components/market/MarketClient";
import HomeEtfRanking from "./HomeEtfRanking";
import HomeRoomRanking from "./HomeRoomRanking";

const TABS = [
  { key: "stock", label: "주식" },
  { key: "etf", label: "ETF" },
  { key: "etn", label: "ETN" },
  { key: "fund", label: "펀드" },
  { key: "reit", label: "리츠" },
  { key: "room", label: "리딩방 리스트" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function ComingSoon({ label }: { label: string }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <span className="mb-2 text-2xl">🗂️</span>
        <p className="text-sm font-medium text-unjong-primary">{label} 성적표는 준비 중이에요</p>
        <p className="mt-1 text-xs text-unjong-muted">데이터 소스 연동 후 주식·ETF와 같은 기간 수익률 방식으로 제공해요</p>
      </div>
    </section>
  );
}

export default function HomeRankingTabs({ onHover, detailSlot }: { onHover?: (s: HoverStock) => void; detailSlot?: ReactNode }) {
  const [tab, setTab] = useState<TabKey>("stock");

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 border-b border-unjong-border">
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

        {/* 오른쪽 자투리 공간: 시장 시간 안내 (넓은 화면만 — 좁으면 탭 우선) */}
        <div className="ml-auto hidden items-center gap-4 pb-2 pr-1 text-xs text-unjong-muted xl:flex">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F04452]" />
            국내 애프터마켓 <span className="font-medium text-unjong-primary">15:30~20:00</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F04452]" />
            해외 프리마켓 <span className="font-medium text-unjong-primary">17:00~22:30</span>
          </span>
        </div>
      </div>

      {tab === "stock" && <MarketClient embedded onHover={onHover} detailSlot={detailSlot} />}
      {tab === "etf" && <HomeEtfRanking fixedAsset="etf" />}
      {tab === "etn" && <ComingSoon label="ETN" />}
      {tab === "fund" && <HomeEtfRanking fixedAsset="fund" />}
      {tab === "reit" && <ComingSoon label="리츠" />}
      {tab === "room" && <HomeRoomRanking platforms={["telegram", "kakao"]} kind="room" />}
    </div>
  );
}
```

> 기본 탭 = **주식**(`stock`). ETN·리츠 = `ComingSoon`. 펀드 = `HomeEtfRanking fixedAsset="fund"`(기존 '펀드 준비 중' 카드 재사용). 구분선(리딩방 앞) 유지.

---

## 작업 2/2 — `components/home-v6/HomeEtfRanking.tsx` (find/replace 2곳)

**① 찾기 (함수 시그니처 + asset 초기값):**
```tsx
export default function HomeEtfRanking() {
  const router = useRouter();
  const [asset, setAsset] = useState<"etf" | "fund">("etf");
```
**바꾸기:**
```tsx
export default function HomeEtfRanking({ fixedAsset }: { fixedAsset?: "etf" | "fund" } = {}) {
  const router = useRouter();
  const [asset, setAsset] = useState<"etf" | "fund">(fixedAsset ?? "etf");
```
> `fixedAsset`이 오면 그 자산으로 고정(토글 숨김). 안 오면 기존대로 'etf' 시작(하위호환).

**② 찾기 (ETF/펀드 토글 + 뒤 구분선):**
```tsx
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setAsset("etf")} className={chip(asset === "etf")}>ETF</button>
          <button type="button" onClick={() => setAsset("fund")} className={chip(asset === "fund")}>펀드</button>
        </div>
        <span className="mx-1 h-5 w-px bg-unjong-border" />
```
**바꾸기:**
```tsx
        {!fixedAsset && (
          <>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setAsset("etf")} className={chip(asset === "etf")}>ETF</button>
              <button type="button" onClick={() => setAsset("fund")} className={chip(asset === "fund")}>펀드</button>
            </div>
            <span className="mx-1 h-5 w-px bg-unjong-border" />
          </>
        )}
```
> 탭으로 ETF/펀드가 분리됐으니, 탭에서 부를 땐(`fixedAsset` 있음) 내부 토글·뒤 구분선을 **숨김**. 정렬 칩(거래대금순·기간 수익률)은 그대로.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeRankingTabs.tsx components/home-v6/HomeEtfRanking.tsx && git commit -m "feat(v7): 홈 랭킹 탭 상품타입 재편(주식·ETF·ETN·펀드·리츠·리딩방 리스트)+ETF fixedAsset (STEP 235)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 홈 탭 = **주식 · ETF · ETN · 펀드 · 리츠 · | · 리딩방 리스트** (기본 선택 = 주식)
- [ ] **주식** 탭 = 기존 성적표 테이블(현재가·1일·1개월·1년)
- [ ] **ETF** 탭 = ETF 랭킹(내부 ETF/펀드 토글 **사라짐**, 정렬 칩은 유지)
- [ ] **ETN · 펀드 · 리츠** 탭 = '준비 중' placeholder
- [ ] '리딩방 리스트' 맨 끝 + 앞 구분선 유지
- ⚠️ 하드 새로고침(Cmd+Shift+R).

## 주의·예상 이슈
- 탭이 6개라 넓은 화면에서 오른쪽 '시장 시간 안내'와 폭이 빠듯할 수 있음(라벨이 짧아 대개 OK). 겹치면 다음에 시장시간 위치 조정.
- 펀드 탭은 `HomeEtfRanking`의 기존 '펀드 준비 중' 카드가 그대로 나옴(컨트롤바는 거의 빈 상태 — 정상).
- `HomeEtfRanking` 내부 'fund' 경로는 탭 분리 후에도 유지(무해, 하위호환).
- **문서 TODO**(다음 갱신): STEP 228~235.

---
> STEP 235 = 홈 탭 상품타입 재편 + ETF 토글 숨김(fixedAsset). 전제 STEP 234(`6480fed`).
> 다음(236) = ETF·펀드 테이블 성적표 칼럼 통일 + 주식 1주~1년·시총 데이터 연동.
