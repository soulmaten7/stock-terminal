<!-- 2026-06-06 -->
# STEP 191 — [A] 실시간차트 필터 토스 스타일 (라운드스퀘어 칩 + 정렬 세트)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_191_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (토스 캡쳐 분석 → 적용)
토스 실시간차트 필터: **라운드스퀘어 칩 + 그룹 세로 구분선 + 선택=진한 채움/흰 글씨 + 비선택=글자만**.
- 칩 모양: `rounded-full`(알약) → **`rounded-lg`(라운드스퀘어)**
- 글씨: `text-xs`(12px) → **`text-[13px]`** (토스급)
- 비선택: 회색 배경 채움 → **투명(글자만)**, hover 시 옅은 배경
- 정렬 세트를 토스와 일치: **거래대금 · 거래량 · 급상승 · 급하락**
  - `상승/하락` → `급상승/급하락` 라벨
  - `시가총액` 제거(토스 이 행엔 없음), 토스증권 거래대금/거래량은 우리 데이터 없어 제외
- 구조(국가 ｜ 시장 ｜ 정렬)·구분선은 유지, 구분선만 `h-5`로

> B(STEP 192)에서 기간 행(실시간·1일·…·1년) + 투자위험 숨기기 토글을 오른쪽에 추가 예정.

## 전제 상태
- HEAD: STEP 190 적용된 상태
- 변경: `components/market/MarketClient.tsx`(필터 정의 + 칩 헬퍼 + 필터 마크업) 1파일

---

## 작업 1/3 — 정렬 세트 토스 일치 (시가총액 제거 · 급상승/급하락)

**찾기:**
```tsx
const KR_FILTERS: FilterDef[] = [
  { key: "amount", label: "거래대금" },
  { key: "volume", label: "거래량" },
  { key: "cap", label: "시가총액" },
  { key: "up", label: "상승" },
  { key: "down", label: "하락" },
];
const US_FILTERS: FilterDef[] = [
  { key: "up", label: "상승" },
  { key: "down", label: "하락" },
];
```

**바꾸기:**
```tsx
const KR_FILTERS: FilterDef[] = [
  { key: "amount", label: "거래대금" },
  { key: "volume", label: "거래량" },
  { key: "up", label: "급상승" },
  { key: "down", label: "급하락" },
];
const US_FILTERS: FilterDef[] = [
  { key: "up", label: "급상승" },
  { key: "down", label: "급하락" },
];
```

## 작업 2/3 — 토스식 칩 헬퍼 추가

**찾기:**
```tsx
  const filters = country === "us" ? US_FILTERS : KR_FILTERS;
```

**바꾸기:**
```tsx
  const filters = country === "us" ? US_FILTERS : KR_FILTERS;

  // 토스식 칩: 라운드스퀘어, 선택=진한 채움/흰 글씨, 비선택=글자만
  const chip = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
      active ? "bg-unjong-primary text-white" : "text-unjong-muted hover:bg-unjong-background"
    }`;
```

## 작업 3/3 — 필터 마크업 교체 (칩 헬퍼 사용 + 구분선 h-5)

**찾기:**
```tsx
      {/* 필터 (토스식 한 줄: 국가 · 시장 · 정렬, 구분선) */}
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-2">
        {COUNTRIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => { setCountry(c.key); setFilter(c.key === "us" ? "up" : "amount"); setMarket("all"); }}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              country === c.key ? "bg-unjong-primary text-white" : "bg-unjong-background text-unjong-muted hover:bg-slate-200"
            }`}
          >
            {c.label}
          </button>
        ))}

        {country === "kr" && <span className="mx-1 h-4 w-px bg-unjong-border" />}
        {country === "kr" &&
          MARKETS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMarket(m.key)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                market === m.key ? "bg-unjong-primary text-white" : "bg-unjong-background text-unjong-muted hover:bg-slate-200"
              }`}
            >
              {m.label}
            </button>
          ))}

        {country !== "global" && <span className="mx-1 h-4 w-px bg-unjong-border" />}
        {country !== "global" &&
          filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === f.key ? "bg-unjong-primary text-white" : "bg-unjong-background text-unjong-muted hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
      </div>
```

**바꾸기:**
```tsx
      {/* 필터 (토스식 라운드스퀘어 칩: 국가 ｜ 시장 ｜ 정렬) */}
      <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-2">
        {COUNTRIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => { setCountry(c.key); setFilter(c.key === "us" ? "up" : "amount"); setMarket("all"); }}
            className={chip(country === c.key)}
          >
            {c.label}
          </button>
        ))}

        {country === "kr" && <span className="mx-1.5 h-5 w-px bg-unjong-border" />}
        {country === "kr" &&
          MARKETS.map((m) => (
            <button key={m.key} type="button" onClick={() => setMarket(m.key)} className={chip(market === m.key)}>
              {m.label}
            </button>
          ))}

        {country !== "global" && <span className="mx-1.5 h-5 w-px bg-unjong-border" />}
        {country !== "global" &&
          filters.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={chip(filter === f.key)}>
              {f.label}
            </button>
          ))}
      </div>
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx && git commit -m "feat(v7): 실시간차트 필터 토스 스타일 — 라운드스퀘어 칩·구분선·정렬세트(거래대금/거래량/급상승/급하락) (STEP 191)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 필터 칩이 **라운드스퀘어**(둥근 사각), 선택=네이비 채움/흰 글씨, 비선택=글자만(hover 옅은 배경)
- [ ] 정렬이 **거래대금·거래량·급상승·급하락** (시가총액 사라짐), 그룹 사이 세로 구분선
- [ ] 글씨가 살짝 커져 토스급(13px)
- [ ] 홈 실시간차트·마켓 페이지 둘 다 반영(같은 컴포넌트)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- `cap`(시가총액) 키는 타입·fetch에 남지만 UI에서 빠져 미사용(무해). 정리는 추후.
- 선택색은 브랜드 네이비(unjong-primary) 유지 — 토스 검정과 거의 동일 톤.
- 다음 STEP 192(B): 기간 행(실시간·1일·1주일·1개월·3개월·6개월·1년) + 투자위험 숨기기 토글(레버리지/인버스 숨김 — 실제 동작).

---
> STEP 191 = [A] 필터 칩 토스화. 전제 STEP 190. 다음: [B] 기간 행. 문서 묶어 갱신.
