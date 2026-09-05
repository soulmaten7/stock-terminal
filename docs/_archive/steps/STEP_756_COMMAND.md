# STEP 756 — KR 보드 렌즈 도트: 행에 렌즈 요약 노출 + 안내 한 줄 (직관성 개선)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: 코드 HEAD `8848cab` · 트리 클린

**배경(사용자 UX 결정 · 07-18 목업 합의)**: 보드 행이 "그냥 시세 리스트"로 보여 탭하면 렌즈가 나온다는 신호가 없음(어포던스 부재). 합의된 최종안:
- **행마다 렌즈 도트+카운트 노출**(내용이 곧 신호 — 아이콘/CTA 반복 안 함)
- **모바일 예시 카드(`BoardTopLensCard`) 제거** → 대신 **안내 한 줄**("종목을 누르면 TR-AI 렌즈가 보입니다 · 사고팔 신호 아님")
- **PC는 종목명/현재가 사이 렌즈 컬럼** 추가·우측 미리보기 레일(`LensPreview`) 유지
- 선계산 밖 종목은 도트 자리 "—"(정직한 결측)
- **KR만 먼저** → 라이브 검증 → 6개국 미러·후속

**🔑 결정론 일관성**: 톤(강점/주의/보통) 계산은 **`/api/watchlist/quotes`(②b-2·`95d4d9f`)의 state→tone 매핑과 반드시 동일**해야 함(행 도트 ≠ 상세 렌즈면 신뢰 붕괴). 그 로직을 복붙하지 말고 **공용 헬퍼로 추출해 양쪽이 같은 함수를 쓰게** 할 것.

---

## 수정 1 — 톤 로직 공용화: 신규 `lib/lensTones.ts`

`app/api/watchlist/quotes/route.ts`에 있는 lens_scores 배치 조회 + state→tone 카운트 로직을 읽고, 순수 함수로 추출:
- `tonesFor(rows: LensScoreRow[]): { pos: number; warn: number; flat: number }` (기존 매핑 그대로 — fscore ≥7/≤3 규칙 포함)
- watchlist/quotes가 이 헬퍼를 import하도록 교체(동작 byte 동일 — 응답 diff 0 확인)

## 수정 2 — `app/api/krx/ranking/route.ts` (톤 배치 포함)

- 응답으로 나가는 종목들(현재 페이지 슬라이스)의 심볼로 `lens_scores`를 `.eq("market","KR").in("symbol", [...])` 배치 1콜 조회 → `tonesFor`로 각 종목 `lens: {pos, warn, flat} | null` 필드 추가(선계산 없으면 null).
- 기존 필드·정렬·캐시 동작 불변. 추가 쿼리 1회뿐(무거운 계산 없음).

## 수정 3 — `components/toolbox/MarketBoard.tsx` (KR 보드만)

**(a) 모바일 안내 한 줄** — 리스트 상단(검색/서브탭 아래·모바일 분기)에:
```
[손가락 아이콘] 종목을 누르면 TR-AI 렌즈가 보입니다 · 사고팔 신호 아님
```
- 민트(`unjong-accent` 계열 기존 토큰) 13px + 각주 11px muted. i18n 키로(`messages/ko.json`+`en.json` 동시 추가 — **패리티 테스트가 en 누락 시 실패함**):
  - ko: `"board.lensHint": "종목을 누르면 TR-AI 렌즈가 보입니다"` · `"board.lensHintNote": "사고팔 신호 아님"`
  - en: `"board.lensHint": "Tap a stock to open its TR-AI Lens"` · `"board.lensHintNote": "Not a buy or sell signal"`

**(b) 모바일 행 3줄화** — 기존 2줄(종목명 / 현재가+수익률) 사이에 도트 줄:
```
{pos개 민트 ●}{warn개 앰버 ●}{flat개 회색 ●}  강점 {pos} · 주의 {warn}
```
- 색은 **`WatchlistClient`가 쓰는 기존 톤 색상과 동일 토큰/클래스 재사용**(새 색 정의 금지). 12px·muted 계열.
- `lens === null`이면 `—` (muted) 한 글자만.
- "강점/주의" 라벨도 관심목록의 기존 i18n 키 재사용(있으면) — 없으면 위 패턴으로 추가.

**(c) 모바일 예시 카드 제거** — `MarketBoard` 내 `BoardTopLensCard` 렌더 제거(KR만). **컴포넌트 파일은 삭제 금지**(US·JP·CN·VN·GB 보드가 아직 사용 — 미러 STEP에서 정리).

**(d) 데스크톱 렌즈 컬럼** — 테이블 종목명과 현재가 사이에 "TR-AI 렌즈" 컬럼(i18n 키 `board.lensCol` — ko "TR-AI 렌즈"·en "TR-AI Lens"):
- 도트 + `강점 N · 주의 N · 보통 N`(데스크톱은 보통까지) 12px. null → `—`.
- 우측 `aside`(LensPreview·거래 상위 폴백)는 **불변**.

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(메시지 패리티 포함) · `npm run build`
2. 로컬(클린 재시작 — API 라우트 변경이라 `pkill -f "next dev"; rm -rf .next && npm run dev`):
   - `curl -s "localhost:3333/api/krx/ranking?market=all&limit=5"` → 각 항목에 `lens` 필드(상위 종목은 값·있으면 정수 카운트)
   - **결정론 대조**: 삼성전자(005930)의 `lens` 카운트가 관심목록/종목상세 렌즈 헤더와 **정확히 일치**해야 함(강점2·주의2·보통3이 최근 실측 — 단 값은 매일 갱신되므로 "당일 관심목록과 일치"가 기준이지 이 숫자 고정 아님)
   - 브라우저: 모바일 뷰(devtools) — 안내 한 줄·행 도트·예시 카드 없음 / 데스크톱 — 렌즈 컬럼 + 우측 레일 유지 / `/en` — 힌트·컬럼 영어
3. `git diff`로 watchlist/quotes 응답 로직 동작 불변 확인(헬퍼 추출만)

## 커밋

```bash
git add lib/lensTones.ts app/api/krx/ranking/route.ts app/api/watchlist/quotes/route.ts components/toolbox/MarketBoard.tsx messages/ko.json messages/en.json docs/STEP_756_COMMAND.md
git commit -m "STEP 756: lens dots on KR board rows + tap hint line (affordance), shared tone helper"
git push
```

## 완료 보고 → Cowork에게
- tsc/vitest/build · ranking API 샘플 JSON(lens 필드) · 삼성전자 카운트(관심목록 대조값 포함) · 커밋 해시. 라이브 화면 검증은 배포 후 Cowork+사용자.
