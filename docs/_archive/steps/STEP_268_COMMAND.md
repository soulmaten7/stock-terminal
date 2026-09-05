<!-- 2026-06-15 -->
# STEP 268 — ETF/ETN/리츠에 ♡(관심) 추가 + 칼럼 정렬을 주식과 통일

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_268_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (UI 일관성 + 기능)
1. **즐겨찾기(♡) 전 상품 적용**: 지금 주식 탭에만 ♡가 있어 ETF/ETN/리츠는 관심종목에 못 담음 → **ETF/ETN/리츠에도 ♡ 추가**(주식과 동일한 `useWatchlist` 토글).
2. **칸 정렬 통일**: 주식은 ♡칼럼 + `px-3`, ETF/ETN/리츠는 ♡ 없음 + `px-4`라 칸 위치가 어긋남 → ETF/ETN/리츠를 **주식과 동일(♡칼럼 + `px-3`)**로.
- 대상: `HomeEtfRanking`(ETF) · `HomePerfRanking`(ETN·리츠). (주식=MarketClient 기준, 이미 ♡·px-3.)
- 참조: MarketClient의 ♡ 셀(아래와 동일). market은 국내라 `"KOSPI"`.

## 전제 상태
- 현재 HEAD: STEP 267 적용 후(`5f992fc`)
- 변경 **2파일**: `components/home-v6/HomeEtfRanking.tsx` · `components/home-v6/HomePerfRanking.tsx`

---

## 작업 1/2 — `components/home-v6/HomePerfRanking.tsx` (ETN·리츠)

**① import — 찾기:**
```tsx
import { useRouter } from "next/navigation";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState, EmptyState } from "@/components/ui/State";
import HomeStockDetail from "./HomeStockDetail";
```
**바꾸기:**
```tsx
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState, EmptyState } from "@/components/ui/State";
import { useWatchlist } from "@/stores/watchlistStore";
import HomeStockDetail from "./HomeStockDetail";
```

**② 관심 훅 — 찾기:**
```tsx
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodKey>("1d");
```
**바꾸기:**
```tsx
  const router = useRouter();
  const watchItems = useWatchlist((s) => s.items);
  const addWatch = useWatchlist((s) => s.add);
  const removeWatch = useWatchlist((s) => s.remove);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isWatched = (code: string) => watchItems.some((i) => i.code === code);
  const [period, setPeriod] = useState<PeriodKey>("1d");
```

**③ thead(♡칼럼 + px-3) — 찾기:**
```tsx
                  <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                    <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium">순위</th>
                    <th className="px-4 py-2.5 text-left font-medium">종목명</th>
                    <th className="px-4 py-2.5 text-right font-medium">현재가</th>
                    <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">{periodLabel}전 대비</th>
                  </tr>
```
**바꾸기:**
```tsx
                  <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                    <th className="w-8 px-2 py-2.5"></th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">순위</th>
                    <th className="px-3 py-2.5 text-left font-medium">종목명</th>
                    <th className="px-3 py-2.5 text-right font-medium">현재가</th>
                    <th className="px-3 py-2.5 text-right font-medium whitespace-nowrap">{periodLabel}전 대비</th>
                  </tr>
```

**④ 행(♡셀 + px-3) — 찾기:**
```tsx
                        <td className="px-4 py-3 tabular-nums text-unjong-muted">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <StockLogo code={r.symbol} name={r.name} size={28} />
                            <span className="font-medium text-unjong-primary">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-unjong-primary">{r.price.toLocaleString()}</td>
                        <td className={`px-4 py-3 text-right font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</td>
