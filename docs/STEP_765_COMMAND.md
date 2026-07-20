# STEP 765 — "오늘" 홈 페이지 (/today · 모닝 다이제스트 · 목업 승인판)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)
**⚠️ STEP 764(변화 파이프) 완료·검증 후 실행**

**전제 상태**: STEP 764 커밋 이후 HEAD · 트리 클린 · `lens_state_changes`에 KR·US 데이터 존재

**결정(07-19 · 목업 승인)**: 신규 `/today` — **현 홈(`/`)은 건드리지 않는다**(가역·랜딩 스위치는 STEP 767). 문법 = 아침 뉴스: 선택 없이 위→아래 한 스크롤·2분 완결·**전부 결정론 사실 서술**(추천 아님·v1 LLM 0).

---

## 페이지 구조 — `app/[locale]/today/page.tsx` (+클라 컴포넌트 `components/today/`)

`force-dynamic`(SYSTEM_MAP §10 캐시 함정). 모바일 1열 / PC 2열(본문 + 우측 320px 레일 — `lg:` 분기).

### 본문 섹션 (위→아래)

1. **헤더**: 오늘 날짜(로케일 포맷) + **시장 한 줄(결정론)**: `/api/yahoo/indices`에서 KOSPI(en이면 S&P500) 등락 — "어제 코스피 -6.37%" + 렌즈 변화 통계 한 조각("렌즈 상태 변화 N건") — 문구는 지수·수치 조립만, 해석 문장 금지.
2. **내 관심종목 · 렌즈 변화**(로그인+변화 있을 때만): `/api/today/changes?watchlist=true` — 카드형(목업대로: 종목명·등락%·"모멘텀 {from라벨} → {to라벨}"). 라벨은 `lensCopy.ts`의 기존 이중언어 상태 라벨 재사용(**새 문구 발명 금지** — 결정론 보장의 핵심). 최대 4건 + "관심종목 전체 →".
3. **간밤 미국**: `/api/today/changes?market=US` 상위 3~5건 — 같은 행 포맷 + 미국 지수 한 줄. (US 크론 05시 KST 완료 = 아침 신선.)
4. **오늘 시장 변화**(KR·en이면 US 우선): 상위 5건 리스트 + "변화 N건 더 보기 →"(→ 탐색 보드로).
5. **각주**: 기존 키 재사용 "사고팔 신호가 아니라, 스스로 판단할 재료예요."

### 상태 변형

- **비로그인/관심 0**: 섹션 2 대신 온보딩 카드 — "관심종목을 담아두면 아침마다 변화를 여기서 알려드려요" + [탐색에서 담으러 가기 →]. **종목 추천 리스트 금지**(중립 원칙).
- **주말/휴장**: 764의 최신 date 폴백 사용 + 섹션 제목 옆에 "금요일 기준" 배지(응답 date로 판별·정직 표기).
- **변화 0건**: "오늘은 렌즈 상태 변화가 없어요" 한 줄(지어내지 않음).

### PC 우측 레일 (`lg:`)

- 시장 카드: `/api/yahoo/indices` 주요 4~6개(기존 데이터 재사용).
- 내 관심종목 카드: `/api/watchlist/quotes` 재사용(시세+등락·"전체 →"). 비로그인 = 로그인 유도 한 줄.

### 접근·기타

- 헤더에 임시 진입점: 기존 헤더 메뉴에 "오늘" 링크 추가(내비 재편은 766 — 여기선 링크 하나만·기존 메뉴 불변).
- 각 행/카드 클릭 → 종목 상세(기존 라우팅). i18n 전 문구 ko/en 동시(패리티) — 라벨은 lensCopy 재사용이라 자동 이중언어.
- 종목명: KR ko=한글/en=name_en(기존 규칙 재사용) · US 그대로.
- SEO: `generateMetadata` 간단(제목 "오늘 — Trillion"·설명 결정론)·index 허용.

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(패리티) · `npm run build`
2. 로컬: 로그인(관심 有)/비로그인/관심 0 세 변형 · 모바일 1열·PC 2열 · `/en` 영어(US 우선) · 변화 0건 mock 확인
3. push·배포 후 라이브: `/today` 실데이터 렌더(KR·US 변화)·주말이면 "금요일 기준" 배지 확인 — Cowork+사용자 폰 검수
4. 커밋:
   ```bash
   git add app/ components/today/ messages/ docs/STEP_765_COMMAND.md
   git commit -m "STEP 765: /today morning-digest home (lens changes, overnight US, deterministic copy, PC rail)"
   git push
   ```

## 완료 보고 → Cowork에게
- tsc/vitest/build · 세 변형 확인 결과 · 커밋 해시. (766 내비·767 랜딩 스위치는 사용자 검수 후 별도.)
