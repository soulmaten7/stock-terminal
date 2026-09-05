<!-- 2026-07-03 -->
# STEP 566 — 렌즈 카드 접힘 = "기법 메뉴"만 (판정·점수·근거는 펼침으로)

> 눈검수 통찰(사용자): 판정("보통 수준의 재무/변동")은 일반인에겐 맥락 없이 안 읽힘 → 스캔해도 의미 약함. 반대로 "뭐하는 기법인지"(사람 말) 설명은 바로 이해되고 펼쳐보게 만듦. → **접힘 = 이름+등급+설명(이해되는 기법 메뉴)** / **펼침 = 이 종목의 읽기 전부**(판정·근거 수치·쉬운 해석·상세). 보는 사람의 언어 우선.
> Cowork이 `app/stock/[symbol]/page.tsx` 수정 완료(tsc EXIT=0). Claude Code는 **빌드 + 재시작 + 눈검수 + 커밋**.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_566_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (Cowork이 이미 수정)
- 렌즈 카드 **접힘** = 이름 + 등급 배지 + **"뭐하는 기법인지" 설명(13px)** 만. (판정·근거 수치 제거)
- 렌즈 카드 **펼침** = 맨 위 **판정 문장(색조)** + 쉬운 해석 → **근거 수치** → 단기/장기 → 알아보기 → 자세히.
- F-Score도 동일: 접힘=이름+등급+설명 / 펼침=판정+점수(4/9)+plain+9항목+상세.

## 0) 확인
```bash
cd ~/stock-terminal && grep -c "verdict.phrase\|fRead.phrase" app/stock/\[symbol\]/page.tsx
```
- [ ] 2 (판정이 펼침에만 각 1곳).

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
  - [ ] **접힘 목록** = 각 카드에 이름+등급+"뭐하는 기법인지" 한 줄만(판정·숫자 안 보임) → 깔끔한 기법 메뉴.
  - [ ] 카드 펼치면 → **판정 문장**("강하게 오르는 흐름")부터 + 쉬운 해석 + 근거 수치 + 단기/장기 + 알아보기/자세히.
  - [ ] F-Score 펼치면 → "보통 수준의 재무 · 점수 4/9" + 9항목.
  - [ ] 모바일에서도 자연스러움.
- 스크린샷(접힘 목록 1 + 펼침 1 + 모바일 1) Cowork 공유.

## 3) 커밋
```bash
git add app/stock/\[symbol\]/page.tsx docs/STEP_566_COMMAND.md && git commit -m "feat(ui): 접힘=기법 메뉴(이름+설명)·펼침=이 종목의 읽기(판정·점수·근거·상세) — 보는 사람 언어 우선 (STEP 566)" && git push
```

## ✅ 여기까지 = 접힘은 이해되는 기법 메뉴 · 읽기는 펼쳐서
## ▶ 다음
- 스크린샷 확정 → UI 마무리. 이후 세션 문서 갱신(564~566) → (확정 후) 일/중 카피.
