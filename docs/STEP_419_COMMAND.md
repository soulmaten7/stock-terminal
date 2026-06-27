<!-- 2026-06-26 -->
# STEP 419 — 모바일 종목표 3종 수정 (증권사 중복 제거 · 링크행 우측정렬 · 종목 시트 정보)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_419_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
모바일에서 국내(`MarketBoard`)·미국(`UsMarketBoard`) 종목표 UX를 다듬는다. 3개 수정:

1. **FIX 1 — 모바일 증권사 중복 제거**: 표 아래 `lg:hidden` "증권사 바로가기" 섹션을 삭제. 증권사는 (a) 데스크탑 우측 `aside`(유지) + (b) 종목 클릭 바텀시트(유지) 두 곳에만 노출. 모바일은 시트에서만 본다.
2. **FIX 3 — 링크행 우측 클러스터 우측정렬**: 공통 링크행(`ListRow`)의 `⭐ + 바로가기` 묶음이 가운데로 몰려 보임 → `ml-auto`로 오른쪽 끝까지 밀착. 한 번 수정 = 모든 링크 탭(뉴스·공시·증권사·유튜브 등)에 적용.
3. **FIX 4 — 종목 클릭 시트에 종목 정보 추가**: 시트 헤더와 "증권사 바로가기" 사이에 **현재가 + 기간별 수익률(1일·1주일·1개월·3개월·6개월·1년)** 콤팩트 블록 삽입.

> 변경 3파일: `components/toolbox/MarketBoard.tsx`, `components/toolbox/UsMarketBoard.tsx`, `components/toolbox/ListRow.tsx`. 컴포넌트만 → **새로고침이면 충분**(서버 재시작 불필요).

---

## 📋 전제 상태
- STEP 418까지 반영된 `main` 기준. (FIX들의 편집 영역은 STEP 420(기간 `<select>` 교체)과 **겹치지 않음** — 419 먼저 실행해도 420 anchor 유효.)
- 행 필드: `symbol, name, price, changePercent(1일), r1w, r1m, r3m, r6m, r1y`.
- `pct()`/`pctColor()` 헬퍼, `formatPrice(price, 'KR'|'US')` 이미 두 파일에 존재.

---

## 📄 파일 1 — `components/toolbox/MarketBoard.tsx` (국내)

### 1-1) FIX 1 — 표 아래 모바일 증권사 섹션 삭제
**찾기:**
```tsx
      {/* 모바일: 증권사 바로가기 (표 아래 — 데스크탑은 우측 aside) */}
      <div className="mt-5 lg:hidden">
        <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
        <p className="border-b border-unjong-border px-1 py-2 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
        <BrokerRanking hideHeader />
      </div>
      {/* 종목 클릭 → 증권사 바로가기 (모바일 전용 — PC는 우측 리스트로 한눈에 보임) */}
```
**바꾸기:**
```tsx
      {/* 종목 클릭 → 증권사 바로가기 (모바일 전용 — PC는 우측 리스트로 한눈에 보임) */}
```

### 1-2) FIX 4 — 클릭 시트에 종목 정보 블록 추가
**찾기:**
```tsx
              <button type="button" onClick={() => setSelectedStock(null)} aria-label="닫기" className="shrink-0 text-unjong-muted hover:text-unjong-primary">
                <X size={20} />
              </button>
            </div>
            <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
            <BrokerRanking hideHeader />
          </div>
        </div>
      )}
    </section>
  );
}
```
**바꾸기:**
```tsx
              <button type="button" onClick={() => setSelectedStock(null)} aria-label="닫기" className="shrink-0 text-unjong-muted hover:text-unjong-primary">
                <X size={20} />
              </button>
            </div>
            {/* 종목 정보 — 현재가 + 기간별 수익률 (증권사 목록 위) */}
            <div className="mb-4 rounded-xl border border-unjong-border bg-unjong-background p-3">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-xs text-unjong-muted">현재가</span>
                <span className="text-base font-bold tabular-nums text-unjong-primary">{selectedStock.price ? formatPrice(selectedStock.price, 'KR') : '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-x-2 gap-y-2.5">
                {([
                  ['1일', selectedStock.changePercent],
                  ['1주일', selectedStock.r1w],
                  ['1개월', selectedStock.r1m],
                  ['3개월', selectedStock.r3m],
                  ['6개월', selectedStock.r6m],
                  ['1년', selectedStock.r1y],
                ] as [string, number | null | undefined][]).map(([label, v]) => (
                  <div key={label} className="flex flex-col">
                    <span className="text-[11px] text-unjong-muted">{label}</span>
                    <span className={`text-sm font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
            <BrokerRanking hideHeader />
          </div>
        </div>
      )}
    </section>
  );
}
```

---

## 📄 파일 2 — `components/toolbox/UsMarketBoard.tsx` (미국)

### 2-1) FIX 1 — 표 아래 모바일 증권사 섹션 삭제
**찾기:**
```tsx
      {/* 모바일: 증권사 바로가기 (표 아래 — 데스크탑은 우측 aside) — KR 미러 */}
      <div className="mt-5 lg:hidden">
        <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
        <p className="border-b border-unjong-border px-1 py-2 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
        <BrokerRanking hideHeader />
      </div>
      {/* 종목 클릭 → 증권사 바텀시트 (모바일 전용) — KR 미러 */}
