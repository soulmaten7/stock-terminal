<!-- 2026-07-06 -->
# STEP 602 — 리스트에 'AI 렌즈' 표식 노출 (발견성) · PC 컬럼 + 모바일 펠

> **목표**: "AI 렌즈가 있는지조차 안 보인다"를 해결. 리스트 단계에서 **종목마다 AI 렌즈가 있다는 신호**를 보여준다. 표식은 **이동하지 않음**(신호 전용) — 행/카드를 누르면 지금처럼 펼침·시트가 뜨고 거기 어두운 배지로 이동(STEP 601 흐름 유지).
> **전제**: STEP 601(`121daae`) 이후.

## 무엇을 바꿨나 (Cowork 완료 · tsc EXIT=0)
- **PC 테이블**: `종목명`과 `현재가` 사이에 **'AI 렌즈' 컬럼** 신설. 헤더 = 민트 T로고 + "AI 렌즈"(회색), 각 행 = **민트 렌즈 칩**(민트 틴트 박스 안 T로고). 펼침행·광고행 `colSpan` 5→6로 맞춤.
- **모바일 카드**: 별표 앞에 **민트 "AI 렌즈" 펠**(로고+글자) 추가 → PC처럼 목록에서도 바로 보임.
- 표식은 클릭 핸들러 없음 → 행/카드의 기존 onClick(시트 열기)만 동작. (신호=리스트, 동작='AI 렌즈 보기'=시트/펼침 그대로.)
- 파일: `components/toolbox/{MarketBoard,JpMarketBoard,CnMarketBoard,UsMarketBoard}.tsx` (4개, 미러 동일).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_602_COMMAND.md 파일 내용대로 실행해줘
```

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 1) 🔴 눈검수
```bash
cd ~/stock-terminal && (npm run dev >/tmp/lens_col_dev.log 2>&1 &) ; sleep 14 ; echo "확인 ↓" ; sleep 1
# 확인 후: pkill -f "next dev"
```
- [ ] **PC** `localhost:3333` : 표 헤더에 `# · 종목명 · [로고]AI 렌즈 · 현재가 · 1일전 · ★` **6컬럼**, 각 행 AI 렌즈 자리에 **민트 렌즈 칩**이 정렬돼 보임. 한국·미국·일본·중국 4탭 모두.
- [ ] **PC 정렬 안 깨짐**: 행 클릭 → 펼침(기간수익률) 행이 표 폭 그대로 꽉 참(6컬럼), 10번째 뒤 **광고 문의 행도 폭 안 깨짐**.
- [ ] **모바일 폭(390px)**: 카드마다 별표 앞에 **민트 "AI 렌즈" 펠**이 보이고, 종목명이 잘려도 레이아웃 안 무너짐.
- [ ] **흐름 유지(STEP 601)**: 종목 탭 → 시트 → AI 렌즈 → 종목 페이지 → **뒤로 = 시트 복원** 여전히 정상.

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add "components/toolbox/MarketBoard.tsx" "components/toolbox/JpMarketBoard.tsx" "components/toolbox/CnMarketBoard.tsx" "components/toolbox/UsMarketBoard.tsx" docs/STEP_602_COMMAND.md && git commit -m "feat(discovery): 리스트에 'AI 렌즈' 표식 노출 — PC 전용 컬럼 + 모바일 카드 펠 (신호 전용, 이동은 시트) (STEP 602)" && git push
```

## ✅ 완료 시: 리스트만 훑어도 'AI 렌즈 있다'가 읽힘 (PC 컬럼 + 모바일 펠). 발견성 확보.
