<!-- 2026-08-04 · STEP 895 · 감사+판정 -->
# 스킵 사유 3자 대조 — 코드 ↔ 문서 ↔ 화면 (STEP 895)

> 실측 = `git grep` 직접 확인(코드) + Supabase 직접 조회(발생 수, `as_of` 최신 = 2026-08-03) + `messages/ko.json`·`components/RevDcfSection.tsx` 직접 개봉(화면). §1의 Cowork 사전 실측을 그대로 믿지 않고 전부 재확인함(플레이북 #82).

## 3자 대조표

| 사유 코드 | 코드 위치 | 발생 조건 | 실제 발생 수(08-03) | 문서 기재(구) | 화면 문구 | 문구 없을 때 화면 |
|---|---|---|---|---|---|---|
| `INSUFFICIENT_HISTORY` | `lib/revdcf/drivers.ts:88` | 매출 5년 미확보 | **39** | ✅ | ✅ `skip.insufficientHistory` | — |
| `MISSING_TAG`(영업이익 원인) | `lib/revdcf/drivers.ts:113` | 영업이익 5년 미확보 | **15**(31 중) | ✅(사유 하나로 뭉침) | ✅ `skip.missingTag`(원인 구분 없이 공통) | — |
| `MISSING_TAG`(PP&E 원인) | `lib/revdcf/drivers.ts:119` | PP&E 5년 미확보 | **13**(31 중) | ✅(위와 동일 자리) | ✅ `skip.missingTag`(동일 문구) | — |
| `MISSING_TAG`(영업현금흐름 원인) | `lib/revdcf/drivers.ts:122` | 영업현금흐름 5년 미확보 | **3**(31 중) | ✅(위와 동일 자리) | ✅ `skip.missingTag`(동일 문구) | — |
| `NOT_APPLICABLE_SECTOR` | `lib/revdcf/drivers.ts:121` | 유동/비유동 미분류 재무제표 | **4** | ✅ | ✅ `skip.notApplicableSector` | — |
| `MULTI_CLASS_SHARES` | `lib/revdcf/drivers.ts:140` | 멀티클래스 주식·통합 주식수 회수 불가 | **5** | ✅ | 🔴 **없음** | `components/RevDcfSection.tsx:70`의 `skipKey` 3항연산자 어디에도 안 걸려 **`else` 분기로 떨어짐 → `skip.missingTag`가 표시됨**("필요한 재무 항목이 5년치 확보되지 않았습니다") — **사실과 다른 문구**(멀티클래스는 재무항목 결측이 아니라 주식수 구조 문제) |
| `NO_INDUSTRY` | `app/api/cron/revdcf/route.ts:67` | 업종 매핑 없음 | **10** | ✅ | ✅ `skip.noIndustry` | — |
| `NO_MARKETCAP` | `app/api/cron/revdcf/route.ts:68` | 시총 자료 자체 없음 | **0** | 🔴 **없음**(구 5종에 빠짐) | 🔴 **없음** | 같은 `else` 분기 → `skip.missingTag` 오표시. 오늘은 0건이라 노출 안 됨(893 실측대로) |
| `STALE_MARKETCAP` | `app/api/cron/revdcf/route.ts:73` | 시총 7일 TTL 초과(893 신설) | **0** | 🔴 **없음**(893 이후 신설이라 구 문서엔 원래 없음) | ✅ `skip.staleMarketcap` | — (문구는 있으나 오늘은 0건이라 미노출) |
| `NO_MARGINAL_CAPEX` | `app/api/cron/revdcf/route.ts:82` | driver5 marginal 산출 불가(880) | **50** | ✅ | ✅ `skip.noMarginalCapex` | — |
| `EX` | `app/api/cron/revdcf/route.ts:98`(catch) | 처리 중 예외 발생 | **0** | 🔴 **없음** | 🔴 **없음** | 같은 `else` 분기 → `skip.missingTag` 오표시. 오늘은 0건 |
| `HTTP_${status}`(가변) | `app/api/cron/revdcf/route.ts:62` | SEC `companyfacts` 조회 HTTP 실패 | **0** | 🔴 **없음** | 🔴 **없음** | 문자열 자체가 동적(`HTTP_404`·`HTTP_500` 등)이라 애초에 `skipKey` 3항연산자로 매칭될 수 없음(정확히 일치하는 케이스가 있을 수 없는 구조) → 항상 `else` → `skip.missingTag` 오표시. 오늘은 0건 |

**합계 검산**: 39+15+13+3+4+5+10+0+0+50+0+0 = **139**(스킵 전체) — DB 직접 조회로 확인(`계산됨 465 + 스킵 139 = 604`, `revdcf_results` 최신 `as_of` 실측과 일치).

## §1 재확인 결과 — Cowork 사전 실측과 대조

- 코드 종수: **10종 + `HTTP_*` 가변** — Cowork 실측과 일치.
- 문서(구) 기재: **5종만**(`INSUFFICIENT_HISTORY`·`MISSING_TAG`·`NOT_APPLICABLE_SECTOR`·`NO_INDUSTRY`·`MULTI_CLASS_SHARES`) — 일치. 🔴 **`MULTI_CLASS_SHARES`는 문서엔 있으나 화면엔 없다**는 조합이 새로 확인됨(문서=코드 존재를 적었을 뿐 화면 노출 여부는 별개 축).
- 화면 문구: **6종**(`insufficientHistory`·`missingTag`·`notApplicableSector`·`noIndustry`·`noMarginalCapex`·`staleMarketcap`) — 일치. `NO_MARKETCAP`·`MULTI_CLASS_SHARES`·`EX`·`HTTP_*` 문구 없음 — 일치.
- 🔴 **§1에 없던 추가 확인(직접 코드 개봉으로 발견)**: 문구 없는 4종이 화면에서 **아무것도 안 보이는 게 아니라, `missingTag`("재무 항목 5년치 미확보")로 잘못 표시된다.** `MULTI_CLASS_SHARES`(주식 구조 문제)·`NO_MARKETCAP`(시총 없음)·`EX`(예외)·`HTTP_*`(SEC API 실패)는 전부 재무 데이터 5년치와 무관한데 같은 문구를 쓴다 — **사실과 다른 문구가 뜬다.**
- 🔴 **`flags.missing`이 화면에 도달하는지 코드 확인 결과 = 도달 안 함.** `components/RevDcfSection.tsx`·`app/[locale]/revdcf/page.tsx` 어디에도 `flags.missing`을 렌더링하는 코드가 없다(grep 0건). `MISSING_TAG` 세 원인(영업이익 15·PP&E 13·현금흐름 3)은 DB에는 구분돼 저장되지만 **사용자는 절대 구분할 수 없다.**
- 보드 배지(`RevDcfBadge.tsx`)는 이 표와 별개로 스킵 verdict 전부를 사유 구분 없이 "—"(빈 표시)로만 낸다 — 오표시 위험은 없으나(빈칸이라 거짓을 말하지 않음), 사유 구분도 전혀 없다.

## §2 896 반영 후 상태 (2026-08-04 · 897이 갱신 · 위 표는 895 시점 기록으로 보존)

🔴 **위 §1 표는 895 시점(896 이전) 스냅샷이다 — 지우지 않고 그대로 둔다.** 896이 코드를 바꿔 아래로 갱신됐다.

| 사유 코드 | 896 이후 화면 문구 | 897 검증 방식 |
|---|---|---|
| `MISSING_TAG`(과거 행 · 896 이전 저장) | ✅ `skip.missingTag`(변경 없음 — 과거 행 보존) | 라이브: `GE`(레거시 `MISSING_TAG`) curl로 문구 확인 |
| `MISSING_TAG_OPERATING_INCOME`(896 신설) | ✅ `skip.missingTagOperatingIncome` | 유닛테스트만(`drivers.test.ts`) — 오늘 DB 행 0건(크론 미실행) |
| `MISSING_TAG_PPE`(896 신설) | ✅ `skip.missingTagPpe` | 유닛테스트만 — 오늘 DB 행 0건 |
| `MISSING_TAG_OPERATING_CASH`(896 신설) | ✅ `skip.missingTagOperatingCash` | 유닛테스트만 — 오늘 DB 행 0건 |
| `NO_MARKETCAP` | ✅ `skip.noMarketcap`(신설) | 유닛테스트만 — 오늘 DB 행 0건 |
| `MULTI_CLASS_SHARES` | ✅ `skip.multiClassShares`(신설) | **라이브**: `V`(실제 5건 중 하나) curl로 문구 확인 — `missingTag` 아님 |
| `EX` | ✅ `skip.exception`(신설) | 유닛테스트만 — 오늘 DB 행 0건 |
| `HTTP_${status}`(가변) | ✅ `skip.httpError`(신설·상태코드 비노출) | 유닛테스트만(`skipKey.test.ts` — `HTTP_404`·`HTTP_503`·`HTTP_999` 등 임의 상태코드로 확인) |
| (매핑에 없는 모든 미래 사유) | ✅ `skip.unspecified`(신설 중립 폴백 — 896 이전엔 `missingTag`로 오표시됐던 자리) | 유닛테스트만 |

🔴 **여전히 남은 것**: `RevDcfSection`이 클라이언트 전용 fetch 컴포넌트라 curl로는 절대 실제 DOM 최종 렌더(줄바꿈·색·잘림)를 볼 수 없다 — Claude Code(이 세션)에 브라우저 자동화 도구가 없어 그 경로로는 완전한 육안 검증을 못 했다. 상세 판정 = `docs/LENS_COMPLETION_STANDARD.md` "✅ 897 판정 — DoD 5".

**898 정정(#80 절차)** — 위 문장이 "육안 검증 0건"으로 읽힐 수 있어 정정한다. **Cowork은 브라우저 도구가 있어 898에서 로컬(`localhost:3333`) 육안 검증 7건을 실제로 수행했다**(방법론 페이지 렌더·`repro` 문구·WACC 원장 행·세율 행·과거 `MISSING_TAG` 문구 등 — `REVDCF_SPEC.md` §11 898 항목). 🔴 **다만 이 표(§0~§2)가 다루는 신규 스킵 사유 문구(`multiClassShares`는 라이브 확인 · `noMarketcap`·`exception`·`httpError`·`unspecified`·`MISSING_TAG_*` 3분기)는 898에서도 브라우저로 다시 보지 않았다** — 여전히 유닛테스트 또는 curl 레벨 확인뿐이다. Vercel Preview는 898에서 인증 브라우저로 접속됐으나 `/revdcf`가 500을 반환해 그 경로로도 검증되지 않았다.
