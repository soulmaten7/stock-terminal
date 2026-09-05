# STEP 24 — Footer 내부를 사이드바+Main 구조로 미러링 (계산 없이 구조로 정렬)

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** Step 23 완료 (Footer `pl-16 pr-4` — CSS는 적용됐지만 시각적으로 여전히 R 위젯과 미스매치)

---

## 🧠 접근 변경

이전 Steps는 **픽셀 계산**에 의존:
- Step 22: Footer 풀폭 1536 복원
- Step 23: `pl-16` (= 52px in 13px-rem)로 수동 맞춤

**문제**: `html { font-size: 13px }` 환경에서 rem 기반 Tailwind 계산 값을 내가 잘못 추정했고, 설령 수식이 맞아도 서브픽셀/레이아웃 간섭이 남을 수 있음.

**새 접근**: **Footer 내부를 LayoutShell + HomeClient와 동일 구조**로 만듦. 같은 클래스를 쓰므로 어떤 계산이든 결과가 동일해짐.

```
현재 (LayoutShell):          Footer 변경 후:
┌─────────────────────┐      ┌─────────────────────┐
│ [VerticalNav w-14]  │      │ [placeholder w-14]  │
│ [main flex-1]       │      │ [content flex-1]    │
│   HomeClient px-2   │      │   px-2              │
│     (R 위젯들)       │      │     (Footer 그리드)  │
└─────────────────────┘      └─────────────────────┘
```

---

## 🔧 파일 변경 (1개 파일)

### `components/layout/Footer.tsx` — 내부 구조 전면 재작성

**Edit 1 — Main Footer 섹션 (42~69번 줄):**

```
old_string:
export default function Footer() {
  return (
    <footer className="bg-[#0ABAB5] border-t border-[#088F8C] mt-auto">
      {/* Main Footer */}
      <div className="max-w-[1600px] mx-auto pl-16 pr-4 py-12">
        <div className="grid grid-cols-4 gap-8">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="font-bold text-white mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {'links' in section && section.links
                  ? section.links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className="text-sm text-white hover:text-[#C9A96E] transition-colors">
                          {link.label}
                        </Link>
                      </li>
                    ))
                  : section.items?.map((item) => (
                      <li key={item} className="text-sm text-white">
                        {item}
                      </li>
                    ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

new_string:
export default function Footer() {
  return (
    <footer className="bg-[#0ABAB5] border-t border-[#088F8C] mt-auto">
      {/* Main Footer — sidebar+main 구조 미러링 */}
      <div className="flex">
        <div className="w-14 shrink-0" aria-hidden />
        <div className="flex-1 min-w-0 px-2 py-12">
          <div className="grid grid-cols-4 gap-8">
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title}>
                <h4 className="font-bold text-white mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {'links' in section && section.links
                    ? section.links.map((link) => (
                        <li key={link.label}>
                          <Link href={link.href} className="text-sm text-white hover:text-[#C9A96E] transition-colors">
                            {link.label}
                          </Link>
                        </li>
                      ))
                    : section.items?.map((item) => (
                        <li key={item} className="text-sm text-white">
                          {item}
                        </li>
                      ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
```

**Edit 2 — Disclaimer 섹션 (71~91번 줄):**

