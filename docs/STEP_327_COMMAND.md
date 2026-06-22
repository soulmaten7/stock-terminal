<!-- 2026-06-20 -->
# STEP 327 — [UI] 종목·상품: 증권사 헤더 두 줄로 분리(하위탭줄=제목 / 표헤더줄=부제)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_327_COMMAND.md 파일 내용대로 실행해줘
```
- **전제**: STEP 326.

---

## 🎯 목표 (칼럼 정렬 정확히)
- **하위탭 줄**: `[주식 ETF ETN 리츠]` ↔ `증권사 바로가기`
- **표 헤더 줄**(`# 종목명 현재가 1일…1년`): ↔ `최근 분기 거래대금순`

즉 지금 컨트롤 줄에 같이 있는 `최근 분기 거래대금순`을 **표 헤더와 같은 높이(증권사 리스트 바로 위)**로 내림.

> 변경: `components/toolbox/MarketBoard.tsx` 2곳.

---

## 📄 `components/toolbox/MarketBoard.tsx` (수정 2곳)

### 1 — 컨트롤 줄 우측엔 제목만 남김
**찾기:**
```tsx
        <div className="hidden w-72 shrink-0 lg:block">
          <p className="text-sm font-bold text-unjong-primary">증권사 바로가기</p>
          <p className="text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
        </div>
```
**바꾸기:**
```tsx
        <div className="hidden w-72 shrink-0 lg:block">
          <p className="text-sm font-bold text-unjong-primary">증권사 바로가기</p>
        </div>
```

### 2 — 부제를 증권사 리스트 바로 위로(표 헤더 줄과 정렬)
**찾기:**
```tsx
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-11">
            <BrokerRanking hideHeader />
          </div>
        </aside>
```
**바꾸기:**
```tsx
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-11">
            <p className="border-b border-unjong-border px-1 py-2.5 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
            <BrokerRanking hideHeader />
          </div>
        </aside>
```

---

## ✅ 검증
```bash
npm run build
```
- 빌드 무에러.

개발 서버 — 종목·상품 탭:
1. `[주식 ETF ETN 리츠]`와 `증권사 바로가기`가 **같은 줄**.
2. 표 헤더(`# 종목명 현재가 1일…1년`)와 `최근 분기 거래대금순`이 **같은 줄**(증권사 리스트 바로 위, 표 헤더와 높이 일치).
3. 그 아래로 표 본문 ↔ 증권사 리스트가 나란히.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add components/toolbox/MarketBoard.tsx && git commit -m "ui(market): 증권사 헤더 두 줄 분리 — 하위탭줄=제목 / 표헤더줄=부제 정렬 (STEP 327)" && git push
```

---

> **한 줄 요약**: '증권사 바로가기'는 하위탭 줄, '최근 분기 거래대금순'은 표 헤더 줄(리스트 바로 위)로 분리 정렬.
