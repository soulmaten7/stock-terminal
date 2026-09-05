# STEP 53 — OrderBookWidget 리팩토링 (P0 Phase A)

**실행 명령어**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태**
- 직전 커밋: `43e28f4` (STEP 52B 중복 파일 정리)
- 빌드 통과 상태
- 참고 문서: `docs/WIDGET_SPEC_OrderBook.md`

**목표**
1. 3-col 레이아웃 (매도잔량 · 호가 · 매수잔량) 키움 스타일
2. 총매도/총매수 잔량 푸터 + 매수/매도 비율 게이지
3. 심볼 검색 폼 (6자리 숫자)
4. href 동적화 (`/orderbook?symbol=`)

**범위 밖 (다음 STEP에서)**
- `/orderbook` 페이지 리팩토링 (현재 스텁 그대로 둠)
- 10단 확장 (위젯은 5단 유지)

---

## Part A — `components/widgets/OrderBookWidget.tsx` 전체 교체

파일 전체 내용 삭제 후 아래로 **완전 교체**:

```tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface Level {
  price: number;
  volume: number;
}

interface BookData {
  symbol: string;
  asks: Level[];
  bids: Level[];
  totalAskVolume: number;
  totalBidVolume: number;
}

interface PriceData {
  name?: string;
  price?: number;
  changePercent?: number;
}

function fmtPrice(n: number): string {
  return n.toLocaleString('ko-KR');
}

const DEFAULT_SYMBOL = '005930';

export default function OrderBookWidget() {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [input, setInput] = useState(DEFAULT_SYMBOL);
  const [book, setBook] = useState<BookData | null>(null);
  const [info, setInfo] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [bookRes, priceRes] = await Promise.all([
          fetch(`/api/kis/orderbook?symbol=${symbol}`),
          fetch(`/api/kis/price?symbol=${symbol}`),
        ]);
        const bookJson = bookRes.ok ? await bookRes.json() : null;
        const priceJson = priceRes.ok ? await priceRes.json() : null;
        if (cancelled) return;
        if (bookJson && bookJson.asks) setBook(bookJson);
        if (priceJson) setInfo(priceJson);
      } catch {
        // noop
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 5_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [symbol]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (/^\d{6}$/.test(v)) {
      setSymbol(v);
      setBook(null);
      setLoading(true);
    }
  };

  const allVolumes = [
    ...(book?.asks || []).map((a) => a.volume),
    ...(book?.bids || []).map((b) => b.volume),
  ];
  const maxVol = Math.max(1, ...allVolumes);

  const asks = book?.asks?.slice(-5) || []; // 매도 5단 (가격 내림차순 → 마지막 5개 = 현재가 근처)
  const bids = book?.bids?.slice(0, 5) || []; // 매수 5단 (가격 내림차순)

  const totalAsk = book?.totalAskVolume ?? 0;
  const totalBid = book?.totalBidVolume ?? 0;
  const sumTotal = totalAsk + totalBid;
  const bidPct = sumTotal > 0 ? (totalBid / sumTotal) * 100 : 50;
  const askPct = 100 - bidPct;

  return (
    <WidgetCard
      title="호가창"
      subtitle={`${info?.name || symbol} · 5초 갱신`}
      href={`/orderbook?symbol=${symbol}`}
      action={
        <form onSubmit={handleSubmit} className="flex items-center gap-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-16 text-[10px] bg-[#F0F0F0] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#0ABAB5]"
            placeholder="005930"
            maxLength={6}
            inputMode="numeric"
          />
          <button type="submit" className="text-[10px] text-[#0ABAB5] hover:underline">
            이동
          </button>
        </form>
      }
    >
      {asks.length === 0 && bids.length === 0 && !loading ? (
        <div className="px-3 py-4 text-xs text-[#999] text-center">데이터 없음</div>
      ) : (
        <div className="flex flex-col h-full">
          <div aria-label="호가창" className="px-2 py-1 text-xs flex-1">
            {/* 매도 호가 (위) — 3-col 그리드 */}
            <div className="mb-0.5">
              {asks.map((a, i) => {
                const bar = Math.round((a.volume / maxVol) * 100);
                return (
                  <div
                    key={`ask-${i}`}
                    className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-1 py-0.5 px-1"
                  >
                    <div className="relative h-full flex items-center justify-end">
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-[#0051CC]/15"
                        style={{ width: `${bar}%` }}
                      />
                      <span className="relative text-[#555] tabular-nums">
                        {a.volume.toLocaleString()}
                      </span>
                    </div>
                    <span className="relative text-[#0051CC] font-bold text-center min-w-[60px] tabular-nums">
                      {fmtPrice(a.price)}
                    </span>
                    <span />
                  </div>
                );
              })}
            </div>

            {/* 현재가 */}
            <div className="bg-[#0ABAB5]/10 text-center py-1 font-bold text-[#0ABAB5] text-sm border-y border-[#0ABAB5]/20 mb-0.5 tabular-nums">
              {info?.price ? fmtPrice(info.price) : '—'}{' '}
              <span
                className={`text-xs ${(info?.changePercent ?? 0) >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}
              >
                {(info?.changePercent ?? 0) >= 0 ? '+' : ''}
                {(info?.changePercent ?? 0).toFixed(2)}%
              </span>
            </div>

            {/* 매수 호가 (아래) — 3-col 그리드 */}
            <div>
              {bids.map((b, i) => {
                const bar = Math.round((b.volume / maxVol) * 100);
                return (
                  <div
                    key={`bid-${i}`}
                    className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-1 py-0.5 px-1"
                  >
                    <span />
                    <span className="relative text-[#FF3B30] font-bold text-center min-w-[60px] tabular-nums">
                      {fmtPrice(b.price)}
                    </span>
                    <div className="relative h-full flex items-center justify-start">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-[#FF3B30]/15"
                        style={{ width: `${bar}%` }}
                      />
                      <span className="relative text-[#555] tabular-nums">
                        {b.volume.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 총잔량 푸터 */}
          {sumTotal > 0 && (
            <div className="border-t border-[#F0F0F0] px-2 py-1.5 bg-[#FAFAFA]">
              <div className="flex items-center justify-between text-[10px] text-[#666] tabular-nums mb-1">
                <span>
                  매도 <span className="text-[#0051CC] font-bold">{totalAsk.toLocaleString()}</span>
                </span>
                <span>
                  매수 <span className="text-[#FF3B30] font-bold">{totalBid.toLocaleString()}</span>
                </span>
              </div>
              <div className="flex h-1.5 rounded overflow-hidden">
                <div className="bg-[#FF3B30]" style={{ width: `${bidPct}%` }} title={`매수 ${bidPct.toFixed(1)}%`} />
                <div className="bg-[#0051CC]" style={{ width: `${askPct}%` }} title={`매도 ${askPct.toFixed(1)}%`} />
              </div>
              <div className="flex items-center justify-between text-[9px] text-[#888] tabular-nums mt-0.5">
                <span>매수 {bidPct.toFixed(1)}%</span>
                <span>{askPct.toFixed(1)}% 매도</span>
              </div>
            </div>
          )}
        </div>
      )}
    </WidgetCard>
  );
}
```

**핵심 변경사항:**
- `symbol` state 추가 (변경 가능) — useEffect가 `[symbol]` 의존성으로 재fetch
- `action` 슬롯에 6자리 숫자 입력 폼 (차트 위젯 패턴 차용)
- `grid-cols-[1fr_auto_1fr]` 3-col: 좌(잔량/빈칸) · 중(호가) · 우(빈칸/잔량)
- 매도 행: 왼쪽에만 잔량, 막대는 우측정렬 (매도 영역에 뻗음)
- 매수 행: 오른쪽에만 잔량, 막대는 좌측정렬 (매수 영역에 뻗음)
- 총잔량 푸터 + 매수/매도 비율 게이지
- `href={'/orderbook?symbol=' + symbol}` 동적화
- `asks.slice(-5)`: API는 내림차순 10개 → 마지막 5개(현재가 근처)만 표시

---

## Part B — 빌드 검증

```bash
npm run build
```

에러 없어야 진행.

---

## Part C — 사용자 수동 검증

브라우저 홈 (`http://localhost:3000/`):

1. **호가창 위젯 레이아웃**
   - [ ] 3-col 그리드 렌더 (매도잔량 좌 · 호가 중앙 · 매수잔량 우)
   - [ ] 매도 5단 (위쪽, 파랑) / 매수 5단 (아래쪽, 빨강)
   - [ ] 매도 잔량 막대: 좌측(잔량 컬럼)에서 우측(호가 쪽)으로 뻗음
   - [ ] 매수 잔량 막대: 우측(잔량 컬럼)에서 좌측(호가 쪽)으로 뻗음
   - [ ] 현재가 행: 티얼 배경, 등락률 색상 (+빨강/-파랑)

2. **총잔량 푸터**
   - [ ] 매도 총잔량, 매수 총잔량 숫자 표시
   - [ ] 매수/매도 % 게이지 바 (빨강·파랑 비율로 100% 채움)

3. **심볼 변경**
   - [ ] 우상단 입력에 `000660` (SK하이닉스) 입력 후 이동
   - [ ] 위젯 재렌더, subtitle 종목명 바뀜
   - [ ] 문자 입력하면 자동 필터링(숫자만)
   - [ ] 6자리 아닐 때 이동 버튼 눌러도 변화 없음

4. **↗ 상세 이동**
   - [ ] ↗ 클릭 시 `/orderbook?symbol=000660` 이동 (페이지는 아직 스텁)

문제 없으면 Part D로.

---

## Part D — 4개 문서 헤더 날짜 갱신

### D-1. `CLAUDE.md` 상단 날짜만 오늘로

### D-2. `docs/CHANGELOG.md` 상단 블록 추가

```markdown
### 2026-04-22 세션 — STEP 53 완료
- [x] OrderBookWidget 3-col 레이아웃 (매도잔량 · 호가 · 매수잔량)
- [x] 총매도/총매수 잔량 푸터 + 매수/매도 비율 게이지
- [x] 6자리 심볼 검색 폼 + href 동적화 (`?symbol=`)
- [x] `docs/WIDGET_SPEC_OrderBook.md` 작성
```

### D-3. `session-context.md` 상단 블록 추가

```markdown
### 2026-04-22 세션 — STEP 53 완료
- [x] OrderBookWidget 키움 스타일 리팩토링 (3-col · 총잔량 푸터 · 심볼 입력)
```

### D-4. `docs/NEXT_SESSION_START.md` 갱신

"다음 할 일 P0" 섹션에서 STEP 53 체크, 다음 후보 추가:
```markdown
- [ ] STEP 54: /orderbook 페이지 풀스크린 10단 (Chart 페이지 패턴 재사용)
- [ ] STEP 55: DartFilingsWidget 리팩토링 (P0) — 공시유형 뱃지
```

---

## Part E — Git commit + push

```bash
git add components/widgets/OrderBookWidget.tsx docs/CHANGELOG.md docs/NEXT_SESSION_START.md docs/WIDGET_SPEC_OrderBook.md docs/STEP_53_COMMAND.md session-context.md CLAUDE.md && git commit -m "$(cat <<'EOF'
feat(orderbook): STEP 53 Phase A — 키움 스타일 3-col 레이아웃 + 총잔량 게이지

- OrderBookWidget 3-col 그리드 (매도잔량 · 호가 · 매수잔량)
  - 매도 5단: 좌측 잔량, 막대 우측 뻗기 (파랑 #0051CC)
  - 매수 5단: 우측 잔량, 막대 좌측 뻗기 (빨강 #FF3B30)
  - 호가 컬럼 중앙 정렬, min-w-[60px] 고정
- 총 매도/매수 잔량 푸터 + 매수·매도 비율 게이지 바
- 6자리 숫자 심볼 입력 폼 (action 슬롯)
- href 동적화: /orderbook?symbol={symbol}
- docs/WIDGET_SPEC_OrderBook.md: 키움 영웅문 벤치마크 + Phase A/B/C

Phase B(/orderbook 페이지 10단) · Phase C(실시간 웹소켓) 유보
EOF
)" && git push origin main
```

---

## Part F — Git log 확인

```bash
git log --oneline -5
```

최신 커밋이 `feat(orderbook): STEP 53 Phase A ...` 로 표시되는지 확인.

---

## 완료 후

다음 후보: **STEP 54 — /orderbook 페이지 풀스크린 (P1 Phase B)**
- Chart 페이지 (`app/chart/page.tsx` + `ChartPageClient`) 패턴 재사용
- 10단 호가 + 심볼 URL 파라미터 + StockHeader 재활용
