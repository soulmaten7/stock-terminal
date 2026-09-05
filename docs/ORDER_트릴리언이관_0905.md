# ORDER — Trillion 이관·방향 전환 착수 (2026-09-05)

이 저장소(stock-terminal, Trillion)는 오늘부터 Cowork 없이 **클로드
채팅(설계·명령서) + 클로드 코드(실행)** 로 운영한다. 운영 체계도 채널
프로젝트(stock-shorts)와 같은 방식으로 통일한다. 단, 이 저장소가 사고에서
배운 안전장치는 하나도 버리지 않는다.

이 ORDER는 **2단계 + 확정 게이트**다. 1단계는 읽고 보고만, 2단계는
사용자 확정("ㅇㅋ") 후 적용. 코드·크론·플래그·DB·프로덕션은 어느
단계에서도 건드리지 않는다.

---

## 0. 배경 (장은태 확정)

Trillion의 방향이 바뀐다: "검증된 모델을 완성하는 플랫폼" →
**"유튜브 채널들과 연동되는 플랫폼·본사"**. 채널 정본은 별도 저장소
stock-shorts(외장볼륨)이며 서로의 저장소를 수정하지 않는다.

상위 목표: 채널들을 최단기간 폭발 성장시켜 광고+외부 전환(제휴·리드)+
스폰서+자체 플랫폼으로 2026년 안에 최소 10억원. Trillion은 그 구조의
본사·중간 매개체. 역할 2층:
- ①허브(즉시 착수 가능): 전 채널 디렉토리·크로스 프로모션, 제휴 링크
  집결지(유튜브 설명란 대신 Trillion 페이지에서 전환·측정), 비즈니스
  문의 단일 창구(contact@onetrillion.app), 스폰서용 미디어킷
- ②제품 통합(미국 롱폼 안정화 후): 영상으로 다룬 종목의 렌즈 페이지·
  관심종목 연동 등 개발 필요 부분

바뀌지 않는 것: 3기둥(무기·직시·자립), 창작 금지(검증된 모델 원전
그대로), 프로덕션 노출은 장은태 승인+육안 검증, 피처 플래그 기본 OFF,
Supabase ref 규칙, Public 저장소 비밀 금지.

## 통일할 운영 체계 (목표 상태)

- **지침**: `CLAUDE.md`를 짧은 허브(항상 적용 규칙 + 라우팅)로 재작성하고,
  세부는 `.claude/rules/` 아래 4파일로 분리 —
  `work-protocol.md`(작업 절차·⓪줄 보고 형식·좌표 의무·확정 전 실행물
  금지) · `docs-map.md`(문서 지도·전수 업데이트 대상) · `mistakes.md`
  (실수 기록, 누적) · `deploy-gates.md`(**이 저장소 전용 안전장치**:
  push 후 CI verify+Vercel Ready 확인(게이트 8), Supabase ref 정답/금지
  목록·CLI DB 명령 금지, 미추적 파일 참조 금지, 플래그·프로덕션 승인
  규칙, Public 저장소 비밀 금지, Vercel Hobby 크론 1일 1회 한도, 반복
  함정 목록). 기존 739행의 규칙은 폐기가 아니라 **이 4파일로 재배치**.
- **명령서**: `docs/ORDER_*.md` + 실행 한 줄. STEP 번호·STEP_LEDGER 폐지,
  이력은 git 커밋 메시지. 기존 STEP_*_COMMAND.md·STEP_LEDGER.md는
  삭제하지 않고 "전환 전 기록"으로 동결(참조용).
- **상태**: `docs/STATE.md` 유지 — 현재 상태·다음 할 일의 정본, 상태가
  바뀔 때만 덮어쓰기(세션마다 의무 갱신 폐지). `docs/CHANGELOG.md`
  폐지(동결). `.claude/hooks/`의 세션 종료 검증(STATE·CHANGELOG 날짜
  체크)은 이 체계에 맞게 수정하거나 제거.
- **결정·방향**: `docs/ROADMAP_V2.md`가 방향 정본 — "무엇을 만들 때
  로드맵을 먼저 연다" 규칙 유지. 결정 기록도 여기 절로.
