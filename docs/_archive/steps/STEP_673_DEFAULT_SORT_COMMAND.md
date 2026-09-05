<!-- 2026-07-09 -->
# STEP 673 — 📊 종목 보드 기본 정렬: 주당가격 → 거래대금순 (Round 3 발견)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** VN HOSE 403 복구 이후. 6개 보드 정상.
**목표:** 종목 보드 기본 정렬이 **주당가격(현재가) 내림차순**이라 고가주(효성중공업 268만·BRK-A $748K)가 위로 오고 **시장 대표주(삼성전자 45위·Apple·Nvidia 등)가 묻힘.** → **거래대금순(most-traded first)** 기본으로 변경(네이버·야후 표준). API가 이미 거래대금순으로 주므로 그 순서를 살린다.
**대상:** 6개 보드(`MarketBoard`·`Us`·`Jp`·`Cn`·`Vn`·`Gb`).
> ⚠️ **제품 기본값 변경**이라, 의도적으로 가격순을 원했다면 이 STEP 스킵. (검수 권장은 거래대금순.)

---

## 각 보드 공통 변경
1. **`Row` 타입에 `amount` 추가** — 리스트 API 응답의 거래대금 필드를 매핑. KR은 `/api/krx/ranking`(sort=amount) 응답의 amount(또는 거래대금 필드)를 `Row.amount`로. US/CN/JP/GB/VN은 `{cc}-list`가 이미 `amount` 반환 → Row/매핑에 포함.
   - 응답에 amount 필드명이 다르면 실측 확인(예: `amount`·`tradeValue`·`accumulatedValue`). 없으면 `price*volume` 폴백.
2. **`sortKey` 유니온에 `'amount'` 추가** + **기본값 변경**:
```ts
const [sortKey, setSortKey] = useState<'amount' | 'name' | 'price' | PeriodKey>('amount'); // 기본 거래대금순
const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
```
3. **정렬 로직에 amount 분기** (sortedRows useMemo):
```ts
if (sortKey === 'amount') { arr.sort((a,b) => (Number(b.amount||0) - Number(a.amount||0)) * (sortDir==='desc'?1:-1)); }
```
(name·price·period 기존 분기 유지.)
4. **정렬 헤더에 "거래대금" 노출**(선택·권장) — `#` 옆 또는 현재가 왼쪽에 작은 "거래대금" 정렬 헤더 추가해 사용자가 기본이 거래대금순임을 알고 클릭 전환 가능하게. 공간 빠듯하면 생략하고 기본 정렬만 바꿔도 됨.
   - 최소안: 헤더 안 바꾸고 **기본 정렬만 amount**로. (현재가/기간/이름 클릭 정렬은 그대로.)

> `LensPreview`/공유 컴포넌트는 `amount`를 이미 받을 수도(US/VN Row엔 있었음) — 타입 충돌만 정리.

## 검증 → 커밋
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && npm run dev
```
- 6개 탭 기본 화면: **거래대금 큰 종목이 위로** — KR이면 삼성전자·SK하이닉스·현대차 등 대표주가 상위(고가주 효성중공업이 1위 아님). US면 Apple·Nvidia·Tesla 등. 현재가 클릭하면 여전히 가격순 정렬됨.
- console.log 금지.
```bash
git add components/toolbox/MarketBoard.tsx components/toolbox/UsMarketBoard.tsx components/toolbox/JpMarketBoard.tsx components/toolbox/CnMarketBoard.tsx components/toolbox/VnMarketBoard.tsx components/toolbox/GbMarketBoard.tsx
git commit -m "feat(board): 기본 정렬 주당가격→거래대금순 — 시장 대표주가 상위로(네이버·야후 표준·Round 3 검수)"
git push
```

## Cowork에게 보고
- 6개 탭 기본 정렬이 거래대금순으로 바뀌어 대표주가 상위인지(KR 삼성전자·US Apple 등).
→ Round 3 계속(다른 시장 상위 종목 교차 대조) or CN #2(A주 소형주) or 광고.
