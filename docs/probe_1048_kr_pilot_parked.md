# probe_1048 — KR 파일럿: 데이터 보존 이관 + 코드 파킹 + DB 제거 (완료)

> STEP1048 실행 기록. STEP1047의 NO-GO(실사용 참조 발견)를 파킹으로 끊고 이관·제거까지 완료했다. 🔴 **실행 중 STEP1047의 핵심 근거("완전한 실사용 체인")가 검증 범위 밖이었음을 발견** — 이 문서 §5에 정정으로 남긴다.

---

## ⓪-3중 규칙 요약

- **A-0 우리 자산**: `docs/probe_1047_kr_pilot_removal.md`(참조 전수, 재사용) · `spinoff/advisor-directory/README.md`·`schema.sql`(형식 선례) · `docs/LOCALE_SOURCE_PLAYBOOK.md` §11(파킹 프로토콜) · `docs/PARKED_HNX_VCI_ACTIVATION.md`(활성화 체크리스트 형식 선례) · `docs/MODEL_UNIVERSE_63_2026-08-07.md` §3-1(정정 대상)
- **A 원문**: 해당 없음(코드·DB 대상 STEP)
- **B 실무**: 해당 없음
- **C 반대 증거**: STEP1047의 "완전한 실사용 체인" 진단 자체가 이번 STEP 실행 중 반증됨(§5)
- **검증**: 우리실측(Supabase MCP `execute_sql`·grep·tsc·vitest·`npm run build`·임시 라우트로 실제 렌더 확인) — 전부 완료
- **검수**: 반박 시도(§5에서 스스로 발견) · 수치 출처 확인(전부 오늘 DB 재조회) · 이전 발언 대조(STEP1047 정정 명시) · 분기 비중(파킹 대상 = 배당 토글 1곳뿐, 나머지 10개 테이블은 참조 0)
- 🔴 **미측정**: 브라우저 실제 시각적 렌더(도구 부재 — 대신 임시 라우트+curl로 HTML 레벨 확인, §4)

---

## 1-1. 데이터 이관 — `spinoff/kr-pilot-2026-06-25/`

**행수 검증(이관 전, DB 직접 조회)**: `stocks`=27 · `dividends`=60 · 나머지 9개(`ai_analysis`·`disclosures`·`financials`·`insider_trades`·`news`·`quant_factors`·`short_credit`·`stock_prices`·`supply_demand`)=0. `probe_1047`의 실측과 완전히 일치(52일 사이 변동 없음 재확인).

**산출물**:
- `data/stocks.json`(27행) · `data/dividends.json`(60행) — DB `json_agg` 조회 결과를 그대로 덤프, 별도 가공 없음
- `data/{ai_analysis,disclosures,financials,insider_trades,news,quant_factors,short_credit,stock_prices,supply_demand}.json`(빈 배열 9개 — 존재 기록용)
- `schema.sql` — 11개 테이블 + 뷰 `stock_snapshot_v`의 CREATE TABLE/INDEX/CHECK/FK/RLS/VIEW 전문(`information_schema`·`pg_indexes`·`pg_constraint`·`pg_policies` 직접 조회로 재구성, 추정 아님)
- `README.md` — ①무엇인가 ②왜 분리·DROP했나 ③이관vs삭제 구분 ④복원 방법 ⑤데이터 한계(`payout_ratio` 전 행 NULL·2019~2024·27종목뿐·`ex_dividend_date`/`payment_date` NULL·`sector`/`market_cap`/`name_en` NULL·단일 시점 스냅샷) ⑥재사용 시 확인할 것

**행수 재검증**(Python `json.load` + `assert`): `stocks.json`=27 · `dividends.json`=60 — 통과. **이 검증을 통과한 뒤에만** 1-2·1-3을 진행했다(주문서 명시 순서).

---

## 1-2. 코드 파킹 — 배당만, IPO는 살린다

**⓪-3b 선확인**: `app/api/ipo/feed/route.ts`(`IpoFeed.tsx`가 부르는 라우트)를 전체 읽음 — 38.co.kr을 직접 스크래핑할 뿐 `dividends`·`stocks`·Supabase 호출이 **전혀 없다.** grep으로도 재확인(0건). **IpoFeed는 파일럿 스키마와 완전히 무관 — 파킹 대상에서 안전하게 제외됨을 코드로 확인 후 진행.**

