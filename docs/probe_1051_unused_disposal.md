# probe_1051 — 미사용 8개 처분 · `products` 귀속 · 「동결」의 정확한 정의

> STEP1051 실행 기록. 🟠 DB 변경 있음(2단계: Phase A 읽기전용 → Phase B 처분) · 화면 변경 0 · KR 크론 무접촉 · `vercel.json` 무접촉.

---

## ⓪-1a. 로드맵 원문 대조

| 층 | 확인 | 비고 |
|---|---|---|
| WHY | 조건1(정확) | 쓰는 것과 안 쓰는 것이 뒤섞이면 판단이 계속 틀린다 — 오늘도 KR 크론을 끌 뻔했다 |
| HOW | H-2(카탈로그가 먼저) | 4층(테이블)에 이번 처분 결과 반영(`DATA_SOURCE_CATALOG.md`) |
| WHAT | 범위(US 상장 종목 분석) | KR 화면이 라이브인 것과 범위의 관계를 `ROADMAP_V2.md`에 한 문단으로 명시 |
| 관문·순위 | F-5 판정 대기 | 확인 결과 F-5 14개 항목 중 이번 처분과 직접 겹치는 항목 없음(아래 "못 한 것" 참고) |
| 완성의 정의 | C-1 항목2(입력 검증) | 미사용 테이블은 입력 검증 대상이 아님을 구분 — 이번에 처분된 7개는 애초에 어느 모델의 입력도 아니었다 |
| 수익 모델 | 없음 | 무관 |

## ⓪-1b. 기존 답 확인 — `ls`로 전수(이름 패턴 금지)

```
docs/PARKED_FIELD_SURFACES.md
docs/PARKED_HNX_VCI_ACTIVATION.md
docs/PARKED_KR_DIVIDEND_ACTIVATION.md
docs/PARKED_OAUTH_LOCALE_ACTIVATION.md
docs/PARKED_TERMS_PRIVACY_ACTIVATION.md
```
(STEP1050과 동일 목록 — 이번 STEP 사이 새로 생긴 `PARKED_*` 없음, 재확인 완료.) 그 밖에 `probe_1047`~`1050` · `DATA_SOURCE_CATALOG.md`(4층) · `SYSTEM_MAP.md` · `STATE.md`를 확인했다. `KNOWN_ANSWERS.md`에 이 8개 테이블 관련 기존 답 없음.

## ⓪-3중 규칙 요약

- **A-0 우리 자산**: `probe_1049`(69개 인벤토리, 이번 STEP의 재확인 대상) · `probe_1047`·`1048`의 처분 절차(형식 재사용) · Cowork 실측(`kr_stock_snapshot` 참조 10곳, 주문서 인용)
- **A 원문**: 해당 없음
- **B 실무**: 해당 없음
- **C 반대 증거**: `probe_1049`의 "미사용 8건" 자체 — 오늘 두 번(`AdvisorDirectory`·`dividends`) 재확인 없이 틀렸던 전례가 있어 그대로 믿지 않고 재검증(아래 A-1)
- **검증**: 우리실측 — SQL(행수·재확인) + grep(정방향+역방향, 따옴표변형) + DB 오브젝트(FK·인덱스·RLS) 대조 + 로컬 API 호출(홈·`/explore`·검색)
- **검수**: 반박 시도(A-1에서 damodaran_capex/working_capital이 실제로 걸림 — 반증 조건 작동 확인) · 수치 출처(전부 오늘 재조회) · 이전 발언 대조(`probe_1049`의 "미사용 8건" 판정 방법에 빠진 것을 A-1에 기록) · 분기 비중(8건 중 7건 처분·1건(`products`) 귀속 재분류·2건 제외)
- 🔴 **미측정**: `discussion_reports`/`platform_discussion_reports`의 트리거 함수(`update_discussion_report_count`·`update_platform_discussion_report_count`) 정리 여부(테이블만 처분, 함수는 미삭제 — 범위 밖으로 명시)

---

## Phase A — 재확인

### A-1. 미사용 8건 재확인 — 두 방법

`probe_1049`가 「미사용(코드 참조 0)」으로 판정한 8개(`ai_view_cache`·`banned_words`·`macro_indicators`·`discussion_reports`·`platform_discussion_reports`·`us_sector_relative_snapshot`·`damodaran_capex`·`damodaran_working_capital`) 전부를 다시 확인했다.

