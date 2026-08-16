<!-- 2026-08-16 -->

# 🅿️ 보류 기능 — KR 모아보기 '배당' 탭 (파일럿 데이터 스키마 DB 제거에 따른 파킹)

> **상태: 코드 전부 보존, 호출 지점만 끊김. DB(`dividends`·`stocks` 등 11개 테이블 + 뷰 1개)는 DROP됨 — 데이터는 `spinoff/kr-pilot-2026-06-25/`로 이관 보존.**
> 관련: `docs/probe_1047_kr_pilot_removal.md`(Phase A 증명, 실사용 참조 발견) · `docs/probe_1048_kr_pilot_parked.md`(이번 STEP 실행 기록) · `docs/LOCALE_SOURCE_PLAYBOOK.md` §11(보류 기능 프로토콜) · `spinoff/kr-pilot-2026-06-25/README.md`.

## ① 왜 보류했나 (한 줄)

**장은태 판정(2026-08-15)**: *"KR은 추후에 사용을 해야 할 수도 있으니 데이터인 거면, 이건 KR 데이터를 모아둔 곳으로 옮겨두고 우린 US를 계속 진행하는 게 맞아."* — 데이터는 버리지 않고 이관, 코드는 지우지 않고 파킹(스위치 OFF), DB만 정리.

배경: `dividends`(60행)·`stocks`(27행)는 2026-06-25에 한 번 시딩된 뒤 **52일간 갱신이 0**이었던 KR 파일럿 스키마의 일부인데(`docs/probe_1047_kr_pilot_removal.md`), KR 모아보기 '배당' 탭(`OfferingsFeed.tsx`)이 이 낡은 데이터를 라이브로 계속 서빙하고 있었다. `CLAUDE.md`의 「🇺🇸🔒 전면 US 단독」 결정 이후 KR 신규 데이터 파이프라인 구축은 착수 대상이 아니라, 이 스키마를 되살리는 대신 **US는 그대로 두고 KR 배당만 파킹**하는 쪽을 선택했다.

## ② 현재 상태

- `components/toolbox/OfferingsFeed.tsx` — **토글 UI는 그대로 유지**('공모주'/'배당' 두 버튼 모두 보임). '배당' 선택 시 `<DividendFeed/>` 대신 **사유를 밝히는 문구**(`Feed.offerings.dividendPaused` 번역 키, ko/en)를 보여준다. 가짜 데이터나 "결측"으로 위장하지 않는다.
- `components/toolbox/DividendFeed.tsx` — **파일 삭제 없음.** `OfferingsFeed.tsx`에서 import만 제거돼 더 이상 렌더되지 않는다.
- `app/api/dividend/feed/route.ts` — **파일 삭제 없음.** `.from("dividends")` 쿼리 코드 그대로. 호출하는 클라이언트가 없어져 사실상 죽은 엔드포인트가 됐을 뿐, URL 자체는 여전히 존재하고 호출하면 **에러**를 반환한다(DB에 `dividends` 테이블이 없어졌으므로 — `supabase.from("dividends")`가 `relation "dividends" does not exist`로 실패, route.ts의 catch가 `{items:[], error}`를 200으로 반환).
- **US 배당 탭(`UsOfferingsFeed`→`UsDividendFeed`)은 완전히 별개 계보로 무영향** — `us_*` 테이블을 쓰고 이 파킹과 무관하다.
- DB: `stocks`·`dividends`를 포함한 11개 테이블 + 뷰 `stock_snapshot_v` **전부 DROP됨**(`supabase/migrations/026_drop_kr_pilot_schema.sql`). 데이터는 `spinoff/kr-pilot-2026-06-25/data/*.json`에 전량 보존.

## ③ 활성화 체크리스트 (나중에 이대로만 하면 켜짐)

1. **새 KR 배당 데이터 소스를 정한다** — 기존 파일럿 스키마를 그대로 되살리지 말 것(52일 방치·`payout_ratio` 전 행 NULL·27종목뿐인 소표본 — `spinoff/kr-pilot-2026-06-25/README.md` §⑤ 한계 참고). 후보: ① DART 공시 원문에서 배당 관련 계정 직접 파싱(`CLAUDE.md`의 "야후 재무는 2차 가공물이라 정본으로 쓰지 않는다" 원칙과 일치) ② `kr_stock_snapshot`에 배당수익률 컬럼을 신설하고 별도 크론으로 채움(현재 이 테이블엔 배당 관련 컬럼이 없음 — 확인 완료, `docs/probe_1047_kr_pilot_removal.md` 선제거 계획 옵션B).
2. **갱신 크론을 만든다** — 파킹 전 상태의 근본 문제는 "테이블은 있는데 채우는 크론이 아예 없었다"는 것이었다(`app/api/dividend/feed/route.ts`는 읽기 전용). 새 소스든 옛 스키마 복원이든 **정기 갱신 크론이 반드시 함께 있어야** 다시 파킹하는 일이 재발하지 않는다.
3. **`OfferingsFeed.tsx`의 '배당' 분기를 되돌린다** — `{view === 'ipo' ? <IpoFeed /> : (paused 문구)}`를 `{view === 'ipo' ? <IpoFeed /> : <DividendFeed />}`로 원복(git 이력상 STEP1048 커밋의 직전 상태 참고, 또는 `DividendFeed.tsx` 컴포넌트를 새 데이터소스에 맞게 고쳐서 연결).
4. **`app/api/dividend/feed/route.ts`를 새 소스에 맞게 고친다** — 옛 `dividends`/`stocks` 테이블 참조를 새 테이블/컬럼으로 교체.
5. **`Feed.offerings.dividendPaused` 키는 지우지 않아도 무방** — 다음에 또 파킹할 일이 생기면 재사용 가능. 다만 활성화 후에는 실제로 안 쓰이므로 그대로 둬도, 정리해도 무방.
6. **로컬에서 KR 모아보기 '배당' 탭을 실제로 열어 데이터가 뜨는지 육안 확인** 후 배포.

## ④ 비용·노력

옛 스키마 복원 자체는 `spinoff/kr-pilot-2026-06-25/schema.sql`+`data/*.json`로 수 분 내 가능하나, **그 데이터는 이미 낡아서(2019~2024·27종목·payout_ratio 전 행 NULL) 실사용자에게 다시 라이브로 내보내기엔 부적합**(이번 파킹의 근본 원인). 제대로 하려면 위 ①(새 소스 결정)+②(크론 신설)가 선행돼야 하며, 이건 새 KR 데이터 파이프라인 하나를 처음부터 만드는 작업 규모다 — `docs/COUNTRY_TAB_PLAYBOOK.md` 수준의 착수 검토가 필요하다.

## ⑤ 재사용 (이게 진짜 가치)

이 파킹 패턴 = **"DB 테이블을 지우기 전에 화면 호출부터 안전하게 끊고, 코드는 남기고, 사유를 사용자에게 정직하게 보여준다"**. STEP1047이 겪은 실수(참조를 못 보고 DROP했다면 화면이 조용히 깨졌을 것)를 STEP1048이 이 패턴으로 예방했다. 다른 낡은 데이터 소스를 정리할 때도 같은 순서를 재사용할 수 있다: ① 코드 참조 전수 확인 ② 참조 지점만 파킹(파일은 보존, 호출만 끊고 이유 문구로 대체) ③ 데이터 이관 ④ DB 정리 ⑤ 활성화 체크리스트를 남긴다.
