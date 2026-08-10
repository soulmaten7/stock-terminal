# STEP 988 — 3번 규칙 기록 (①-A 3회 · ①-B 3회)

> 초점 = 서버리스 환경에서 야후 비공식 API를 쓸 때 알려진 실패 양상(crumb 인스턴스 분산·리전 차단·부분 응답).

## A-0 — 먼저 연 것

- `node_modules/yahoo-finance2/esm/src/lib/getCrumb.js`(984에서 이미 읽음, 재사용) — `crumb`·`promise` 모듈레벨 변수.
- `lib/lensPrecompute.ts`의 `topByMarketCap()`(984·986에서 이미 읽음) — concurrency=6은 `mapLimit`의 JS 비동기 동시성이지, 별도 프로세스·인스턴스가 아니다(단일 Node 이벤트루프 안). `new YahooFinance()`는 모듈 최상단에서 **1회만** 생성(`lensPrecompute.ts:17`).
- `package-lock.json` — `yahoo-finance2` 정확히 `3.15.4`로 고정(신규 확인, 985/986/987 어디서도 버전 자체를 확인한 적 없었다).
- `app/api/cron/lens-scores/route.ts` — `export const dynamic = "force-dynamic";`(이미 읽었던 파일, 이번엔 캐싱 관점으로 재확인).

## ①-A — 원전·공식문서 (3회)

**A-1.** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/fetch.md`(이 프로젝트의 실제 Next.js 16 번들 문서, AGENTS.md 지시대로 확인) — 기본값 **"auto no cache"**: *"Next.js fetches the resource from the remote server on every request in development... If Request-time APIs are detected on the route, Next.js will fetch the resource on every request."* 🔑 **우리 라우트가 `dynamic="force-dynamic"`이라 이 조건에 해당** — Next.js fetch 캐싱이 이 크론에서 원리적으로 적용되면 안 된다. **가설 기각(코드+원전 대조로).**

**A-2(WebSearch, Vercel 공식).** *"resources that have not received traffic for a few minutes being shut down"*(표준 플랜) — **"Scale to One"(웜인스턴스 최대 14일 유지)은 Pro/Enterprise 전용**, 우리는 Hobby다. 🔑 **하루 1회(21:30 UTC) 도는 우리 크론은 매번 콜드스타트다** — 전날의 모듈 상태(crumb 포함)가 다음날로 넘어올 수 없다는 뜻. 이게 "웜인스턴스 상태 누수가 11일 지속을 설명한다"는 가설을 약화시킨다(아래 ①-B와 함께 판정).

**A-3.** `yahoo-finance2` GitHub 공식 릴리스 노트(`github.com/gadicc/yahoo-finance2/releases`) — v4.0.0(2026-07-11) 커밋 `835c599`: **"stop sharing crumb, queue, and debounce state across instances"**. 🔑 **우리가 겪는 것과 정확히 같은 범주(모듈레벨 상태 공유)의 버그를 라이브러리 저자가 이미 인지·수정했다** — 단 우리는 `^3.14.0`(락파일 3.15.4)에 고정돼 있어 이 수정이 반영 안 됨. v4.0.1(08-07)·v4.0.2(08-09, 우리 마지막 관측 heartbeat와 같은 날)도 crumb 관련 수정을 계속 냄 — **활발히 진행 중인 버그군**이라는 정황.

## ①-B — 실무(3곳)

**B-1.** `ghostfolio/ghostfolio` 이슈 #6314(WebSearch) — 실제 프로덕션 오픈소스 앱(yahoo-finance2 사용)이 *"TypeError: fetch failed"*를 crumb 조회 중 겪음. **완전 실패**(부분성공 아님) — 984의 결론(crumb 실패=완전실패, 우리 증상=부분결측과 안 맞음)과 같은 패턴 재확인.

**B-2.** `gadicc/yahoo-finance2` 이슈 #977("Failed to get crumb, status 429") — 레이트리밋도 **완전 실패**(크럼 자체를 못 받음)로 나타남. 우리 heartbeat(`noResponse=0`·`retryFailReasons={}`)와 다시 안 맞음.

**B-3.** 🔴 **못 채움** — "특정 종목군만 marketCap이 선택적으로 빠진다"는 정확히 같은 증상을 보고한 사례는 이번에도 못 찾음(984·987과 동일한 한계). 이 증상 자체가 공개적으로 알려진 사례가 없을 가능성 — 미확인으로 남긴다.

## ①-A/①-B 종합 판정

🔑 **crumb 계열 가설(984에서 이미 "약화")은 이번 추가 조사로도 강화되지 않았다** — 실무 사례는 전부 "완전 실패"만 보고하고, 우리가 겪는 "부분 결측"과 일치하는 보고가 없다. 라이브러리 자체의 "인스턴스간 상태공유" 버그는 실재하고 우리 버전에 있지만, **Vercel Hobby가 매일 콜드스타트**라 "여러 날에 걸친 상태 누수"라는 메커니즘과는 안 맞는다(A-2). **다른 메커니즘(같은 실행 내 인터리빙 등)일 가능성은 남아 있으나 검증 못 함.**
