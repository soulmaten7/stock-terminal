<!-- 2026-08-06 · STEP 925 · 진단 전용 문서 — 판정 없음, 승인은 장은태 것 -->
# DECISION 925 — `daily-brief`·`email-brief` 라벨 조립 진단 (수리 금지)

> 이 문서는 **진단이지 수리가 아니다.** 코드 diff 0(`scripts/` 프로브 제외). 수리 선택지는 나열만 하고 실행하지 않는다.
> 🔴 **결론을 먼저 말한다**: 924가 *"있을 가능성"*으로 남긴 라벨 중복은 **실재한다**(가능성이 아니라 확인된 결함). 종목명(348개 대조 대상이던 그 결함)은 이 두 경로에서는 이미 정상 — `lib/todayChanges.ts` 하나를 고친 924의 효과가 여기까지 닿았다.

---

## §1 — 경로: `lensStateLine`을 쓰는가, 자체 조립인가

**`daily-brief`**(`app/api/cron/daily-brief/route.ts`): `buildMarketFacts()`가 `getTodayChanges()`로 얻은 항목마다 `resolveDisplayName()`(종목명) · `lensDisplayName(loc, it.lensKey)`(렌즈이름) · `lensStateLabel(loc, it.lensKey, it.fromState/toState)`(상태문구)을 **각각 따로** 호출해 `{name, lensName, from, to}` 4필드로 저장한다(`lib/dailyBrief.ts`의 `MoverFact` 타입). 이 문자열은 두 곳에서 조립된다 — ① `buildFallbackBrief()`: `` `${m.lensName} ${m.from}→${m.to}` `` 결정론 폴백 문장(LLM 실패·API 키 없음 시 실제로 저장·사용) ② `factsToPromptText()`: `` `${m.lensName} ${m.from} → ${m.to}` `` LLM 프롬프트 불릿(LLM이 이걸 보고 자기 문장을 씀 — 최종 텍스트가 이 문구를 그대로 베낀다는 보장은 없음).

**`email-brief`**(`app/api/cron/email-brief/route.ts`): `movers()` 함수가 `daily-brief`의 `buildMarketFacts()`와 **동일한 3-호출 패턴**(`resolveDisplayName`·`lensDisplayName`·`lensStateLabel`)을 별도로 반복 구현한다(코드 중복, 924와 무관하게 이미 있던 구조). `renderHtml()`의 `moversHtml` 템플릿이 `` `${m.lensName} ${m.from} → ${m.to}` ``로 조립 — 이건 **LLM을 거치지 않는 결정론 HTML**이라 조건 없이 항상 이 형태로 나간다.

🔴 **둘 다 `lib/lensCopy.ts`의 `lensStateLine`을 쓰지 않는다** — `grep -rn "lensStateLine" app/api/cron/daily-brief app/api/cron/email-brief`가 0건. 924는 `ExploreClient.tsx:161` 한 곳만 `lensStateLine`으로 교체했고, 이 두 라우트는 **924 이전부터 존재하던 자체 조립을 그대로 쓰고 있다** — 924가 고치지 않은 게 아니라 애초에 924의 수정 범위 밖이었다(923이 발견한 것도 `ExploreClient.tsx:161` 하나뿐이었다).

**`lib/todayChanges.ts`가 어떻게 닿는가**: `buildMarketFacts()`·`movers()` 둘 다 `getTodayChanges()`를 호출해 `it.name`/`item.name`을 얻고, 이 값을 `resolveDisplayName({rawName: it.name, ...})`에 넘긴다. 924가 `getTodayChanges()` 내부에서 `name===symbol`일 때 `usSymbolRawName()`으로 대체하도록 고쳤으므로, **종목명은 이 두 경로에도 자동으로 반영됐다** — `lensName`/`from`/`to`(라벨 조립)와 `name`(종목명)은 서로 다른 필드라 924의 수정이 하나(이름)엔 닿고 다른 하나(라벨)엔 안 닿은 것이 정확한 그림이다.

## §2 — 실측: 중복이 실제로 있는가

