# STEP 775 — 변화 풀리스트: 기준 라벨 + 톤 필터 칩 + 이름 일원화 (목업 승인판)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)
**⚠️ STEP 774(섹션명 동적화·거래대금 가시화)가 아직 안 돌았으면 774 먼저 실행 후 이어서.**

**전제 상태**: STEP 774 커밋 이후 HEAD · 트리 클린

**결정(07-21 · 목업 승인)**: 탐색 풀리스트(`/explore?list=changes`)에 ① 정렬 근거 명시 ② **톤 필터 칩**(정렬 토글 아님 — 터미널 문법 금지 유지) ③ 종목명 표시 일원화.

---

## 수정

### 1) 풀리스트 헤더 기준 라벨

- 헤더 우측 라벨을 "**거래대금 순 · 현재가 · 어제 등락**"으로(오늘 화면 772 라벨과 동일 키 재사용 — en "By value traded · Price · 1d change").

### 2) 톤 필터 칩 3개 (변화 풀리스트 전용)

- `[전체 N] [● 강점 전환 N] [● 주의 전환 N]` — 칩에 색 도트+건수. 763 통일 칩 스펙(44px·rounded-xl·활성 bg-strong).
- 필터 = `to_tone` 기준(pos/warn). "보통 전환"(flat)은 전체에만 포함(별도 칩 없음 — 승인안). 필터 내 순서는 거래대금 유지.
- 클라 필터로 충분(이미 최대 50행 로드 — 단, 건수 N은 **전체 모수 기준**이어야 하므로 changes API 응답에 tone별 카운트 추가(`counts: {total, pos, warn}`) — 서버에서 집계).
- i18n ko/en 패리티("강점 전환/주의 전환" · en "To strength / To caution" — 기존 렌즈 용어와 톤 일치 확인 후 채택).

### 3) 종목명 표시 일원화 + 꼬리 정리

- 풀리스트(및 탐색 목록·오늘 화면)가 **같은 이름 해석 경로**를 쓰게: `foreign_ko_names` 한글 오버라이드(ko) → `cleanUsName`/`pickKrName` — 현재 화면마다 갈라진 경로를 공용 함수 하나로(중복 제거). 알리바바=한글·IBM=축약이 모든 화면에서 동일해야 함.
- `cleanUsName` 결과의 **꼬리 잔여물 트림**: 끝의 `-`·`·`·쉼표 등 제거("Warner Bros. Discovery, Inc. -" → "Warner Bros. Discovery, Inc."). 유닛 테스트 1개 추가(기존 usNameFormat 테스트 파일 있으면 거기).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(패리티+트림 테스트) · `npm run build`
2. 라이브: `/explore?list=changes&market=US` — 기준 라벨·칩 3개(건수 = API counts와 일치)·강점 전환 탭 시 pos만·알리바바 한글·꼬리 대시 소멸. KR 리스트도 동일. `/en` 영어 확인.
3. 오늘 화면·탐색 목록의 이름이 풀리스트와 동일한지(일원화 증거) 스팟 대조.
4. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ docs/STEP_775_COMMAND.md
   git commit -m "STEP 775: changes full-list - basis label, tone filter chips with counts, unified name resolution"
   git push
   ```

## 완료 보고 → Cowork에게
- tsc/vitest/build · counts 샘플 · 커밋 해시.
