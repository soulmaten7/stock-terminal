# spinoff/unused-tables-2026-08-16 — 미사용 테이블 7개 (분리 보관)

> 2026-08-16 STEP1051로 트릴리언 본체 DB에서 분리·DROP. `probe_1049`(2026-08-16)가 69개 테이블 전수 인벤토리에서 「미사용(코드 참조 0)」으로 판정한 8건 중, STEP1051이 **두 방법(정방향 이름검색+역방향 코드대조)으로 재확인**해 여전히 참조 0으로 남은 7건이 대상이다. **이 폴더는 트릴리언 빌드에 포함되지 않는다**(`tsconfig.json`의 `spinoff/**` exclude가 이미 이 폴더도 덮는다).

## ① 무엇인가

7개 테이블 — 성격이 서로 다른 세 무리다.

- **완전히 죽은 테이블 5개**(전부 0행): `ai_view_cache`(AI 생성 뷰 캐시 추정, 마이그레이션 파일에도 없음) · `banned_words`(금칙어, seed만 있고 필터링 로직 없음) · `macro_indicators`(거시지표, `SYSTEM_MAP.md`가 2026-08-07부터 이미 "죽은 테이블"로 기록) · `discussion_reports`·`platform_discussion_reports`(토론 신고 — 부모 테이블 `discussions`·`platform_discussions`는 회원탈퇴 클린업 코드가 참조해 유지되지만, 이 둘은 그 클린업 배열에도 없어 참조가 완전히 0이었다).
- **감사용 1회 스냅샷 1개**(2,294행): `us_sector_relative_snapshot` — `snapshot_tag='pre_step980'`, STEP980 이전 값을 비교하려고 한 번 떠 둔 스냅샷. 쓰기 코드도 읽기 코드도 0(감사가 끝난 뒤 방치됨).
- **KR ETF 상품 카탈로그 1개**(10행): `products` — KODEX 200·TIGER 200 등 10개 한국 ETF. `created_at`이 전부 `2026-06-24T06:29:00.498616` 단일 타임스탬프로, `spinoff/kr-pilot-2026-06-25/`의 `stocks`·`dividends`와 **같은 시딩 패턴**(하루 전)이다 — 같은 시기에 만들어졌다가 함께 버려진 KR 파일럿 데이터로 보인다. 코드 참조는 0(이전 조사에서 "products"라는 문자열이 SPDR 다운로드 URL 경로 `library-content/products/fund-data/`에 우연히 포함돼 있어 참조가 있는 것처럼 보였으나, STEP1051 재확인 결과 실제 테이블 참조가 아니었다).

## ② 왜 분리·DROP했나

`probe_1049`가 69개 테이블 전수를 훑으며 이 8개(damodaran_capex·damodaran_working_capital 포함)를 "미사용"으로 묶었다. 그런데 같은 날 두 번(`AdvisorDirectory`가 "제거됨"이라 적혔으나 라이브였던 사례, `dividends`가 "US 재료 갭"인 줄 알았으나 KR 파일럿이었던 사례) 판정이 재확인 없이 틀렸던 전례가 있어, STEP1051은 **처분 전에 반드시 두 방법으로 다시 확인**하도록 설계됐다(`docs/step_orders/STEP1051.md`). 재확인 결과 이 7개는 정말로 참조 0이었고(damodaran_capex·damodaran_working_capital 2개는 재확인 과정에서 "실제로는 쓰인다"는 게 드러나 처분에서 제외됨 — `docs/probe_1051_unused_disposal.md` §A-1 참고), 이 7개만 DROP했다.

## ③ 이관 vs 삭제의 구분

🔴 **「이관」과 「삭제」는 다른 일이다.** 이 폴더는 데이터(행)와 스키마(DDL)를 원본 그대로 보존하는 **이관**이고, 트릴리언 프로덕션 DB에서 테이블 자체를 없앤 것이 **삭제**다(`supabase/migrations/20260816b_drop_unused_tables.sql`). 데이터는 안 버렸고, DB에서만 없앴다.

## ④ 복원 방법

1. **복원 좌표**: 이 폴더가 추가된 커밋과 DROP 마이그레이션 커밋은 `docs/probe_1051_unused_disposal.md`와 `docs/CHANGELOG.md`의 2026-08-16 STEP1051 블록에 기록돼 있다.
2. **스키마 복원**: `schema.sql`을 그대로 실행 — 7개 테이블이 원래 DDL(컬럼·제약조건·인덱스·RLS)대로 재생성된다. 단 `discussion_reports`·`platform_discussion_reports`는 `discussions`·`platform_discussions`(본체에 그대로 남아 있음)를 FK로 참조하므로 그 두 테이블이 먼저 있어야 한다. 트리거(`trigger_discussion_reports_count` 등)는 DROP과 함께 사라졌으므로 복원하려면 `017_discussions.sql`·`019_platform_directory.sql`의 원본 트리거 정의를 다시 실행해야 한다(함수 자체는 이번에 지우지 않아 DB에 남아 있다 — ⑥ 참고).
3. **데이터 복원**: `data/*.json`의 각 파일을 해당 테이블에 INSERT. `us_sector_relative_snapshot.json`은 1.27MB·2,294행이라 배치 INSERT 권장.
4. 나머지 코드(이 테이블들을 부르는 앱 코드)는 애초에 없었으므로 복원할 코드가 없다 — 스키마+데이터만으로 복원 완료.

## ⑤ 데이터 한계 (재사용 전 반드시 확인)

- `products`(KR ETF 10건): 결측 없이 완전한 레코드지만 **10개뿐**이고 `inception_date`가 전부 NULL, `2026-06-24` 시점 스냅샷이라 이미 낡았을 수 있다. `view_count`·`discussion_count` 전부 0(실사용 흔적 없음).
- `us_sector_relative_snapshot`: `snapshot_tag='pre_step980'` 단일 시점(2026-08-08~09)뿐 — 시계열이 아니라 한 순간의 비교용 캡처다. 재사용하려면 무엇과 비교하려던 스냅샷이었는지(`STEP980` 커밋 이력) 먼저 확인해야 뜻이 통한다.
- 나머지 5개(`ai_view_cache`·`banned_words`·`macro_indicators`·`discussion_reports`·`platform_discussion_reports`)는 **행 자체가 없다** — 스키마(컬럼 구조)만 참고 가능.

## ⑥ 재사용 시 확인할 것

- 이 폴더는 **데이터·DDL만** 담고 있다. 이 테이블들을 부르는 코드는 애초에 존재하지 않았다(그래서 처분 대상이었다) — 재사용하려면 새로 배선해야 한다.
- 🔴 **`update_discussion_report_count()`·`update_platform_discussion_report_count()` 함수는 이번 STEP에서 지우지 않고 DB에 그대로 남겨뒀다** — 트리거만 테이블과 함께 자동 소멸했다. 복원 시 트리거를 다시 만들면 이 함수들을 그대로 재사용할 수 있다(`docs/probe_1051_unused_disposal.md` "못 한 것" 참고 — 함수 정리는 이번 STEP 범위 밖).
- `products`가 KR ETF 카탈로그로 재사용 가치가 있다면, `platform_discussions`(0행, 본체에 남아 있음)와 함께 "상품 토론" 기능 전체를 다시 설계하는 것이 자연스럽다 — 테이블 하나만 되살리는 것보다 그 세트 전체(`019_platform_directory.sql`)를 같이 보는 것을 권한다.
