# probe_1047 — KR 파일럿 스키마 제거: Phase A 증명 결과 → 🔴 NO-GO (실사용 참조 발견)

> STEP1047 실행 기록. **Phase A(증명)에서 실사용 코드 참조가 발견되어 Phase B(DROP)를 진행하지 않았다.** 🔴 코드·DB 변경 0건 — 이 문서와 STATE/CHANGELOG/STEP_LEDGER 갱신만 있다.

---

## ⓪-3중 규칙 요약

- **A-0 우리 자산**: `docs/step_orders/STEP1047.md`(주문서) · STEP1035~1039(리딩방 제거 선례, 절차 재사용) · `docs/probe_1039_kr_premise_sweep.md` · `supabase/migrations/001_initial_schema.sql`·`012_quant_factors.sql`·`013_stock_snapshot_view.sql` · `docs/probe_1036_orphan_tables.md`(뷰 미사용 선행 발견) · `supabase/migrations/20260712_harden_definer_views_grants.sql`(뷰 레거시 확인 주석)
- **A 원문**: 해당 없음(코드·DB 대상 STEP, 학술 원전 대조 아님)
- **B 실무**: 해당 없음
- **C 반대 증거**: 주문서 자체의 전제("참조 0" 암묵 가정) — **오늘 실측이 이 전제를 반증**
- **검증**: 우리실측(Supabase MCP `execute_sql`·grep) — 두 방법(정방향·역방향) 완료. 제3자 대조 불필요(코드·DB 사실 확인 성격)
- **검수**: 반박 시도 — "라이브 스크린샷을 못 봤으니 실사용이 아닐 수도"라는 반박을 시도했으나, RLS `Anyone can read`+실제 렌더 체인(아래 A-2)이 이를 기각. 분기 비중 — 참조 1건(`dividends`+`stocks`), 나머지 9개 테이블은 0건으로 셈. 이전 발언 대조 — 이 문서가 최초 발견, 정정 대상 없음
- 🔴 **미측정**: 브라우저 육안 렌더 확인(도구 부재, API/코드 체인까지만 확인) · `dividends` 데이터의 신선도 원인(2026-06-25 단일 시각 이후 갱신 파이프라인 존재 여부)

---

## ⓪-1a. 로드맵 원문 대조

| 층 | 확인 | 비고 |
|---|---|---|
| WHY | 조건1(정확) | 틀린 재료 표기 위에서 순위를 매기고 있었다는 전제는 유효 |
| HOW | H-2·H-7 | 카탈로그가 DB 스키마를 안 담고 있었다는 지적 유효 |
| WHAT | W-2-3·W-2-4 | 배당 칸 재료 판정에 영향(아래 §5) |
| 관문·순위 | F-4·F-4-3·F-5 | 🔴 **이번 STEP은 A-4에서 멈췄으므로 F-4/F-4-3/F-5 수정은 보류** — Phase B가 실행돼야 "US 재료 0건"이 확정되는데, 이번엔 그 전 단계에서 멈췄다. 다만 `dividends`가 **KR 실사용 중**이라는 사실 자체는 F-4-3의 "재료 갭"이 아니라 "US엔 원래 없음 + KR엔 살아있음"으로 한 번 더 정밀해진다(§5) |
| 완성의 정의 | C-1 항목2 | 이 항목이 지켜졌으면 애초에 이 STEP이 필요 없었다는 주문서 진단 유효 |
| 수익 모델 | 없음 | 무관 |

## ⓪-1b. 기존 답 확인

STEP1035~1039(리딩방 제거) 절차를 그대로 재사용했다 — 새 절차 설계 없음. 핵심 재사용 원칙: **"0행이어도 코드가 부르면 깨진다."** 이번 STEP은 그 원칙이 **60행짜리 실데이터에서도 똑같이 적용**됨을 보여준 사례다.

---

## Phase A — 증명

### A-1. 대상 확정 (🔴 주문서 수치 2건 정정)

| 주문서 표기 | 실측 | 정정 사유 |
|---|---|---|
| "12개" (`stocks` + `stock_id` 참조 10개 + `financials`) | **11개** | `financials`는 이미 "`stock_id` 참조 10개"에 포함된 테이블이다 — 주문서가 이를 중복 계산했다 |
| "8개 0행" | **9개 0행** | `stocks`(27)·`dividends`(60)를 제외한 나머지 9개(`ai_analysis`·`disclosures`·`financials`·`insider_trades`·`news`·`quant_factors`·`short_credit`·`stock_prices`·`supply_demand`)가 전부 0행 |