| 테이블 | 행수(재확인) | 최신 갱신 | 방법①(정방향, 따옴표 3종+템플릿리터럴) | 방법②(역방향, `.from()`/`.rpc()` 전수 대조) | 판정 |
|---|--:|---|---|---|---|
| `ai_view_cache` | 0 | — | 0건 | 대상 아님(0건) | ✅ 참조 0 확정 |
| `banned_words` | 0 | — | 0건 | 대상 아님 | ✅ 참조 0 확정 |
| `macro_indicators` | 0 | — | 0건 | 대상 아님 | ✅ 참조 0 확정 |
| `discussion_reports` | 0 | — | 0건(회원탈퇴 `USER_OWNED_TABLES` 배열에도 없음 — `discussions`·`discussion_comments`·`discussion_likes`는 있는데 이 테이블만 빠짐) | 대상 아님 | ✅ 참조 0 확정 |
| `platform_discussion_reports` | 0 | — | 0건(위와 동일 결여) | 대상 아님 | ✅ 참조 0 확정 |
| `us_sector_relative_snapshot` | 2,294 | `captured_at` 2026-08-10 | 0건(쓰기 코드도 0 — `probe_1049`가 놓쳤던 "쓰기 코드 특정 못 함"을 이번에 완결: 쓰기 코드 자체가 없음 확인) | 대상 아님 | ✅ 참조 0 확정(행이 있어도 코드 참조는 0 — 별개 축) |
| 🔴 `damodaran_capex` | 94 | 2026-01-05 | **0건(읽기 코드)** — 그러나 `lib/revdcf/registry.ts:73`에 "driver 5 대조"용으로 등재, `scripts/ingest_damodaran.ts:127`이 **매년 능동적으로 upsert** | 대상 아님(읽기 없음) | 🔴 **처분에서 제외** — 반증 조건 실제로 걸림 |
| 🔴 `damodaran_working_capital` | 94 | 2026-01-05 | **0건(읽기 코드)** — `registry.ts:74` "driver 4 대조 · 폴백 금지" 명시, `ingest_damodaran.ts:136`이 매년 write | 대상 아님(읽기 없음) | 🔴 **처분에서 제외** — 동일 사유 |

🔴 **반증 조건(⓪-4) "8건 중 실제로 쓰이는 것이 나온다" — 실제로 걸렸다.** `probe_1049`의 판정 방법에 빠진 것: **"코드 참조 0"을 읽기(`.from()` select)만 확인했지 쓰기(`upsert`/`insert`) 여부는 별도로 확인하지 않았다.** `damodaran_capex`·`damodaran_working_capital`은 읽기는 0이지만 쓰기는 매년 능동적으로 일어나는 "설계상 대조 전용" 테이블이었다 — "미사용"이라는 한 단어로 "죽었다(읽기·쓰기 둘 다 0)"와 "읽지 않는다(쓰기는 계속된다)"를 뭉뚱그리면 안 됐다.

**DB 오브젝트 전수(뷰·FK·인덱스·RLS·마이그레이션)**: `advisor_directory` 선례대로 확인 — 뷰 0개(기존과 동일, 새로 생긴 것 없음). FK: `discussion_reports`→`discussions`, `platform_discussion_reports`→`platform_discussions`(둘 다 자식→부모 방향, 부모는 처분 대상 아니므로 문제 없음). 나머지 5개는 FK 없음. 트리거: `discussion_reports`·`platform_discussion_reports`에 각각 1개(AFTER INSERT count 갱신) — 테이블 DROP 시 자동 소멸, 함수 자체는 미삭제(§"못 한 것"). 인덱스·RLS 정책 전수 확인 완료(`docs/probe_1051_unused_disposal.md`와 같은 커밋의 `spinoff/unused-tables-2026-08-16/schema.sql` 참고).

### A-2. `products` 귀속

**스키마**: `category`(etf/fund/wrap/els/bond/reits/other 체크 제약) · `ticker`·`name`·`issuer`·`fee_pct`·`inception_date`·`tags`·`view_count`·`discussion_count`·`hidden`. **행수**: 10. **데이터 내용**(전량 실측): KODEX 200·TIGER 200·TIGER 미국나스닥100·TIGER 미국S&P500·KODEX 2차전지산업·TIGER 2차전지테마·KODEX 미국나스닥100(H)·TIGER 리츠부동산인프라·KODEX 200TR·KODEX 미국나스닥100TR — **전부 한국 자산운용사(삼성·미래에셋)가 발행한 한국 상장 ETF**(티커가 6자리 KRX 코드). `created_at`이 10행 전부 `2026-06-24T06:29:00.498616` 단일 타임스탬프.