**구현**: `components/toolbox/OfferingsFeed.tsx`를 수정 — 🔴 **토글 UI는 그대로 유지**(주문서의 "토글 자체를 안 보이게 하거나, 이유를 밝히는 문구" 중 후자를 선택. 이유: 공유 번역 키 `Home.category.ipo`="공모주·배당"이 US 탭에서는 여전히 사실이라, 토글 자체를 숨기면 KR에서만 다른 UI 구조가 되어 오히려 일관성이 깨짐). '공모주' 선택 시 기존과 동일하게 `<IpoFeed/>`, '배당' 선택 시 `<DividendFeed/>` 대신 새 번역 키 `Feed.offerings.dividendPaused`(ko: "국내 배당 데이터 정비로 잠시 제공을 중단했습니다." / en: "KR dividend data is being retired — this section is temporarily unavailable.") 렌더.

**가짜 채움 확인**: 빈 리스트나 "데이터 없음"으로 위장하지 않았다 — 명시적으로 "정비 중단"이라는 사유를 문장으로 밝힌다.

**파일 삭제 0**: `components/toolbox/DividendFeed.tsx`·`app/api/dividend/feed/route.ts` 둘 다 git diff에 안 잡힘(파일 존재 그대로, import만 제거) — `git status`로 확인.

**`docs/PARKED_KR_DIVIDEND_ACTIVATION.md` 신설**: 기존 `PARKED_HNX_VCI_ACTIVATION.md` 형식(왜 보류했나·현재 상태·활성화 체크리스트·비용·재사용 가치) 그대로. 활성화 체크리스트 6단계(새 데이터소스 결정→크론 신설→토글 원복→route.ts 교체→육안 확인) 포함.

**US 컴포넌트 diff 0**: `git diff --stat -- components/toolbox/UsOfferingsFeed.tsx components/toolbox/UsDividendFeed.tsx components/toolbox/UsIpoFeed.tsx`(및 관련 API) — **빈 출력.** 무접촉 증명 완료.

---

## 1-3. DB 제거

**DROP 직전 재실측**(1-1과 동일 시각대 재조회로 드리프트 없음 확인): `stocks`=27·`dividends`=60·나머지 9개=0 — 덤프와 완전 일치.

**마이그레이션**: `supabase/migrations/20260816_drop_kr_pilot_schema.sql` — 의존 역순(뷰 `stock_snapshot_v` → FK로 `stocks`를 참조하는 10개 테이블 → `stocks` 마지막). `mcp__claude_ai_Supabase__apply_migration`으로 적용, `{"success":true}` 확인.

**DROP 후 즉시 재조회**: `information_schema.tables`에서 11개 테이블명 전체 조회 → **빈 결과(0건)**. `pg_views`에서 `stock_snapshot_v` → **0건**.

---

## 1-4. 검증 — 양방향 + 눈으로

**① 코드→DB(고아 참조)**: 11개 테이블명을 `.from('table')`/`.from("table")` 두 따옴표 형태로 `app/lib/components/scripts` 전수 재검색 — **`app/api/dividend/feed/route.ts:12`의 `.from("dividends")` 1건만 남음.** 🔴 이것은 버그가 아니라 **의도된 파킹 상태**(파일 삭제 안 함, 호출자가 없어져 도달 불가) — `PARKED_KR_DIVIDEND_ACTIVATION.md`에 이 정확한 동작(테이블 없음 → 에러 → catch가 `{items:[],error}` 200 반환)이 문서화돼 있고, 실제로 로컬에서 재현 확인함(§4).

**② DB→코드(고아 테이블)**: DROP 후 남은 69개 테이블 중 이번 STEP이 건드리지 않은 것은 전부 기존 상태 유지 — 새로 생긴 고아 테이블 없음(이번 STEP은 DROP만 했고 새 테이블을 안 만듦).

**tsc clean**: `npx tsc --noEmit` — 0 에러(사전 존재하던 gitignore 처리 스크립트 `scripts/_probe_B_flows.ts`의 중복 함수 오류는 이번 STEP과 무관한 로컬 전용 파일이라 임시로 옮겨 확인 후 원복 — 아래 별도 기록).

**전체 테스트 통과**: `npx vitest run` — **34 파일·384개 테스트 전부 통과**(`messages.test.ts` ko/en 키 패리티 포함, 신설 `dividendPaused` 키가 양쪽에 대칭 추가됐음을 재확인).

**build 성공**: `npm run build` — Turbopack 컴파일 성공·타입체크 통과·모든 라우트 정상 빌드.

**`git diff --stat`으로 US·`kr_stock_snapshot` 코드 무변경 증명**: 변경 파일 = `components/toolbox/OfferingsFeed.tsx`·`messages/ko.json`·`messages/en.json` 3개뿐(+16/-4줄). US·KR보드 관련 코드 0건.

