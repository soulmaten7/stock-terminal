<!-- 2026-07-01 -->
# STEP 487 — JP 종목명: jp_symbols의 큐레이션 이름 사용 (ETF 발행사명 오표시 수정)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_487_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (`app/api/yahoo/jp-list/route.ts` 1파일)
JP 종목·ETF·리츠 이름을 **Yahoo가 아니라 `jp_symbols.json`의 큐레이션 이름**으로. 지금 Yahoo가 ETF엔 발행사명("NOMURA ASSET MANAGEMENT")만 줘서 1570·1357 등이 구분 안 되고 레버리지 배지도 안 뜸.
- 고치면: 1570 → "NF 日経平均レバレッジ(2倍)"(레버리지 배지 O), 리츠 → "日本ビルファンド投資法人", 종목 → "トヨタ自動車"(현지명).
- ⚠️ API 라우트라 클린 재시작 필요.

---

## 1) `app/api/yahoo/jp-list/route.ts`

**1-A. 심볼→이름 맵 추가.** 찾을 것:
```ts
const ALL_SYMS = symbols as Sym[];
```
**바꿀 것:**
```ts
const ALL_SYMS = symbols as Sym[];
const NAME_MAP = new Map(ALL_SYMS.map((s) => [s.sym, s.name]));
```

**1-B. 이름을 맵 우선으로.** 찾을 것:
```ts
          name:
            (q as { shortName?: string }).shortName ||
            (q as { longName?: string }).longName ||
            (q as { symbol: string }).symbol,
```
**바꿀 것:**
```ts
          name:
            NAME_MAP.get((q as { symbol: string }).symbol) ||
            (q as { shortName?: string }).shortName ||
            (q as { longName?: string }).longName ||
            (q as { symbol: string }).symbol,
```

---

## 2) 빌드 + 클린 재시작
```bash
npm run build
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 3) 검증 (localhost:3333)
- [ ] 🇯🇵 일본 → ETF 탭: **1570 "NF 日経平均レバレッジ(2倍)"에 2x 배지**, 1357 "ダブルインバース"에 인버스(빨강) 배지. 각 ETF 이름이 구분됨.
- [ ] 리츠 탭: "日本ビルファンド投資法人" 등 펀드명.
- [ ] 종목 탭: "トヨタ自動車" 등 현지명(티커로 식별).

## 4) 커밋
```bash
git add app/api/yahoo/jp-list/route.ts && git commit -m "fix(jp): 종목·ETF·리츠 이름을 jp_symbols 큐레이션명으로(발행사명 오표시·배지 미표시 수정) (STEP 487)" && git push
```

## ▶ 다음
- **미국 자산군 확충** — 리츠(REIT) 서브탭 + ETF 레버리지·인버스(TQQQ·SOXL·SQQQ) + ETN. (다음 STEP)
