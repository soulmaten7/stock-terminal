<!-- 2026-07-02 -->
# STEP 540 — 렌즈 1기법 1줄(단일 열) + 폭 정렬 통일

> 피드백: 2열이면 '자세히' 펼칠 때 옆 카드와 높이 어긋남 → **1기법 1줄(단일 열)**. 헤더·카드·TRAI 모두 `max-w-4xl` 왼쪽 정렬(홈 프레임과 왼쪽 끝 일치).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_540_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
- **Cowork이 이미 수정**: `app/stock/[symbol]/page.tsx` — 렌즈/F-Score를 `lg:grid-cols-2` → 단일 열(`space-y-3`), 전 섹션 `max-w-4xl` 통일. (page.tsx만 변경 — 컴포넌트라 HMR)

## 1) 확인
```bash
cd ~/stock-terminal && grep -c "lg:grid-cols-2" "app/stock/[symbol]/page.tsx" && grep -c "max-w-4xl" "app/stock/[symbol]/page.tsx"
```
- [ ] `lg:grid-cols-2` = **0**(제거됨), `max-w-4xl` = 5(헤더·로딩·리스트·TRAI·푸터).

## 2) 빌드 + 눈검수
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
- [ ] "Compiled successfully". 브라우저 `/stock/BRK-A`: **한 줄에 렌즈 1개**(F-Score→모멘텀→저변동→기술→밸류 세로), 폭 통일, '▾ 자세히' 펼침 시 아래로만 늘어남(옆 카드 영향 없음).

## 3) 커밋
```bash
git add "app/stock/[symbol]/page.tsx" docs/STEP_540_COMMAND.md && git commit -m "style(lens): 렌즈 1기법 1줄(단일 열)·max-w-4xl 정렬 통일 — 자세히 확장 대비 (STEP 540)" && git push
```

## ✅ 여기까지 = 렌즈 페이지 레이아웃 확정
## ▶ 다음 후보
- TRAI 로고 정식 SVG 다듬기 · 배포 후 모바일 눈검수 · (유료 TRAI 종합 활성화는 계속 보류)
