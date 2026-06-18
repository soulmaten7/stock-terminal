<!-- 2026-06-15 -->
# STEP 270 — 미리보기: hover → '행 클릭'으로 변경 (행 클릭 상세이동 제거)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_270_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (인터랙션 변경)
- 지금: 행에 **마우스 올리면(hover)** 미리보기 표시 + 행 **클릭 시 상세 페이지로 이동**.
- 변경: 행 **클릭 시 미리보기**에 표시(hover 자동표시 제거). **상세 이동은 미리보기 안 '종목 상세·토론 보기 →' 버튼**(이미 존재)으로만.
- 대상: MarketClient(주식)·HomeEtfRanking(ETF)·HomePerfRanking(ETN/리츠) + HomeStockDetail(빈 상태 문구).
- `router`는 행 클릭(상세 이동)에만 쓰였으므로 제거(상세 이동은 HomeStockDetail의 `Link`가 담당).

## 전제 상태
- 현재 HEAD: STEP 269 적용 후(`8408560`)
- 변경 **4파일**

---

## 작업 1/4 — `components/market/MarketClient.tsx` (주식)

**① useRouter import 제거 — 찾기:**
```tsx
import { useRouter } from "next/navigation";
import { LoadingState, EmptyState } from "@/components/ui/State";
```
**바꾸기:**
```tsx
import { LoadingState, EmptyState } from "@/components/ui/State";
```

**② const router 제거 — 찾기:**
```tsx
  const router = useRouter();
  const watchItems = useWatchlist((s) => s.items);
```
**바꾸기:**
```tsx
  const watchItems = useWatchlist((s) => s.items);
```

**③ 행: 클릭=미리보기, hover 제거 — 찾기:**
```tsx
                          key={r.symbol}
                          onClick={() => router.push(`/stock/${r.symbol}?name=${encodeURIComponent(r.name)}`)}
                          onMouseEnter={() => onHover?.({ symbol: r.symbol, name: r.name, priceText: r.priceText, changePercent: r.changePercent, volume: r.volume, tradeAmount: r.tradeAmount })}
                          className="border-b border-unjong-border last:border-0 hover:bg-unjong-background cursor-pointer"
```
**바꾸기:**
```tsx
                          key={r.symbol}
                          onClick={() => onHover?.({ symbol: r.symbol, name: r.name, priceText: r.priceText, changePercent: r.changePercent, volume: r.volume, tradeAmount: r.tradeAmount })}
                          className="border-b border-unjong-border last:border-0 hover:bg-unjong-background cursor-pointer"
```

---

## 작업 2/4 — `components/home-v6/HomePerfRanking.tsx` (ETN/리츠)

**① import 제거 — 찾기:**
```tsx
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
```
**바꾸기:**
```tsx
import { Heart } from "lucide-react";
```

**② const router 제거 — 찾기:**
```tsx
  const router = useRouter();
  const watchItems = useWatchlist((s) => s.items);
```
**바꾸기:**
```tsx
  const watchItems = useWatchlist((s) => s.items);
```

**③ previewStock 기본 null — 찾기:**
```tsx
  const previewStock = hovered ?? (rows[0] ? toHover(rows[0]) : null);
```
**바꾸기:**
```tsx
  const previewStock = hovered;
```

**④ 행: 클릭=미리보기, hover 제거 — 찾기:**
```tsx
                        key={r.symbol}
                        onClick={() => router.push(`/stock/${r.symbol}?name=${encodeURIComponent(r.name)}`)}
                        onMouseEnter={() => setHovered(toHover(r))}
                        className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background"
```
**바꾸기:**
```tsx
                        key={r.symbol}
                        onClick={() => setHovered(toHover(r))}
                        className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background"
```

---

## 작업 3/4 — `components/home-v6/HomeEtfRanking.tsx` (ETF)

**① import 제거 — 찾기:**
```tsx
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
```
**바꾸기:**
```tsx
import { Heart } from "lucide-react";
```

**② const router 제거 — 찾기:**
```tsx
  const router = useRouter();
  const asset = fixedAsset ?? "etf";
```
**바꾸기:**
```tsx
  const asset = fixedAsset ?? "etf";
```

**③ previewStock 기본 null — 찾기:**
```tsx
  const previewStock = hovered ?? (rows[0] ? toHover(rows[0]) : null);
```
**바꾸기:**
```tsx
  const previewStock = hovered;
```

**④ 행: 클릭=미리보기, hover 제거 — 찾기:**
```tsx
                        key={r.symbol}
                        onClick={() => router.push(`/stock/${r.symbol}?name=${encodeURIComponent(r.name)}`)}
                        onMouseEnter={() => setHovered(toHover(r))}
                        className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background"
```
**바꾸기:**
```tsx
                        key={r.symbol}
                        onClick={() => setHovered(toHover(r))}
                        className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background"
```

---

## 작업 4/4 — `components/home-v6/HomeStockDetail.tsx` (빈 상태 문구)

**찾기:**
```tsx
          <div className="p-5 text-sm text-unjong-muted">종목에 마우스를 올리면 상세가 표시됩니다.</div>
```
**바꾸기:**
```tsx
          <div className="p-5 text-sm text-unjong-muted">종목을 클릭하면 미리보기가 표시됩니다.</div>
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0, 미사용 router 경고 없는지) 확인 후:
```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx components/home-v6/HomePerfRanking.tsx components/home-v6/HomeEtfRanking.tsx components/home-v6/HomeStockDetail.tsx && git commit -m "feat(v7): 미리보기 트리거 hover→행 클릭, 행 클릭 상세이동 제거(상세는 미리보기 버튼) (STEP 270)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 재시작** 후: 주식·ETF·ETN·리츠에서 행에 **마우스만 올리면 미리보기 안 바뀜**, **클릭하면** 미리보기에 표시
- [ ] 미리보기 안 **'종목 상세·토론 보기 →'** 클릭 → 상세 페이지 이동(정상)
- [ ] 행 클릭이 상세로 더는 안 넘어감
- [ ] 처음엔 미리보기 빈 상태("종목을 클릭하면…")

## 주의·예상 이슈
- ♡ 버튼은 `stopPropagation`이라 행 클릭(미리보기)과 충돌 없음.
- /market(상품 리스트)은 여전히 행 클릭=상세 이동(별도 페이지라 이번 범위 밖). 필요 시 후속.
- **문서 TODO**(다음 갱신): STEP 265~270.

---
> STEP 270 = 미리보기 클릭 트리거. 전제 STEP 269(`8408560`).
