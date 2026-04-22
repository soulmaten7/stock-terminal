# STEP 14 — TickerBar sticky 해제 (상단 고정만, 스크롤 시 딸려오지 않도록)

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** Step 13 완료 (commit `86b1f9d` — 채팅 참여자 팝업 scope 수정)

**목표:** 현재 티커(S&P500, US100, DOW 등)가 Header 바로 아래 `sticky`로 설정돼 스크롤 내릴 때 계속 따라옴. 이를 제거해 **상단에만 정적 배치**, 스크롤하면 Header만 상단에 남고 티커는 자연스럽게 위로 사라지도록.

---

## 📐 설계 판단

**왜 Header는 sticky 유지하는가?**
- Header: 로고, 네비게이션(홈/스크리너/도구함), 검색, 국가선택, 알림, 프로필 — 스크롤 중에도 자주 접근.
- Ticker: 글로벌 지수 요약 — 한 번 훑고 나면 스크롤 중 굳이 볼 이유 없음.

**표준 UX 패턴:**
- Bloomberg Terminal: 최상단 command bar만 고정, 티커는 스크롤.
- TradingView: 툴바만 고정, 심볼 리스트는 스크롤.
- 우리도 동일 패턴 채택.

---

## 🔧 파일별 변경사항

### `components/layout/TickerBar.tsx`

**변경 위치:** 95번 줄 — 루트 `<div>` className.

**Edit 툴 호출용:**

```
old_string:
    <div className="bg-white border-b border-[#E5E7EB] h-10 overflow-hidden sticky top-[72px] z-30">

new_string:
    <div className="bg-white border-b border-[#E5E7EB] h-10 overflow-hidden">
```

**변경 내역:**
- ❌ `sticky top-[72px]` — 헤더 바로 아래 고정되던 것 제거
- ❌ `z-30` — sticky 제거되면 불필요

**유지:**
- ✅ `bg-white border-b border-[#E5E7EB]` — 시각 분리선
- ✅ `h-10` — 높이 40px
- ✅ `overflow-hidden` — TradingView 위젯 iframe overflow 방지

---

## 🚀 실행 순서

```bash
cd ~/Desktop/OTMarketing
git status

# 1. TickerBar.tsx 95번 줄 Edit (위 old_string/new_string 대로)

# 2. 빌드 확인
npm run build

# 3. 개발 서버 재기동 (Turbopack 캐시 초기화)
pkill -f "next dev" || true
rm -rf .next node_modules/.cache
nohup npm run dev > /tmp/next-dev.log 2>&1 &
sleep 5
tail -n 20 /tmp/next-dev.log

# 4. 커밋 + 푸시
git add components/layout/TickerBar.tsx
git commit -m "$(cat <<'EOF'
fix: ticker bar no longer sticky below header

- Remove sticky top-[72px] z-30 from TickerBar root div
- Header stays sticky (logo/search/profile needed during scroll)
- TickerBar scrolls away naturally with content

Rationale: Bloomberg/TradingView standard pattern — command bar
stays fixed, market ticker is a read-once element.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

---

## ✅ 시각 검증 체크리스트

브라우저에서 `http://localhost:3000` 새로고침 후:

1. **초기 상태** — Header 아래 티커가 평소처럼 보이는가 (S&P 500, US 100, DOW, USD/KRW, WTI, GOLD…)
2. **스크롤 다운** — 페이지를 아래로 스크롤하면:
   - Header는 **상단에 그대로 고정**돼 있는가 ✅
   - Ticker는 **위로 올라가 사라지는가** ✅ (핵심 수정 목표)
3. **스크롤 업** — 맨 위로 올라오면 Ticker가 다시 보이는가

---

## ⚠️ 사이드 이펙트 체크

- **사이드바 페이지 (상승/하락, 거래량 등)** — 짧은 페이지라 스크롤 자체가 안 생길 수 있음. 화면 높이 작은 환경(노트북)에서는 스크롤 발생 → 티커 사라지는 동작 확인 가능.
- **홈 대시보드** — `100vh - 152px` 기반 그리드라 자체 스크롤은 없음. 브라우저 확대(Cmd+)로 강제 스크롤 만들어 확인 가능.
- **차트 상세 페이지 (`/chart`, `/stocks/[symbol]`)** — 긴 페이지들, 확실히 차이 체감됨.

---

## 🗣️ 남은 논의 (사용자 결정 대기)

이번 세션 대화 중 **결정 보류**된 항목 정리:

1. **대시보드 폭/밀도** — Koyfin 대비 "너무 와이드"하지 않은지 사용자가 제기. `window.innerWidth` 값 + 사용자 선호 옵션 필요.
   - 옵션 1: max-width 컨테이너 (예: `max-w-[1600px] mx-auto`)
   - 옵션 2: 밀도 압축 (폰트/패딩 타이트)
   - 옵션 3: 둘 다
   - → 지금 판단 보류. 사용자가 다시 꺼낼 때 결정.

2. **Phase 2-B (수급 통합 탭)** — `/investor-flow` → `/net-buy` 내부 탭으로 흡수. P0 대기.
3. **Phase 2-C (경제캘린더 미니 위젯)** — 홈 대시보드 편입. P1 대기.

Step 14 완료 후 사용자가 다음 작업 지정해주면 진행.
