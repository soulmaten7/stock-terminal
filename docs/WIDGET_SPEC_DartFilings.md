# WIDGET_SPEC: DartFilings (DART 공시 피드)

> **최종 업데이트**: 2026-04-22
> **우선순위**: P0 (위젯) / P0 (페이지)
> **위치**: `components/widgets/DartFilingsWidget.tsx` (홈) · `app/disclosures/page.tsx` (전체 페이지)

---

## 1. 레퍼런스 벤치마크

### 주 레퍼런스 — DART 전자공시시스템 (opendart.fss.or.kr)
- 최신공시 테이블: 시간 · 공시대상회사 · 보고서명 · 제출인 · 접수일자
- 공시유형 필터: 정기 / 주요사항 / 발행 / 지분 / 기타법인 / 외부감사 / 펀드 / 자산유동화 / 거래소공시
- 시장별 필터: 전체 / 코스피 / 코스닥 / 코넥스
- "긴급공시" 배지 (주요사항보고서 등)

### 보조 레퍼런스 — 네이버증권 공시탭
- 종목별 공시는 기업명 굵게, 공시명 아래 줄, 우측에 유형 뱃지
- 시간은 왼쪽 회색 작게
- 중요도 시각화: 붉은 점 또는 "중요" 태그

### 보조 레퍼런스 — 키움 영웅문 공시창
- 기업코드 + 기업명 + 공시명 한 줄 요약
- 공시유형별 색상 코드화

---

## 2. 현재 상태 (STEP 54 기준)

### 홈 위젯 — 작동 중
- `/api/dart?endpoint=list&page_count=20` 호출 → 15개 표시 ✅
- 공시유형 자체 분류 (주요사항/정기공시/지분공시/감사보고/공시) ✅
- 유형별 색상 뱃지 (주황/티얼/보라/파랑/회색) ✅
- `fmtTime(rcept_dt)` → "04/20" 포맷 ✅
- `inline` / `size` props 지원 ✅
- **문제점**:
  - API의 `is_important` 플래그를 **쓰지 않고** 위젯에서 자체 regex로 재분류 (중복)
  - "중요 공시만" 필터 없음
  - `href="/disclosures"` 고정 — 필터 상태 전달 안 됨

### `/disclosures` 페이지 — **테마 부정합 (다크 → 화이트/티얼 마이그레이션 필요)**
- 기능: 검색(기업명·종목코드·공시제목) + 날짜 선택 + 50건 테이블 ✅
- **문제점**:
  - 색상이 여전히 **구 다크 테마** (`bg-dark-700`, `text-text-secondary`, `border-border`, `text-accent`)
  - 프로젝트 전역은 화이트/티얼 테마로 이동 완료 (Chart·Watchlist·OrderBook 페이지 참고)
  - 공시유형 뱃지 없음 (위젯의 분류 로직을 페이지가 재사용 못 함)
  - `is_important` 플래그 시각화 없음
  - 시장구분 (KOSPI/KOSDAQ/KONEX) 필터 없음
  - "중요만" 토글 없음
  - URL `?symbol=`, `?important=`, `?corp_cls=` 같은 파라미터 미지원

---

## 3. Phase A — STEP 55 범위 (즉시 실행)

### 3-1. DartFilingsWidget 개선

**(a) `is_important` 활용**
- API가 돌려주는 `is_important: boolean`을 그대로 사용 (자체 regex 재분류는 유형 분류용으로만 유지)
- 중요 공시 행: 좌측 3px 붉은 보더(`border-l-2 border-[#FF3B30]`) + 우상단 "중요" 뱃지 추가

**(b) 중요 공시만 토글**
- 위젯 헤더 action 슬롯에 작은 토글: `전체 | 중요` (2개 칩)
- 선택 상태 유지 (useState)
- 필터링은 클라이언트 사이드 (이미 받은 15개 중 `is_important=true`만)

**(c) href 동적화**
- `href="/disclosures"` → `href={onlyImportant ? '/disclosures?important=1' : '/disclosures'}`

### 3-2. `/disclosures` 페이지 리팩토링

**(a) 파일 구조 — 다른 P0 페이지와 동일 패턴**
- `components/disclosures/DisclosuresPageClient.tsx` 새로 생성
- `app/disclosures/page.tsx` 는 Suspense 래퍼로 전환 (단 12줄)

