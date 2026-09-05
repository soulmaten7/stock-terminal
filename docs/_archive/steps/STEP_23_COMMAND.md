# STEP 23 — Footer 내부 콘텐츠 좌측 정렬 (대시보드 R1/R4와 동일 x좌표)

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** Step 22 완료 (LayoutShell 롤백, Header = Footer = 1536 풀폭)

---

## 📐 현재 상태 & 문제

```
┌──── 1536px 박스 ──────────────────────┐
│ Header (1536) · 로고 px-6             │
│ Ticker (1536)                         │
├─────┬──────────────────────────────────┤
│ Sb  │ Main (R1-R4) 1480                │
│ 56  │   HomeClient px-2 (8px)          │
│     │   → R 위젯 left = box+56+8 = 64  │
├─────┴──────────────────────────────────┤
│ Footer (1536)                         │
│   max-w-[1600px] mx-auto px-4         │
│   → 콘텐츠 left = box+16              │
└────────────────────────────────────────┘
```

**불일치**: Footer 콘텐츠 left(box+16) ↔ R 위젯 left(box+64). **48px 어긋남**.

사용자 요구: Footer 배경은 1536 그대로 두되, "서비스 안내/약관/광고/고객지원" 4-column 블록이 **대시보드 위젯과 같은 x좌표**에서 시작.

---

## 🔧 파일 변경 (1개 파일, 2곳 수정)

### `components/layout/Footer.tsx`

**Edit 1 — Main Footer 내부 컨테이너 (46번 줄):**

```
old_string:
      {/* Main Footer */}
      <div className="max-w-[1600px] mx-auto px-4 py-12">

new_string:
      {/* Main Footer */}
      <div className="max-w-[1600px] mx-auto pl-16 pr-4 py-12">
```

**Edit 2 — Disclaimer 내부 컨테이너 (73번 줄):**

```
old_string:
      <div className="border-t border-[#088F8C] bg-[#088F8C]">
        <div className="max-w-[1600px] mx-auto px-4 py-6">

new_string:
      <div className="border-t border-[#088F8C] bg-[#088F8C]">
        <div className="max-w-[1600px] mx-auto pl-16 pr-4 py-6">
```

**의도:**
- `px-4` (좌우 16px) → `pl-16 pr-4` (좌 64px, 우 16px)
- pl-16 = 64px = **사이드바 56 + HomeClient px-2 8** → R1/R4 위젯 좌측 edge와 정확히 일치
- 우측 `pr-4`는 기존 16px 유지 (Footer 우측 여백 자연스러움 보존)
- Footer **배경** (`<footer>` + `<div bg-[#088F8C]>`)는 건드리지 않음 → 1536 풀폭 유지

**결과:**

```
┌──── 1536px 박스 ──────────────────────┐
│ Footer 배경 (1536)                    │
│        ┌─────────────────────────┐    │
│        │ 서비스안내│약관│광고│지원│    │ ← 콘텐츠 left = 64
│        └─────────────────────────┘    │
│        (R1/R4 위젯 left과 동일 x좌표)  │
└────────────────────────────────────────┘
```

---

## 🔒 변경하지 않는 파일

- `components/layout/LayoutShell.tsx` — Step 22 상태 유지
- `components/layout/VerticalNav.tsx` — Step 21 `self-start` 유지
- `components/layout/Header.tsx` — 로고 정렬 현상유지 (사용자 미언급)
- `components/home/HomeClient.tsx` — px-2 그대로
- `app/layout.tsx` — 건드리지 않음

---

## 🚀 실행 순서

```bash
cd ~/Desktop/OTMarketing
git status
git log --oneline -3

# 1. components/layout/Footer.tsx Edit 2회

# 2. 빌드 확인
npm run build 2>&1 | tail -10

# 3. 개발 서버 재기동
pkill -f "next dev" || true
rm -rf .next node_modules/.cache
nohup npm run dev > /tmp/next-dev.log 2>&1 &
sleep 6
tail -n 15 /tmp/next-dev.log

# 4. 커밋 + 푸시
git add components/layout/Footer.tsx

git commit -m "$(cat <<'EOF'
fix: align footer inner content with dashboard R1/R4 left edge

Footer background still spans the full 1536px box (matches
Header/Ticker), but its inner "서비스 안내/약관/광고/고객지원"
grid was starting at box-left + 16 (from px-4), while the
dashboard widgets start at box-left + 64 (sidebar 56 + HomeClient
px-2). That 48px gap was the remaining misalignment the user
flagged after Step 22.

Change both inner containers (main footer + disclaimer) from
px-4 to pl-16 pr-4. That shifts the content left edge to
box-left + 64, aligning precisely with the dashboard widget
column while preserving the right-side padding.

The outer footer background and the disclaimer bg stripe keep
the full 1536px width so the Header/Ticker/Footer box-level
symmetry remains intact.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

---

## ✅ 시각 검증 체크리스트

**정렬 (핵심)**
1. "서비스 안내" 제목 좌측 x좌표 = R1 마켓채팅 위젯 좌측 x좌표 (동일)
2. "서비스 안내" 제목 좌측 x좌표 = R4 상승/하락 위젯 좌측 x좌표 (동일)
3. 면책 고지문 ("본 사이트는...") 좌측 = 위 블록과 동일 x좌표

**박스 너비 유지 (회귀 방지)**
4. Footer turquoise 배경 좌우 끝 = Header 좌우 끝 = Ticker 좌우 끝 (모두 1536)
5. 하단 disclaimer 어두운 띠 (`bg-[#088F8C]`) 배경도 박스 풀폭 유지
6. Copyright 중앙 정렬 (`text-center`) 그대로

**기능 회귀 없음**
7. Footer 링크 4개 섹션 모두 클릭 가능
8. 모바일 반응형 (뷰포트 좁을 때) 그리드 깨지지 않음
9. Step 22에서 해결된 사이드바 스크롤 추적은 그대로 유지

---

## ⚠️ 예상 부작용 & 대응

- **`max-w-[1600px]` 불필요해 보임**: 현재 부모(박스) 너비가 1536이라 max-w 1600은 트리거되지 않음. 제거해도 동일 동작. 이번엔 그대로 두고 나중에 정리.
- **작은 뷰포트 (1024px 등)**: pl-16(64px) + pr-4(16px) = 80px 패딩. 콘텐츠 너비 충분 (944px). 문제 없음.
- **사이드바 숨김 모바일**: `hidden md:flex`이므로 md 미만에서는 사이드바 없음. 그러면 pl-16이 너무 많은 왼쪽 여백을 만듦. 하지만 이번엔 PC 데스크탑 레이아웃 정리가 우선이라 수용.

---

## 🗣️ 남은 대기 목록

1. **Step 24 (다음)** — Col 3 뉴스/DART 위젯 내부 레이아웃 (Step 22 완료 후에도 미해결인지 스크린샷 재검증)
2. **모바일 Footer** — 사이드바 숨김 시 pl-16 → md:pl-16 로 반응형 처리 (낮은 우선순위)
3. **Phase 2-B** — 수급 통합 탭 (`/investor-flow` → `/net-buy`). P0
4. **Phase 2-C** — 경제캘린더 미니 위젯. P1
5. **Phase 2-D** — 발굴 ↔ 관심종목 연동. P1
6. **세션 종료 처리** — 4개 문서 헤더 날짜 업데이트

Step 23 완료 후 스크린샷 받아서 Col 3 이슈 재진단 여부 판단.
