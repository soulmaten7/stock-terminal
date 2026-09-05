# STEP 767a — 탐색 재정의: 검색 + 렌즈 목록 (/explore · 목업 승인판)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet — 막히면 🔴 Opus 재실행 허용)

**전제 상태**: 코드 HEAD `82d3416`(STEP 766) · 트리 클린

**결정(07-21 · 장은태)**: 필드 = **오늘·탐색·종목상세·관심·마이 5면뿐**. 탐색 = 터미널이 아니라 **렌즈의 입구**(검색 + 렌즈 목록 3종). 이 STEP은 **신규 `/explore` 구축만** — 기존 `/` 보드·내비 연결은 767b(전환·파킹)에서. 접근은 URL 직접(검수용).

---

## §1. 신규 API 2개

### 1) `/api/search?q=` — 전 종목 검색(6개국)

- 서버 인메모리 인덱스(모듈 캐시·`lib/stockName.ts`와 같은 소스): KR=`kr_stock_snapshot`(name·name_en·symbol — 서버 기동 시 1회 로드+1h 갱신) + US/JP/CN/VN/GB=시드 JSON(name·en(있으면)·sym) + `foreign_ko_names` 한글.
- 매칭: 대소문자 무시 부분일치(name·en·한글·티커) · **정렬: 접두 일치 > 포함, 거래대금/시총 큰 시장(KR·US) 우선** · **최대 8건**(모바일 표준).
- 응답: `{items:[{symbol, name(로케일 규칙: ko=한글/FK·en=en), country, type(stock|etf)}]}` · 5분 캐시.

### 2) `/api/explore/lens-top?market=KR|US&sort=pos|warn` — 렌즈 정렬 목록

- `lens_scores`(해당 market) → `tonesFor`(기존 lib/lensTones)로 pos/warn/flat 카운트 → `sort=pos`: pos 내림차순(동률=거래대금) · `sort=warn`: warn 내림차순 · limit(기본 10·최대 50).
- 가격·등락은 `kr_stock_snapshot`/`us_stock_perf`에서 심볼 배치 조인(1,000 청크 규칙). 응답 행: symbol·name(로케일)·tones·price·changePercent.

## §2. 페이지 — `app/[locale]/explore/page.tsx` (+`components/explore/`)

`force-dynamic`. 모바일 1열 / PC 중앙 `max-w-[680px]`(단일 컬럼 — 검색 페이지 문법). 하단 탭바는 전역이라 자동.

### 상단 — 검색 (주인공)

- 큰 검색창(높이 ≥52px·15px+ 플레이스홀더 "종목명·티커로 검색") — **탭하면 인풋 포커스, 300ms 디바운스**로 `/api/search` 호출, 결과 ≤8건을 **인풋 바로 아래 리스트로**(로고·이름·국가 플래그·type 배지). 행 탭 → **종목 상세로 이동**. Escape/바깥 탭/X = 닫기. 데스크톱 키보드 ↑↓·Enter 지원. 결과 0건 = "검색 결과가 없어요" 한 줄. IME(한글 조합) 안전: `compositionend` 고려 또는 value 기반 디바운스만.

### 국가 토글 — [한국 | 미국] 2개만

- 렌즈 선계산 보유 시장만(설계 결정 — JP 등은 검색으로 상세 접근). 선택은 localStorage 유지 · 초기값 ko=한국/en=미국. 토글 시 아래 목록 3종 전부 전환. 칩 스펙은 763 통일 스펙 재사용.

### 목록 3종 (각 5행 + "더 보기 →")

1. **오늘 상태가 바뀐 종목** — `/api/today/changes?market=`(기존) 상위 5 — 행: 로고·이름·`● {렌즈} {from}→{to}`(도트=to_tone)·등락%. 헤더 우측 "N건 →".
2. **강점이 많은 종목** — `lens-top?sort=pos` 5행 — 행: 로고·이름·도트 문자열·등락%.
3. **오늘 거래가 많았던 종목** — 기존 `krx/ranking`/`us-list` 상위 5(lens 도트 포함·이미 응답에 있음).
- 행 탭 → 종목 상세. **별(관심 토글) 각 행 우측**(기존 watchlist API·보드 패턴 재사용). 각주(기존 키) 맨 아래.

### "더 보기" 전체 리스트 — 같은 페이지 내 뷰 전환(깊이 규칙 ≤3)

- `/explore?list=changes|pos|amount`(쿼리 기반) → 해당 목록의 **풀 리스트 화면**(제목+뒤로(←)+최대 50행·같은 행 포맷). 뒤로 = 탐색 메인(쿼리 제거·스크롤 복원은 브라우저 기본). 새 라우트 파일 없이 한 페이지에서 상태 전환(공유 컴포넌트).

### 상태·엣지

- changes 주말 폴백 = 764 date 응답 사용 · "{요일} 기준" 배지(765b 패턴 재사용).
- 각 목록 로딩 스켈레톤·실패 시 섹션 숨김(빈 화면 금지 — 나머지 섹션은 정상 표시).
- i18n 전 문구 ko/en(패리티). 미국 목록의 종목명 = 765b의 축약 규칙 재사용(`lib/usNameFormat.ts`).

## §3. 검증

1. `npx tsc --noEmit` 0 · `npm run test`(패리티) · `npm run build`
2. 로컬: `/explore` — 검색("삼성"→삼성전자군·"NVDA"→엔비디아·"극양"/JP 티커도 상세 진입) · 국가 토글로 3목록 전환 · 더 보기 → 풀 리스트 → 뒤로 · 별 토글 · `/en`(미국 디폴트·영어) · 모바일 뷰 스켈레톤/키보드.
3. 라이브(배포 후): `/api/search?q=sam` · `/api/explore/lens-top?market=US&sort=pos` 200 실데이터 · `/explore` 3목록 실데이터 — Cowork 크롬+사용자 폰.
4. 커밋:
   ```bash
   git add app/ components/explore/ lib/ messages/ docs/STEP_767A_COMMAND.md
   git commit -m "STEP 767a: /explore - search-first lens gateway (global search API, lens-top lists, full-list views)"
   git push
   ```

## 완료 보고 → Cowork에게
- tsc/vitest/build · 검색 샘플 결과 · 3목록 실데이터 여부 · 커밋 해시. (767b 전환·파킹은 사용자 검수 후.)