**`us_*`·`kr_stock_snapshot` 행수 before/after**:

| 테이블 | before | after |
|---|--:|--:|
| `kr_stock_snapshot` | 2,776 | 2,776 |
| `us_valuation` | 32,561 | 32,561 |
| `us_fundamentals` | 5,820 | 5,820 |
| `us_market_cap` | 5,917 | 5,917 |

**완전 불변 확인.**

**로컬 육안 확인 — 🔴 여기서 STEP1047 진단의 허점을 발견**: 아래 §5 참고.

---

## 1-5. 문서 정정 — 전수

| 문서 | 정정 내용 |
|---|---|
| `docs/MODEL_UNIVERSE_63_2026-08-07.md` §3-1 | **전면 철회**로 갱신(원문은 `<details>`로 보존). "`financials` 0행 → 1~8위 전부 푼다"는 US 모델 선정과 무관한 KR 파일럿 테이블 얘기였다 |
| `docs/ROADMAP_V2.md` F-4(표) | "`dividends` 60행뿐(1,977종목 중)" → "US 재료 0건" |
| `docs/ROADMAP_V2.md` F-4-2 ㉠ | "AAII 73%인데 60행뿐" → "US 재료 자체가 없다"(재료 갭→재료 없음) |
| `docs/ROADMAP_V2.md` F-4-3(순위표 7위) | "0.46%(27/5,820)" → "0%(US 재료 0건)", 분모·분자 전부 오분류였음을 명시 |
| `docs/ROADMAP_V2.md` F-4-3 선행층 | `financials` §3-1 "8~11위에만 유효" 부분철회 → 전면철회로 갱신 |
| `docs/ROADMAP_V2.md` F-5 ⑬ | 성장(⑬-a, 있는데 부족) vs 배당·부도위험(⑬-b, 아예 없음)으로 분리 |
| `docs/probe_1039_kr_premise_sweep.md` | "데이터 스키마 축을 안 봤다" 정정 섹션 신설(이번 STEP이 발견한 누락 경로) |
| `docs/step_orders/_TEMPLATE.md` ⓪-5 §2 | "이름에 KR이 없으면 패턴 검색에 안 걸린다"를 근거 ⑤로 한 줄 추가(2026-08-15 4건에 이어 2026-08-16 재발 사례) |
| `docs/SYSTEM_MAP.md` §5 | 11개 테이블 목록에서 제거, 헤더 "64개"(스테일) → 오늘 DB 실측 "69개"로 갱신, DROP 사실 안내 배너 추가 |
| `docs/STATE.md` | STEP1047 항목을 "완료"로 갱신 + §5 발견 요약 |
| `docs/roadmap_v2.html` | 위 F-4/F-4-2/F-4-3/F-5 4곳 전부 동기화. `html.parser` 파싱 오류 0·div/table/tr/td/th 태그 개수 완전 일치(python 재검증) |

---

## §5. 🔴 실행 중 발견 — STEP1047의 "완전한 실사용 체인" 진단이 검증 범위 밖이었다

**1-4의 "로컬에서 실제로 열어본다" 단계에서 발견.** `components/toolbox/ToolboxClient.tsx`(STEP1047이 "KR 모아보기 화면"이라 지칭한 파일)를 어느 페이지가 렌더하는지 추적하다가, **`app/` 전체에서 `ToolboxClient`를 import하는 곳이 단 한 곳도 없음을 확인했다**(`command grep -rlF "ToolboxClient" app components stores` — 파일 자신 + 무관한 주석 2곳뿐). `OfferingsFeed`·`IpoFeed`도 `components/toolbox/` 내부에서만 서로 참조될 뿐, 그 바깥(=실제 페이지)에서 부르는 곳이 없다. 홈(`/`)은 `TodayClient`, `/explore`는 `ExploreClient`가 렌더하며 둘 다 IPO/배당 관련 코드를 전혀 갖고 있지 않다. `/toolbox` 라우트 자체는 `redirect({href:"/"})`로 홈으로 튕긴다.

**추가 검증(정방향 HTML 확인)**: 홈페이지 실제 SSR HTML을 curl로 받아 `<script>` 태그를 제거한 뒤 "공모주"·"배당" 문자열을 검색 — **body에는 0건**(유일한 잔존은 `<meta name="description">`의 마케팅 카피 1건). script 태그 안에는 여러 건 나오지만 전부 next-intl이 로케일 메시지 전체를 클라이언트로 실어 보내는 JSON 페이로드였다(사용 여부와 무관하게 번역 파일 전체가 직렬화됨) — **실제 렌더된 UI가 아니라 번역 데이터 뭉치일 뿐이었다.**

