<!-- 2026-07-08 (3rd) -->
# STEP 663 — 🔬 종목·상품 우측 레일 = AI 렌즈 미리보기 (KR 보드 레퍼런스)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** HEAD `61e4be7`(STEP 662, 증권사 탭 신설). 설계=`docs/UI_BROKER_LENS_REDESIGN.md`.
**목표:** 종목·상품 탭 우측 사이드바(현 `증권사 바로가기` w-72)를 **"선택한 종목 AI 렌즈 미리보기"** 패널로 교체 + **폭 확대**. 지금 데스크탑에서 행 클릭 시 인라인으로 펼쳐지는 **기간 수익률 패노라마도 이 패널로 병합**. 종목 미선택 시 빈 상태.
**범위:** **KR `MarketBoard.tsx` 먼저(레퍼런스)** → 검증 후 STEP 663B에서 US/JP/CN/VN/GB 5개 보드 미러. (하나씩 완전히.)
**대상 파일:** `components/toolbox/MarketBoard.tsx` (+ 렌즈 압축 렌더는 `StockLensClient.tsx`/`lib/lensCompute.ts` 구조 재사용).

> 🔴 **렌즈 데이터 출처**: 보드 표의 "AI 렌즈" 컬럼은 지금 **장식 아이콘일 뿐**(실데이터 아님). 실제 렌즈는 종목 페이지가 `/api/lens?symbol=`으로 가져옴(`data.lenses[]` — momentum/quality/lowvol/valuation/assetgrowth 퍼센타일+판정). **미리보기 패널은 선택 종목의 `/api/lens`를 불러와 압축 표시**한다.

---

## 1. `LensPreview` 컴포넌트 신설 (MarketBoard.tsx 내부 or 별도 파일)

선택 종목(`selectedStock: Row | null`)을 받아:
- **미선택**: 빈 상태 카드 — `<TLensLogo/>` + "종목을 선택하면 AI 렌즈가 읽어드려요" + 한 줄 부연("검증된 기법들이 이 종목을 어떻게 보는지 요약해요").
- **선택**: 
  1. 헤더 — `StockLogo` + 종목명 + 현재가.
  2. **기간 수익률**(패노라마 병합) — 지금 인라인 패노라마(현 445~467행)에 있는 값 그대로: 1일전 `changePercent`·1주 `r1w`·1개월 `r1m`·3개월 `r3m`·6개월 `r6m`·1년 `r1y` (Row에 이미 있음·fetch 불필요). `pct`/`pctColor` 유틸 재사용.
  3. **AI 렌즈 요약** — `useEffect`로 `/api/lens?symbol=${selectedStock.symbol}` 호출 → `data.lenses` 압축 표시. **각 렌즈 = 이름(한글) + 읽기(강함/보통/약함 등) + 신뢰도 배지.** 렌더 로직은 **`StockLensClient.tsx`의 렌즈 카드/신뢰도 배지(검증·표본약함·건전성·참고용) 표기를 압축 재사용**(그 파일에서 배지 매핑·verdict 라벨 로직을 찾아 컴팩트 버전으로). 로딩/실패는 조용히("렌즈 읽는 중…"/숨김).
  4. **CTA** — "전체 렌즈·근거 보기 →" 링크 `/stock/${selectedStock.symbol}` (`AiLensBadge href arrow` 재사용 가능).