**(b) 화이트/티얼 테마 마이그레이션**
- 모든 다크 색상 → 화이트/티얼로 치환:
  - `bg-dark-700` / `bg-dark-800` / `bg-dark-600` → `bg-white` / `bg-[#FAFAFA]`
  - `text-text-secondary` → `text-[#666]` 또는 `text-[#888]`
  - `text-text-primary` → `text-black`
  - `border-border` → `border-[#E5E7EB]`
  - `text-accent` → `text-[#0ABAB5]`
- 배경은 페이지 전체 흰색 (OrderBook 페이지 참고)

**(c) URL 파라미터 지원**
- `?symbol=005930` — 해당 종목 공시만 필터 (선택적)
- `?important=1` — 중요 공시만
- `?corp_cls=Y` — 시장구분 (Y=KOSPI, K=KOSDAQ, N=KONEX)
- 초기 로드시 URL param 읽어서 상태 초기화

**(d) 컨트롤 바 추가**
- 검색 박스 (기존 유지)
- 날짜 피커 (기존 유지)
- 시장구분 세그먼트: `전체 | KOSPI | KOSDAQ | KONEX` (4개 칩)
- 중요 토글: `전체 | 중요만` (2개 칩)

**(e) 테이블 컬럼 재구성**
- `접수일 | 종목코드 | 기업명 | 유형 | 공시 제목 | 제출인 | 원문`
- **신규 "유형" 컬럼**: 위젯의 TYPE_COLOR 맵 공용으로 분리하여 재사용 (`lib/dart-classify.ts`)
- 중요 공시 행: 기업명 옆에 "중요" 뱃지(붉은 배경)

**(f) 시장구분 API 연동**
- API는 이미 `corp_cls` 파라미터 지원 중 (route.ts 29행)
- `/api/dart?endpoint=list&bgn_de=YYYYMMDD&page_count=50&corp_cls=Y`

### 3-3. 공용 모듈 추출
- `lib/dart-classify.ts` 신규:
  - `classifyType(reportNm: string): string`
  - `TYPE_COLOR: Record<string, string>`
- 위젯과 페이지 모두 import → 로직 중복 제거

### 3-4. Phase A 제외 (의도적)
- 종목별 공시 상세 페이지 (`/disclosures/[rcept_no]`): Phase B
- 공시유형 다중 선택 필터 (정기+주요사항 동시): Phase B
- DART 원문 PDF 인앱 뷰어: Phase C
- 푸시 알림 (새 중요 공시): Phase C

---

## 4. Phase B — 향후 (STEP 70+ 추정)

1. **공시 상세 뷰** — `/disclosures/[rcept_no]` 페이지
   - rcept_no 별 보고서 메타정보 + 원문 링크
   - 관련 종목 시세 + 차트 썸네일
2. **유형 다중 필터** — 체크박스 그룹 (정기+주요사항+지분 동시)
3. **즐겨찾기 기업 공시만 필터** — Supabase watchlist 연동
4. **정기공시 제출 마감일 캘린더** — /calendar 페이지와 교차

## 5. Phase C — 장기

1. DART 푸시 알림 (신규 중요 공시 발생 시)
2. 공시 AI 요약 (Claude API로 보고서 3줄 요약)
3. 공시 영향도 스코어 (주가 반응 예측)
4. 내부자거래/자사주 매매 상세 분석 대시보드

---

## 6. STEP 55 성공 기준

- [ ] DartFilingsWidget: 중요 공시 붉은 보더 + "중요" 뱃지 표시
- [ ] DartFilingsWidget: 전체/중요 토글 동작 (클라이언트 사이드 필터)
- [ ] DartFilingsWidget: 토글 상태에 따라 href 동적 변경
- [ ] `lib/dart-classify.ts` 추출 — 위젯·페이지 공용
- [ ] `components/disclosures/DisclosuresPageClient.tsx` 신규 생성
- [ ] `app/disclosures/page.tsx` Suspense 래퍼로 전환
- [ ] /disclosures 페이지 화이트/티얼 테마 마이그레이션 완료
- [ ] /disclosures 페이지 URL 파라미터 (`?important=1`, `?corp_cls=Y`) 동작
- [ ] /disclosures 페이지 시장구분 세그먼트 + 중요 토글 표시
- [ ] 테이블에 "유형" 컬럼 추가, 색상 뱃지 표시
- [ ] 빌드 통과 (`npm run build` 0 에러)
