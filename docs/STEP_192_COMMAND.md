<!-- 2026-06-06 -->
# STEP 192 — [B] 기간 필터 행(실시간~1년) + 투자위험 숨기기 토글

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_192_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (토스 캡쳐 분석 → 적용)
필터 오른쪽에 토스처럼 **기간 칩(실시간·1일·1주일·1개월·3개월·6개월·1년) + 투자위험 숨기기 토글**.
- **정직 처리**: 우리 랭킹은 현재 스냅샷 → **실시간만 실데이터**. 나머지 기간은 칩은 띄우되 **비활성("준비 중")** — 가짜 정렬 X. (과거 집계 데이터 연동되면 활성)
- **투자위험 숨기기 = 실제 동작**: `leverageInfo`로 레버리지/인버스 ETF(KODEX 레버리지·인버스·3x 등) 행을 실제로 숨김.
- 기간+토글은 `ml-auto`로 오른쪽 정렬(좁으면 다음 줄 래핑).

## 전제 상태
- HEAD: STEP 191 적용된 상태
- 변경: `components/market/MarketClient.tsx`(import·상수·state·필터행·테이블) 1파일

---

## 작업 1/6 — leverageInfo import

**찾기:**
```tsx
import { StockLogo } from "@/components/ui/StockLogo";
```
**바꾸기:**
```tsx
import { StockLogo } from "@/components/ui/StockLogo";
import { leverageInfo } from "@/lib/avatar";
```

## 작업 2/6 — PERIODS 상수 추가

**찾기:**
```tsx
] as const;
type MarketKey = (typeof MARKETS)[number]["key"];
```
**바꾸기:**
```tsx
] as const;
type MarketKey = (typeof MARKETS)[number]["key"];

const PERIODS = [
  { key: "live", label: "실시간" },
  { key: "1d", label: "1일" },
  { key: "1w", label: "1주일" },
  { key: "1m", label: "1개월" },
  { key: "3m", label: "3개월" },
  { key: "6m", label: "6개월" },
  { key: "1y", label: "1년" },
] as const;
type PeriodKey = (typeof PERIODS)[number]["key"];
```

## 작업 3/6 — state 추가 (period · hideRisk)

**찾기:**
```tsx
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
```
**바꾸기:**
```tsx
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>("live");
  const [hideRisk, setHideRisk] = useState(false);
```

## 작업 4/6 — shownRows (투자위험 필터)

**찾기:**
```tsx
  const filters = country === "us" ? US_FILTERS : KR_FILTERS;

  // 토스식 칩: 라운드스퀘어, 선택=진한 채움/흰 글씨, 비선택=글자만
```
**바꾸기:**
```tsx
  const filters = country === "us" ? US_FILTERS : KR_FILTERS;
  const shownRows = hideRisk ? rows.filter((r) => !leverageInfo(r.name)) : rows;

  // 토스식 칩: 라운드스퀘어, 선택=진한 채움/흰 글씨, 비선택=글자만
```

## 작업 5/6 — 기간 칩 + 투자위험 토글 (필터행 끝에 추가)

**찾기:**
```tsx
        {country !== "global" &&
          filters.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={chip(filter === f.key)}>
              {f.label}
            </button>
          ))}
      </div>
```
**바꾸기:**
```tsx
        {country !== "global" &&
          filters.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={chip(filter === f.key)}>
              {f.label}
            </button>
          ))}

        {/* 기간 + 투자위험 토글 (오른쪽). 실시간만 동작, 나머지 준비 중 */}
        {country !== "global" && (
          <div className="ml-auto flex flex-wrap items-center gap-x-1 gap-y-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                disabled={p.key !== "live"}
                onClick={() => p.key === "live" && setPeriod(p.key)}
                title={p.key === "live" ? undefined : "기간별 데이터 준비 중"}
                className={`${chip(period === p.key)} ${p.key !== "live" ? "cursor-not-allowed opacity-40" : ""}`}
              >
                {p.label}
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-unjong-border" />
            <button
              type="button"
              onClick={() => setHideRisk((v) => !v)}
              title="레버리지·인버스 ETF 숨기기"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                hideRisk ? "text-unjong-primary" : "text-unjong-muted hover:bg-unjong-background"
              }`}
            >
              <span className={`flex h-4 w-4 items-center justify-center rounded text-[10px] leading-none ${hideRisk ? "bg-[#3182F6] text-white" : "border border-unjong-border text-transparent"}`}>✓</span>
              투자위험 숨기기
            </button>
          </div>
        )}
      </div>
```

## 작업 6/6 — 테이블이 shownRows 사용

**찾기:**
```tsx
            ) : rows.length === 0 ? (
```
**바꾸기:**
```tsx
            ) : shownRows.length === 0 ? (
```

**찾기:**
```tsx
                <tbody>
                  {rows.map((r) => {
```
**바꾸기:**
```tsx
                <tbody>
                  {shownRows.map((r) => {
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx && git commit -m "feat(v7): 실시간차트 기간 행(실시간~1년)+투자위험 숨기기 토글(레버리지/인버스 실제 숨김) (STEP 192)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 필터 오른쪽에 기간 칩(실시간·1일·…·1년) — **실시간만 진하게 활성**, 나머지는 흐릿+클릭 안 됨(hover 시 "준비 중")
- [ ] **투자위험 숨기기** 켜면 KODEX 레버리지·인버스·3x 등이 리스트에서 사라지고, 끄면 다시 나옴(실제 동작)
- [ ] 좁은 화면(홈 임베드)에선 기간 그룹이 다음 줄로 오른쪽 정렬 래핑
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 기간 비활성은 **정직 처리**(기간별 과거 데이터 없음). 나중에 과거 집계 연동 시 `disabled` 풀고 fetch에 period 반영.
- 투자위험=레버리지/인버스 기준(우리가 감지 가능한 범위). 관리종목 등은 데이터 생기면 확장.
- 다음 STEP 193: [C] 지금 뜨는 카테고리 2열(국내/해외).

---
> STEP 192 = [B] 기간 행+투자위험 토글. 전제 STEP 191. 다음: [C] 카테고리 2열. 문서 묶어 갱신.