```
old_string:
      {/* Disclaimer */}
      <div className="border-t border-[#088F8C] bg-[#088F8C]">
        <div className="max-w-[1600px] mx-auto pl-16 pr-4 py-6">
          <p className="text-xs text-white leading-relaxed mb-3">
            본 사이트는 공개된 금융 데이터를 정리하여 제공하며, 투자 권유 또는 투자 자문이 아닙니다.
            모든 투자 판단과 그에 따른 결과의 책임은 투자자 본인에게 있습니다.
            본 사이트에서 제공하는 정보의 정확성, 완전성을 보장하지 않으며, 이를 기반으로 한 투자 손실에 대해 어떠한 책임도 지지 않습니다.
          </p>
          <p className="text-xs text-white leading-relaxed mb-6">
            광고 배너는 광고주가 직접 등록한 것이며, 본 사이트는 광고 내용에 대한 책임을 지지 않습니다.
            인증업체 마크는 사업자등록 확인을 의미하며, 상품의 품질이나 수익을 보증하지 않습니다.
          </p>
          <div className="text-xs text-white space-y-1">
            <p>상호명: [추후 입력] | 대표자: [추후 입력] | 사업자등록번호: [추후 입력]</p>
            <p>통신판매업 신고번호: [추후 입력] | 주소: [추후 입력]</p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#077D7A] text-xs text-white text-center">
            &copy; 2026 StockTerminal. All rights reserved.
          </div>
        </div>
      </div>

new_string:
      {/* Disclaimer — sidebar+main 구조 미러링 */}
      <div className="border-t border-[#088F8C] bg-[#088F8C]">
        <div className="flex">
          <div className="w-14 shrink-0" aria-hidden />
          <div className="flex-1 min-w-0 px-2 py-6">
            <p className="text-xs text-white leading-relaxed mb-3">
              본 사이트는 공개된 금융 데이터를 정리하여 제공하며, 투자 권유 또는 투자 자문이 아닙니다.
              모든 투자 판단과 그에 따른 결과의 책임은 투자자 본인에게 있습니다.
              본 사이트에서 제공하는 정보의 정확성, 완전성을 보장하지 않으며, 이를 기반으로 한 투자 손실에 대해 어떠한 책임도 지지 않습니다.
            </p>
            <p className="text-xs text-white leading-relaxed mb-6">
              광고 배너는 광고주가 직접 등록한 것이며, 본 사이트는 광고 내용에 대한 책임을 지지 않습니다.
              인증업체 마크는 사업자등록 확인을 의미하며, 상품의 품질이나 수익을 보증하지 않습니다.
            </p>
            <div className="text-xs text-white space-y-1">
              <p>상호명: [추후 입력] | 대표자: [추후 입력] | 사업자등록번호: [추후 입력]</p>
              <p>통신판매업 신고번호: [추후 입력] | 주소: [추후 입력]</p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#077D7A] text-xs text-white text-center">
              &copy; 2026 StockTerminal. All rights reserved.
            </div>
          </div>
        </div>
      </div>
```

---

## 🎯 왜 이 방식이 확실한가

| 요소 | LayoutShell + HomeClient | Footer 새 구조 |
|---|---|---|
| 좌측 사이드바 영역 | `<VerticalNav className="w-14 ...">` | `<div className="w-14 shrink-0">` |
| 우측 콘텐츠 영역 | `<main className="flex-1 min-w-0">` | `<div className="flex-1 min-w-0">` |
| 콘텐츠 내부 패딩 | HomeClient: `px-2 py-2` | Footer 내부: `px-2 py-12` (패딩 유지) |
| 부모 컨테이너 | `<div className="flex flex-1">` | `<div className="flex">` |

두 구조가 **동일 Tailwind 클래스 조합**을 쓰므로:
- rem 1단위가 뭐든 (13px든 16px든)
- 서브픽셀 반올림이 어떻든
- 브라우저 줌이 어떻든
- **결과는 수학적으로 동일**

Footer 콘텐츠 "서비스 안내" 좌측 edge = R1 마켓채팅 위젯 좌측 edge (0px 차이 보장).

---

## 🔒 유지되는 것들

- Footer 배경 (`<footer className="bg-[#0ABAB5] ...">`) — **1536 풀폭 그대로**
- Disclaimer 어두운 띠 (`<div className="border-t border-[#088F8C] bg-[#088F8C]">`) — **1536 풀폭**
- FOOTER_SECTIONS 배열, 링크, 면책 문구 — 내용 100% 동일
- `max-w-[1600px] mx-auto` 제거 — 어차피 1536 부모 내에서 트리거 안 됨, 혼란만 가중