🔴 **판정: 귀속 = KR(내용 기준, 이름 아님).** 근거: ① 내용이 100% KR ETF ② 단일 시딩 타임스탬프가 `spinoff/kr-pilot-2026-06-25/`의 `stocks`(2026-06-25 12:50:42)·`dividends`와 **정확히 같은 패턴**(하루 전) — 같은 시기에 만들어졌다가 함께 버려진 KR 파일럿 데이터로 보인다 ③ 코드 참조는 재확인 결과 0(아래).

**참조 코드 재확인**: 이전 조사에서 `lib/revdcf/registry.ts`·`scripts/fetch_spdr_sectors.ts`에 "products"가 매치됐던 것은 **SPDR ETF 다운로드 URL 경로 문자열**(`library-content/products/fund-data/etfs/...`)의 우연한 부분일치였다 — 실제 코드 컨텍스트를 직접 열어 재확인(`registry.ts:105`, `fetch_spdr_sectors.ts:36,104`), 테이블 참조가 아님을 확정. `.from('products')`/`.from("products")`/백틱/`.rpc()` 전부 0건.

**「불명」 유지가 아니라 확정한 이유**: 주문서 A-2는 "못 정하면 불명 유지"를 요구하지만, 이번엔 **내용 대조로 정해졌다**(KR) — `probe_1049`가 "불명"으로 남긴 이유는 이름("products")만 보고 코드 참조 0이라는 사실만 확인했을 뿐, **데이터 내용을 직접 열어보지 않았기 때문**이었다. 이름이 아니라 내용으로 보니 답이 나왔다.

### A-3. 판정 — 진행 가능한가

| 테이블 | 참조 0 증명 | Phase B |
|---|---|---|
| `ai_view_cache`·`banned_words`·`macro_indicators`·`discussion_reports`·`platform_discussion_reports`·`us_sector_relative_snapshot` | ✅ | 진행(0행 5개는 DDL+존재기록만, `us_sector_relative_snapshot`은 2,294행 실데이터 덤프) |
| `products` | ✅(귀속 KR 확정, 참조 0) | 진행(10행 실데이터 덤프) |
| `damodaran_capex`·`damodaran_working_capital` | 🔴 쓰기 참조 있음 | **제외** — 처분하지 않는다 |

---

## Phase B — 처분

### B-1. 보존

`spinoff/unused-tables-2026-08-16/`에:
- `data/*.json` — `us_sector_relative_snapshot`(2,294행, 페이지네이션으로 전량 수집·1.27MB) · `products`(10행, 전체 KR ETF 레코드) · 나머지 5개는 존재 기록용 빈 배열 `[]`
- `schema.sql` — 7개 테이블 전체 DDL(컬럼·제약·인덱스·RLS, `information_schema`/`pg_catalog` 직접 조회로 재구성)
- `README.md` — ①무엇인가(세 무리로 구분: 완전히 죽은 5개 / 감사 스냅샷 1개 / KR ETF 카탈로그 1개) ②왜 처분했나 ③이관vs삭제 구분 ④복원방법 ⑤데이터한계 ⑥재사용시 확인할 것

행수 재검증(Python `json.load`): `us_sector_relative_snapshot`=2,294·`products`=10 — DB 실측과 일치 확인 후 다음 단계 진행.

### B-2. 제거

DROP 직전 재실측(1-1 시점과 동일): 0,0,0,0,0,2294,10 — 덤프와 완전 일치. `supabase/migrations/20260816b_drop_unused_tables.sql` 작성·적용(`{"success":true}`) — 의존 역순(자식 `discussion_reports`·`platform_discussion_reports` 먼저, 나머지는 상호 의존 없어 순서 무관). DROP 후 `information_schema.tables` 재조회로 7개 전부 소멸 확인.

### B-3. 검증 — 양방향 + 눈으로

**① 코드→DB 고아 참조**: 7개 테이블명 재검색 — `products`에서 이전과 동일한 SPDR URL 문자열 부분일치 1건(이미 확정된 false positive, 실제 테이블 참조 아님). 그 외 0건.
**② DB→코드 고아 테이블**: 이번 STEP이 새로 만든 테이블 없음(DROP만) — 해당 없음.
**tsc**: clean(사전 존재하는 `.gitignore` 대상 `scripts/_probe_B_flows.ts`는 이번 STEP과 무관, 임시 이동 후 재확인·복원). **vitest**: 34 파일·386개 테스트 전부 통과(이번 STEP은 코드 변경이 없어 STEP1050과 동일 수치). **`npm run build`**: 라이브 dev 서버(포트 3333) 보호를 위해 생략(STEP1050 선례 그대로 — 대신 tsc+vitest+로컬 API 실호출로 대체 검증).

