# STEP 757 — 렌즈 도트 6개국 미러 (US~GB 보드 + 리스트 라우트 배선)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet — 미러 작업)

**전제 상태**: 코드 HEAD `746efe0`(STEP 756b) · 트리 클린

**목표**: STEP 756/756b(KR)의 확정 패턴을 나머지 5개국 보드에 동일 적용. TR-AI 도트는 전 국가 디폴트(사용자 확정).
- **US = 도트 즉시 작동**(`lens_scores` US ~1,029 선계산 보유).
- **JP/CN/VN/GB = 배선만**(선계산 없음 → 도트 빈 상태·안내 줄+범례+탭 렌즈는 작동). 선계산 확장 시 코드 수정 없이 자동 점등. ⚠️ 가짜 도트 금지 — 없는 데이터는 빈 게 정직(§0 원칙).

---

## 수정 1 — 리스트 라우트 5개에 톤 조인 (`lib/lensTones.ts` 재사용)

`app/api/yahoo/{us,jp,cn,vn,gb}-list/route.ts` 각각에 STEP 756의 `krx/ranking` 패턴 미러:
- 응답 슬라이스의 심볼로 `lens_scores`를 `.eq("market", <'US'|'JP'|'CN'|'VN'|'GB'>).in("symbol", [...])` 배치 1콜 → `tonesFor()` → 항목별 `lens: {pos,warn,flat} | null`.
- **심볼 포맷 주의**: `lens_scores.symbol`의 US 포맷(플레인 티커 "MU"인지)과 각 리스트 응답 심볼 포맷을 **실제 DB로 대조 후** 매칭(불일치 시 접미 정규화). JP/CN/VN/GB는 현재 행이 없어 빈 결과 → null(무비용) — 그래도 market 코드는 정확히.
- 기존 필드·정렬·캐시 불변.

## 수정 2 — 보드 컴포넌트 5개 미러 (`components/toolbox/{Us,Jp,Cn,Vn,Gb}MarketBoard.tsx`)

`MarketBoard.tsx`(756b 확정형)를 기준으로 각 보드에 동일 적용:
- (a) 모바일 안내 2줄(힌트+범례) — 기존 i18n 키(`Board.lensHint`·범례 키) 그대로 재사용(신규 키 금지·en 자동).
- (b) 모바일 행: 종목명 옆 인라인 도트(2줄 유지·null=무표시).
- (c) 데스크톱: "TR-AI 렌즈" 도트-only 컬럼(92px·null=`—`).
- (d) `BoardTopLensCard` 렌더 제거(5개 보드 전부). **이 STEP 후 사용처 0이면 컴포넌트 파일도 삭제**(grep로 확인 후).
- (e) 데스크톱 우측 `LensPreview` aside(범례 포함)는 각 보드 기존 그대로.
- CN 보드의 `.cur` 통화 등 각 보드 고유 로직 불변(744/745 때처럼 미러는 "패턴만").

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. 로컬: `curl -s "localhost:3333/api/yahoo/us-list?limit=5"` → 상위 US 종목 `lens` 값 존재(NVDA·MU 등 선계산권). jp/cn/vn/gb-list → `lens: null` 정상.
3. 브라우저: US 보드 — 데스크톱 컬럼 도트·모바일 이름 옆 도트·안내 줄 / JP 보드 — 안내 줄+범례 뜨고 도트는 빈 상태·레이아웃 안 깨짐 / `/en` 영어.
4. 커밋·푸시:
   ```bash
   git add app/api/yahoo/ components/toolbox/ docs/STEP_757_COMMAND.md
   git commit -m "STEP 757: mirror lens dots to all country boards (US live, others wired for future precompute)"
   git push
   ```

## 완료 보고 → Cowork에게
- us-list 샘플 lens 값 · jp-list null 확인 · BoardTopLensCard 삭제 여부 · 커밋 해시.
