<!-- 2026-07-03 -->
# STEP 562 — 렌즈 페이지 UI 편의성 (Phase 2): 카드 압축/펼치기 + 중립화

> 방향 확정(대화): **한 페이지 유지**(탭 X — 엇갈림이 핵심). 카드를 **압축(판정 문장+등급+근거 수치)**, 누르면 상세(쉬운 해석·단기/장기·알아보기·자세히) **펼치기**. 맨 위 **"기법 성향" 종합 줄 제거**(우리가 결론 권유하는 것 → 중립화). 모바일 스캔 편의 ↑.
> Cowork이 `app/stock/[symbol]/page.tsx` 수정 완료(tsc EXIT=0). API·로직 변경 없음. Claude Code는 **빌드 + 재시작 + 눈검수 + 커밋**.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_562_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (Cowork이 이미 수정)
- 렌즈 카드 = **접힘 기본**: 헤더(영문명+등급 배지+한글명) + **판정 문장** + **근거 수치** 노출 · 누르면 펼침(쉬운 해석·단기/장기·알아보기·자세히). `openLens` state 토글.
- **F-Score 카드도 동일**(접힘=점수+판정 문장, 펼침=9항목+상세).
- 맨 위 **"기법 성향" 종합 블록 삭제** + `styleRead`·`gradeColor` 미사용 함수 제거. 안내문 아래 "각 렌즈를 눌러 상세를 펼쳐 보세요" 추가.

## 0) 확인
```bash
cd ~/stock-terminal && grep -c "toggleLens\|openLens" app/stock/\[symbol\]/page.tsx && grep -c "기법 성향\|styleRead" app/stock/\[symbol\]/page.tsx
```
- [ ] toggleLens/openLens 2+, "기법 성향"·styleRead **0**(제거됨).

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
  - [ ] 카드 7개 + F-Score가 **접힌 상태**로 촘촘히 — 각 판정 문장(모멘텀 "강하게 오르는 흐름" 등) + 근거 수치가 한 화면에 여러 개 보임(엇갈림 스캔).
  - [ ] 카드 클릭 → 아래로 쉬운 해석·단기/장기·알아보기·자세히 펼쳐짐. 다시 클릭 → 접힘.
  - [ ] 맨 위 "기법 성향 · 모멘텀↑…" 줄 **없음**.
  - [ ] **모바일 폭**(개발자도구 375px)에서도 카드·판정·수치가 안 깨지고 읽힘.
- 스크린샷(접힘 1장 + 펼침 1장 + 모바일 1장) Cowork에 공유.

## 3) 커밋
```bash
git add app/stock/\[symbol\]/page.tsx docs/STEP_562_COMMAND.md && git commit -m "feat(ui): 렌즈 페이지 편의성 — 카드 압축/펼치기(판정+근거수치 접힘·상세 펼침)·F-Score 동일·'기법 성향' 종합줄 제거(중립화) (STEP 562)" && git push
```

## ✅ 여기까지 = Phase 2 UI 편의성 1차 (한 페이지 유지·중립·스캔 편의·모바일)
## ▶ 다음
- 스크린샷 보고 밀도·펼침 동작 미세 조정(필요 시).
- 이후: 세션 문서 갱신(559~562) · 일본어·중국어 카피 · 배포 안정화.
