<!-- 2026-06-22 -->
# STEP 346 — [UI] 게이트웨이 카테고리 탭 순서 재정렬 (타입별 그룹)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_346_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
탭 순서를 타입이 섞인 현재 배열 → **타입별 그룹**으로:
- ① 시세·차트: 종목·상품 · 차트·시세
- ② 정보·공시: 뉴스 · 공시·신용 · 리포트 · 기업·재무
- ③ 거시·상품: 거시경제 · ETF·펀드 · 공모주·배당
- ④ 거래 인프라: 거래소
- ⑤ 사람·검증: 유튜브 · 커뮤니티 · 리딩방·검증

> 변경 1파일 1줄: `components/toolbox/ToolboxClient.tsx`의 `TAB_ORDER`. 기본 탭(종목·상품)·피드 매핑·라벨 전부 그대로(슬러그만 순서 변경).

---

## 📄 `components/toolbox/ToolboxClient.tsx` — `TAB_ORDER` 순서 변경

**찾기:**
```tsx
const TAB_ORDER = ['market', 'news', 'youtube', 'chart', 'analysis', 'research', 'disclosure', 'etf', 'ipo', 'macro', 'exchange', 'community', 'room'];
```
**바꾸기:**
```tsx
const TAB_ORDER = ['market', 'chart', 'news', 'disclosure', 'research', 'analysis', 'macro', 'etf', 'ipo', 'exchange', 'youtube', 'community', 'room'];
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

개발 서버(컴포넌트 변경 → HMR 자동 반영, 안 되면 새로고침):
- 게이트웨이 탭 순서 = **종목·상품 · 차트·시세 · 뉴스 · 공시·신용 · 리포트 · 기업·재무 · 거시경제 · ETF·펀드 · 공모주·배당 · 거래소 · 유튜브 · 커뮤니티 · 리딩방·검증**
- 유튜브가 끝(커뮤니티·리딩방 옆)으로, 차트·시세가 종목 바로 옆으로 이동했는지 확인.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add components/toolbox/ToolboxClient.tsx && git commit -m "ui(gateway): 카테고리 탭 순서 타입별 그룹 재정렬 (시세→정보→상품→거래소→사람·검증) (STEP 346)" && git push
```

---

> **한 줄 요약**: 탭 순서를 타입별 그룹(시세·정보·상품·거래소·사람검증)으로 재정렬 — 유튜브를 검증 그룹으로, 차트를 종목 옆으로.