**11개 확정 목록**: `stocks`(27) · `dividends`(60) · `ai_analysis`(0) · `disclosures`(0) · `financials`(0) · `insider_trades`(0) · `news`(0) · `quant_factors`(0) · `short_credit`(0) · `stock_prices`(0) · `supply_demand`(0)

**FK 계보**: `information_schema` 조회로 `stocks(id)`를 `stock_id` FK로 참조하는 테이블이 정확히 위 10개(=`stocks` 제외 전부)임을 확인. **다른 테이블에서 `stock_id` 컬럼을 가진 것은 이 10개뿐**(전수 확인 완료, 12개 밖 계보 없음).

**마이그레이션 계보**: `stocks`·`dividends`·`financials`·`ai_analysis`·`disclosures`·`insider_trades`·`news`·`short_credit`·`stock_prices`·`supply_demand` = `supabase/migrations/001_initial_schema.sql`(최초 커밋 2026-04-09) · `quant_factors` = `012_quant_factors.sql`(최초 커밋 2026-04-22, "STEP 45") · 파생 뷰 `stock_snapshot_v` = `013_stock_snapshot_view.sql`(최초 커밋 2026-04-22, "STEP 46"). 🔴 **주문서의 "2026-06-25 계보"는 마이그레이션 파일 생성일이 아니라 `stocks` 테이블의 실제 데이터 행(27개) `created_at`이 전부 2026-06-25 12:50:42 단일 시각이라는 뜻**이다 — 스키마(코드)는 4월에 만들어졌고, 데이터(27행)는 6월 25일 한 번 시딩된 뒤 재실행이 없었다는 두 사실을 하나로 뭉쳐 쓴 것. 실측으로 분리 확인.

**`kr_stock_snapshot` 계열과의 경계**: FK 조회(`ccu.table_name='kr_stock_snapshot' OR tc.table_name='kr_stock_snapshot'`) = **0행**. 뷰 정의에 `kr_stock_snapshot`과 파일럿 11개 테이블명이 동시에 등장하는 뷰 = **0개**. **경계 확인 완료 — 얽혀 있지 않다.**

**12개 밖 잔재 추가 확인**: `stock_id` 컬럼을 가진 테이블 = 정확히 위 10개(추가 없음). `%stock%` 이름의 테이블 전수(`pg_tables`) 중 국가 계열(`kr_stock_snapshot`·`cn/gb/jp/us/vn_stock_perf`)과 이미 확정된 `stocks`·`stock_prices`를 뺀 나머지는 `stock_briefings` 하나뿐이며, **`stock_id` FK가 없다**(AI 브리핑 캐시 테이블, symbol 문자열 키 — 파일럿 계보 아님). 12개 밖 추가 잔재 없음.

### A-2. 코드 참조 전수 — 두 방법 (🔴 여기서 실사용 참조 발견)

**방법①(정방향)**: 11개 테이블명을 `app/lib/components/scripts` 전체에서 `.from('table')`/`.from("table")`/`` .from(`table`) `` 세 따옴표 형태로 각각 검색. `stock_prices`는 별도로 `app/api/cron/revdcf/route.ts:66`의 주석("`stock_prices` 테이블은 저장소에 없다 — STEP 947 §5-5 원문의 명칭이 정확치 않았음")이 **독립적으로 미사용을 재확인**. `financials`는 문자열 매치가 있었으나 전부 `StockData["financials"]`(무관한 타입 필드명)·GICS 라벨 `"financials"`(무관) — 테이블 참조 아님. **결과: `dividends` 1건만 HIT, 나머지 10개는 0건.**

**방법②(역방향)**: 코드 전체의 `.from(...)`·`.rpc(...)` 호출을 전수 수집해 62개 distinct 테이블/뷰 + RPC 2개(`lens_distribution`·`lens_percentiles`) 목록을 만들고 11개 파일럿 테이블과 대조. **교집합 = `dividends` 1개.** 나머지 61개는 `us_*`·`kr_stock_snapshot`·`jp/cn/gb/vn_*`·`link_hub*`·`damodaran_*`·`lens_*`·`revdcf_results` 등 전부 파일럿과 무관.

**차집합**: 방법①과 방법②가 **완전히 일치**(둘 다 `dividends` 1건) — 교차검증 성공, 방법①만으로는 놓칠 수 있었던 문자열-조합 케이스가 이번엔 없었다는 뜻이지 방법①만으로 충분했다는 뜻은 아니다(주문서 원칙 유지).

🔴 **HIT 상세 — `dividends`+`stocks` 실사용 체인 (완전 확인)**:

