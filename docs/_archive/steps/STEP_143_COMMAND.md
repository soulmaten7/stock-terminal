<!-- 2026-06-03 -->
# STEP 143 — 홈 빈 섹션·버그 수정 + 시각 밀도 보강

## 🟢 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
호출법: `@docs/STEP_143_COMMAND.md 파일 내용대로 실행해줘`

---

## 🎯 목표

STEP 142 포털 홈에서 **비어 보이는/깨진 데이터 섹션 3곳을 살리고**, 랭킹에 시각 요소(레터 아바타)를 넣어 밀도를 높인다. 전부 응답 키 불일치·죽은 소스 버그 수정 — **마이그레이션 없음**.

진단(확인 완료):
1. **브리핑 빈칸** — `/api/home/briefing` 의 overnight 가 야후 `quoteResponse` raw fetch(빈값) 사용 → `yahooFinance.quote()` 라이브러리로 교체(같은 레포의 `/api/home/sectors` 는 이 방식으로 정상 동작).
2. **거래량 랭킹 "1.0x +0.0%"** — `HomeGlobalRanking` 이 실제 `price`·`changePercent` 무시하고 `spike`·0% 표시 → 실제 값 매핑.
3. **업종·테마 빈칸** — `HomeSectorTheme` 미국탭이 `market=US` 누락 + 응답키 `sector`/`change` 를 `name`/`changePct` 로 오독, 국내탭은 불안정한 `kis/theme` → 둘 다 `/api/home/sectors?market=KR|US` + 올바른 키.

> 등락색 토스식(상승 `#1AC267`/하락 `#F04452`). 운종 자체 UI·데이터만 사용(타사 로고/에셋 복제 ❌).

---

## 📌 전제 상태
- **이전 HEAD**: `a6cf701` (STEP 142). *시작 전 `git log --oneline -1` 확인.*
- 마이그레이션·DB 변경 없음.
- 확인된 실제 응답 키:
  - `/api/home/briefing` → `{ overnight:[{label,val,change,up}], schedule:[string] }`
  - `/api/home/sectors?market=KR|US` → `{ sectors:[{sector,change,count}], market }`
  - `/api/kis/volume-rank` → `{ stocks:[{rank,symbol,name,price,changePercent,volume,spike,tradeAmount}] }`
  - `/api/kis/movers` → `{ items:[{symbol,name,price,priceText,changePercent,...}] }`

---

## 🔢 작업 순서

### STEP 1 — 브리핑 overnight 소스 교체 (`app/api/home/briefing/route.ts`)

`fetchUsIndices()` 가 raw `fetch(...quoteResponse...)` 대신 **`yahoo-finance2` 라이브러리**를 쓰도록 교체(미국 지수 4종). `/api/home/sectors` 의 `yahooFinance.quote(symbols)` 패턴 그대로.

```ts
import yahooFinance from "yahoo-finance2";
// ...
async function fetchUsIndices() {
  const SYMS = [
    { symbol: "^GSPC", label: "S&P 500" },
    { symbol: "^IXIC", label: "NASDAQ" },
    { symbol: "^DJI",  label: "DOW" },
    { symbol: "^VIX",  label: "VIX" },
  ];
  try {
    const q = await yahooFinance.quote(SYMS.map((s) => s.symbol));
    const arr = (Array.isArray(q) ? q : [q]) as Array<Record<string, unknown>>;
    return SYMS.map((s) => {
      const hit = arr.find((x) => x.symbol === s.symbol);
      const price = Number(hit?.regularMarketPrice ?? 0);
      const pct = Number(hit?.regularMarketChangePercent ?? 0);
      return {
        label: s.label,
        val: price >= 1000 ? price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : price.toFixed(2),
        change: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
        up: pct >= 0,
      };
    });
  } catch {
    return SYMS.map((s) => ({ label: s.label, val: "—", change: "—", up: true }));
  }
}
```
- `schedule`(DART): 오늘 공시가 0건이면 빈칸이 되니, 조회 범위를 **최근 3일**로 넓혀 최소 몇 건은 나오게(`bgn_de` 를 오늘-3일). 그래도 0이면 그대로 빈 배열.
> 기존 raw fetch 헬퍼·상수는 제거. 응답 키 `{ overnight, schedule }` 유지(컴포넌트 안 건드림).

---

### STEP 2 — 거래량 랭킹 실제 값 매핑 (`components/home-v6/HomeGlobalRanking.tsx`)