```
**바꾸기:**
```tsx
      {/* 종목 클릭 → 증권사 바텀시트 (모바일 전용) — KR 미러 */}
```

### 2-2) FIX 4 — 클릭 시트에 종목 정보 블록 추가 (미국 — `$` formatPrice)
**찾기:**
```tsx
              <button type="button" onClick={() => setSelectedStock(null)} aria-label="닫기" className="shrink-0 text-unjong-muted hover:text-unjong-primary">
                <X size={20} />
              </button>
            </div>
            <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
            <BrokerRanking hideHeader />
          </div>
        </div>
      )}
    </section>
  );
}
```
**바꾸기:**
```tsx
              <button type="button" onClick={() => setSelectedStock(null)} aria-label="닫기" className="shrink-0 text-unjong-muted hover:text-unjong-primary">
                <X size={20} />
              </button>
            </div>
            {/* 종목 정보 — 현재가 + 기간별 수익률 (증권사 목록 위) */}
            <div className="mb-4 rounded-xl border border-unjong-border bg-unjong-background p-3">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-xs text-unjong-muted">현재가</span>
                <span className="text-base font-bold tabular-nums text-unjong-primary">{selectedStock.price ? formatPrice(selectedStock.price, 'US') : '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-x-2 gap-y-2.5">
                {([
                  ['1일', selectedStock.changePercent],
                  ['1주일', selectedStock.r1w],
                  ['1개월', selectedStock.r1m],
                  ['3개월', selectedStock.r3m],
                  ['6개월', selectedStock.r6m],
                  ['1년', selectedStock.r1y],
                ] as [string, number | null | undefined][]).map(([label, v]) => (
                  <div key={label} className="flex flex-col">
                    <span className="text-[11px] text-unjong-muted">{label}</span>
                    <span className={`text-sm font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
            <BrokerRanking hideHeader />
          </div>
        </div>
      )}
    </section>
  );
}
```

---

## 📄 파일 3 — `components/toolbox/ListRow.tsx` (공통 링크행 — FIX 3)

우측 클러스터(`stat` 옵션값 → `trailing`(⭐) → "바로가기")를 하나의 `ml-auto` span으로 묶어 오른쪽 끝까지 밀착시킨다. 기존엔 세 형제가 따로 떨어져 있어 좌측 콘텐츠 폭에 따라 가운데로 몰려 보였음.

**찾기:**
```tsx
      {stat ? <span className="shrink-0 text-xs font-bold text-unjong-accent">{stat}</span> : null}
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
      <span className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] text-unjong-muted group-hover:text-unjong-accent">
        바로가기 <ExternalLink size={12} />
      </span>
```
**바꾸기:**
```tsx
      <span className="ml-auto flex shrink-0 items-center gap-2.5">
        {stat ? <span className="shrink-0 text-xs font-bold text-unjong-accent">{stat}</span> : null}
        {trailing ? <span className="shrink-0">{trailing}</span> : null}
        <span className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] text-unjong-muted group-hover:text-unjong-accent">
          바로가기 <ExternalLink size={12} />
        </span>
      </span>
```

> `ml-auto`가 클러스터 전체를 오른쪽으로 밀어줌. `meta`가 있든(LinkCard) 없든(BrokerRanking·YoutubeRanking) 항상 우측 정렬 보장.

---

## ✅ 검증
```bash
pkill -f "next dev" 2>/dev/null; npm run build
```
빌드 무에러.

개발 서버(컴포넌트 → HMR/새로고침), **모바일 폭**(또는 브라우저 좁게):
1. 국내·미국 종목표 **아래쪽에 "증권사 바로가기" 목록이 더 이상 안 보임**(중복 제거).
2. 종목 행 클릭 → 바텀시트에 **현재가 + 1일·1주일·1개월·3개월·6개월·1년 수익률**(빨강/파랑 색상, 값 없으면 `—`) → 그 아래 증권사 목록.
3. 데스크탑(넓은 폭): 우측 증권사 `aside` 그대로 유지.
4. 뉴스·공시·증권사·유튜브 등 **링크 탭 행의 `⭐ + 바로가기`가 오른쪽 끝에 밀착**.

---

## 📦 커밋 (LOCAL only — push·vercel 금지)
```bash
cd ~/stock-terminal && git add components/toolbox/MarketBoard.tsx components/toolbox/UsMarketBoard.tsx components/toolbox/ListRow.tsx && git commit -m "feat(STEP 419): 모바일 — 증권사 중복 제거·링크행 우측정렬·종목시트 정보"
```
> push 하지 말 것. vercel 배포 하지 말 것. 로컬 커밋까지만.

---

## ⏭️ 스킵 / 보류
- 기간 선택 `<select>` → 커스텀 드롭다운 교체는 **STEP 420**에서 진행(이 STEP은 손대지 않음).
- 데스크탑 우측 `aside`·클릭 시트 골격은 유지(시트엔 정보만 추가).

> **한 줄 요약**: 모바일 종목표 — 표 아래 증권사 목록 중복 제거 + 링크행 우측 클러스터 우측정렬 + 클릭 시트에 현재가·기간수익률 정보. 정렬·기간값 로직 불변.
