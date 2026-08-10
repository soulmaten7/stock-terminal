# STEP 989 — 3번 규칙 기록 (①-A 3회 · ①-B 3회)

> 초점 = yahoo-finance2 4.x의 실제 변경 내용과, 3.x 서버리스 실무에서 보고된 증상.

## A-0 — 먼저 연 것(988 재사용)

- `docs/probe_988_search.md` A-2/A-3 — Vercel Hobby 웜인스턴스 "몇 분"·yahoo-finance2 4.0.0 커밋 `835c599`("stop sharing crumb...state across instances") 이미 확인. 이번엔 **그 커밋의 실제 diff**를 처음으로 열었다(아래 A-2).
- `ghostfolio/ghostfolio` #6314·`gadicc/yahoo-finance2` #977 — 988에서 이미 확인, 재인용만.

## ①-A — 원전(라이브러리 공식 변경이력, 3회)

**A-1.** `docs/UPGRADING.md`(WebFetch 직접) — 3→4 **유일한 breaking change 는 Node.js 버전**(*"Version 4 requires Node.js 22 or newer"*). *"There are no other breaking API changes in this release."* — `quote`·`quoteSummary`·`chart`·`fundamentalsTimeSeries` 시그니처는 안 바뀜(2단계 실측으로 재확인).

**A-2(신규, 실제 diff 확인 — 문구만 인용하지 않음).** 커밋 `835c599`의 실제 변경: `getCrumb.js`의 `let crumb`/`let promise`(모듈레벨) → `WeakMap<ExtendedCookieJar, CrumbState>`(**쿠키자 단위**)로 교체. `yahooFinanceFetch.js`의 전역 `_queue` → `WeakMap<instance, Queue>`. `quoteCombine.js`의 전역 `slugMap` → 인스턴스별 `WeakMap`. 🔑 **이 수정은 "여러 `YahooFinance` 인스턴스/쿠키자가 상태를 서로 오염시키는 것"을 막는 수정이다** — 우리는 `lensPrecompute.ts:17`에서 인스턴스를 **1개만** 만든다. 인스턴스가 하나뿐이면 3.x(모듈레벨 공유)와 4.x(WeakMap, 그 하나의 인스턴스 키로 조회)가 **그 하나의 인스턴스 안에서는 동작이 같다** — 우리 사용 패턴에는 이 수정이 원리적으로 적용될 여지가 없다.

**A-3.** 08-07(v4.0.1)·08-09(v4.0.2) 릴리스노트 — "반복 동의 리다이렉트 처리"(#1025)·"quoteSummary 스키마 재커밋"(#1024). 🔑 **크럼 관련 수정이 최근까지 활발히 나오고 있다는 정황** — 단 A-2와 같은 이유로 우리(단일 인스턴스)에 직접 적용될지는 불확실.

## ①-B — 3.x 서버리스 실무 증상(3곳)

**B-1(988 재인용).** ghostfolio #6314 — "TypeError: fetch failed"(크럼 조회 중, **완전 실패**).
**B-2(988 재인용).** yahoo-finance2 #977 — "Failed to get crumb, status 429"(**완전 실패**).
**B-3(신규).** yahoo-finance2 #445 — S&P500류 500+ 종목을 **순차** 조회하다 **약 200번째 이후**부터 스키마 검증 오류(암호화폐용 스키마가 주식 응답에 잘못 적용됨)로 실패 시작. 🔑 **부분배치 실패는 아니지만, "고물량 요청 뒤 응답이 이상해진다"는 같은 범주**(요청량 누적에 따른 열화) — 미해결 상태로 남아 있음(공식 해결책 없음).

## 종합

🔴 **"일부 심볼만 marketCap이 빠진다"와 정확히 같은 증상을 보고한 사례는 이번에도 못 찾았다**(988에 이어 재확인). A-2가 이번 STEP의 핵심 발견 — **4.0.0의 crumb 수정이 우리 단일 인스턴스 사용 패턴에는 적용되지 않는다**는 것을 실제 diff로 확인했다. 이 판단이 맞다면 2단계 실측에서 3.x와 4.x가 **같은 증상**을 보여야 한다(아래 §2 결과 참조).
