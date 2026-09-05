<!-- 2026-07-06 -->
# STEP 601 — AI 렌즈 박스 배지 + "뒤로=시트 복원"(진짜 수정) + 현재가 중복 제거

> **목표(사용자 피드백 반영)**:
> ① AI 렌즈 배지 = **어두운 박스 카드**(로고+흰 글자, 배경까지 눌림) · ② **"— 기법별 전망" 제거**
> ③ 🔴 **모바일 "뒤로" = 왔던 시트로 복원** — 종목 시트 열고 → AI 렌즈 → 종목 페이지 → "뒤로"를 누르면 **홈(맨 보드)이 아니라 그 종목 시트가 다시 열린 상태**로 돌아옴 · ④ 모바일 시트 수익률 카드 **현재가 중복 제거**
> **⚠️ STEP 600은 커밋하지 말 것** — 이 601이 600 브랜딩 + 위 4개를 **한 커밋**으로 통합.
> **전제**: STEP 599(`7e336c5`) 이후.

## ③이 왜 이전엔 "홈으로" 갔었나 (원인)
- **홈(`/`) 자체가 보드 화면**이라, 뒤로 가서 보드로 와도 "홈"과 똑같이 보였음.
- 모바일 **시트는 URL이 아니라 React state**(`selectedStock`)여서, 종목 페이지에 갔다 오면 시트가 **닫힌 맨 보드**만 떴음.
- **수정**: 시트를 열 때 URL에 `?s=심볼`을 history로 한 칸 쌓고(`lib/useSheetSync.ts`), 종목 페이지에서 `router.back()` 하면 그 `?s=심볼`로 돌아와 **마운트 시 시트를 복원**. (단순히 back 라벨만 바꾼 게 아님.)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_601_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (소스 완료 · tsc EXIT=0 확인)
- **신규** `lib/useSheetSync.ts` — 보드 선택(시트) 상태 ↔ URL `?s=심볼` 동기화 훅 + `openSheetUrl`/`closeSheetUrl`.
- 4개 보드(`MarketBoard`·`JpMarketBoard`·`CnMarketBoard`·`UsMarketBoard`) — `useSheetSync` 배선 + 행/카드/배경/드래그 닫기의 `setSelectedStock` → `selectStock`(URL 동기화 래퍼)으로 교체. **행 클릭 = 시트 열기 + history push, 닫기 = history back**.
- `components/AiLensBadge.tsx` — **박스 카드**(bg-unjong-primary·민트 T로고·흰 "AI {렌즈}"). 언어별 렌즈(ko 렌즈·en Lens·ja レンズ·zh 镜头), AI·로고 고정.
- 4개 보드 — 바텀시트 버튼 **"— 기법별 전망" 삭제**(로고+"AI 렌즈"만) · **모바일 시트 수익률 카드의 현재가 행 삭제**.
- `app/stock/[symbol]/page.tsx` — 상단 "← 뒤로" = `router.back()`(히스토리 없으면 홈 폴백) · 헤더 배지 박스.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 1) 🔴 눈검수 — ③은 반드시 "보드에서 출발"하는 실제 흐름으로 (모바일 폭에서)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/sheet_dev.log 2>&1 &) ; sleep 14 ; echo "→ 브라우저를 모바일 폭(개발자도구 반응형·약 390px)으로 확인" ; sleep 1
# 확인 후: pkill -f "next dev"
```
- [ ] **박스 배지(①②)**: `localhost:3333` 종목 행 클릭 → 기간수익률 줄에 **[민트 T로고] AI 렌즈** 가 **어두운 박스**로. 바텀시트 버튼도 **[로고] AI 렌즈**("기법별 전망" 없음). `/stock/NVDA` 헤더 배지도 박스.
- [ ] 🔴 **③ 핵심 흐름 (이 순서 그대로)**:
  1. `localhost:3333` (보드) 열기 → 아무 종목 **탭 → 바텀시트 열림**
  2. 시트 안 **AI 렌즈 클릭 → 종목 페이지**로 이동
  3. **"← 뒤로" 클릭 → 홈(맨 보드)이 아니라 "그 종목 시트가 열린 상태"로 복원**되면 성공.
  - (참고: 주소창에 `/stock/NVDA`를 **직접 쳐서** 들어간 경우엔 돌아갈 시트가 없으니 홈으로 가는 게 정상. 반드시 위 1→2→3 순서로 검수.)
- [ ] **④ 현재가 중복**: 모바일 시트 상단 종목명 옆 현재가는 그대로, **아래 수익률 카드엔 현재가 없음**.
- [ ] **부작용 점검**: 시트 열고 **배경/아래 드래그로 닫기** → 정상으로 닫히고 뒤로 눌러도 이상 없음. 4개국 탭(KR·US·JP·CN) 각각 위 흐름 1회씩.

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add lib/useSheetSync.ts components/AiLensBadge.tsx "components/toolbox/MarketBoard.tsx" "components/toolbox/JpMarketBoard.tsx" "components/toolbox/CnMarketBoard.tsx" "components/toolbox/UsMarketBoard.tsx" "app/stock/[symbol]/page.tsx" docs/STEP_600_COMMAND.md docs/STEP_601_COMMAND.md && git commit -m "feat(brand+nav): AI 렌즈 박스 배지(기법별전망 제거) + 시트 URL 동기화로 종목→뒤로 시 시트 복원 + 모바일 시트 현재가 중복 제거 (STEP 600~601)" && git push
```

## ✅ 완료 시: 브랜딩(박스 배지) + "뒤로=시트 복원"(URL 동기화) + 현재가 중복 제거. 옛 'TRAI' 청산. (국가 확장 AI는 여전히 사용자 승인 후.)
