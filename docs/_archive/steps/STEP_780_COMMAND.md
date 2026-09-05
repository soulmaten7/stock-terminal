# STEP 780 — "상태가 바뀐 종목" 명칭 통일 (오늘 섹션 · 탐색 섹션 · 풀리스트 = 한 이름)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: STEP 779 커밋 `1793d42` 이후 HEAD · 트리 클린

**배경(07-22 · 장은태 승인)**: 같은 풀리스트(`/explore?list=changes`)로 가는 입구가 오늘 화면에선 "한국 시장 변화", 탐색에선 "상태가 바뀐 종목"으로 이름이 달라 사용자가 다른 페이지로 오인(Nielsen #4 일관성 위반). 뒤로가기 동작(온 곳으로 복귀)·다중 입구 구조는 **표준이므로 불변** — 고치는 건 이름뿐.

---

## 수정

### 1) 개념 이름을 "상태가 바뀐 종목" 하나로 통일

- **정본 키 하나**(기존 탐색 섹션 키를 정본으로)를 3곳이 재사용:
  1. **오늘 화면 섹션 제목**: `한국 · 상태가 바뀐 종목` (시장 표기 유지 — 774의 en 시장 불일치 버그 재발 방지. en 화면 = `US · ...`)
  2. **탐색 섹션 제목**: `상태가 바뀐 종목` (현행 유지 — 시장 토글이 바로 위라 접두어 불필요)
  3. **풀리스트(`?list=changes`) 헤더 제목**: `한국 · 상태가 바뀐 종목` (market 파라미터 기준 접두어)
- 774의 `Today.marketChangesTitle`("{market} 시장 변화")류 구 키는 제거·교체(사용처 grep 전수 — 잔존 금지).
- en 패리티: **기존 탐색 섹션의 en 문구를 정본으로** 동일 통일(새 영문 발명 금지 — 현행 en 키 그대로 3곳 재사용, 접두어만 `US · `). messages ko/en 패리티 테스트 통과.
- "N건 →" 더보기 라벨·카운트·정렬·톤 필터 칩은 불변.

### 2) 탭 하이라이트 현황 확인 (보고만 — 수정 금지)

- 오늘 화면에서 더보기로 `/explore?list=changes` 진입 시 하단 탭바(모바일)·상단 내비의 활성 표시가 어느 탭인지 코드로 확인해서 완료 보고에 1줄 기재(웹 관례상 URL 기준 활성이면 허용 — 바꾸지 말 것, 논의용 사실만).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(패리티) · `npm run build`
2. 라이브: `/` 오늘 섹션 제목 `한국 · 상태가 바뀐 종목` → 더보기 → 풀리스트 헤더 동일 이름 · 탐색 섹션도 동일 개념명 · `/en` = `US · ` 접두어 + 기존 en 문구 · 구 문구("시장 변화") grep 0.
3. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ docs/STEP_780_COMMAND.md
   git commit -m "STEP 780: unify changes-list name across today section, explore section, full-list header"
   git push
   ```

## 완료 보고 → Cowork에게: 라이브 확인 + 탭 하이라이트 현황 1줄 + 커밋 해시. 최종 판정 = 장은태 폰(입구→도착→뒤로가기 직접 사용).
