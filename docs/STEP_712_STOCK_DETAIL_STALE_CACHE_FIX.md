<!-- 2026-07-14 -->
# STEP 712 — 종목상세 페이지 stale 캐시 수정 (force-dynamic)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
(2줄 추가·잘 진단된 저위험 수정 — Sonnet)
**목표:** `/stock/{symbol}` SSR가 옛 캐시(옛 브랜딩·미정리 종목명·폐기 태그라인)로 굳던 것 수정 → 항상 신선. **KR 종목페이지 SEO 신선도 복구.**
**전제:** STEP 711(`f647b08`)·문서 `c8e9802`. 배포 확인 중 발견.

---

## 🔬 진단 (라이브 web_fetch로 확정)
- **증상**: bare `https://onetrillion.app/stock/AAPL`이 **2026-07-10 이전** SSR을 서빙 — "AI 렌즈"(TR-AI 개명 전)·"흩어진 금융정보를 한눈에"(폐기 태그라인)·"Apple Inc. - Common Stock"(cleanUsName 전). 캐시버스터 `?fresh=`를 붙이면 **최신**(애플·TR-AI 렌즈·"종목을 보는 눈을, 누구에게나.")으로 정상 렌더 → **bare URL만 무한 stale 캐시.**
- **원인**: `app/[locale]/layout.tsx`가 `generateStaticParams`(locales)+`setRequestLocale`로 **정적 렌더를 켬**. `app/[locale]/stock/[symbol]/page.tsx`엔 `dynamic`/`revalidate` **지시자가 없음** → 종목별로 **on-demand 1회 생성 후 무한 캐시**(revalidate 없음). 배포해도 안 갈아엎어짐.
- **대조**: `app/[locale]/page.tsx`(홈)는 `export const dynamic = "force-dynamic"`(L10)이 있어 **항상 신선**(그래서 홈만 멀쩡). 종목 페이지엔 이게 빠진 것.

## ✅ 수정 (2줄 — 홈과 동일 패턴)
`app/[locale]/stock/[symbol]/page.tsx` 상단 import 직후에 추가:
```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```
- 근거: 종목 SSR는 가벼움(이름 해석·메타·JSON-LD만 · 무거운 렌즈·시세·브리핑은 전부 `StockLensClient`에서 클라 fetch). 신선도 > 캐시 이득. 홈이 이미 이 패턴으로 검증됨. (perf가 크롤 규모에서 문제되면 후속에 `revalidate` ISR로 전환 가능 — 지금은 신선도 확실성 우선.)
- **다른 건 건드리지 말 것** — `generateMetadata`·JSON-LD·`StockLensClient`·`EtfLensClient` 로직 변경 0. 오직 캐시 지시자 2줄.

## 검증
1. `npm run build`(종목 라우트가 이제 `ƒ`(Dynamic)로 표시되는지)·tsc 0·vitest.
2. **배포 후 라이브**(web_fetch·캐시버스터 없이):
   - bare `https://onetrillion.app/stock/AAPL` → **애플·TR-AI 렌즈·"종목을 보는 눈을, 누구에게나."**(신선·`?fresh=` 붙인 것과 동일).
   - bare `https://onetrillion.app/stock/005930`(삼성전자) 등 2~3개 더 → 현재값.
   - `https://onetrillion.app/en/stock/AAPL` → 영어 SEO 유지(STEP 711 무회귀).
3. 홈·보드 정상(무영향).

## 커밋
```bash
git add -A && git commit -m "fix: 종목상세 force-dynamic — 무한 캐시로 옛 SSR(옛 브랜딩·미정리 종목명·폐기 태그라인) 서빙되던 것 수정 (홈과 동일 패턴·KR SEO 신선도 복구)" && git push
```

## 참고
- 이 캐시 함정은 **i18n 라우트 이동(app/[locale]) 때 노출됨** — 레이아웃 정적 렌더 자격 + 페이지 캐시 지시자 누락의 조합. 향후 새 `[locale]` 하위 동적 페이지 만들 때 **캐시 지시자 명시** 습관화(홈·advertise·business·admin은 이미 force-dynamic).
- 다른 `[locale]` 페이지 캐시 감사(선택): `favorites`·`coin`·`about`·`feedback` 등이 stale 가능성 있는지 배포 후 훑기(대부분 정적이라 무해하나 확인 가치).
