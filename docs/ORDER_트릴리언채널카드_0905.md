# ORDER — Trillion 홈: 우리 유튜브 채널 카드 (2026-09-05)

Trillion을 채널들의 본사·허브로 만드는 첫 실현. 홈에 우리 유튜브 채널
2개를 카드로 노출해, 한 채널로 들어온 사람이 다른 채널로도 흘러가게
한다(리포트는 언어 토글로 어느 나라 것이든 볼 수 있으므로 교차 유입이
성립).

**디자인은 여전히 최소.** 리브랜딩은 이후 별도.

## 대상 채널
- 한국: 스톡스카우터 — `UC81WH6o_AKDN2NVqBSs3mlg`
- 미국: WeTheTicker — `UC0BirFox7u4vg2iMMwBZZ-Q`

## 표시 내용 (확정)
채널명 · 구독자수 · 채널 로고(아바타) · 채널 링크. **최근 영상 썸네일은
넣지 않는다** — 클릭 목적이 "이 채널로 가기"이지 특정 영상 시청이
아니고, API 호출·구현이 배로 늘어난다.

## 조사에서 확정된 재사용/신설 (STEP1 보고 기준)
- **재사용**: YOUTUBE_API_KEY(프로덕션에 이미 설정됨) · `lib/youtube.ts`의
  `channels.list?part=snippet,statistics` 호출 패턴(검색 단계 없이 채널
  ID 2개를 직접 조회) · `fmtSubs()` 구독자수 축약 포맷터(ko/en)
- **신설**: 저장 테이블 · 홈 카드 UI
- 🔴 **`youtube_channels` 테이블에 우리 채널을 넣지 말 것** —
  `refreshYoutubeTop100()`이 `delete().eq('country','KR')` 후 재삽입하므로
  그 크론이 돌면 우리 행이 삭제된다. 반드시 별도 테이블(예:
  `our_channels`)로.

## STEP 1 — 저장 구조 + 갱신 경로
- 새 테이블 신설(마이그레이션은 MCP apply_migration으로, CLI db push
  금지). 컬럼 최소: channel_key(kr/us) · channel_id · title ·
  subscriber_count · thumbnail_url · channel_url · updated_at.
  기존 테이블 컨벤션(bigint identity PK, RLS on + revoke all + grant
  select + public read 정책 — channel_reports와 같은 패턴) 따르기.
- 갱신 경로: 구독자수는 매일 변하므로 주기 갱신이 필요하다. 다만
  **Vercel Hobby는 크론 1일 1회 제한**이고 현재 9개가 이미 등록돼 있다 —
  새 크론을 추가할 여유가 있는지 확인하고, 없거나 애매하면 기존 크론
  하나에 얹거나 ISR/온디맨드 갱신(예: 홈 조회 시 24시간 지난 값이면
  갱신) 중 어느 쪽이 이 저장소에 맞는지 판단해서 제안하고 근거를 보고.
  **판단이 갈리면 실행 전에 물어볼 것.**
- 최초 1회 실제 API 호출로 두 채널 값을 채우고, 받은 값을 보고에 명시
  (채널명·구독자수 — 공개 정보라 보고 가능).

## STEP 2 — 홈 카드 UI
- 위치: 홈 리포트 피드(🇰🇷/🇺🇸 2섹션) **아래**. 리포트가 주인공이고
  채널은 그 다음 행선지이므로.
- 형태: 카드 2개(가로 나란히, 모바일은 세로). 각 카드 = 로고 + 채널명 +
  구독자수 + 국기. 클릭 시 유튜브 채널로 이동(새 탭).
- 섹션 제목 i18n(ko/en 패리티, 아포스트로피 금지 규칙 유의):
  - ko: 「우리 채널」 / en: 「Our Channels」
  - 카드 보조 문구 예: ko 「구독자 N만명」(fmtSubs 재사용) / en 「N subscribers」
- 데이터가 없거나 API 실패 시에도 카드는 뜨되(채널명·링크는 상수로
  알고 있으므로) 구독자수만 생략 — 홈이 깨지지 않게.
- 푸터에도 같은 두 링크를 텍스트로 추가(상시 접근).

## 검증
- 라이브 홈에서 카드 2개가 뜨고 구독자수가 실제 값인지, 클릭 시 각
  채널로 가는지(href 확인). ko/en 양쪽.
- 홈·종목 페이지 200 유지.

## 하지 말 것
- `youtube_channels`(경쟁사 랭킹 100행) 테이블·`refreshYoutubeTop100()`·
  파킹된 /toolbox 건드리지 말 것.
- 최근 영상 조회(playlistItems 등) 구현 금지 — 이번 범위 아님.
- 모델 크론·계산 변경 금지.
- 새 디자인·리브랜딩 요소 금지(최소 스타일).

## 보고 형식
work-protocol ⓪줄 + 새 테이블 스키마 + 갱신 경로 판단 근거 + API로 받은
실제 값 + 검증 결과 + 못 한 것. 커밋·push 후 게이트 8(CI verify +
Vercel Ready). YouTube API 쿼터 소모가 걱정되면 그 점도 보고에.
