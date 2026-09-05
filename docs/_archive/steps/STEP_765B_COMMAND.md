# STEP 765b — /today 목업 정합 폴리시 (실물 검수 6건)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: 코드 HEAD `714f9fe`(STEP 765) · 트리 클린

**배경(07-21 · 사용자 폰 + Cowork PC 라이브 검수)**: /today가 승인 목업과 6곳에서 어긋남. 원칙: 목업이 정본.

---

## 수정

### 1) 타이틀 위계 — 날짜가 주인공 (`components/today/TodayClient.tsx` 또는 페이지)

- 현행: 작은 날짜 + H1 "오늘" + 부제 "아침 브리핑 · 어제→오늘 렌즈 변화" → **목업대로**: **날짜가 큰 제목**(모바일 22px·PC 26px·"2026년 7월 21일 화요일") + 바로 아래 시장 한 줄. "오늘" H1·부제 라벨 제거(페이지 `<title>`은 유지). i18n 갱신.

### 2) US 종목명 축약

- 변화 행 이름 표시: **`foreign_ko_names` 한글 오버라이드 우선 → `cleanUsName()`(기존 lib/stockName.ts 재사용) → 한 줄 말줄임(line-clamp-1)**. KR은 현행(ko=한글). 764가 저장한 raw name은 그대로 두고 **표시층에서 변환**(저장 재수정 불필요·이름 규칙은 읽기 쪽 일원화).

### 3) 노이즈 전환 필터

- `lib/lensPrecompute.ts` 기록 조건에 **`from_tone`이 유효(pos|warn|flat)일 때만** 추가(산출 불가/null → 값 생김 = 변화 아님·기록 제외). `/api/today/changes` 읽기에도 같은 가드(기존 노이즈 행 방어). 기존 lens_state_changes의 노이즈 행은 Cowork이 MCP로 일괄 삭제 예정(보고만).

### 4) PC 조판 — 중앙 정렬

- 페이지 컨테이너 `max-w-[1040px] mx-auto` + 본문 컬럼 `max-w-[680px]` + 레일 320px(목업 정합·본문 라인 길이 표준). 모바일 무변.

### 5) 관심 섹션 3상태 완성

- ① 비로그인 또는 관심 0 → 온보딩 카드(현행) ② 관심 있음+변화 있음 → 변화 카드 ③ **관심 있음+변화 0 → "오늘은 관심종목 렌즈 상태 변화가 없어요" 한 줄**(신규·ko/en).

### 6) 도트 정리(소소)

- 행 우측 단일 점은 to_tone 의미 — 유지하되 이름 옆이 아니라 **상태 문구 앞**으로 이동(무엇의 톤인지 명확).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(패리티) · `npm run build`
2. 라이브(배포 후): `/today` — 날짜 헤더·US명 축약(알리바바/한글·IBM 단축)·"산출 불가" 행 소멸·PC 중앙 조판(Cowork 크롬 재검수)·관심 3상태(코드 확인).
3. 커밋:
   ```bash
   git add components/today/ app/ lib/lensPrecompute.ts messages/ docs/STEP_765B_COMMAND.md
   git commit -m "STEP 765b: /today mockup parity - date-first header, short US names, noise-transition filter, centered PC layout, watchlist 3-state"
   git push
   ```

## 완료 보고 → Cowork에게
- tsc/vitest/build · 커밋 해시. (Cowork: 기존 노이즈 행 MCP 삭제 + PC 재검수. **766 내비 재편이 즉시 후속** — 목업 체감의 나머지 절반.)