volume-rank 매핑을 실제 `price`·`changePercent` 로 교체(가짜 "spike x"·0% 제거):
```tsx
if (vr?.stocks) {
  setVolume(vr.stocks.map((s: { symbol: string; name: string; price: number; changePercent: number }) => ({
    code: s.symbol,
    name: s.name,
    price: (s.price ?? 0).toLocaleString("ko-KR"),
    changePct: s.changePercent ?? 0,
  })));
}
```
- `volume-rank` 요청 파라미터의 `sort=spike` 는 두어도 무방(라우트가 거래량순 반환). 컬럼 제목 "🔥 거래량 급증" 유지.

---

### STEP 3 — 업종·테마 소스·키 수정 (`components/home-v6/HomeSectorTheme.tsx`)

두 탭 모두 `/api/home/sectors` + 올바른 `market`·키:
```tsx
const market = tab === "미국" ? "US" : "KR";
const j = await (await fetch(`/api/home/sectors?market=${market}`)).json();
const rows = (j.sectors || []).map((s: { sector: string; change: number }) => ({
  name: s.sector,
  changePct: Number(s.change ?? 0),
}));
if (!cancelled) setItems(rows);
```
- `kis/theme` 호출 제거(불안정). 막대 그래프·카드 렌더는 기존 유지.

---

### STEP 4 — 랭킹 레터 아바타 (시각 밀도, `HomeGlobalRanking.tsx`)

종목 로고가 없으므로 **이름 첫 글자 컬러 원형 아바타**로 밀도를 준다(타사 로고 복제 ❌). `RankList` 의 각 행 순위 숫자 옆에 추가:
```tsx
function avatarColor(name: string): string {
  const colors = ["bg-blue-100 text-blue-700","bg-emerald-100 text-emerald-700","bg-amber-100 text-amber-700","bg-violet-100 text-violet-700","bg-rose-100 text-rose-700","bg-slate-100 text-slate-700"];
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
  return colors[h];
}
// 행 내부, 순위 숫자 다음:
<span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(r.name)}`}>
  {r.name.charAt(0)}
</span>
```
> "등락률 상위"·"거래량 급증" 두 열 모두 적용.

---

### STEP 5 — 빌드 + 커밋

```bash
cd ~/stock-terminal && npm run build
```
✓ exit 0 · `console.log` 금지.

```bash
cd ~/stock-terminal && git add app/api/home/briefing/route.ts \
  components/home-v6/HomeGlobalRanking.tsx components/home-v6/HomeSectorTheme.tsx \
  && git commit -m "fix(v6): 홈 빈 섹션 복구 — 브리핑 야후 라이브러리 교체 + 거래량랭킹 실값 + 업종테마 market/키 수정 + 랭킹 레터아바타 (STEP 143)" \
  && git push
```

---

### STEP 6 — 문서 갱신

오늘(2026-06-03):
- `CLAUDE.md` · `docs/CHANGELOG.md` · `session-context.md` · `docs/NEXT_SESSION_START.md` 헤더 + STEP 143 블록
- `docs/NEXT_SESSION_PLAYBOOK.md` (HEAD 갱신)
- `docs/SESSION_KICKOFF.md` (현재 커밋)

---

## ✅ 완료 기준 (DoD)

1. 시장 브리핑에 "간밤 미국 시장"(S&P·NASDAQ·DOW·VIX) 실데이터 표시(장중/마감 무관 최근값).
2. 실시간 랭킹 "거래량 급증"이 실제 종목명·가격·등락%로 표시(1.0x·0% 버그 제거).
3. 인기 업종·테마 국내/미국 탭 모두 데이터 표시(업종명 + 등락% + 막대).
4. 랭킹 각 행에 레터 아바타.
5. `npm run build` ✓ exit 0 + push.
6. 6개 문서 갱신.

## ⚠️ 주의
- 마이그레이션·DB 변경 ❌.
- 야후 호출은 라우트 캐시(s-maxage) 안에서 — 컴포넌트 폴링 간격 유지.
- 뉴스 썸네일은 RSS 이미지 소스 없음 → 이번 범위 제외(지어내지 말 것).
- 타사 로고·고유 디자인 에셋 복제 ❌ — 레터 아바타 등 운종 자체 UI 로.
- 데이터가 실제로 0인 섹션(인기 토론글=실제 글 0건)은 버그 아님 — EmptyState 정상.

---

> **STEP 143 = 홈 "빈 화면" 해소.** 이후: 지수 카드 스파크라인(별도 history 소스 필요) · 인기글 시드 · 레이아웃 비율 미세조정.
