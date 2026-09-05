<!-- 2026-07-03 -->
# STEP 564 — 렌즈 카드 시각 계층 개선 (카드 띄우기·큰 화살표·서랍 배경)

> STEP 562 편의성에 대한 눈검수 피드백: ①펼침 화살표가 너무 작아 직관성↓ ②모든 선·색이 균일해 카드 경계가 안 잡힘. → 세계최고 디자이너 관점 = 선을 더 긋지 말고 **여백·배경·테두리 대비**로 경계 만들기.
> Cowork이 `app/stock/[symbol]/page.tsx` 수정 완료(tsc EXIT=0). Claude Code는 **빌드 + 재시작 + 눈검수 + 커밋**.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_564_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (Cowork이 이미 수정)
- **카드 띄우기**: `rounded-2xl` + `shadow-sm` + 카드 간격 `space-y-4` → 각 카드가 독립 물체로 분리.
- **큰 원형 화살표**: 32px(`h-8 w-8`) 원형 테두리 안에 18px SVG chevron, 펼치면 `rotate-180`(아래→위). "누르면 열림" 명확.
- **펼친 상세 = 서랍 배경**: 펼침 영역만 `bg-unjong-background/50` → 색으로 구분(선 남발 X).
- **판정 문장 16px**(`text-base`) + 근거 수치를 헤더 좌측에 묶음(전체 헤더가 토글). F-Score 카드도 동일(점수도 좌측 근거로).

## 0) 확인
```bash
cd ~/stock-terminal && grep -c "rounded-2xl\|shadow-sm\|rotate-180" app/stock/\[symbol\]/page.tsx
```
- [ ] 3+ (카드 스타일·화살표 회전 반영).

## 1) 빌드 + 클린 재시작
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
```
- [ ] "Compiled successfully".

## 2) 눈검수 (스크린샷 — PC + 모바일)
- `/stock/NVDA`:
  - [ ] 카드들이 **그림자로 살짝 떠 보이고** 서로 또렷이 분리(간격↑).
  - [ ] 우측에 **원형 화살표 버튼**(큼) — 접힘=아래·펼침=위 회전.
  - [ ] 카드 누르면 **옅은 배경 서랍**이 아래로 펼쳐짐(상세). 다시 누르면 접힘.
  - [ ] 판정 문장이 조금 더 큼(16px). 근거 수치는 그 아래.
  - [ ] **모바일 375~390px**에서도 안 깨지고 화살표·간격 자연스러움.
- 스크린샷(접힘 목록 1 + 펼침 1 + 모바일 1) Cowork 공유.

## 3) 커밋
```bash
git add app/stock/\[symbol\]/page.tsx docs/STEP_564_COMMAND.md && git commit -m "feat(ui): 렌즈 카드 시각 계층 — 카드 그림자로 띄우기·원형 큰 화살표·펼침 서랍 배경·판정 16px (STEP 564)" && git push
```

## ✅ 여기까지 = 카드가 하나의 단위로 또렷이·펼침 직관적
## ▶ 다음
- 스크린샷 보고 밀도·그림자·색 미세 조정(필요 시). 확정되면 그때 다음(일/중 카피 등).