```
**바꾸기:**
```tsx
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            aria-label="관심 토글"
                            className="p-0.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isWatched(r.symbol)) removeWatch(r.symbol);
                              else addWatch({ code: r.symbol, name: r.name, market: "KOSPI" });
                            }}
                          >
                            <Heart
                              size={15}
                              fill={mounted && isWatched(r.symbol) ? "currentColor" : "none"}
                              className={mounted && isWatched(r.symbol) ? "text-[#3182F6]" : "text-unjong-muted hover:text-[#3182F6]"}
                            />
                          </button>
                        </td>
                        <td className="px-3 py-3 tabular-nums text-unjong-muted">{i + 1}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <StockLogo code={r.symbol} name={r.name} size={28} />
                            <span className="font-medium text-unjong-primary">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-unjong-primary">{r.price.toLocaleString()}</td>
                        <td className={`px-3 py-3 text-right font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</td>
```

---

## 작업 2/2 — `components/home-v6/HomeEtfRanking.tsx` (ETF)

**① import — 찾기:**
```tsx
import { useRouter } from "next/navigation";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState, EmptyState } from "@/components/ui/State";
import HomeStockDetail from "./HomeStockDetail";
```
**바꾸기:**
```tsx
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState, EmptyState } from "@/components/ui/State";
import { useWatchlist } from "@/stores/watchlistStore";
import HomeStockDetail from "./HomeStockDetail";
```

**② 관심 훅 — 찾기:**
```tsx
  const asset = fixedAsset ?? "etf";
  const [period, setPeriod] = useState<PeriodKey>("1d");
```
**바꾸기:**
```tsx
  const asset = fixedAsset ?? "etf";
  const watchItems = useWatchlist((s) => s.items);
  const addWatch = useWatchlist((s) => s.add);
  const removeWatch = useWatchlist((s) => s.remove);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isWatched = (code: string) => watchItems.some((i) => i.code === code);
  const [period, setPeriod] = useState<PeriodKey>("1d");
```

**③ thead(♡칼럼 + px-3) — 찾기:**
```tsx
                  <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                    <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium">순위</th>
                    <th className="px-4 py-2.5 text-left font-medium">종목명</th>
                    <th className="px-4 py-2.5 text-right font-medium">현재가</th>
                    <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">{periodLabel}전 대비</th>
                  </tr>
```
**바꾸기:**
```tsx
                  <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                    <th className="w-8 px-2 py-2.5"></th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">순위</th>
                    <th className="px-3 py-2.5 text-left font-medium">종목명</th>
                    <th className="px-3 py-2.5 text-right font-medium">현재가</th>
                    <th className="px-3 py-2.5 text-right font-medium whitespace-nowrap">{periodLabel}전 대비</th>
                  </tr>
```

**④ 행(♡셀 + px-3) — 찾기:**
```tsx
                        <td className="px-4 py-3 tabular-nums text-unjong-muted">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <StockLogo code={r.symbol} name={r.name} size={28} />
                            <span className="font-medium text-unjong-primary">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-unjong-primary">{r.price.toLocaleString()}</td>
                        <td className={`px-4 py-3 text-right font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</td>
```
**바꾸기:**
```tsx
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            aria-label="관심 토글"
                            className="p-0.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isWatched(r.symbol)) removeWatch(r.symbol);
                              else addWatch({ code: r.symbol, name: r.name, market: "KOSPI" });
                            }}
                          >
                            <Heart
                              size={15}
                              fill={mounted && isWatched(r.symbol) ? "currentColor" : "none"}
                              className={mounted && isWatched(r.symbol) ? "text-[#3182F6]" : "text-unjong-muted hover:text-[#3182F6]"}
                            />
                          </button>
                        </td>
                        <td className="px-3 py-3 tabular-nums text-unjong-muted">{i + 1}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <StockLogo code={r.symbol} name={r.name} size={28} />
                            <span className="font-medium text-unjong-primary">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-unjong-primary">{r.price.toLocaleString()}</td>
                        <td className={`px-3 py-3 text-right font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</td>
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeEtfRanking.tsx components/home-v6/HomePerfRanking.tsx && git commit -m "feat(v7): ETF/ETN/리츠에 ♡관심 추가 + 칼럼 정렬 주식과 통일(px-3) (STEP 268)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 재시작** 후: ETF·ETN·리츠 행 맨 앞 **♡** 표시 → 누르면 우측 **관심 종목**에 담김(주식과 동일)
- [ ] 주식·ETF·ETN·리츠 칸(순위·종목명·현재가·대비) **가로 정렬 일치**
- [ ] ♡ 클릭 시 행 클릭(종목 이동)과 충돌 없음(stopPropagation)

## 주의·예상 이슈
- 관심종목 우측 레일이 ETF/ETN/리츠 코드도 표시(가격은 종목에 따라 "—"일 수 있음 — 별개).
- /market(상품 리스트)엔 아직 ♡ 없음 — '홈' 요청 범위라 이번엔 홈 탭만. 필요 시 후속.
- **문서 TODO**(다음 갱신): STEP 265~268.

---
> STEP 268 = ETF/ETN/리츠 ♡ + 정렬 통일. 전제 STEP 267(`5f992fc`).
