<!-- 2026-06-06 -->
# STEP 179 — 실시간 차트 필터 토스식 한 줄 (국가·시장·정렬 칩 통합)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_179_COMMAND.md 파일 내용대로 실행해줘`

## 목표
지금 **3줄로 펼쳐진** 필터(① 국가 국내/미국/글로벌 ② 시장 전체/코스피/코스닥 ③ 정렬 거래대금/…)를 **토스처럼 한 줄 칩**으로 압축. 구역은 **세로 구분선**으로 나눔.
> 토스의 기간 칩(실시간/1일/…/1년)은 기간별 등락 데이터 필요 → 추후. 이번엔 레이아웃만.

## 전제 상태
- HEAD: STEP 178 적용된 상태
- 변경: `components/market/MarketClient.tsx` (필터 영역 1블록 교체)

---

## 작업 1/1 — `components/market/MarketClient.tsx` (필터 3블록 → 한 줄)

**찾기:**
```tsx
      {/* 국가 탭 */}
      <div className="flex items-center gap-2 border-b border-unjong-border mb-4">
        {COUNTRIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              setCountry(c.key);
              setFilter(c.key === "us" ? "up" : "amount");
              setMarket("all");
            }}
            className={
              country === c.key
                ? "px-3 py-2 text-sm font-bold text-unjong-primary border-b-2 border-unjong-primary -mb-px"
                : "px-3 py-2 text-sm font-medium text-unjong-muted hover:text-unjong-primary border-b-2 border-transparent -mb-px"
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {country === "global" ? (
        <EmptyState icon="🛠️" title="글로벌 마켓 준비 중" description="순차 확장 예정 (STEP 154~)." className="py-12" />
      ) : (
        <>
          {/* 시장 필터 (국내만) */}
          {country === "kr" && (
            <div className="flex items-center gap-1.5 mb-3">
              {MARKETS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMarket(m.key)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                    market === m.key ? "bg-unjong-primary text-white" : "bg-unjong-background text-unjong-muted hover:bg-slate-200"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {/* 랭킹 필터 (국가별) */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
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

      {country === "global" ? (
        <EmptyState icon="🛠️" title="글로벌 마켓 준비 중" description="순차 확장 예정 (STEP 154~)." className="py-12" />
      ) : (
        <>
```

> 변경점: 국가(언더라인 탭) → 칩, 시장·정렬과 함께 **한 줄(flex-wrap)** 에 `|` 구분선으로. 정렬 칩도 통일된 `rounded-full px-2.5 py-1`. 기능(전환·데이터)은 동일.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx && git commit -m "feat(v7): 실시간 차트 필터 토스식 한 줄 — 국가·시장·정렬 칩 통합(구분선) (STEP 179)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 필터가 **한 줄**(국가 · 시장 · 정렬, 구분선)로 압축됐는지 — 3줄 펼침 사라짐
- [ ] 국내/미국/글로벌 전환, 시장(코스피/코스닥), 정렬 다 정상 작동
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- `/market` 페이지(비-embedded)도 같은 컴포넌트라 함께 압축됨(정상).
- 기간 칩(실시간/1일/…/1년)은 기간별 등락 데이터 필요 → 추후.
- 다음: 미국 탭 "데이터 없음" 버그 · 카테고리 레이아웃.

---
> STEP 179 = 필터 한 줄 압축. 전제 STEP 178. 다음: 미국탭 버그 · 카테고리. 문서 묶어 갱신.