**임시 라우트로 최종 확인**: `app/[locale]/step1048rendercheck/page.tsx`(커밋 전 삭제)를 만들어 `<OfferingsFeed/>`·`<UsOfferingsFeed/>`를 직접 마운트 — 둘 다 정상 렌더(토글 버튼 "공모주"/"배당" 표시, 크래시 없음). `/api/ipo/feed` 직접 호출 → 실제 최신 공모주 데이터 반환(빅웨이브로보틱스 등, 정상). `/api/dividend/feed` 직접 호출 → `{"items":[],"error":"[object Object]"}` HTTP 200(파킹 설계대로 우아하게 실패). ko/en 페이지 양쪽에서 `dividendPaused` 번역 문자열이 정상 로드됨을 확인. 검증 후 임시 라우트 파일 완전 삭제(`git status`로 잔존 없음 확인).

**결론**: `components/toolbox/*`(26개 파일)는 **현재 어떤 페이지 라우트에서도 도달 불가능한 고아 코드**로 보인다. STEP1047이 "완전히 확인된 실사용 체인"이라 기술한 것은 **컴포넌트 간 내부 합성 관계**(A가 B를 렌더한다)만 확인한 것이었고, **최상위 진입점(페이지→`ToolboxClient`) 자체가 실제로 도달 가능한지는 검증하지 않았다** — `CLAUDE.md`의 C-3 ㉡("확인했다고 생각했지만 실제로는 안 봤다")에 정확히 해당하는 사례다.

🔴 **이 발견이 이번 STEP의 실행을 바꾸지는 않는다.** 파킹·이관·DROP은 `OfferingsFeed`가 도달 가능하든 아니든 안전한 조치였고(도달 불가능이면 오히려 더 명백히 안전), 이미 완료됐다. 🔴 **바뀌는 것은 서술이다** — STEP1047·1048 주문서가 근거로 든 "라이브 화면에 영향이 간다"는 진술은 **검증되지 않은 과장**이었을 가능성이 높다. 다만 **확정은 못 한다** — `app/` grep과 curl 검증만으로 "완전히 죽었다"를 100% 증명할 수는 없다(예: 관리자 전용 숨김 라우트, 조건부 렌더 등 이번 검색이 못 잡는 경로가 이론상 있을 수 있음, 미측정으로 남김).

**후속 판단 필요(이 STEP의 범위 밖, 착수 안 함)**: `components/toolbox/*` 26개 파일 전체가 정말 고아 코드인지 별도 STEP으로 더 넓게 확인하고, 맞다면 정리(삭제 또는 spinoff 이관) 여부는 장은태 판정.

---

## `_probe_B_flows.ts` 관련 — 이번 STEP과 무관한 로컬 이슈 기록

`npx tsc --noEmit`·`npm run build`를 처음 실행했을 때 `scripts/_probe_B_flows.ts`(중복 함수 정의)에서 실패했다. 확인 결과 이 파일은 **git 미추적**(`.gitignore:51: scripts/_*.ts`)이고 **2026-07-28**(이번 STEP 3주 전)에 로컬에 생성된 것으로, 이번 STEP의 변경과 무관하다. 클린 배포 환경(Vercel)에는 애초에 존재하지 않는 파일이라 이 오류는 **로컬 전용 아티팩트**다. 검증을 위해 `/tmp`로 임시 이동 → tsc·build 재실행(둘 다 통과) → 원위치로 복원(내용 무변경, `mv` 왕복만) — 파일을 삭제하거나 내용을 고치지 않았다.

---

## 못 한 것 / 미측정 / 철회·정정

- **못 한 것**: 브라우저 실제 시각적 렌더(스크린샷 도구 부재 — 대신 임시 라우트+HTML 파싱으로 최대한 근접 확인, §4·§5)
- **철회·정정**: STEP1047·1048 주문서의 "라이브 화면에 영향" 근거가 검증 범위 밖이었음을 §5에 기록(파킹·DROP 실행 자체는 철회하지 않음 — 결과는 동일하게 안전)
- **미측정**: `components/toolbox/*` 전체가 100% 도달 불가능한지(관리자·조건부 라우트 등 이번 검색이 못 잡는 경로 이론상 존재 가능) · `dividends` 60행이 왜 애초에 크론 없이 방치됐는지(이력 밖)

🔴 **판정 금지 — `components/toolbox/*` 전체의 향후 처리(정리·이관·유지)는 장은태 판정 대상이며 이 STEP은 착수하지 않았다.**