```tsx
function LensPreview({ stock }: { stock: Row | null }) {
  const [lenses, setLenses] = useState<LensItem[] | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  useEffect(() => {
    if (!stock) { setState('idle'); setLenses(null); return; }
    let alive = true; setState('loading');
    fetch('/api/lens?symbol=' + encodeURIComponent(stock.symbol))
      .then((r) => r.json())
      .then((j) => { if (!alive) return; setLenses(j.lenses || []); setState('done'); })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [stock?.symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stock) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-white p-4 text-center">
        <TLensLogo size={22} color="#2DD4BF" />
        <p className="mt-2 text-sm font-semibold text-unjong-primary">종목을 선택하면 AI 렌즈가 읽어드려요</p>
        <p className="mt-1 text-[12px] leading-relaxed text-unjong-muted">검증된 기법들이 이 종목을 어떻게 보는지 요약해요.</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-unjong-border bg-white p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2.5">
        <StockLogo code={stock.symbol} name={stock.name} size={32} />
        <div className="min-w-0"><p className="truncate font-semibold text-unjong-primary">{stock.name}</p>
          <p className="text-[12px] tabular-nums text-unjong-muted">{stock.price ? formatPrice(stock.price, 'KR') : '—'}</p></div>
      </div>
      {/* 기간 수익률(패노라마 병합) */}
      <div className="mt-3 grid grid-cols-3 gap-y-2">
        {([['1일',stock.changePercent],['1주',stock.r1w],['1개월',stock.r1m],['3개월',stock.r3m],['6개월',stock.r6m],['1년',stock.r1y]] as [string, number|null|undefined][]).map(([l,v]) => (
          <div key={l} className="flex flex-col"><span className="text-[11px] text-unjong-muted">{l}</span><span className={`text-sm font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</span></div>
        ))}
      </div>
      {/* AI 렌즈 요약 (압축) */}
      <div className="mt-3 border-t border-unjong-border pt-3">
        <div className="mb-1.5 flex items-center gap-1"><TLensLogo size={12} color="#2DD4BF" /><span className="text-[12px] font-semibold text-unjong-primary">AI 렌즈</span></div>
        {state === 'loading' ? <p className="text-[12px] text-unjong-muted">렌즈 읽는 중…</p>
          : state === 'done' && lenses?.length ? (
            <ul className="space-y-1">{lenses.map((l) => (
              <li key={l.key} className="flex items-center justify-between text-[12px]">
                <span className="text-unjong-primary">{l.labelKo /* 렌즈 한글명 */}</span>
                <span className="flex items-center gap-1.5"><span className="text-unjong-muted">{l.readKo /* 강함/보통/약함 */}</span>{/* 신뢰도 배지: StockLensClient 매핑 재사용 */}</span>
              </li>))}</ul>
          ) : <p className="text-[12px] text-unjong-muted">렌즈 정보 준비 중</p>}
      </div>
      <a href={`/stock/${stock.symbol}`} className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-unjong-accent/10 py-2 text-[12px] font-semibold text-unjong-accent hover:bg-unjong-accent/15">전체 렌즈·근거 보기 →</a>
    </div>
  );
}
```
> `LensItem`/`labelKo`/`readKo`/신뢰도 배지 = **`/api/lens` 실제 응답 + `StockLensClient.tsx` 렌즈 렌더에서 정확한 필드·라벨·배지 매핑을 확인해 맞춘다**(추측 금지 — 그 파일에 이미 있음). 압축이라 "이게 뭐예요/자세히" 접힘은 생략, 이름+읽기+신뢰도만.

## 2. 레일 배선 (MarketBoard.tsx)

- **컨트롤 줄 헤더**(현 243~272행, `우(w-72)=증권사 바로가기 헤더`): "증권사 바로가기" 텍스트 제거 → 레일 헤더도 폭만 맞추거나 비움(패널 자체에 헤더 있으니 이 줄의 우측 헤더는 삭제 가능). **w-72 → w-96**로 확대(좌 표는 `flex-1`이라 자동 축소).
- **사이드바**(현 539~541행 `<aside w-72><BrokerRanking hideHeader/></aside>`) → **`<aside className="hidden w-96 shrink-0 lg:block"><LensPreview stock={selectedStock} /></aside>`**. `BrokerRanking` import는 이제 이 파일에서 미사용이면 제거(증권사는 STEP 662 탭에 있음).
- **인라인 패노라마 제거**(현 444~467행) — 기간 수익률이 LensPreview로 갔으니 행 클릭 시 펼쳐지던 `<tr>` 삭제. (행 클릭 = `selectStock`만 유지 → 우측 패널이 반응.)
- `AdSlotRow`(469~471행)는 **이번엔 그대로 유지**(STEP 664에서 유료-only 처리).

## 3. 모바일 (선택·권장)
모바일 하단 시트(현 546행~)에도 `LensPreview`의 렌즈 요약을 넣으면 데스크탑과 일관. 시트 내부에 기간 수익률 이미 있으면 그 아래 렌즈 요약만 추가(같은 fetch 재사용). 시간 빠듯하면 이번 STEP은 데스크탑 레일만 하고 모바일은 663B로.

---

## 4. 검증 → 커밋
```bash
npx tsc --noEmit          # EXIT 0
```
- 클라 컴포넌트 → HMR 즉시. 데스크탑에서 종목·상품 탭:
  - 미선택: 우측에 "종목을 선택하면…" 빈 상태.
  - 종목 클릭: 우측에 종목 헤더 + 기간수익률 + **/api/lens 렌즈 요약**(모멘텀·밸류 등 읽기+신뢰도) + "전체 렌즈 보기" 링크. 인라인 패노라마는 더 이상 안 펼쳐짐.
  - 레일이 넓어짐(w-96). 증권사 사이드바 사라짐(증권사 탭엔 그대로 있음).
- 렌즈 필드/라벨이 안 맞으면 `/api/lens` 응답을 콘솔 아닌 실호출로 확인(`curl "http://localhost:3333/api/lens?symbol=005930.KS"`)해 매핑 교정.
- console.log 금지.
```bash
git add "components/toolbox/MarketBoard.tsx"
git commit -m "feat(ui): STEP 663 종목·상품 우측 레일=AI 렌즈 미리보기(KR) — 사이드바 증권사 제거·패노라마 병합·폭확대·/api/lens 압축"
git push
```

## Cowork에게 보고
1. 렌즈 미리보기 렌더 품질(005930 삼성전자·000660 SK하이닉스로 눈검수) — 렌즈 읽기+신뢰도 맞는지.
2. `/api/lens` 실제 필드명(labelKo/readKo/배지) — 내가 STEP에 쓴 이름과 실제 차이.
3. 레일 폭 w-96 느낌(더 넓/좁게?).
→ 다음 = **STEP 663B**(US/JP/CN/VN/GB 보드 미러 + 모바일 시트 렌즈) → **STEP 664**(광고 슬롯 유료-only).
