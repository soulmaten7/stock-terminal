# STEP 785 — 섹션 헤더 모바일 줄바꿈 회귀 수정 (제목/기준라벨 세로 2단 · 전수)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: STEP 784 문서 커밋 `34e6758` 이후 HEAD · 트리 클린

**배경(07-22 · 폰 실물 발견)**: 풀리스트 헤더(`ExploreClient.tsx` 389~395행)가 `flex items-center justify-between`으로 **제목과 기준/범례 라벨이 한 가로줄을 다툼**. 776(범례 추가)+780(제목에 "한국 · " 접두어) 이후 모바일 375px에서 제목이 2줄로 깨짐("한국 · 오늘 거래가 많았던 종/목"). 각각은 옳았으나 조합에서 생긴 회귀 — **같은 패턴을 쓰는 헤더 전수**가 대상.

---

## 수정

### 1) 헤더 레이아웃: 모바일 세로 2단 · 데스크톱 현행 가로

- 대상 컨테이너를 `flex items-center justify-between` → **`flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between`**(모바일=제목 줄 / 라벨 줄, sm+=현행 가로 byte 동일).
- 제목 `<h1>/<h2>`는 모바일에서 한 줄을 온전히 차지 → 줄바꿈 소멸. 라벨(`BasisLabel`·`SelectionBasisLabel`·`DotLegendBasisLabel`)은 아래 줄 **좌측 정렬**(모바일), sm+에선 우측 정렬 현행 유지.
- 라벨 텍스트 자체는 불변(문구·범례 도트·i18n 손대지 말 것).

### 2) 적용 범위 — 전수 (같은 패턴 grep)

- `components/explore/ExploreClient.tsx`: 풀리스트 헤더(389) + 각 섹션 헤더(상태가 바뀐 종목·강점이 많은 종목·오늘 거래가 많았던 종목).
- `components/today/TodayClient.tsx`: 섹션 헤더 전부(내 관심종목·간밤 미국·{시장} 상태가 바뀐 종목).
- 그 외 `justify-between` + 제목 + 라벨 조합이 있는 곳 grep으로 찾아 동일 적용(관심 `/favorites` 등). **AsOfBadge는 제목 옆에 붙어 있는 현행 유지**(제목 줄 안에서 함께 흐름).

### 3) 회귀 방지

- 제목에 `whitespace-nowrap` 같은 강제 금지(긴 종목명·en 제목이 잘림) — **레이아웃으로 해결**.
- sm+ 데스크톱 렌더는 변화 0이어야 함(diff 검토 시 확인).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. **모바일 폭 실측**(375px·414px): `/explore?list=amount&market=KR` 제목 1줄 · 범례 아래 줄 노출 · `list=pos`·`list=changes` 동일 · 탐색 3섹션 · 오늘 3섹션 전부 제목 줄바꿈 0. `/en` 영어 제목(더 긴 문자열)에서도 1줄 확인 — 안 되면 라벨 줄 유지한 채 제목 폰트/줄간 조정 없이 **레이아웃 범위 내**에서 해결.
3. 데스크톱(1280px) 헤더 현행과 동일한지 스팟 확인.
4. 커밋:
   ```bash
   git add app/ components/ docs/STEP_785_COMMAND.md
   git commit -m "STEP 785: stack section header title and basis label on mobile (fix title wrap regression)"
   git push
   ```

## 완료 보고 → Cowork에게: 모바일 폭 검증 결과(어느 폭에서 확인했는지) + 커밋 해시. 최종 판정 = 장은태 폰.
