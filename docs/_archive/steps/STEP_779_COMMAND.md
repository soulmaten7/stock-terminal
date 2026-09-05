# STEP 779 — 탐색 랭킹 리스트 행에 "랭킹 근거" 둘째 줄 (강점 라벨 · 거래대금)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)
**⚠️ STEP 776~778 완료 후 실행** (전제: 778 커밋 `939d212` 이후 HEAD · 트리 클린)

**결정(07-22 · 장은태 승인)**: "상태가 바뀐 종목" 행은 둘째 줄에 문장이 있는데 "강점이 많은 종목"·"오늘 거래가 많았던 종목" 행은 말 없는 도트뿐이라 비어 보임(사용자 발견). 3중 검증 결과(Material Design 2줄 리스트 문법 · Stockopedia/Danelfin "랭킹 근거 값 행 노출" · 토스 "값+짧은 라벨, 문장 금지") → **행 둘째 줄 = 그 리스트의 랭킹 근거**. LLM·섹션 헤더 스탯은 넣지 않음(오늘 리드 문단 하나 유지).

---

## 수정

### 1) "강점이 많은 종목" (탐색 섹션 + 풀리스트 `?list=pos`)

- 행 둘째 줄: `●●●●●○○  강점 5 · 모멘텀 강한 상승 추세`
  - 도트는 현행 유지, 그 뒤에 텍스트 추가.
  - `강점 N` = pos 렌즈 수(랭킹 근거) — muted 13px(기존 메타 스케일).
  - `· <대표 강점 라벨>` = **pos 톤 렌즈 중 기존 렌즈 표시 순서상 첫 번째**의 상태 라벨 — 778에서 만든 공용 헬퍼(`lensStateLabel`류, `lib/lensCopy.ts` 어휘) 재사용. 새 문구 발명 금지. 색 = **민트(pos 토큰)** — 777-4 도착 상태 색과 동일 문법.
  - pos 0개면(방어) 라벨 생략, `강점 0`만.
- en 패리티: `Strengths 5 · Momentum strong uptrend` — 기존 en 렌즈 라벨 재사용. i18n 키는 messages(ko/en) 패리티.
- 좁은 화면 넘침 = `truncate`(말줄임) — 줄바꿈 금지.

### 2) "오늘 거래가 많았던 종목" (탐색 섹션 + 풀리스트 `?list=amount`)

- 행 둘째 줄: `●●●○○  거래대금 1.2조` (en `Value traded $1.2B`)
  - 값 = KR `kr_stock_snapshot.trade_amount` · US `us_stock_perf.amount` — **774의 공용 축약 포맷 함수(`formatTradeValue`) 재사용**. muted(중립 값이므로 색 없음).
  - 해당 리스트 API 응답에 값이 없으면 **서버 응답에 포함**(기존 조회 확장 — 클라 N+1 추가 호출 금지). 값 없으면 항목 생략(정직 결측).

### 3) 공통

- 대표 라벨/상태 데이터가 API에 없으면 서버 응답 확장으로 해결(렌즈 상태는 도트 렌더에 이미 쓰고 있을 가능성 높음 — 먼저 확인 후 재사용).
- "상태가 바뀐 종목" 행·763 밀도 결정·칩 스펙은 불변. 오늘 화면은 스코프 아님(탐색 + 두 풀리스트만).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(i18n 패리티 포함) · `npm run build`
2. 라이브: 탐색 KR — 강점 섹션 행에 `강점 N · 라벨(민트)` · 거래 섹션 행에 `거래대금 N.N조` · 풀리스트 2종 동일 · `/en` 영어 + `$N.NB` · 모바일 폭에서 말줄임 확인(줄바꿈 없음).
3. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ docs/STEP_779_COMMAND.md
   git commit -m "STEP 779: ranking-basis second line on explore lists - strength count+top lens label, trade value"
   git push
   ```

## 완료 보고 → Cowork에게: 라이브 확인 결과(두 섹션 스크린 기준) + 커밋 해시. 최종 판정 = 장은태 폰 실물.