---

## 🚀 실행 순서

```bash
cd ~/Desktop/OTMarketing
git status
git log --oneline -3

# 1. components/layout/Footer.tsx Edit 2회

# 2. 빌드 확인 (타입 에러 없는지)
npm run build 2>&1 | tail -10

# 3. 개발 서버 완전 재기동 (캐시 삭제)
pkill -f "next dev" || true
rm -rf .next node_modules/.cache
nohup npm run dev > /tmp/next-dev.log 2>&1 &
sleep 8
tail -n 15 /tmp/next-dev.log

# 4. 커밋 + 푸시
git add components/layout/Footer.tsx

git commit -m "$(cat <<'EOF'
refactor: mirror sidebar+main structure in footer for exact alignment

Step 23 used pl-16 to shift footer content right by 52px (in this
project's 13px-rem context), but pixel-level calculation turned
out unreliable — the visual alignment with dashboard R widgets
still looked off to the user.

Replace the max-w + pl-16 hack with a structural mirror of
LayoutShell. Footer now has:
- <div className="flex">
  - <div className="w-14 shrink-0" /> (matches VerticalNav width)
  - <div className="flex-1 min-w-0 px-2"> (matches main + HomeClient)

Since footer's inner container uses the exact same Tailwind
class combination as the dashboard container, their left edges
are guaranteed to align regardless of rem base, subpixel rounding,
or browser zoom level.

Footer and disclaimer background stripes still span the full
1536px box width (unchanged), so Header/Ticker/Footer box-level
symmetry from Step 22 is preserved.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

---

## ✅ 시각 검증 체크리스트

**정렬 (핵심 — 픽셀 단위 일치해야 함)**
1. "서비스 안내" 제목 좌측 x좌표 = R1 마켓채팅 위젯 좌측 x좌표
2. R4 상승/하락 위젯 좌측 = "서비스 안내" 좌측
3. 면책 고지문 좌측도 동일 x좌표
4. Copyright 중앙 정렬 유지 (위 블록 안에서 center)

**배경 풀폭 유지 (Step 22 회귀 방지)**
5. Footer turquoise 배경 좌우 끝 = Header = Ticker 좌우 끝 (모두 1536)
6. Disclaimer 어두운 띠 배경도 1536 유지 (좌측 사이드바 영역도 어두운 색으로 칠해짐)

**기능 회귀 없음**
7. 링크 4개 섹션 클릭 가능
8. `grid-cols-4 gap-8` 내부 그리드 정상 렌더링
9. Step 21 사이드바 스크롤 추적 유지

---

## 💡 만약 Step 24 이후에도 미스매치가 보인다면

그건 실제로 Footer 이외의 요소와 비교하는 것. 후보:
- **Header 로고 "STOCK TERMINAL"** — `px-6` 사용 중이라 Header 내용은 box+78px에서 시작 (사용자 미언급)
- **Ticker 내용물** — TradingView widget 내부 구조에 따라 다름
- **R4 위젯 내부 글자** — 위젯 자체 패딩에 따라 시작점 이동

스크린샷에 빨간 화살표로 **어느 요소 vs 어느 요소**가 안 맞는지 표시해주면 정확히 진단 가능.

---

## 🗣️ 남은 대기 목록

1. **Step 25 (조건부)** — 24 이후에도 안 맞으면, DevTools 픽셀값 기반 수동 맞춤
2. **Col 3 뉴스/DART 위젯 내부 레이아웃** — 원래 첫 불만이었던 항목, 별도 처리
3. **Phase 2-B** — 수급 통합 탭 (`/investor-flow` → `/net-buy`). P0
4. **Phase 2-C** — 경제캘린더 미니 위젯. P1
5. **Phase 2-D** — 발굴 ↔ 관심종목 연동. P1
6. **세션 종료 처리** — 4개 문서 헤더 날짜 업데이트
