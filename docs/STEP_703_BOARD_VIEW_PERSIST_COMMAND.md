# STEP 703 — 종목보드 뷰 상태 복원 (렌즈 상세 왕복 시 정렬·페이지 유지)

🔴 **Opus 권장** — 6개 보드 + 스토어 걸친 섬세한 상태 리팩토링(마운트 vs 실제 변경 구분).

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```
그다음: `@docs/STEP_703_BOARD_VIEW_PERSIST_COMMAND.md 파일 내용대로 실행해줘`

---

## 목표
종목보드에서 종목을 눌러 **TR-AI 렌즈 상세(`/stock/[symbol]`)로 갔다가 "뒤로"로 돌아오면**, 이전에 보던 **하위탭·정렬키·정렬방향·페이지가 그대로 복원**되게 한다.

**현재 문제**: "뒤로"(`router.back()`)는 정상인데, 홈 보드가 새로 마운트되며 내부 `useState`가 기본값으로 리셋된다(국가는 `countryStore`(Zustand persist)라 유지되지만 하위탭·정렬·페이지는 각 보드 local state라 날아감). 또 각 보드의 "하위탭 변경 시 정렬 리셋" 이펙트가 **마운트 때도** 돌아 정렬을 `amount·desc`로 되돌린다.

**범위(확정)**:
- ✅ 렌즈 상세 **왕복 시에만** 복원.
- ✅ **국가 전환 시엔 초기화**(국가 전환 = 맥락 이탈, 이전 개념과 완전 다름).
- ✅ 전체 새로고침 시 초기화(정상 — 모듈 메모리라 자동).
- ✅ 데스크탑·**모바일 자동 적용**(같은 컴포넌트·같은 상태라 별도 코드 없음).
- ❌ 스크롤 복원 불필요(보드가 페이지네이션 — `page`만 복원하면 3페이지가 그대로 뜸).
- ❌ 선택 종목(우측 레일/모바일 시트) 복원은 범위 밖.

## 전제 상태
- HEAD = 직전 "렌즈 정직 표시(LensPreview)" 커밋 이후. 6개 종목보드 정렬 버그 수정(`(a-b)*dir`) 반영된 상태.
- 대상 보드: `MarketBoard`(KR)·`UsMarketBoard`·`JpMarketBoard`·`CnMarketBoard`·`VnMarketBoard`·`GbMarketBoard`.
- 국가 스토어: `stores/countryStore.ts` — `country`, `setCountry`(persist). 국가 탭 클릭 = `components/toolbox/ToolboxClient.tsx`의 `onClick={() => setCountry(c.code)}`.

---

## 변경 1 — 신규 파일 `lib/boardMemory.ts`
모듈 레벨 Map으로 보드 뷰 상태를 국가별로 임시 기억. 클라이언트 네비게이션(/stock ↔ 홈) 사이엔 유지, 전체 새로고침 시 소멸, 국가 전환 시 `clearBoardViews()`로 명시적 소멸.

```ts
// 종목보드 뷰 상태(하위탭·정렬·페이지) 임시 기억 — 렌즈 상세 왕복 시 복원용.
// 모듈 레벨이라 SPA 네비게이션 사이엔 유지 · 전체 새로고침 시 초기화(정상) · 국가 전환 시 clearBoardViews().
export type BoardView = {
  sub?: string;              // 하위탭(stock/etf/etn/reit 등)
  sortKey: string;           // 정렬 키
  sortDir: 'asc' | 'desc';
  page: number;
  market?: string;           // KR 전용: 코스피/코스닥 세그먼트(있으면)
};

