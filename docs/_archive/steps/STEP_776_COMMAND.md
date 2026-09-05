# STEP 776 — 리스트 정합 4건: US 영문 통일 · 도트 범례 · 종목당 묶기 · 도트 토큰 단일화

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: 코드 HEAD `c7374fb`(STEP 775) · 트리 클린

**결정(07-21 · 장은태 확인)**: 사용자 검수 3건 + 토큰 정리.

---

## 수정

### 1) US 리스트 종목명 영문 통일

- ko 화면의 **리스트류(오늘·탐색 목록·풀리스트·검색 결과)에서 US 종목의 FK 한글 오버라이드 적용 중지** → `cleanUsName` 영문으로 통일(한 리스트 내 한글/영문 혼재 제거).
- FK 한글의 두 역할은 **유지**: ① `/api/search` 별칭 매칭("테슬라"→TSLA — 검색어 매칭에만 사용) ② 종목 상세의 한글 표시/병기(현행 `resolveStockName` 로직 불변).
- 775의 `resolveDisplayName` 공용 함수에 `context: 'list' | 'detail'` 구분(또는 리스트용 함수 분리)으로 구현 — 화면별 재분기 금지.

### 2) 도트 범례 재도입 (탐색)

- 도트 문자열을 쓰는 두 섹션("강점이 많은 종목"·"오늘 거래가 많았던 종목")의 기준 라벨 줄에 범례 병합: `● 강점 ● 주의 ● 보통 · 현재가 · 어제 등락` (도트는 실제 색·11~12px·en 패리티 "Strength/Caution/Neutral" — 기존 렌즈 용어 재사용).
- lens-top 풀리스트(`?list=pos`)·거래 풀리스트(`?list=amount`) 헤더도 동일.

### 3) 종목당 변화 묶기

- 변화 리스트(오늘 화면 섹션·탐색 목록·풀리스트)에서 **같은 심볼의 다중 렌즈 변화를 한 행으로**: 대표 변화(현재 정렬 순 첫 번째) 표시 + 꼬리 `외 1건`(muted·en "+1 more"). 행 탭 → 상세(전 렌즈 확인). API는 그대로 두고 표시층 그룹핑(counts는 변화 건수 기준 유지 — 묶음과 무관).
- 톤 필터와의 상호작용: 필터 적용 후 그룹핑(강점 전환 필터에서 그 종목의 pos 변화가 대표).

### 4) 도트 색 토큰 단일화

- 민트/앰버/그레이 도트 hex가 파일별로 흩어져 있으면(`#2DD4BF`·`#F0B429`·`#6B7280` 등) **단일 소스**(예: `lib/lensTones.ts`의 TONE_COLORS 또는 tailwind 토큰)로 통일하고 전 사용처 교체(grep 전수).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(패리티) · `npm run build`
2. 라이브: ko 미국 풀리스트 — 로빈후드→Robinhood·엑슨모빌→Exxon Mobil(전 행 영문) · 검색 "테슬라"→TSLA 여전히 매칭 · 테슬라 상세는 한글 유지 · 탐색 두 섹션 헤더 범례 · Thermo Fisher 1행+"외 1건" · 도트 hex grep 단일.
3. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ docs/STEP_776_COMMAND.md
   git commit -m "STEP 776: english-only US names in lists (search alias kept), dot legend, per-symbol grouping, tone color tokens"
   git push
   ```

## 완료 보고 → Cowork에게: 검증 결과 + 커밋 해시. (직후 777.)
