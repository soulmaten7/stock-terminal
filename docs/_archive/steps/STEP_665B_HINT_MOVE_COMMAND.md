<!-- 2026-07-08 (3rd) -->
# STEP 665B — 📍 "AI 렌즈·브리핑" 클릭 힌트 위치 이동 (컨트롤 줄 안으로)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** HEAD `b27bbd7`(STEP 665). 표 위에 별도 줄로 넣은 클릭 힌트가 빈 공간을 만들어 UI가 어색함.
**목표:** 힌트를 **컨트롤 줄의 하위탭(주식/ETF/ETN/리츠) 뒤 ~ 검색 박스 앞 빈 공간**으로 옮긴다(데스크탑 전용). 별도 줄 제거 → 빈 공간 활용.
**대상:** 6개 보드(`MarketBoard`·`Us`·`Jp`·`Cn`·`Vn`·`Gb`).

---

## 각 보드 공통 변경

**(a) STEP 665에서 넣은 표 위 별도 줄 힌트 제거**
```tsx
<p className="mb-1.5 hidden text-[11px] text-unjong-muted lg:block">종목을 클릭하면 우측에 <span ...>AI 렌즈·브리핑</span>이 나와요.</p>
```
→ 삭제.

**(b) 컨트롤 줄 하위탭 컨테이너 안, `SUBTABS.map(...)` **바로 뒤**에 힌트 추가** (리츠 버튼 다음, 같은 flex 컨테이너 안):
```tsx
<div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
  {SUBTABS.map((s) => ( ...버튼... ))}
  {/* ↓ 추가: 하위탭 뒤 빈 공간에 클릭 힌트(데스크탑 전용) */}
  <p className="ml-2 hidden shrink-0 items-center self-center whitespace-nowrap text-[11px] text-unjong-muted lg:flex">
    종목 클릭 시 우측에 <span className="ml-1 font-medium text-unjong-accent">AI 렌즈·브리핑</span>
  </p>
</div>
```
- 하위탭 컨테이너(`flex-1`)는 그대로 두면 버튼+힌트가 왼쪽에 붙고 남는 공간이 검색 박스 앞에 남음 → 힌트가 리츠와 검색 사이에 위치.
- `lg:flex`(데스크탑만)·`shrink-0`·`whitespace-nowrap`로 모바일에선 숨고 데스크탑에선 줄바꿈 없이.
- 문구는 한 줄에 맞게 축약("종목 클릭 시 우측에 AI 렌즈·브리핑").

> 보드마다 하위탭 세트는 다를 수 있으나(예: US는 주식/ETF만) **구조는 동일**(하위탭 컨테이너 + 검색). 각 보드의 그 컨테이너 안 map 뒤에 동일하게 삽입.

---

## 검증 → 커밋
```bash
npx tsc --noEmit          # EXIT 0
```
- 6개 탭 데스크탑: 힌트가 **하위탭 뒤 ~ 검색 박스 앞**에 자리, 표 위 빈 줄 사라짐. 모바일: 힌트 숨김·레이아웃 정상.
- 좁은 데스크탑 폭에서 힌트가 검색 박스를 밀어내지 않는지(밀면 `truncate`나 더 짧은 문구로). console.log 금지.
```bash
git add components/toolbox/MarketBoard.tsx components/toolbox/UsMarketBoard.tsx components/toolbox/JpMarketBoard.tsx components/toolbox/CnMarketBoard.tsx components/toolbox/VnMarketBoard.tsx components/toolbox/GbMarketBoard.tsx
git commit -m "fix(ui): STEP 665B 클릭 힌트를 컨트롤 줄(하위탭 뒤·검색 앞)으로 이동 — 빈 줄 제거·공간 활용"
git push
```

## Cowork에게 보고
- 6개 탭 힌트 위치·정렬 정상 + 좁은 폭에서 검색 박스 안 밀리는지.
→ 다음 = STEP 666(지수 티커 6개국 + 색/구분선/범례/대비).
