<!-- 2026-06-30 -->
# STEP 467 — (US 미러) 미국 종목·상품 수익률 패노라마 + 10행마다 광고 문의

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_467_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
STEP 466(KR)와 동일하게 **미국 탭(`UsMarketBoard`)**에도: ① 데스크탑 행 클릭 → 1일~1년 수익률 가로 패노라마(아코디언) ② 표 10행마다 `광고 문의하기` 행(`slot="broker"`). 모바일은 기존 하단 시트 유지.

## 전제
- 최신 main + 466. `components/toolbox/UsMarketBoard.tsx` 3곳 수정. 클라이언트 → HMR.

---

## (1) `Fragment` 임포트 — 찾기:
```tsx
import { useEffect, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
```
바꾸기:
```tsx
import { Fragment, useEffect, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
```

## (2) `AdSlotRow` 임포트 — 찾기:
```tsx
import BrokerRanking from './BrokerRanking';
```
바꾸기:
```tsx
import BrokerRanking from './BrokerRanking';
import AdSlotRow from './AdSlotRow';
```

## (3) tbody — 행 토글 + 패노라마 확장행 + 10행마다 광고 — 찾기:
```tsx
              <tbody>
                {paginated.map((r, i) => (
                  <tr key={r.symbol} onClick={() => setSelectedStock(r)} className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background">
                    <td className="py-2.5 pl-2 pr-0.5 tabular-nums text-unjong-muted sm:px-2">{page * PAGE_SIZE + i + 1}</td>
                    <td className="py-2.5 pl-0.5 pr-2 sm:px-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <StockLogo code={r.symbol} name={r.name} size={32} />
                        <span className="min-w-0 truncate">
                          <span className="font-bold text-unjong-primary">{r.symbol}</span>
                          <span title={r.name} className="ml-1.5 text-xs text-unjong-muted">{r.name}</span>
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-unjong-primary sm:px-4">{r.price ? formatPrice(r.price, 'US') : '—'}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-semibold tabular-nums sm:pr-4 ${pctColor(periodCell(r))}`}>{periodCell(r) === undefined ? <span className="text-unjong-muted">…</span> : pct(periodCell(r))}</td>
                    <td className="w-9 px-1 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleWatch(r); }}
                        aria-label={watchSet.has(r.symbol) ? '관심종목 해제' : '관심종목 추가'}
                        className={`transition-colors ${watchSet.has(r.symbol) ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
                      >
                        <Star size={14} fill={watchSet.has(r.symbol) ? 'currentColor' : 'none'} className="mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
```
바꾸기:
```tsx
              <tbody>
                {paginated.map((r, i) => (
                  <Fragment key={r.symbol}>
                  <tr onClick={() => setSelectedStock((s) => (s?.symbol === r.symbol ? null : r))} className={`cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background ${selectedStock?.symbol === r.symbol ? 'bg-unjong-background' : ''}`}>
                    <td className="py-2.5 pl-2 pr-0.5 tabular-nums text-unjong-muted sm:px-2">{page * PAGE_SIZE + i + 1}</td>
                    <td className="py-2.5 pl-0.5 pr-2 sm:px-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <StockLogo code={r.symbol} name={r.name} size={32} />
                        <span className="min-w-0 truncate">
                          <span className="font-bold text-unjong-primary">{r.symbol}</span>
                          <span title={r.name} className="ml-1.5 text-xs text-unjong-muted">{r.name}</span>
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-unjong-primary sm:px-4">{r.price ? formatPrice(r.price, 'US') : '—'}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-semibold tabular-nums sm:pr-4 ${pctColor(periodCell(r))}`}>{periodCell(r) === undefined ? <span className="text-unjong-muted">…</span> : pct(periodCell(r))}</td>
                    <td className="w-9 px-1 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleWatch(r); }}
                        aria-label={watchSet.has(r.symbol) ? '관심종목 해제' : '관심종목 추가'}
                        className={`transition-colors ${watchSet.has(r.symbol) ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
                      >
                        <Star size={14} fill={watchSet.has(r.symbol) ? 'currentColor' : 'none'} className="mx-auto" />
                      </button>
                    </td>
                  </tr>
                  {/* 데스크탑 전용: 행 클릭 시 1일~1년 수익률 패노라마 펼침(모바일은 하단 시트가 대신) */}
                  {selectedStock?.symbol === r.symbol ? (
                    <tr className="hidden border-b border-unjong-border bg-unjong-background/50 lg:table-row">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-2.5">
                          <span className="text-[11px] font-semibold text-unjong-muted">기간 수익률</span>
                          {([
                            ['1일전', r.changePercent],
                            ['1주일전', r.r1w],
                            ['1개월전', r.r1m],
                            ['3개월전', r.r3m],
                            ['6개월전', r.r6m],
                            ['1년전', r.r1y],
                          ] as [string, number | null | undefined][]).map(([label, v]) => (
                            <div key={label} className="flex min-w-[3.5rem] flex-col">
                              <span className="text-[11px] text-unjong-muted">{label}</span>
                              <span className={`text-sm font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  {/* 10행마다 광고 문의 행 (증권사 사이드바와 동일 패턴, 페이지 마지막 행 뒤엔 생략) */}
                  {(i + 1) % 10 === 0 && i + 1 < paginated.length ? (
                    <tr><td colSpan={5} className="p-0"><AdSlotRow slot="broker" /></td></tr>
                  ) : null}
                  </Fragment>
                ))}
              </tbody>
```

---

## 확인 (HMR — 국가 토글 US)
- 데스크탑 US 주식/ETF: 행 클릭 → 패노라마, 10행마다 `광고 문의하기` 행. KR과 동일.
- 모바일 US: 하단 시트 + 광고 행만.
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 466·467·468 묶어 커밋.
