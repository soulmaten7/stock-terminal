# STEP 771 — 리스트 단일 탭 타깃 + 종목 상세 관심 별 + 오늘 홈 서버 프리페치

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: 코드 HEAD `d49ec49`(STEP 770) · 트리 클린

**결정(07-21 · 목업 승인)**: ① 모바일 리스트 행 = 단일 탭 타깃(별 제거 — Robinhood/토스 문법) ② 관심 추가는 종목 상세의 **아이콘 전용 별 토글**로 이동 ③ 오늘 홈은 서버 프리페치로 즉시 페인트(스피너 소멸).

---

## 수정

### 1) 모바일 리스트 별 제거 (오늘 · 탐색 목록/풀리스트 · 검색 결과 행)

- 행 우측 별 버튼을 **모바일에서 제거**(`hidden sm:...`로 PC hover 문화는 유지). 행 전체 = 상세 진입 단일 타깃.
- ⚠️ **회귀 금지(검증 항목)**: 770에서 배포된 것들 전부 불변 — 섹션 헤더 우측 기준 라벨("현재가 · 어제 등락")·행 현재가+등락 2줄·모바일 풀블리드·KR 한글 종목명·상태 문구 폭.

### 2) 종목 상세 관심 별 (StockLensClient · EtfLensClient)

- 헤더(이름·현재가 영역) 우측에 **아이콘 전용 별 토글**:
  - 미등록 = 빈 별(outline) `#9CA3AF` · 등록 = **채운 별 `#2DD4BF`**
  - 아이콘 24px · 터치 영역 44×44px · 토글 시 scale 마이크로 애니메이션(예: active:scale-90→복귀 or keyframe 1→1.2→1)
  - `aria-label` 토글 상태별("관심 등록"/"관심 해제" · en 패리티) · 라벨 텍스트 없음
  - 기존 watchlist API·비로그인 처리(로그인 유도) 재사용 — 이미 상세에 별이 있으면 이 스펙으로 교체.

### 3) 오늘 홈 서버 프리페치 (즉시 페인트)

- `app/[locale]/page.tsx`(서버)에서 **KR/US 변화 + 지수**를 병렬 조회해 `TodayClient`에 `initialData` props로 전달 → 첫 HTML에 콘텐츠 포함.
  - 내부 API HTTP 왕복 금지 — 서버에서 lib/DB 직접(changes 조회 로직·5분 캐시 모듈을 서버에서 재사용 가능하게 추출).
  - 관심(watchlist) 섹션만 클라 fetch 유지(세션 필요). `force-dynamic` 유지.
  - 클라는 initialData 있으면 스켈레톤 없이 즉시 렌더(재fetch 불필요·필요 시 백그라운드 갱신만).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(패리티 — aria 라벨 키 추가 시) · `npm run build`
2. **SSR 실측**: `curl -s localhost:3333/ | grep` 으로 첫 HTML에 변화 종목명·지수 수치가 포함되는지(이번엔 잡혀야 정상 — 770 때 스피너만 잡히던 것과 대조).
3. 회귀 확인(1번 ⚠️ 목록) + 상세 별 토글 동작(등록→채움·해제→빈 별) + PC 리스트 별 유지.
4. 커밋:
   ```bash
   git add app/ components/ messages/ docs/STEP_771_COMMAND.md
   git commit -m "STEP 771: single-tap list rows, icon-only watch star on detail, server-prefetched Today home"
   git push
   ```

## 완료 보고 → Cowork에게
- tsc/vitest/build · SSR grep 결과(콘텐츠 포함 증거) · 회귀 확인 · 커밋 해시.
