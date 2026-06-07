<!-- 2026-06-06 -->
# STEP 181 — 미리보기 패널을 필터 밑·랭킹과 같은 높이로 (토스 정렬)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_181_COMMAND.md 파일 내용대로 실행해줘`

## 목표
상세 미리보기 패널이 지금 **탭 높이**에서 시작(필터보다 위) → 토스처럼 **필터(한 줄 칩+구분선) 밑, 랭킹 테이블과 같은 높이**에서 시작하게. 즉 `[필터]` → 그 밑에 `[랭킹 테이블 ｜ 미리보기]` 나란히.
- 방법: 미리보기를 `MarketClient` 테이블 옆(필터 다음)으로 이동 = `detailSlot` prop. 호버 상태(`hovered`)는 HomeClientV6 유지.

## 전제 상태
- HEAD: STEP 180 적용된 상태
- 변경: `components/market/MarketClient.tsx`(4곳) · `components/home-v6/HomeRankingTabs.tsx`(3곳) · `components/home-v6/HomeClientV6.tsx`(1곳)

---

## 작업 1/8 — `MarketClient.tsx` ① ReactNode import

**찾기:**
```tsx
import { useEffect, useState } from "react";
```
**바꾸기:**
```tsx
import { useEffect, useState, type ReactNode } from "react";
```

## 작업 2/8 — `MarketClient.tsx` ② detailSlot prop

**찾기:**
```tsx
export default function MarketClient({ embedded = false, onHover }: { embedded?: boolean; onHover?: (s: HoverStock) => void }) {
```
**바꾸기:**
```tsx
export default function MarketClient({ embedded = false, onHover, detailSlot }: { embedded?: boolean; onHover?: (s: HoverStock) => void; detailSlot?: ReactNode }) {
```

## 작업 3/8 — `MarketClient.tsx` ③ 테이블을 flex로 감싸고 미리보기 자리 (열기)

**찾기:**
```tsx
          {/* 랭킹 테이블 */}
          <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft overflow-hidden">
```
**바꾸기:**
```tsx
          {/* 랭킹 테이블 (embedded: 우측 미리보기 — 필터 밑, 테이블과 같은 높이) */}
          <div className={embedded ? "flex items-start gap-4" : ""}>
          <section className={`overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft ${embedded ? "flex-1 min-w-0" : ""}`}>
```

## 작업 4/8 — `MarketClient.tsx` ④ 미리보기 렌더 + flex 닫기

**찾기:**
```tsx
              </table>
            )}
          </section>
        </>
      )}
```
**바꾸기:**
```tsx
              </table>
            )}
          </section>
          {embedded && detailSlot}
          </div>
        </>
      )}
```

---

## 작업 5/8 — `HomeRankingTabs.tsx` ① ReactNode import

**찾기:**
```tsx
import { useState } from "react";
```
**바꾸기:**
```tsx
import { useState, type ReactNode } from "react";
```

## 작업 6/8 — `HomeRankingTabs.tsx` ② detailSlot prop

**찾기:**
```tsx
export default function HomeRankingTabs({ onHover }: { onHover?: (s: HoverStock) => void }) {
```
**바꾸기:**
```tsx
export default function HomeRankingTabs({ onHover, detailSlot }: { onHover?: (s: HoverStock) => void; detailSlot?: ReactNode }) {
```

## 작업 7/8 — `HomeRankingTabs.tsx` ③ MarketClient 에 detailSlot 전달

**찾기:**
```tsx
      {tab === "chart" && <MarketClient embedded onHover={onHover} />}
```
**바꾸기:**
```tsx
      {tab === "chart" && <MarketClient embedded onHover={onHover} detailSlot={detailSlot} />}
```

---

## 작업 8/8 — `HomeClientV6.tsx` (랭킹 영역: 미리보기를 detailSlot 으로)

**찾기:**
```tsx
          <div className="mt-5 flex gap-4">
            <div className="flex-1 min-w-0">
              <HomeRankingTabs onHover={setHovered} />
            </div>
            <HomeStockDetail stock={hovered} />
          </div>
```
**바꾸기:**
```tsx
          <div className="mt-5">
            <HomeRankingTabs onHover={setHovered} detailSlot={<HomeStockDetail stock={hovered} />} />
          </div>
```

> 핵심: 미리보기가 이제 **필터 다음·테이블 옆**(같은 높이)에 렌더됨. `[필터]` → `[랭킹 ｜ 미리보기]`. 호버→상세 동작·관심레일은 그대로.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx components/home-v6/HomeRankingTabs.tsx components/home-v6/HomeClientV6.tsx && git commit -m "feat(v7): 미리보기 패널을 필터 밑·랭킹 테이블과 같은 높이로 (토스 정렬, detailSlot) (STEP 181)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 미리보기 패널이 **탭 높이가 아니라, 필터 한 줄 밑·랭킹 테이블과 같은 높이**에서 시작하는지 (토스처럼 [필터]→[랭킹 ｜ 미리보기])
- [ ] 종목 hover 시 미리보기 갱신·캔들·커뮤니티 그대로 동작
- [ ] '지금 뜨는 카테고리'·'국내 투자자 동향' 탭은 미리보기 없이 전체폭(정상)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 미리보기는 `xl` 이상에서만 표시(좁은 화면은 테이블 전체폭).
- 미리보기는 실시간 차트 탭에서만(카테고리·투자자 탭은 리스트 전체폭).
- 다음: 미국 탭 "데이터 없음" 버그.

---
> STEP 181 = 미리보기 정렬(필터 밑). 전제 STEP 180. 다음: 미국탭 버그. 문서 묶어 갱신.
