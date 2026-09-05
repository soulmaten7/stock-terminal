<!-- 2026-06-24 -->
# STEP 380 — [모바일 ④] 터치 타깃 + 잔여 스윕 + 아침 체크리스트

> 📱 모바일 마무리. **데스크탑 클래스 삭제 금지.** 빌드 통과 시에만 커밋. 이 STEP까지 끝나면 모바일 1차 완료 → 아침에 사용자가 실제 폰에서 미세조정.

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_380_COMMAND.md 파일 내용대로 실행해줘
```

---

## ① 터치 타깃 — 가로 스크롤 탭 모바일 높이 ↑ (데스크탑 유지)

**`components/toolbox/ToolboxClient.tsx`** — 카테고리 탭. 찾기:
```tsx
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
```
바꾸기:
```tsx
            className={`shrink-0 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors sm:py-1.5 ${
```

**`components/toolbox/MarketBoard.tsx`** — 하위탭. 찾기:
```tsx
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${tab === s.key ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
```
바꾸기:
```tsx
              className={`shrink-0 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors sm:py-1.5 ${tab === s.key ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
```

> 모바일 탭 높이 ~8px 증가(탭하기 쉬움), 데스크탑은 `sm:py-1.5`로 원복.

## ② 잔여 고정폭 스윕 (자동 점검 — 수정 아님, 보고만)

아래 명령으로 **반응형 가드(`lg:`/`sm:`) 없이 노출된 고정 픽셀 폭**이 있는지 점검하라:
```bash
cd ~/stock-terminal && grep -rnE "w-\[[0-9]+px\]|min-w-\[[0-9]+px\]|w-72|w-96" components/ app/ | grep -vE "lg:|sm:|md:|hidden|overflow-x" || echo "잔여 노출 고정폭 없음"
```
- 결과가 나오면 각 줄을 `docs/MOBILE_MORNING_CHECKLIST.md` 맨 아래 **"## 🔎 STEP 380 스윕 결과"** 섹션에 그대로 붙여라(파일 끝에 append). 수정은 하지 말 것(아침에 사람이 판단).
- "잔여 노출 고정폭 없음"이면 그 문장만 같은 섹션에 적어라.

## ③ 빌드 + 커밋
```bash
cd ~/stock-terminal && npm run build
```
무에러 시:
```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(mobile): 탭 터치 타깃 모바일 확대 + 고정폭 스윕 결과 기록 (STEP 380)" && git push
```

---

## 🌅 아침 인수인계
- `docs/MOBILE_MORNING_CHECKLIST.md` 를 열어 실제 폰에서 화면별로 체크.
- 스윕 결과 섹션에 잡힌 항목이 있으면 Cowork과 함께 판단.
- STEP 377~380 전부 빌드 통과·커밋됐는지 `git log --oneline -6` 확인.

---

> **한 줄 요약**: 탭 터치 타깃 확대 + 잔여 고정폭 자동 스윕 기록. 모바일 1차 완료 → 아침에 실제 폰 미세조정.
