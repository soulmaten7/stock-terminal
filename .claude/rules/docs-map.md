<!-- 2026-09-05 신설 · docs/ORDER_트릴리언이관_0905.md STEP2 -->
# 문서 지도 (docs-map)

## 1. 현재 문서 체계 (2026-09-05 전환)

| 문서 | 역할 | 갱신 규칙 |
|---|---|---|
| `docs/STATE.md` | 현재 상태·다음 할 일의 정본 | **상태가 바뀔 때만** 덮어쓰기(세션마다 의무 갱신 폐지) |
| `docs/ROADMAP_V2.md` | 방향 정본 — "무엇을 만들 때 먼저 연다" | 결정 기록도 여기 절로. 2026-09-05 방향 전환 절이 최상단 |
| `docs/SYSTEM_MAP.md` | 아키텍처·파이프라인 지도 | 아키텍처가 바뀔 때만 |
| `docs/CHANGELOG.md` | 🅿️ **동결**(2026-09-05) | 새 항목 추가 안 함 — 이력은 git 커밋 메시지 |
| `docs/STEP_LEDGER.md` | 🅿️ **동결**(2026-09-05) | 새 항목 추가 안 함 |
| `docs/_archive/steps/` | 🅿️ **동결** — 옛 `STEP_*_COMMAND.md` 893개 | 새로 만들지 않음. 이력 참조용 |
| `docs/_archive/MODEL_TRACK_RULES_FROZEN_2026-09-05.md` | 🅿️ **동결** — 옛 CLAUDE.md 모델 트랙 규칙 전문 | 모델 트랙 재개 시에만 재검토 |
| `docs/LENS_DEV_PLAYBOOK.md` | 렌즈 개발 교훈 100+ (실제 118+ 항목, §7 참조) | 읽기 참조만 — **새 교훈은 여기 대신 `mistakes.md`에 쌓는다** |
| `docs/BUILD_SEQUENCE.md` §6-C | 🅿️ **동결**(2026-09-05, 모델 판정 대장) | 판정 대상 아님 |
| `docs/DATA_SOURCE_CATALOG.md`·`docs/REVDCF_SPEC.md`·`docs/VALUATION_SPEC.md` | 모델 설계 정본(유지) | 모델 트랙 폐지 상태의 참고 자료로 유지 — 신규 갱신 없음 |
| `docs/COMMIT_GATES.md` | 커밋 전 체크리스트(9게이트+브랜치 규약) | `deploy-gates.md`가 이 문서를 가리킴 — 여기가 정본 |
| `docs/COUNTRY_TAB_PLAYBOOK.md` | 국가탭 표준틀·DoD | 새 국가탭·언어권 착수 전 필독(매번) |
| `.claude/rules/{work-protocol,docs-map,mistakes,deploy-gates}.md` | 새 규칙 4파일 | CLAUDE.md 허브가 여기로 라우팅 |

## 2. 폴더 구조

```
/
├── app/                    # Next.js App Router 페이지
├── components/             # React 컴포넌트
├── lib/                    # 유틸리티, API, 상수
├── stores/                 # Zustand 상태관리
├── types/                  # TypeScript 타입 정의
├── supabase/               # DB 스키마 마이그레이션
├── public/                 # 정적 파일
├── docs/                   # 프로젝트 문서(STATE·ROADMAP_V2·SYSTEM_MAP + PLAYBOOK들 + _archive/)
├── .claude/rules/          # 이 4개 규칙 파일
├── .claude/hooks/          # 세션 종료 검증 hook
└── CLAUDE.md               # 허브(항상 적용 규칙 + 라우팅)
```

## 3. 저장소 경계

- **OTMarketing CPA 작업은 여기서 하지 않는다** → `~/OTMarketing/` 별도 저장소(2026-04-23 분리, 상세: `docs/CROSS_REFERENCE.md`).
- **광고주 DB 수집·정산 로직은 본 프로젝트 영역 아님** — 투자 정보·차트·시그널·트레이딩 도구 + (2026-09-05~) 채널 리포트 적재만 다룬다.

## 4. 참조 파일 경로 테이블

| 파일 | 경로 | 용도 |
|---|---|---|
| 전체 문서 인덱스 | `docs/INDEX.md` | 카테고리별 카탈로그 |
| 현재 상태(정본) | `docs/STATE.md` | 세션 시작 최우선 |
| 방향 정본 | `docs/ROADMAP_V2.md` | 무엇을 만들지 결정하기 전에 |
| 아키텍처 | `docs/SYSTEM_MAP.md` | 6개국 파이프라인·크론·테이블·env·함정 |
| DB 스키마 | `supabase/migrations/*.sql` | Supabase 테이블 정의 |
| 환경변수 | `.env.local` | API 키(반드시 Trillion 전용 Supabase 프로젝트) |
| 커밋 게이트 | `docs/COMMIT_GATES.md` | 커밋 전 체크리스트(정본) |
| 브랜드 정체성 | `docs/BRAND_IDENTITY.md` | 3기둥·슬로건·보이스 |

## 5. 새 국가탭·언어권 착수 규칙

새 국가탭·언어권 착수 전 반드시 `docs/COUNTRY_TAB_PLAYBOOK.md`를 먼저 (재)읽고 시작한다 — 매번. §0 대원칙·§3 DoD 전 항목 확인 후 착수. (모델 트랙 폐지와 무관하게 유효 — 채널·허브가 국가를 확장할 때도 같은 틀을 쓴다.)

## 6. 문서 유지 규칙

- **현재상태 기록용 새 파일 신설 금지** — `docs/STATE.md` 하나에만.
- **이력 기록용 새 파일 신설 금지** — 지금은 git 커밋 메시지가 이력이다(CHANGELOG 동결).
- 문서를 고칠 때는 그 파일을 **덮어쓴다** — 새 파일·새 버전 사본을 만들지 않는다.
- 폐기 문서는 **삭제하지 않고 동결(🅿️) 표기** — `docs/_archive/`로 옮기거나 상단에 한 줄 표시.