```
components/toolbox/ToolboxClient.tsx  (KR 모아보기 화면)
  → <OfferingsFeed />                  (components/toolbox/OfferingsFeed.tsx)
    → <DividendFeed />                 (components/toolbox/DividendFeed.tsx, '배당' 탭)
      → fetch('/api/dividend/feed')
        → app/api/dividend/feed/route.ts
          .from("dividends")
          .select("dividend_per_share, dividend_yield, ex_dividend_date, fiscal_year, stocks ( symbol, name_ko )")
          .not("dividend_yield","is",null).gt("dividend_yield",0)
          .order("dividend_yield",{ascending:false}).limit(60)
```

DB 실측(top 10 by yield): JB금융지주·HD현대·현대엘리베이터·우리금융지주·기업은행·메리츠금융지주·BNK금융지주·iM금융지주·NH투자증권 등 **실제 KR 종목명·시세성 수치**가 반환된다. RLS = `Anyone can read dividends`/`Anyone can read stocks`(둘 다 `qual=true`, 완전 공개 읽기) — 인증 여부와 무관하게 서빙된다. `fiscal_year`는 2020~2024(최신 2025/2026 없음, 정체 상태이나 **빈 테이블이 아니다**), `ex_dividend_date`는 표본 전 행 NULL.

**회원탈퇴·관리자·크론·RLS 명시 확인**: `account/delete` 계열 코드에 11개 테이블명 매치 없음(리딩방 선례와 다른 결과 — 이번엔 탈퇴 경로엔 없었다). 관리자(`app/admin` 등) 매치 없음. 크론 — **11개 테이블을 쓰는 크론이 없다**(`dividends`는 읽기 전용 route만 있고, upsert하는 크론 자체가 존재하지 않음 → 60행은 2026-06-25 시딩 이후 한 번도 갱신되지 않았을 가능성이 높다는 뜻이지, 참조가 없다는 뜻은 아니다). RLS는 위에서 확인.

### A-3. DB 오브젝트 전수

| 오브젝트 | 결과 |
|---|---|
| **뷰** | `stock_snapshot_v`(`stocks`+`quant_factors`+`dividends` LEFT JOIN LATERAL, `013_stock_snapshot_view.sql`) 1개. **앱 미사용 확인 3중** — ① `20260712_harden_definer_views_grants.sql` 주석 *"stock_snapshot_v 는 앱 미사용(레거시·마이그레이션 정의에만 존재)"* + 실제로 `security_invoker` 전환·`anon/authenticated` 권한 회수까지 이미 집행됨 ② `docs/probe_1036_orphan_tables.md:105`가 이미 참조 2건(마이그레이션 자기참조뿐)으로 미사용 플래그 ③ 오늘 grep — `app/lib/components/scripts` 전체에 `stock_snapshot_v` 문자열 0건, `docs/STEP_46_COMMAND.md`·`docs/STEP_85_COMMAND.md`(archived 명령 문서, 실행코드 아님)에만 잔존. **결론: 뷰는 미사용 — 하지만 A-4 판정은 `dividends` 단독으로도 이미 NO-GO이므로 이 결론은 참고용.** |
| **FK** | `stocks`→10개 테이블 방향 10건(이미 A-1에 반영). `kr_stock_snapshot` 방향 0건. |
| **인덱스** | 11개 테이블 전부 PK + 통상적 `stock_id`/날짜 컬럼 보조 인덱스. `insider_trades`만 PK뿐(보조 인덱스 없음) — 0행 테이블이라 실질 영향 없음. |
| **트리거** | 11개 테이블 전부 0건. |
| **함수/RPC** | `pg_proc` 함수 본문에 11개 테이블명이 등장하는 함수 0건. |
| **RLS 정책** | 11개 테이블 전부 `Anyone can read <table>`(공개 SELECT) 보유. `quant_factors`·`stock_prices`만 추가로 `service_role` 쓰기 정책 보유(둘 다 0행 — 쓰기 정책이 있다고 실제 쓰기가 일어나는 것은 아님). |
| **마이그레이션 파일** | `001_initial_schema.sql`(대부분)·`012_quant_factors.sql`(`quant_factors`)·`013_stock_snapshot_view.sql`(뷰)·`20260712_harden_definer_views_grants.sql`(뷰 권한 조정, DROP 없음) 4개 파일이 11개 테이블·1개 뷰를 언급. |

### A-4. 🔴 판정 — NO-GO, Phase B 중단

| 항목 | 결과 |
|---|---|
| 코드 참조 0 | 🔴 **아니오 — `dividends`+`stocks` 1건 실사용 확인** |
| 오브젝트 0 | 뷰 1개(미사용 확인) 외 FK/트리거/함수 신규 발견 없음 |
| **A-4 결론** | 🔴 **Phase B(백업·DROP·문서정정) 전부 미실행.** 주문서 ⓪-4 표의 "참조가 하나라도 있다 → Phase B 중단. 참조 목록과 선제거 계획만 내고 보고. 임의로 코드를 고쳐 진행하지 않는다"를 그대로 적용 |

