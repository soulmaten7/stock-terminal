<!-- 2026-06-22 -->
# STEP 350 — [UI] 탭 끝부분 재정렬: 거래소 · 유튜브 · 리딩방·검증 붙이기

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_350_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
유튜브·리딩방·검증(둘 다 "사람·채널이 주는 정보 → 검증·주의 대상")을 붙이고, 거래소를 그 앞에. **커뮤니티는 거래소 앞으로** 이동.
- 끝부분: ⋯ 공모주·배당 · **커뮤니티 · 거래소 · 유튜브 · 리딩방·검증**

> 변경 1파일 1줄: `components/toolbox/ToolboxClient.tsx`의 `TAB_ORDER`(community를 exchange 앞으로).

---

## 📄 `components/toolbox/ToolboxClient.tsx` — `TAB_ORDER`

**찾기:**
```tsx
const TAB_ORDER = ['market', 'chart', 'news', 'disclosure', 'research', 'analysis', 'macro', 'etf', 'ipo', 'exchange', 'youtube', 'community', 'room'];
```
**바꾸기:**
```tsx
const TAB_ORDER = ['market', 'chart', 'news', 'disclosure', 'research', 'analysis', 'macro', 'etf', 'ipo', 'community', 'exchange', 'youtube', 'room'];
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

개발 서버(컴포넌트 변경 → HMR/새로고침):
- 탭 끝 = ⋯ **공모주·배당 · 커뮤니티 · 거래소 · 유튜브 · 리딩방·검증**.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add components/toolbox/ToolboxClient.tsx && git commit -m "ui(gateway): 탭 끝부분 재정렬 — 거래소·유튜브·리딩방 인접, 커뮤니티 앞으로 (STEP 350)" && git push
```

---

> **한 줄 요약**: 유튜브·리딩방·검증 인접(검증·주의 대상) + 거래소 그 앞, 커뮤니티는 거래소 앞으로.
