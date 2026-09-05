<!-- 2026-05-27 -->
# STEP 95-E1 — ChartTab 풀폭 사이즈 핫픽스

> **목표**: 종목 상세의 차트 placeholder 가 세로로 너무 긴 문제 수정. 풀폭에서 가로 길게, 세로는 300px 고정.
> **세션**: #25
> **전제**: STEP 95-E 완료 (`ea52558`), 3컬럼 구조 작동 중
> **유형**: 단일 컴포넌트 핫픽스 (30분 이내)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_95E1_COMMAND.md 파일 내용대로 실행해줘
```

---

## 문제

현재 화면에서 종목 상세 (StockDetailPanel inline 모드) 의 ChartTab 차트 placeholder 가 `aspect-[4/3]` 비율이라 풀폭에서:
- 폭 1000px → 세로 750px (4:3 비율)
- 세로 너무 길고 좌우 SVG 라인이 가운데 작게 표시됨 (preserveAspectRatio 디폴트)

→ **세로 길이 고정 + SVG 가로로 늘어남** 으로 수정.

---

## 작업 1 — `components/sidepanel/StockDetailPanel.tsx` 의 ChartTab 수정

ChartTab 함수 안의 차트 placeholder 부분을 다음으로 교체:

### Before

```tsx
function ChartTab() {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-1">
        {["1분", "3분", "5분", "30분", "일봉", "주봉", "월봉"].map((interval) => (
          <button ...>{interval}</button>
        ))}
      </div>

      {/* 차트 placeholder — 단순 SVG 모형 */}
      <div className="aspect-[4/3] rounded border border-unjong-border bg-unjong-background flex items-center justify-center relative overflow-hidden">
        <svg
          viewBox="0 0 400 300"
          className="absolute inset-0 w-full h-full opacity-30"
          aria-hidden
        >
          <polyline
            points="20,200 60,180 100,210 140,150 180,160 220,120 260,140 300,90 340,110 380,70"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-unjong-success"
          />
          {/* ... */}
        </svg>
        <div className="relative text-center px-4">
          <p className="text-sm font-medium text-unjong-primary">📈 차트</p>
          <p className="text-[10px] text-unjong-muted mt-1">
            Layer 1 — TradingView · lightweight-charts 연결
          </p>
        </div>
      </div>
    </div>
  );
}
```

### After

```tsx
function ChartTab() {
  return (
    <div className="p-3 space-y-3">
      {/* 시간 간격 버튼 */}
      <div className="flex items-center gap-1">
        {["1분", "3분", "5분", "30분", "일봉", "주봉", "월봉"].map((interval) => (
          <button
            key={interval}
            type="button"
            className="text-[10px] text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background px-2 py-1 rounded"
          >
            {interval}
          </button>
        ))}
      </div>

      {/* 차트 placeholder — 풀폭, 세로 고정 300px */}
      <div className="w-full h-[300px] rounded border border-unjong-border bg-unjong-background flex items-center justify-center relative overflow-hidden">
        <svg
          viewBox="0 0 1600 400"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full opacity-30"
          aria-hidden
        >
          {/* 가로 길게 펼쳐진 캔들 라인 */}
          <polyline
            points="50,300 150,260 280,290 400,210 530,230 660,180 800,200 930,150 1050,180 1180,140 1320,170 1450,110 1550,130"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-unjong-success"
          />
          {/* 가로 격자선 */}
          <line x1="0" y1="100" x2="1600" y2="100" stroke="currentColor" strokeWidth="1" strokeDasharray="8 8" className="text-unjong-border" />
          <line x1="0" y1="200" x2="1600" y2="200" stroke="currentColor" strokeWidth="1" strokeDasharray="8 8" className="text-unjong-border" />
          <line x1="0" y1="300" x2="1600" y2="300" stroke="currentColor" strokeWidth="1" strokeDasharray="8 8" className="text-unjong-border" />
        </svg>
        <div className="relative text-center px-4 z-10">
          <p className="text-sm font-medium text-unjong-primary">📈 차트</p>
          <p className="text-[10px] text-unjong-muted mt-1">
            Layer 1 — TradingView · lightweight-charts 연결
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 핵심 변경

| 항목 | Before | After |
|------|--------|-------|
| 컨테이너 크기 | `aspect-[4/3]` (가로:세로 4:3) | `w-full h-[300px]` (풀폭 + 300px 고정) |
| SVG viewBox | `0 0 400 300` (4:3) | `0 0 1600 400` (4:1 가로) |
| preserveAspectRatio | (디폴트 — 비율 유지) | `none` (강제 늘림) |
| polyline 좌표 | 400×300 기준 | 1600×400 기준 (13 포인트) |
| 격자선 | 2개 (가로) | 3개 (가로) |
| z-index | (없음) | `z-10` (텍스트가 SVG 위) |

→ 결과: 차트 풀폭으로 펼쳐지고, 세로 300px 고정. 좌우 빈 공간 없음.

---

## 작업 2 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build
```

확인:
- 빌드 성공, TypeScript 오류 0
- StockDetailPanel.tsx 정상 컴파일

---

## 작업 3 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add components/sidepanel/StockDetailPanel.tsx docs/STEP_95E1_COMMAND.md
git status
git commit -m "fix: STEP 95-E1 - ChartTab 풀폭 사이즈 핫픽스

문제: ChartTab 의 차트 placeholder 가 aspect-[4/3] 비율이라
풀폭에서 세로가 너무 길게 표시 (예: 폭 1000 → 세로 750).
SVG 라인도 가운데 좁게 표시됨 (preserveAspectRatio 디폴트).

수정:
- 컨테이너: aspect-[4/3] → w-full h-[300px] (풀폭 + 세로 고정)
- SVG viewBox: 400×300 → 1600×400 (가로 4:1 비율)
- preserveAspectRatio='none' 추가 (강제 풀폭 늘림)
- polyline 좌표 새 viewBox 에 맞게 13 포인트로 재배치
- z-10 으로 텍스트 SVG 위에 표시

결과: 차트 풀폭으로 펼쳐지고 좌우 빈 공간 없음."
git push
```

---

## 검증 체크리스트

- [ ] `ChartTab` 의 차트 placeholder 컨테이너 = `w-full h-[300px]`
- [ ] SVG viewBox = `0 0 1600 400`, `preserveAspectRatio="none"`
- [ ] polyline 좌표가 1600×400 비율에 맞게 펼쳐짐
- [ ] 격자선 3개 (y=100, 200, 300)
- [ ] 빌드 클린
- [ ] git push 완료

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 95-E1 완료. ChartTab 풀폭 사이즈 핫픽스 끝.

수정:
- 컨테이너 w-full h-[300px] (풀폭 + 세로 고정)
- SVG viewBox 1600×400 + preserveAspectRatio='none'
- polyline 좌표 13 포인트로 재배치

빌드 클린, git push 완료 (커밋 [해시])

브라우저에서 확인:
  http://localhost:3333/scalper
    → 종목 상세 차트가 가로로 풀폭으로 펼쳐짐
    → 세로 300px 고정, 좌우 빈 공간 없음
```

---

## ⚠️ 주의 사항

1. **단일 컴포넌트만 수정** — StockDetailPanel.tsx 의 ChartTab 함수만
2. **다른 탭 (호가창/체결/종합) 은 건드리지 말 것**
3. **호가창·체결·종합 탭 디자인 문제 발견 시** — 별도 핫픽스로 따로 처리
4. **`preserveAspectRatio="none"` 은 SVG 왜곡 허용** — Layer 1 에서 실 차트 연결 시 자연스럽게 해결됨
5. **빌드 깨지면 즉시 보고**
6. **console.log 남기지 말 것**