**주문서 반증 조건 매칭**: "화면·API에 영향이 나온다" 조건도 동시에 해당한다 — `dividends`+`stocks`를 지우면 KR 모아보기 화면의 '배당' 탭이 (에러가 아니라) **빈 목록으로 조용히 바뀐다**(`route.ts`가 catch에서 `{items:[], error}`를 200으로 반환하므로 화면 크래시는 없지만, 실제 20개 종목 표시 → 0개로 화면이 바뀐다). 이는 CLAUDE.md의 "프로덕션 화면을 바꾸는 작업은 장은태 명시 승인 없이 진행하지 않는다"에도 걸리는 사안이라 이중으로 정지 대상이다.

---

## 선제거 계획(제안 — 미실행, 장은태 판정 대상)

11개 중 9개(`dividends`·`stocks` 제외 전부, 전부 0행 + 참조 0)와 뷰 1개(`stock_snapshot_v`, 참조 0)는 A-2·A-3 기준으로 **참조 0을 이미 증명했다.** 다만 주문서의 A-4 게이트는 "전체 12개(→11개) 중 하나라도 참조가 있으면 Phase B 전체 중단"으로 되어 있어 **부분 실행(9개+뷰만 먼저 제거)도 이번 STEP 범위에서는 임의 진행에 해당** — 실행하지 않았다. 다음 STEP을 위한 옵션만 제시한다:

- **옵션 A** — `dividends`+`stocks` 2개를 이번 제거 대상에서 명시적으로 제외하고, 나머지 9개 0행 테이블 + `stock_snapshot_v` 뷰만 별도 STEP으로 먼저 제거. `dividends`+`stocks`는 "KR 배당 피드가 살아있는 동안은 유지"로 별도 트랙.
- **옵션 B** — KR '배당' 탭을 `kr_stock_snapshot` 계열(실제 KR 보드 데이터)로 먼저 마이그레이션한 뒤(전제: `kr_stock_snapshot`에 배당 관련 컬럼이 현재 없음 — 마이그레이션 파일 grep 결과 `dividend`/`yield` 컬럼 0건, **새 데이터 파이프라인이 필요**) 11개 전체를 한 번에 제거.
- **옵션 C** — KR '배당' 탭 자체를 제품 결정으로 내리고(스코프 밖, 장은태 판단 필요) 이후 11개 전체 제거.

세 옵션 모두 **이번 STEP에서 결정하지 않는다** — CLAUDE.md의 "임의 판단 금지"·"완전성=MVP는 축소가 아니다"와 이 STEP 자체의 A-4 게이트에 따라 장은태 판정 대상으로 남긴다.

---

## 문서 정정 — 이번엔 미실행

주문서 B-4(`MODEL_UNIVERSE_63` §3-1 전면 철회·`ROADMAP_V2` F-4/F-4-3/F-5 갱신)는 **Phase B 완료를 전제로 한 항목**이라 이번엔 실행하지 않는다. 다만 한 가지는 사실관계로 지금 남긴다: 🔴 **`dividends`(60행)는 "US 재료 갭"이 아니라 "KR 파일럿 스키마의 실사용 중인 잔재"였다** — F-4/F-4-3의 "배당 60/1,977행"이라는 기존 표기가 US 맥락에서 여전히 부정확하다는 진단(주문서 0-A)은 유효하되, 정정 방향은 Phase B 실행 이후에 확정한다.

---

## 못 한 것 / 미측정 / 철회·정정

- **못 한 것**: 브라우저 육안으로 KR 모아보기 '배당' 탭 실제 렌더 확인(API·코드 체인까지만) · Phase B 전체(백업/DROP/문서정정) — 게이트 미통과로 설계대로 미실행
- **철회·정정**: 주문서 수치 2건 — "12개"→**11개**(financials 중복계산), "8개 0행"→**9개 0행**. 두 정정 모두 A-1에 반영, 결론(파일럿 스키마 존재 자체)에는 영향 없음
- **미측정**: `dividends` 60행이 2026-06-25 이후 왜 갱신되지 않았는지(크론 부재는 확인했으나 애초에 왜 만들어지지 않았는지는 이력 밖) · `kr_stock_snapshot`에 배당 데이터를 추가하는 마이그레이션 비용

🔴 **판정 금지 — 이 STEP은 A-4에서 스스로 멈췄다. Phase B 착수 여부·선제거 계획 A/B/C 중 선택은 전부 장은태 판정 대상이며 이 문서는 그 결정 재료다.**
