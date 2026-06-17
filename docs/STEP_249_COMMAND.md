<!-- 2026-06-15 -->
# STEP 249 — 종목 클릭 시 이름 전달 (ETF 등 DB 없는 종목도 상세 헤더 정확)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_249_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (기능적 완성 #3)
성적표에서 종목 클릭 → 상세 페이지. 지금 **ETF는 `stocks` DB에 없어 헤더 이름이 "069500" 코드로** 뜸(주식·리츠는 DB에 있어 정상).
- 클릭할 때 **이름을 `?name=`으로 같이 넘김** → 상세가 그 이름을 즉시 사용(ETF·미국 등 DB 무관 정확) + DB 조회 안 기다려 더 빠름.
- 4개 성적표 컴포넌트 `router.push` + `StockPageClient` 한 곳.

> #3 확인 결과: 상세 페이지(차트·토론·뉴스·공시·인사이트 5탭)·`BrokerLinks`(증권사 중립 바로가기)·채팅 모두 정상. **이름만 갭**이라 그것만 메움.

## 전제 상태
- 현재 HEAD: STEP 248 적용 후
- 변경 **5파일** (각 1곳):
  - `components/market/MarketClient.tsx`
  - `components/home-v6/HomeEtfRanking.tsx`
  - `components/home-v6/HomePerfRanking.tsx`
  - `components/market/MarketDirectoryClient.tsx`
  - `components/stock/StockPageClient.tsx`

---

## 작업 1~4 — 성적표 4곳 `router.push`에 `?name=` 추가

> 아래 **찾기/바꾸기는 4개 파일에서 동일**(각 파일에 1곳씩). 각각 적용.

**찾기:**
```tsx
router.push(`/stock/${r.symbol}`)
```
**바꾸기:**
```tsx
router.push(`/stock/${r.symbol}?name=${encodeURIComponent(r.name)}`)
```

적용 파일:
1. `components/market/MarketClient.tsx`
2. `components/home-v6/HomeEtfRanking.tsx`
3. `components/home-v6/HomePerfRanking.tsx`
4. `components/market/MarketDirectoryClient.tsx`

> 네 곳 다 `r.name`(행의 종목명)이 있으므로 그대로 인코딩해 전달. (없으면 빌드 에러 — 다 있는 거 확인됨)

---

## 작업 5 — `components/stock/StockPageClient.tsx` (넘긴 이름 우선 사용)

**① 찾기 (import 추가):**
```tsx
import { useEffect, useState } from "react";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";
```
**바꾸기:**
```tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";
```

**② 찾기 (이름 상태 + 조회 useEffect):**
```tsx
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [stockName, setStockName] = useState<string>(code);

  // 종목명 조회 (한국: stocks DB name_ko · 미국: ticker 그대로)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (/^\d{6}$/.test(code)) {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("stocks")
          .select("name_ko")
          .eq("symbol", code)
          .maybeSingle();
        if (!cancelled && data?.name_ko) setStockName(data.name_ko);
      } else {
        if (!cancelled) setStockName(code);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [code]);
```
**바꾸기:**
```tsx
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const searchParams = useSearchParams();
  const passedName = searchParams.get("name");
  const [stockName, setStockName] = useState<string>(passedName || code);

  // 종목명: 성적표에서 넘긴 이름(?name=) 있으면 즉시 사용(ETF 등 DB 무관 정확).
  // 없을 때만 한국 stocks DB name_ko 조회 / 미국은 ticker 그대로.
  useEffect(() => {
    if (passedName) { setStockName(passedName); return; }
    let cancelled = false;
    const load = async () => {
      if (/^\d{6}$/.test(code)) {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("stocks")
          .select("name_ko")
          .eq("symbol", code)
          .maybeSingle();
        if (!cancelled && data?.name_ko) setStockName(data.name_ko);
      } else {
        if (!cancelled) setStockName(code);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [code, passedName]);
```

> `useSearchParams`는 이미 `app/stock/[code]/page.tsx`가 `<Suspense>`로 감싸서 안전. 넘긴 이름 우선 → ETF "069500" 대신 "KODEX 200" 즉시 표시.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx components/home-v6/HomeEtfRanking.tsx components/home-v6/HomePerfRanking.tsx components/market/MarketDirectoryClient.tsx components/stock/StockPageClient.tsx && git commit -m "fix(v7): 종목 클릭 시 이름 전달(?name=) → ETF 등 DB 없는 종목도 상세 헤더 정확 (STEP 249)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **ETF**(KODEX 200 등) 클릭 → 상세 헤더에 **"KODEX 200"**(코드 아님) 표시
- [ ] 주식·리츠·미국도 클릭 시 이름 즉시(빠르게) 뜸
- [ ] 차트·탭·BrokerLinks·채팅 그대로 정상
- ⚠️ 하드 새로고침.

## 주의·예상 이슈
- `?name=` 없이 직접 URL 진입(`/stock/069500`)하면 기존대로 DB 조회 → ETF는 코드로. (성적표 클릭 경로는 항상 이름 전달이라 OK)
- 4개 파일 `router.push(\`/stock/${r.symbol}\`)` 문자열이 동일해야 함(전부 확인됨).
- **문서 TODO**(다음 갱신): STEP 248~249.

---
> STEP 249 = 종목 이름 전달(ETF 이름 갭). 전제 STEP 248.
> 다음(기능적 완성): #4 '1 Issue' dev 경고 점검. (#1 ETN·펀드 = 외부 소스 대기)
