<!-- 2026-09-05 전면 재작성 · docs/ORDER_트릴리언이관_0905.md 적용 · 2026-09-06 EarthTicker로 개명(브랜드명·태그라인만, docs/ORDER_리브랜딩1단계_텍스트_0906.md) -->
# EarthTicker(어스티커) — Claude Code 지침서 (허브)

> 이 문서는 **짧은 허브**다. 항상 적용되는 규칙만 여기 두고, 세부는 `.claude/rules/` 4파일로 라우팅한다.
> - **작업 절차·명령서 형식·보고 형식·좌표 의무** → `.claude/rules/work-protocol.md`
> - **문서 지도·폴더 구조·저장소 경계** → `.claude/rules/docs-map.md`
> - **배포 안전장치(Supabase ref·커밋 게이트·프로덕션 승인 등)** → `.claude/rules/deploy-gates.md`
> - **실수 기록(누적)** → `.claude/rules/mistakes.md`

@AGENTS.md

---

## 🚨 2026-09-05 방향 전환 (장은태 확정) — 다른 모든 지침에 우선한다

**모델 트랙(렌즈·역DCF·배수 등) 전면 폐지 확정.** EarthTicker(舊 Trillion)는 **모델 계산 플랫폼**에서 **채널 리포트 적재 플랫폼**으로 전환됐다 — 종목 페이지 알맹이는 모델 판정이 아니라 **채널 제작 리포트가 국가별 시간순으로 적재되는 것**이다. UI 껍데기(5면·국가 탭·헤더·티커·로그인·관심종목)는 유지한다.

- 모델 계산·관련 크론·파이프라인 정지, 화면의 렌즈/역DCF 제거는 **이 전환과 별개로, 별도 STEP에서 신중히 실행한다.** 이 전환 자체는 방향 기록이다.
- **`docs/BUILD_SEQUENCE.md` §6-C 판정 대장은 폐지(동결 표시)** — 더 이상 판정 대상이 아니다.
- 옛 모델 트랙 규칙(🚫창작금지·🇺🇸US단독·🔍3중규칙·✅선정모델 등) 전문은 **`docs/_archive/MODEL_TRACK_RULES_FROZEN_2026-09-05.md`**에 동결 보존돼 있다. 재개 판단이 나오면 거기서부터 재검토한다(자동 승계 없음).
- 상세 배경·연혁은 `docs/ROADMAP_V2.md` 상단 「방향 전환(2026-09-05)」절.

**운영 체계**: 이 저장소는 오늘부터 **클로드 채팅(설계·명령서) + 클로드 코드(실행)**로 운영한다. "Cowork"라는 별도 주체는 없다. 🔴 **EarthTicker 운영의 설계·명령서 대화는 한국 채널 세션(이 채팅)이 전담한다.** 상세 = `.claude/rules/work-protocol.md`.

바뀌지 않는 것: 3기둥(무기·직시·자립), 프로덕션 노출은 장은태 승인+육안 검증, 피처 플래그 기본 OFF, Supabase ref 규칙, Public 저장소 비밀 금지.

---

## 프로젝트 개요

**EarthTicker(어스티커)** — **"세계의 주식 정보를, 한 곳에서."**(2026-09-06 개명, 옛 이름 Trillion·트릴리언) 거래 X(매매·중개·자문 없음 · 통신판매업신고 비대상 = 무거래 정보서비스). 사업자 원트릴리언(210-39-33812, 법인 실명이라 유지). 코드 식별자 `unjong-*`·DB명은 대소문자 이유로 유지(구 이름 잔재).

**정체성 3기둥** (권위 = `docs/BRAND_IDENTITY.md`): **무기(Arm)** — 개인 손에 쥐어주는 명료함 · **직시(See)** — 정직한 1차 재료, 비예측 · **자립(Compete)** — 추천 안 함, 판단은 사용자.

목소리 = **멍거 톤**(건조·직설·인센티브·"덜 멍청하게"). 따뜻한 마케팅 카피 금지.