**`us_*`·`kr_stock_snapshot`·기타 무접촉 대상 before/after**:

| 테이블 | before | after |
|---|--:|--:|
| `kr_stock_snapshot` | 2,776 | 2,776 |
| `us_valuation` | 32,561 | 32,561 |
| `us_fundamentals` | 5,820 | 5,820 |
| `us_market_cap` | 5,917 | 5,917 |
| `discussions`(부모, 유지) | 0 | 0 |
| `platform_discussions`(부모, 유지) | 0 | 0 |
| `damodaran_capex`(제외분) | 94 | 94 |
| `damodaran_working_capital`(제외분) | 94 | 94 |

**완전 불변 확인.**

**로컬 육안(실제로는 curl — 브라우저 도구 부재, C-3㉡ 준수)**:

```
홈(/) status=200
/explore status=200
/api/search?q=삼성 status=200 → 삼성중공업·삼성증권·삼성E&A 등 실데이터 반환
/api/krx/ranking status=200 → 1위 SK하이닉스(가격·등락률·거래대금 실측치) 등 실데이터 반환
```

**결론: KR 크론 3개(`kr-perf`·`kr-etp`·`kr-lens-scores`) 무접촉 상태에서 홈·검색·`/explore`(KR)·랭킹 전부 정상 작동 확인.**

---

## 2. 🔑 「동결」의 정확한 정의 — 문서화

`docs/ROADMAP_V2.md` 머리(범위 절 바로 아래)에 「동결/파킹/제거」 3낱말 표 + KR 크론 유지 근거 + 범위와의 관계 한 문단을 추가했다(원문은 `ROADMAP_V2.md` 참고, `roadmap_v2.html` 동기화 완료). 요지:

- **동결**(KR): 새 작업 안 함, 기존 화면·크론·데이터는 그대로 돈다 — **라이브**.
- **파킹**(타국·기능): 배선 보존·스위치 OFF — **안 나감**.
- **제거**: 데이터 보존 후 DB·코드에서 없앰 — **없음**.
- **KR이 동결인데 라이브인 이유**: `kr_stock_snapshot`을 읽는 코드 10곳(홈·검색·사이트맵·관심목록·`/explore`) — 그러므로 **KR 크론 3개는 유지가 답**.
- **범위와의 관계**: "US 상장 종목 분석"은 새 모델의 적용 대상이지 화면에서 KR을 내린다는 뜻이 아니다.

---

## before / after 요약

| 항목 | before | after |
|---|---|---|
| 테이블 수 | 69 | **62** |
| 미사용 판정 8건 | 판정만(probe_1049) | 7건 DROP·2건 제외 확정 |
| `products` 귀속 | 불명 | **KR**(DROP됨) |
| `damodaran_capex`/`working_capital` | "미사용" 오분류 | ✅ 살아있음(대조용) — 정정 |
| KR 크론 3개 | 라이브 | **무변경(라이브)** |
| `ROADMAP_V2.md` 「동결」 정의 | 없음 | 표+근거 명시 |

---

## 못 한 것 / 미측정 / 철회·정정

- **못 한 것**: `update_discussion_report_count()`·`update_platform_discussion_report_count()` 함수 정리(트리거는 테이블과 함께 소멸했으나 함수 자체는 남아 vestigial — 범위="테이블 처분"을 넘는 정리라 손대지 않음, `spinoff/unused-tables-2026-08-16/README.md`에 기록) · F-5 헤더 "14건" 카운터 갱신(이번 처분과 F-5 항목 사이 실제 교집합이 없어 갱신 대상 자체가 없음을 확인 — "못 함"이 아니라 "해당 없음"으로 정정).
- **아직 안 함**: 없음(이 STEP 범위 내 전부 완료).
- **철회·정정**: `probe_1049`의 "미사용 8건" 중 2건(`damodaran_capex`·`damodaran_working_capital`)을 "실제로 쓰인다(대조용 write)"로 정정 — **판정 방법의 결함**(읽기만 확인, 쓰기 미확인)을 A-1에 기록. `products`의 "불명"을 "KR"로 정정(내용 대조 미실시가 원인).
- **미측정**: 없음(이 STEP의 반증 조건 6개 전부 확인 완료 — 8건 재확인·`products`판정·KR크론근거불변·0행아닌것보존·동결정의어긋남없음 전부 대조함).

🔴 **판정 금지 없음 — 이 STEP은 판정거리(KR 크론)가 아니라 이미 답이 있던 것을 실행했고, 나머지(7개 처분·`products` 귀속·「동결」 정의)도 전부 이 STEP 안에서 확정·완료했다.**