**방법**: `scripts/probe_925_brief_labels.ts`(신규, 커밋됨) — 라우트 파일 자체를 호출하지 않고, `getTodayChanges()`·`resolveDisplayName()`·`lensDisplayName()`·`lensStateLabel()`을 **직접 같은 순서로** 호출해 실제 라우트가 만드는 것과 동일한 `movers` 배열·`buildFallbackBrief()`/`factsToPromptText()` 출력·email mover-line 문자열을 재현. 크론 미실행·메일 미발송·DB 쓰기 0. 산출물 = `docs/probe_925_brief_labels.json`(같은 커밋).

**결과(오늘 실제 데이터, 2026-08-06 KR / 2026-08-05 US — `getTodayChanges`가 반환하는 최신 change_date 그대로)**:

| 시장·로케일 | movers | 중복 행 | 예시 |
|---|---|---|---|
| KR·ko | 5 | **3/5** | "두산에너빌리티는 **모멘텀 모멘텀 상위권**→모멘텀 중간권 전환" |
| US·en | 5 | **2/5** | "Applovin Corporation moved **Momentum Mid-pack momentum**→Top-tier momentum" |

🔴 **"가능성"이 아니라 확인된 결함이다.** `buildFallbackBrief()`가 실제로 저장·사용하는 문장에 "모멘텀 모멘텀"이 리터럴로 들어간다(위 표의 KR 인용은 프로브가 `buildFallbackBrief()`를 직접 호출해 얻은 실제 반환값). email HTML의 mover-line도 동일 패턴 — `moversHtml` 템플릿이 조건 없이 항상 이 형태.

**924가 찾은 3그룹과의 대조**: 오늘 표본에서 실제로 걸린 것은 **momentum(ko: flat·down / en: up·down)** — momentum·up(ko)과 valuation-ko(mid)은 오늘 표본에 우연히 없었을 뿐, `lensStateLabel`이 반환하는 phrase 자체는 924가 이미 전수 확인한 것과 동일 함수·동일 데이터이므로 **924의 71개 조합 전수 대조 결과를 그대로 재사용 가능** — 오늘 안 걸렸다고 momentum-up이나 valuation-mid가 이 경로에서 안전하다는 뜻은 아니다(같은 phrase, 같은 조립 패턴이라 상태만 맞으면 똑같이 겹친다).

**종목명 확인**: `ticker_like_name_count = 0`(KR·US 둘 다) — 「Mo」·「Hst」류 잔존 **없음**. §1에서 예상한 대로 924의 `getTodayChanges` 수정이 이 두 경로에 자동 반영됨을 실측으로 확인.

**ko/en**: `daily-brief`는 시장당 로케일 하나만 만든다(KR=ko, US=en — 코드 주석·`route.ts` 반복문으로 확인). 그래서 KR·en이나 US·ko 조합은 애초에 프로덕션에 존재하지 않아 테스트하지 않았다.

## §3 — 노출 이력 (되돌릴 수 없는 것)

- **`email-brief` 가동 이력**: `cron_heartbeats`에서 `job='email-brief'` 최신 1행만 확인 가능(upsert가 이전 이력을 덮어씀 — 히스토리 테이블 아님) — **last_run_at = 2026-08-05 23:05:32 UTC, ok=true**(직전 1회는 성공). "언제부터 돌았는지"는 이 테이블로는 알 수 없어, 라우트 파일 최초 커밋(`git log --diff-filter=A`)으로 대체 확인 — **STEP 784, 2026-07-23 최초 작성**. 이후 22:15 UTC경 1일 1회 스케줄로 존재해 왔다고 추정할 수 있으나 매일 성공했는지는 이 테이블만으로는 모른다.
- **`daily_brief` 저장 범위**: KR 9행(2026-07-22~08-04) · US 15행(2026-07-21~08-05).
- **저장된 과거 브리핑 본문 전수 검색**(`docs/probe_925_brief_labels.json`의 `exposure_history_check`) — `text_ko ~ '모멘텀\s*모멘텀'` / `text_en ~* 'momentum\s+momentum'` 등으로 24행 전수 조회 → **리터럴 중복 0건**. LLM 경로가 자연스럽게 패러프레이즈해 이 정확한 패턴을 우연히 피했을 가능성이 높다(추정 — LLM 호출 여부·API 키 존재를 이 세션에서 확정하지 않았으므로 단정 안 함).
- 🔴 **그러나 email의 "내 관심종목·오늘 변화" 섹션(`moversHtml`)은 LLM을 거치지 않고 매번 결정론으로 만들어지며, DB에 저장되지 않는다**(발송 시점에만 렌더돼 사라짐) — **이 섹션의 과거 실제 발송분은 원리적으로 측정 불가**다. "0건"이 아니라 "잴 수 없음"이 정확한 표현.
- 🔴 **수신자 규모는 조사하지 않았다** — `email_subscriptions` 테이블을 열지 않음. 개인정보 영역이라 이 STEP의 질문이 아니다. **"미조사".**
- 🔴 **"몇 명이 이 결함을 봤다"는 추정하지 않는다** — 수신자 수를 모르고, 발송분 렌더 결과가 저장되지 않아 과거 email mover-line의 실제 내용도 모른다. 두 미지수를 곱해 숫자를 만드는 건 근거 없는 숫자다.