**허브 사업 모델**(2026-09-05~, 상세는 `docs/ROADMAP_V2.md`): 채널 정본은 별도 저장소 stock-shorts(외장볼륨) — 서로의 저장소를 수정하지 않는다. EarthTicker 역할 2층: ①허브(전 채널 디렉토리·크로스 프로모션·제휴 링크 집결지·비즈니스 문의 창구·미디어킷) ②제품 통합(미국 롱폼 안정화 후 — 종목 렌즈 페이지·관심종목 연동 등).

## 절대 규칙

- 코드/기술 용어는 영어, 소통은 한국어.
- 코딩 초보자 대상 — 기술 설명 간결하게, 명령어는 복붙 가능하게.
- **OTMarketing CPA 작업은 여기서 하지 않는다** · **광고주 DB 수집·정산 로직은 본 프로젝트 영역 아님** — 상세 = `.claude/rules/docs-map.md`.
- **완전성 = 축소가 아니다.** "나중/선택/후속"으로 임의 제외 금지.
- 그 외 배포·커밋·데이터 관련 절대 규칙(빌드·console.log·Supabase ref·git 미추적 파일·이상치 가드 등) 전부 = `.claude/rules/deploy-gates.md`.

## 핵심 원칙

- "로그 없으면 미완료" — 빌드 성공해도, 테스트 통과해도, 기록(git 커밋 메시지) 없으면 미완료. 실패·미실행도 같은 규칙.
- "근거 없는 숫자 만들기 금지" — `docs/STATE.md`/라이브 실측에 없는 수치 사용 금지.
- "한 번에 하나의 작업만" — 멀티태스킹 금지.
- "명령어는 복붙 가능하게" — 사용자가 바로 Claude Code 터미널에 붙여넣을 수 있는 형태로.
- **명령어는 설명과 분리해 단독 코드블록으로 준다.** 한 블록 = 한 번의 붙여넣기.

## 세션 시작 시 읽는 순서

1. `docs/STATE.md` ⓪(직전 세션 요약)
2. `docs/ROADMAP_V2.md` 상단 「방향 전환(2026-09-05)」절
3. 이 `CLAUDE.md` 허브 전체 + 필요한 `.claude/rules/*.md`
4. 작업 성격에 맞는 세부 문서(`docs/SYSTEM_MAP.md`, `docs/COUNTRY_TAB_PLAYBOOK.md` 등) — 카탈로그 = `docs/INDEX.md`

## 세션 종료 시

1. `docs/STATE.md`를 **상태가 바뀌었으면** 덮어쓰기(HEAD·현재 상태·다음 할 일). 매 세션 의무 아님.
2. 커밋·push, 게이트 8(`docs/COMMIT_GATES.md`) 확인 — GitHub Actions verify + Vercel Production/Preview Ready.
3. 코드/아키텍처가 바뀌면 `docs/SYSTEM_MAP.md` 갱신.
4. 새로운 교훈이 생기면 `.claude/rules/mistakes.md`에 추가.

## 참조 파일 인덱스

전체 문서 카탈로그 = `docs/INDEX.md`. 자주 쓰는 것만 여기 남긴다.

| 문서 | 용도 |
|---|---|
| `docs/STATE.md` | 현재 상태·다음 할 일 정본 |
| `docs/ROADMAP_V2.md` | 방향 정본 |
| `docs/SYSTEM_MAP.md` | 아키텍처·크론·테이블·env·함정 |
| `docs/COMMIT_GATES.md` | 커밋 전 체크리스트(정본) |
| `docs/COUNTRY_TAB_PLAYBOOK.md` | 새 국가탭 착수 전 필독 |
| `docs/BRAND_IDENTITY.md` | 3기둥·슬로건·보이스(권위) |
| `docs/_archive/MODEL_TRACK_RULES_FROZEN_2026-09-05.md` | 옛 모델 트랙 규칙 전문(동결) |
