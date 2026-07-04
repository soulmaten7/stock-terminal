<!-- 2026-07-03 -->
# STEP 565 — 렌즈 카드 정보 순서 개선 ("뭐하는 기법인지"를 이름 밑 서브타이틀로)

> 눈검수 피드백: "이게 뭐하는 기법인지" 한 줄 설명이 접힘 안쪽에 작게 있어 맥락 없이 판정·점수·등급이 먼저 보여 "이게 뭐야?"가 됨. → **이름 바로 밑에 서브타이틀**로 올려 "아 이런 기법이구나" 이해 후 판정을 읽게. 정보 순서: 이름 → 뭐하는 기법 → 판정 → 근거 수치 → (펼침) 상세.
> Cowork이 `app/stock/[symbol]/page.tsx` 수정 완료(tsc EXIT=0). Claude Code는 **빌드 + 재시작 + 눈검수 + 커밋**.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_565_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (Cowork이 이미 수정)
- 렌즈 카드: `L.summary`("요즘 강하게 오른 종목이 계속 갈지 보는 방법…")를 **이름 바로 밑 서브타이틀**(muted 12px)로 이동. 접힘 안쪽의 중복 요약 제거.
- F-Score 카드: `LENS_COPY.ko.fscore.what`(+asOf 기준)을 **이름 밑 서브타이틀**로 이동. 접힘 안쪽 중복 제거.
- 순서: 이름/등급 → **뭐하는 기법(서브타이틀)** → 판정 문장 → 근거 수치 → (펼침) 쉬운 해석·상세.

## 0) 확인
```bash
cd ~/stock-terminal && grep -c "L.summary" app/stock/\[symbol\]/page.tsx
```
- [ ] `L.summary` 1 (서브타이틀 1곳만·접힘 중복 제거됨).

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
  - [ ] 각 카드: 이름 바로 아래 **"뭐하는 기법인지" 한 줄**(예: 모멘텀 "요즘 강하게 오른 종목이 계속 갈지 보는 방법…") → 그 아래 판정("강하게 오르는 흐름") → 근거 수치.
  - [ ] F-Score: 이름 아래 "회사 재무가 튼튼한지 9가지로… (수익 예측 아님) · 날짜" → "보통 수준의 재무" → 점수 4/9.
  - [ ] 펼침 안쪽에 요약 **중복 없음**(쉬운 해석·단기/장기·알아보기·자세히만).
  - [ ] 모바일에서도 자연스러움.
- 스크린샷 Cowork 공유.

## 3) 커밋
```bash
git add app/stock/\[symbol\]/page.tsx docs/STEP_565_COMMAND.md && git commit -m "feat(ui): 렌즈 카드 정보 순서 — '뭐하는 기법인지'를 이름 밑 서브타이틀로(맥락 먼저)·접힘 중복 제거 (STEP 565)" && git push
```

## ✅ 여기까지 = 맥락(뭐하는 기법)→판정→근거 자연스러운 읽기 순서
## ▶ 다음
- 스크린샷 확정 후 UI 마무리. 그 다음에 세션 문서 갱신(564~565) → (확정되면) 일/중 카피.