## §4 — 판정서

**중복 있음 → 수리 선택지(권고까지만, 실행은 승인 후)**

| 선택지 | 내용 | 대가 |
|---|---|---|
| **A — 공유 헬퍼로 조립 통일(권고)** | `lib/lensCopy.ts`에 전환용 헬퍼(가칭 `lensTransitionLine(loc,key,from,to)`) 신설 — `lensStateLine`과 같은 dedup 로직을 "from→to" 양쪽에 적용해 이름을 한 번만 보여주는 형태로. `daily-brief`·`email-brief` 양쪽의 조립 지점 2곳(`buildFallbackBrief`/`factsToPromptText`의 템플릿, `email-brief`의 `moversHtml`)을 이 헬퍼로 교체 | **발송 경로(email-brief)를 직접 건드린다** — 924의 `lensStateLine`은 화면(Explore)이라 사람이 바로 눈으로 재확인 가능했지만, 이메일은 실제 발송 전 미리보기가 어렵다(이번 진단처럼 프로브로 문자열만 재현하는 방식으로 사전 검증은 가능). LLM 프롬프트 텍스트(`factsToPromptText`)를 바꾸면 LLM 산출 문장의 표현도 미세하게 달라질 수 있음(가드 통과 여부에 영향 줄 가능성 — 미검증) |
| **B — email mover-line만 우선 수정** | §3에서 확인했듯 email의 `moversHtml`은 **매번·무조건** 이 형태로 나가는 유일한 결정론 노출 지점(daily-brief 본문은 LLM이 대개 가로챔) — 이 한 곳만 좁게 고친다 | A보다 범위는 좁지만 `daily-brief`의 결정론 폴백 문장(LLM 실패 시)은 여전히 중복 가능 — 완전 해소 아님 |
| **C — 방치** | 아무것도 안 함 | 중복은 momentum·valuation-mid 상태가 나올 때마다 계속 노출된다. email mover-line은 매번, daily-brief는 LLM 실패 시에만(빈도 미상) |

**노출 이력**: 코드는 2026-07-23(STEP 784)부터 존재. `daily_brief` 저장분 24행 전수 검색 결과 리터럴 중복 0건(LLM 경로 추정 회피). email mover-line 과거분은 **측정 불가**(저장 안 됨). **수신자 규모는 미조사**(개인정보 영역, 이 STEP 범위 밖).

**DoD7과의 관계**: 923이 확인한 대로 `LENS_COMPLETION_STANDARD.md:24`의 "같은 이름"이 판정라벨인지 종목명인지 여전히 정의돼 있지 않다. 이 STEP도 그 해석 문제를 풀지 않는다 — **DoD7 판정 칸은 이 문서로 바뀌지 않는다.**

**승인은 장은태 것**: 위 A/B/C 중 무엇을 언제 할지, 특히 email-brief(발송 경로)를 건드리는 A·B는 장은태 명시 승인 없이 착수하지 않는다.
