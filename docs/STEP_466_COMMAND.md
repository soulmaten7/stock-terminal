<!-- 2026-06-30 -->
# STEP 466 — 종목·상품(KR) 데스크탑 수익률 패노라마 + 10행마다 광고 문의

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_466_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
1. **데스크탑 행 클릭 → 그 행 아래로 1일~1년 수익률 가로 패노라마(아코디언), 재클릭 닫힘.** 모바일은 기존 하단 시트 유지(`hidden lg:table-row`).
2. **표에 10행마다 `광고 문의하기` 행 삽입**(증권사 사이드바와 동일 패턴, `slot="broker"` = 종목·상품 탭). 데이터(`r1w~r1y`)는 이미 행에 있음.

## 전제
- 최신 main + 465. `components/toolbox/MarketBoard.tsx` 3곳 수정. 클라이언트 → HMR.

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
                        <span title={r.name} className="truncate font-medium text-unjong-primary">{r.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-unjong-primary sm:px-4">{r.price ? formatPrice(r.price, 'KR') : '—'}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-semibold tabular-nums sm:pr-4 ${pctColor(r[mobileField] as number | null | undefined)}`}>{pct(r[mobileField] as number | null | undefined)}</td>
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
                        <span title={r.name} className="truncate font-medium text-unjong-primary">{r.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-unjong-primary sm:px-4">{r.price ? formatPrice(r.price, 'KR') : '—'}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-semibold tabular-nums sm:pr-4 ${pctColor(r[mobileField] as number | null | undefined)}`}>{pct(r[mobileField] as number | null | undefined)}</td>
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

## 확인 (HMR — 새로고침)
- **데스크탑**: 행 클릭 → 아래로 1일~1년 수익률 펼침, 재클릭 닫힘, 선택 행 배경 강조.
- **표 10행마다** `광고 문의하기 ›` 행이 보이고, 누르면 `/advertise?slot=broker`로 이동(드롭다운이 '증권사 슬롯'으로 선택됨).
- **모바일**: 패노라마 행 숨김 + 기존 하단 시트 유지. 광고 행은 모바일에서도 보임(전체 폭).
- ⭐ 클릭은 `stopPropagation`이라 행 안 펼쳐짐. 정렬·기간 드롭다운·페이지네이션 정상.
- 빌드 에러 없음.

## 빌드·커밋
- 보류. US(467)·다른 탭(468)까지 묶어 커밋.
