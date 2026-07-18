<!-- 2026-07-18 -->
# 🚀 Trillion(트릴리언) — STATE (현재 상태 단일 정본)

> **이 파일 = "지금 어디까지 왔나 + 다음 뭐 할까"의 유일한 정본. 매 세션 덮어쓴다(배너 쌓기 금지).**
> 새 세션 읽는 순서: **이 STATE → `docs/SYSTEM_MAP.md`(아키텍처) → 작업별 PLAYBOOK**(국가탭 `COUNTRY_TAB_PLAYBOOK`·렌즈 `LENS_DEV_PLAYBOOK`·데이터소스 `LOCALE_SOURCE_PLAYBOOK`) → 이력 필요 시 `docs/CHANGELOG.md`.
> 규칙: **현재상태=여기에만 · 이력=CHANGELOG에만 · 아키텍처=SYSTEM_MAP에만.** (CLAUDE.md 문서 규칙)

## HEAD / 배포
- 코드 HEAD **`e254c53`**(STEP 747 · /en 매매처 배선+meta 한글 제거) · origin/main 동기화 · 트리 클린 · **배포 ✓ onetrillion.app**(라이브 실측).

## 정체성 (권위 = `docs/BRAND_IDENTITY.md`)
- 사업자 **원트릴리언** · 대표 장은태 · 210-39-33812 · contact@onetrillion.app.
- 슬로건 **"종목을 보는 눈을, 누구에게나."** — 3기둥: **무기**(TR-AI 렌즈) · **직시**(1차 재료 그대로) · **자립**(판단은 당신). 목소리 = 멍거 톤(건조·인센티브). **예측·추천 안 함 · 거래 X**(정보·허브·링크). 디자인 = 미드나잇 `#0E1116` + 민트 `#2DD4BF`(다크). 코드 식별자 `unjong-*` 유지(리브랜드 전 잔재).
- 상단 3탭 = **종목 · 정보 · 검증**. i18n = ko(디폴트) · en(`/en` · `as-needed`) · `/en` = 로고 워드마크 외 한국어 0(정적 UI·결정론 데이터·LLM 산출물·로그인 왕복 전부).

## 지금 상태 (정직한 기준선)
- ✅ **실질 완성 = 한국어 KR 탭 하나.** KR만 유니버스까지 자동(KRX 전종목 일일피드 → 신규 상장 다음날 자동 편입) + 매일 크론 + 라이브. "매일 갱신 + 라이브"가 실제로 성립.
- ⚠️ **US·JP·CN·VN·GB = 기능은 KR급이나 유니버스가 정적 시드**(`data/*_symbols.json`). 가격·수익률은 매일 새로 받지만, **신규 상장은 시드 리스트 재생성 전엔 누락.** 비미국 종목명 영어화는 JP/CN/VN 미완(US·GB는 원어가 영어). → 파이프라인 상세 = `SYSTEM_MAP.md`.
- 최근(07-17~18): ②b-2 관심목록 렌즈 즉시화(`95d4d9f`) + ①-KR 종목명 영어화(`147bc39`·`aebda56`·`7bd48e5`·`name_en` 2766/2772·라이브) → **문서 통합** + **전략 확정**(Phase 1 한국 베타 / Phase 2 글로벌화 · `ROADMAP §2-1`) → **STEP 746 name_en 정상운영화**(`76030d2`·매일 `kr-perf` 크론이 `name_en IS NULL`만 야후 증분 채움 → 신규 상장 다음날 자동 영문명·MCP 검증 null 6=야후 미제공·기존값 무변).

## ▶ 다음 (우선순위)

> **전략(권위 = `ROADMAP.md` §2-1) · 07-18 순서 재확정(장은태)**: Phase 1 = **한국 기준 베타**(게이트 = KR+US) → 베타 게이트 밖 작업(JP 브릿지 등)을 앞세우지 않는다. 순서 = **작은 픽스 → 베타 발송 → US 3중 검수 갭 처리 → 그 다음 JP/CN 브릿지**(VN/GB는 파킹 — 브릿지 대상에서 제외).

1. **클로즈드 베타 발송** — 게이트 KR+US 충족·`docs/BETA_INVITE.md` 준비됨.
2. **US 3중 검수(07-18) 잔여 갭 처리** — ⑴ bare `/en` stale HTML 1회 관찰(옛 release·주소/Coin/disclaimer2 재등장 — 도구 캐시 가능성, 브라우저 재확인 필요) ⑵ 푸터 지원시간 "Weekdays 09:00–18:00" 시간대 미표기(KST) ⑶ "미국인 시선" 본감사·영어 SEO·미국 수익화는 Phase 2 유보(로드맵 그대로).
3. **①-JP/CN 종목명 브릿지** (VN 제외·파킹 정합) — 소스 프로브 ✅완료·기록 = `LOCALE_SOURCE_PLAYBOOK §6c`(JP=JPX `data_e.xls` 실측 · CN=시드 이미 영문→title-case만 · 한글 레이어 얇음). 착수 시 표시 우선순위 인간 확정부터.
4. **6개국 유니버스 프레시니스 잡** — 시드 5개국 명단 주기 재생성(브릿지 `en` 갱신도 이 잡에 통합).
5. **운영모델 경량화** — 남은 = 일일 헬스체크·읽기전용 서브에이전트 2~4개.
6. **R4 정의** — 후보: 렌즈 조합 스크리너·관심종목 알림·포트폴리오 렌즈. 이름만·미정의.
- ✅ 완료(07-18): STEP 746 name_en 정상운영화(`76030d2`) · US 3중 검수(갭 발견) · STEP 747 /en 픽스 2건(`e254c53`·라이브 검증) · US 매매처 note 영어화(MCP).
- 장기 미착수: Trillion AI 구독(Phase 5) · 결제 레일(토스·법률자문 전제) · 클로즈드 베타 초대(`docs/BETA_INVITE.md` 준비됨).

## 워크플로우 (역할 혼용 금지)
- **Cowork = 두뇌**: 대화·설계·문서/명령 작성 · DB는 Supabase MCP로 `ccbwxcszdoyjxvckedfp`에 직접. **실행·빌드·git 안 함.**
- **Claude Code = 손**: STEP 실행·빌드·git. 실행 `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Opus는 Cowork이 🔴 표시한 복잡 디버깅/리팩토링만).
- 세션 종료 = **STATE 덮어쓰기 + CHANGELOG 한 블록 + (코드 바뀌면) SYSTEM_MAP 갱신 + git push.** (상세 = `CLAUDE.md` 문서 규칙.)