- **참고 문서 동결**: SYSTEM_MAP(아키텍처 지도 — 유지·갱신 대상),
  LENS_DEV_PLAYBOOK(교훈 100+ — 읽기 참조, 새 교훈은 mistakes.md로),
  BUILD_SEQUENCE §6-C 판정 대장(모델 작업 — 파킹), DATA_SOURCE_CATALOG·
  REVDCF_SPEC·VALUATION_SPEC(정본 유지).
- **3중 규칙**(3번 검색·검증·검수)은 모델·데이터 정의 변경 작업에만
  적용, 허브·UI·문서 작업엔 미적용 — work-protocol에 명시.
- **역할**: 채팅=설계·명령서·Supabase 마이그레이션 적용(MCP), 코드=실행·
  .sql 아카이브·커밋·push·게이트 8 확인. Cowork 예약 작업 2개(매일
  신선도 점검·주간 요약)는 일단 유지(감시 공백 방지).

---

## STEP 1 — 읽고 보고만 (적용 없음)

1. 부팅: `docs/STATE.md` ⓪ → `docs/ROADMAP_V2.md` 전문 → `CLAUDE.md`
   전문(739행) → `docs/COMMIT_GATES.md` → `docs/SYSTEM_MAP.md` §10(함정)
   → `.claude/hooks/` 내용.
2. **규칙 재배치 계획표**: CLAUDE.md의 규칙을 항목별로 표로 —
   `현행 문구(줄번호) / 배치(허브 유지·work-protocol·docs-map·deploy-gates·
   폐지) / 유래(사고·합의·관례)`. 사고에서 나온 규칙은 전부 deploy-gates
   또는 허브로, 폐지 후보는 이유 명시. **누락 0이 목표** — 표 항목 수가
   CLAUDE.md 규칙 수와 맞는지 자기 대조.
3. **전략 규칙 개정안**: CLAUDE.md 최상단 전략 규칙 중 새 방향과 충돌하는
   것(🇺🇸 US 단독, 모델 완성이 UI보다 먼저, 판정 B의 우선순위 기준 등)을
   `현행 / 개정안` 대조표로.
4. **허브 재료 실사**(저장소+Supabase 실제 행 기준, 추측 금지, 좌표 명시):
   `/advertise`·`ad_inquiries`(슬롯 정의 ko3/en2) · `brokers`·`link_hub`
   (컬럼·행 수·노출 화면 유무) · `youtube_channels`·파킹된 /toolbox
   유튜브 탭·중지된 youtube-refresh 크론·YOUTUBE_API_KEY(복원 절차) ·
   이메일 브리핑(구독자 수·발송 상태) · `ACTIVE_MARKETS` 현행 유지 여부.
5. 보고 후 **대기**. 형식: ⓪ 실제로 연 파일:줄 / 2·3·4 표 / 못 한 것.

## STEP 2 — 확정 후 적용

1. `CLAUDE.md` 허브 재작성 + `.claude/rules/` 4파일 생성(1단계 계획표
   그대로, 확정 시 수정된 항목 반영). 전략 규칙은 확정된 개정안 문구로.
2. `.claude/hooks/` 세션 종료 검증을 새 체계에 맞게 수정/제거.
3. `docs/ROADMAP_V2.md`에 「방향 전환 (2026-09-05)」 절 추가(0절 내용을
   로드맵 언어로). 기존 절은 삭제하지 말고 "전환 전 로드맵"으로 표시.
4. `docs/STATE.md` ⓪ 덮어쓰기: 방향 전환·운영 주체 변경(Cowork 폐지)·
   체계 전환 완료·다음 = 허브 ① 착수 명령서 대기.
5. STEP_*_COMMAND.md·STEP_LEDGER.md·CHANGELOG.md 상단에 "2026-09-05
   체계 전환으로 동결 — 현재는 STATE.md·ORDER_*.md" 한 줄(삭제 금지).
   `docs/handoff_map.html` 상단에도 같은 한 줄(덮어쓰기, 새 파일 금지).
6. `docs/INDEX.md`에 새 체계 파일 등록.
7. 커밋·push, push 후 CI verify + Vercel 배포 Ready 확인(게이트 8 —
   문서만 바뀌어도 배포는 돈다). 결과 보고.

## 하지 말 것
- 코드·크론(vercel.json)·피처 플래그·Supabase 데이터·마이그레이션 변경
- 프로덕션 화면 변경
- 기존 문서 삭제(동결 표시만)
- 1단계 보고 전에 2단계 착수
