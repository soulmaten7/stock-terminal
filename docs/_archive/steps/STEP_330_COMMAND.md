<!-- 2026-06-20 -->
# STEP 330 — [UI] 증권사 바로가기 sticky 고정 해제

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_330_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
종목·상품 우측 증권사 바로가기가 스크롤 시 티커 밑에 **고정(sticky)** 되어 있는 걸 해제 → 페이지와 함께 자연스럽게 스크롤.

> 변경: `components/toolbox/MarketBoard.tsx` 1곳.

---

## 📄 `components/toolbox/MarketBoard.tsx`

**찾기:**
```tsx
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-11">
            <p className="border-b border-unjong-border px-1 py-2.5 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
            <BrokerRanking hideHeader />
          </div>
        </aside>
```
**바꾸기:**
```tsx
        <aside className="hidden w-72 shrink-0 lg:block">
          <p className="border-b border-unjong-border px-1 py-2.5 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
          <BrokerRanking hideHeader />
        </aside>
```

---

## ✅ 검증
```bash
npm run build
```
- 빌드 무에러.

개발 서버: 스크롤하면 증권사 바로가기가 고정되지 않고 표와 함께 내려감.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add components/toolbox/MarketBoard.tsx && git commit -m "ui(market): 증권사 바로가기 sticky 고정 해제 (STEP 330)" && git push
```

---

> **한 줄 요약**: 증권사 바로가기 sticky 제거 → 페이지와 함께 스크롤.