const mem = new Map<string, BoardView>();
export const saveBoardView = (country: string, v: BoardView) => { mem.set(country, v); };
export const loadBoardView = (country: string): BoardView | undefined => mem.get(country);
export const clearBoardViews = () => { mem.clear(); };
```

## 변경 2 — 6개 보드 각각 (국가 코드는 보드별 고정: KR/US/JP/CN/VN/GB)
각 보드에서 아래 3가지를 적용한다. **보드마다 변수명·리셋 라인·dep 배열이 조금씩 다르니, 각 파일을 읽고 그 보드의 실제 상태변수에 맞춰 적용할 것.**

**(a) import 추가**
```ts
import { saveBoardView, loadBoardView } from '@/lib/boardMemory';
```

**(b) 상태 lazy-init을 메모리에서** — 기존 `useState('amount')` 등을 메모리 우선으로. 예(US, 국가='US'):
```ts
const [tab, setTab] = useState<SubTab>(() => (loadBoardView('US')?.sub as SubTab) ?? 'stock');
const [sortKey, setSortKey] = useState<'amount' | 'name' | 'price' | PeriodKey>(() => (loadBoardView('US')?.sortKey as 'amount' | 'name' | 'price' | PeriodKey) ?? 'amount');
const [sortDir, setSortDir] = useState<'desc' | 'asc'>(() => loadBoardView('US')?.sortDir ?? 'desc');
const [page, setPage] = useState(() => loadBoardView('US')?.page ?? 0);
```
- KR(`MarketBoard`)은 **코스피/코스닥 세그먼트 상태변수도** 같은 방식으로 `market`에서 lazy-init(그 보드의 실제 변수명 사용).
- 보드마다 하위탭 타입명(`SubTab`)·기본값(`'stock'`)·정렬 유니온 타입이 다르니 실제에 맞출 것.

**(c) "하위탭 변경 시 리셋" 이펙트를 첫 마운트엔 스킵** — 그 이펙트 안의 `setSearch('')/setPage(0)/setSortKey('amount')/setSortDir('desc')` 리셋 블록을 `firstRun` ref로 감싸 **마운트 때는 건너뛰고**(복원값 보존), 실제 하위탭 전환 때만 리셋. 페치 로직은 그대로 항상 실행.
```ts
const firstRun = useRef(true);
useEffect(() => {
  let cancelled = false;
  if (!firstRun.current) {
    setSearch(''); setPage(0); setSortKey('amount'); setSortDir('desc');
    // (KR이면 market 세그먼트도 기본값으로 리셋)
  }
  firstRun.current = false;
  /* ...기존 캐시/페치 로직 그대로... */
  return () => { cancelled = true; };
}, [tab]);
```
- `useRef` import 누락 시 추가.
- 이미 `firstRun`/유사 ref가 있으면 재사용.

**(d) 저장 이펙트 추가** — 뷰 상태 바뀔 때마다 메모리에 저장:
```ts
useEffect(() => {
  saveBoardView('US', { sub: tab, sortKey, sortDir, page /*, market: <KR세그먼트> */ });
}, [tab, sortKey, sortDir, page /*, market */]);
```

## 변경 3 — `components/toolbox/ToolboxClient.tsx` (국가 전환 시 초기화)
```ts
import { clearBoardViews } from '@/lib/boardMemory';
```
국가 탭 클릭 핸들러(현재 `onClick={() => setCountry(c.code)}`)를:
```ts
onClick={() => { clearBoardViews(); setCountry(c.code); }}
```
→ 국가 전환 시 모든 보드 메모리 소멸 → 새 국가 보드는 기본값. (같은 국가로 /stock 왕복은 국가 클릭이 없으니 유지됨.)

---

## 동작 검증(수동)
1. 미국 탭 → 현재가 헤더 클릭해 **내림차순 정렬** → **3페이지**로 이동 → 아무 종목 "TR-AI 렌즈·근거 보기" → 상세페이지 → **"뒤로"** → **현재가 내림차순·3페이지 그대로** 떠야 함. ✅
2. 하위탭(주식↔ETF) **직접 전환** 시엔 정렬이 기본값으로 리셋돼야 함(기존 동작 유지). ✅
3. **국가 전환**(미국→한국) 시엔 초기화(기본 정렬·1페이지). ✅
4. 전체 **새로고침** 시 초기화(정상). ✅
5. **모바일**에서도 1~4 동일하게 동작(같은 컴포넌트). ✅
6. KR: 코스피/코스닥 세그먼트도 왕복 시 유지, 국가 전환 시 초기화. ✅
7. `npm run build` 통과 · console.log 없음.

## 커밋
```
fix(board): 렌즈 상세 왕복 시 종목보드 뷰(하위탭·정렬·페이지) 복원 — 국가 전환/새로고침 시엔 초기화

- lib/boardMemory.ts(모듈 Map): saveBoardView/loadBoardView/clearBoardViews
- 6개 보드: 상태 lazy-init(메모리 우선) + 하위탭 리셋 이펙트 첫 마운트 스킵(firstRun ref) + 변경 시 저장. KR은 코스피/코스닥 세그먼트도 포함
- ToolboxClient: 국가 탭 클릭 시 clearBoardViews()(맥락 이탈=초기화)
- 데스크탑·모바일 공용 컴포넌트라 자동 동일 적용. 스크롤은 페이지네이션이라 page 복원으로 충분
```
빌드 통과 확인 후 `git add -A && git commit && git push`.
