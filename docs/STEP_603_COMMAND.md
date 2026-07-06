<!-- 2026-07-06 -->
# STEP 603 — 'AI 렌즈' 표식 위치 통일 (현재가 ↔ 1일전 사이) · 모바일도 동일

> **목표(사용자 피드백)**: AI 렌즈 표식을 **현재가와 1일전(등락률) 사이**로 통일. PC·모바일 위치를 똑같이 맞춤.
> - **PC**: AI 렌즈 컬럼을 `종목명↔현재가` → **`현재가↔1일전 사이`**로 이동.
> - **모바일 = PC와 동일 구조**: 상단 정렬 바(현재가 ↔ 1일전 사이)에 **"[로고] AI 렌즈" 라벨 한 번**(헤더 역할) + **각 카드 행엔 아이콘만**(가격과 등락률 사이, 글자 없음).
> - 표식은 여전히 **신호 전용**(이동 안 함) — 행/카드 탭 → 시트 → 'AI 렌즈 보기'로 이동(STEP 601 흐름 유지).
> **STEP 602의 위치를 대체**(602 커밋 여부와 무관하게 이 커밋이 현재 상태 반영). **전제**: STEP 601(`121daae`) 이후.

## 무엇을 바꿨나 (Cowork 완료 · tsc EXIT=0)
- 4개 보드 헤더 컬럼 순서: `# · 종목명 · 현재가 · [로고]AI 렌즈 · 1일전 · ★` (AI 렌즈가 현재가 뒤·1일전 앞).
- 4개 보드 행: 현재가 셀과 등락률 셀 **사이**에 민트 렌즈 칩.
- 모바일 상단 정렬 바: `종목명 · 현재가 ··· [로고]AI 렌즈 ··· 1일전▾` — 라벨을 **중앙 정렬**해서 카드 아이콘 열 바로 위에 오게. 각 카드 2번째 줄: `가격  [로고]  등락률` (아이콘만, 글자 없음).
- 파일: `components/toolbox/{MarketBoard,JpMarketBoard,CnMarketBoard,UsMarketBoard}.tsx`.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_603_COMMAND.md 파일 내용대로 실행해줘
```

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 1) 🔴 눈검수
```bash
cd ~/stock-terminal && (npm run dev >/tmp/lens_pos_dev.log 2>&1 &) ; sleep 14 ; echo "확인 ↓" ; sleep 1
# 확인 후: pkill -f "next dev"
```
- [ ] **PC** `localhost:3333` : 헤더가 `# · 종목명 · 현재가 · [로고]AI 렌즈 · 1일전 · ★` 순서. 각 행에서 렌즈 칩이 **현재가(달러)와 등락률 사이**에 세로로 정렬돼 보임. 4탭(한국·미국·일본·중국) 모두.
- [ ] **PC 정렬 안 깨짐**: 행 클릭 → 펼침(기간수익률) 행·광고 문의 행이 표 폭 그대로(6컬럼) 안 깨짐.
- [ ] **모바일 폭(390px)**: 상단 정렬 바의 **"[로고] AI 렌즈" 라벨이 카드 아이콘 열 바로 위(중앙)**에 오는지. 각 카드 2번째 줄엔 **로고 아이콘만**(글자 없음). → 라벨↔아이콘 세로 정렬 확인.
- [ ] **흐름 유지(STEP 601)**: 종목 탭 → 시트 → AI 렌즈 → 종목 페이지 → **뒤로 = 시트 복원** 정상.

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add "components/toolbox/MarketBoard.tsx" "components/toolbox/JpMarketBoard.tsx" "components/toolbox/CnMarketBoard.tsx" "components/toolbox/UsMarketBoard.tsx" docs/STEP_602_COMMAND.md docs/STEP_603_COMMAND.md && git commit -m "feat(discovery): 'AI 렌즈' 표식 현재가↔1일전 사이로 통일 — PC/모바일 모두 헤더 라벨 1회 + 행 아이콘만 (STEP 602~603)" && git push
```

## ✅ 완료 시: PC·모바일 모두 현재가와 1일전 사이에 렌즈 표식 — 위치 일치. 발견성 확보.
