<!-- 2026-07-06 -->
# STEP 607 — 일본탭 R3(뉴스) 확장 · 일본명·ja 로케일

> **목표**: R3 뉴스를 JP에도. JP(.T)면 **야후 일본 종목명 + 일본 로케일(ja-JP) 구글뉴스** → 한국어 요약(가드레일 동일). KR·US 코드는 그대로, JP 분기만 추가.
> **범위**: 일본은 이번엔 **R3(뉴스)까지**. R1·R2 공시(EDINET)는 사용자 결정대로 다음 별도 작업.
> **⚠️ 커밋 금지** — 빌드+생성+눈검수까지. **Cowork MCP 검수 후** 커밋 STEP.
> **전제**: STEP 606(`cf22aba`) 이후.

## Cowork이 바꾼 것 (tsc EXIT=0)
- `lib/stockNews.ts` — locale에 `'ja'` 추가(`hl=ja&gl=JP&ceid=JP:ja`).
- `lib/lensCompute.ts` — `fetchYahooName(symbol)`(야후 shortName) 추가.
- `app/api/news-brief/route.ts` — JP(.T)면 야후 일본명 + ja 뉴스로 분기(KR=DART·ko는 그대로).
- (페이지는 STEP 604에서 이미 전 국가 StockNewsBrief 렌더 → JP 추가 배선 불필요.)

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 1) 🔴 JP 뉴스 생성 — 3종목 + 도요타 3회 반복(일관성)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/jp_r3_dev.log 2>&1 &) ; sleep 14
set -a; source .env.local 2>/dev/null; set +a
D=$(date -u +%F)
echo "=== 도요타(7203.T) 3회 (캐시 비우고) ==="
for i in 1 2 3; do
  node -e "const {createClient}=require('@supabase/supabase-js'); const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); sb.from('news_briefs').delete().eq('symbol','7203.T').eq('as_of','$D').then(()=>process.exit(0)).catch(()=>process.exit(0));"
  echo "--- 7203.T $i/3 ---"; curl -s "http://localhost:3333/api/news-brief?symbol=7203.T" | head -c 800; echo; echo
done
echo "=== 소니(6758.T)·소프트뱅크(9984.T) 1회씩 ==="
for S in 6758.T 9984.T; do
  echo "--- $S ---"; curl -s "http://localhost:3333/api/news-brief?symbol=$S" | head -c 800; echo; echo
done
# 확인 후: pkill -f "next dev"
```
- [ ] 요약이 **한국어**(일본 뉴스를 한국어로), **구체 사건**(실적·신제품·계약·상장 등)만. 사건 없으면 `null`.
- [ ] **목표주가·투자의견·과대/저평가·전망 없음**, 서로 다른 기사 **짜깁기 없음**.
- [ ] 도요타 3회 대체로 일관.

## 2) 눈검수 — JP 종목 페이지
```bash
cd ~/stock-terminal && open "http://localhost:3333/stock/7203.T"
```
- [ ] `StockNewsBrief(R3)`가 **한국어 일본 뉴스**로 뜨는지(또는 사건 없으면 숨김). R2 브리핑은 렌즈 기반으로 뜨되 공시란은 아직 "없음"(EDINET 미구축 = 정상).

## 3) 결과 붙여넣기 → Cowork MCP 검수 대기
- 도요타 3회 + 소니·소프트뱅크 출력을 Cowork에 붙여넣기. **Cowork가 news_briefs JP 행을 MCP로 확인**(한국어·구체사건·무밸류·무전망·무짜깁기) 후 커밋 STEP.
- **여기서 멈춤(커밋 X).**

## ✅ 통과 시: 일본 R3(뉴스) 완성. (R1·R2 공시=EDINET은 다음.)
