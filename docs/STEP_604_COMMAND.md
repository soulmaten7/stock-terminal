<!-- 2026-07-06 -->
# STEP 604 — 한국탭 AI 확장 (R2 브리핑·R3 뉴스에 KR 데이터 연결) · "US 완성형 → 데이터 교체" 증명

> **목표**: US 코드 그대로 두고 **KR 데이터로 분기**. R1-KR(공시요약)은 이미 있음 → 이번엔 **R2 브리핑에 DART 공시** + **R3 뉴스에 한글명·한국 로케일** 연결. 새 테이블·마이그레이션 없음(캐시는 symbol 기준·국가무관).
> **⚠️ 커밋은 이 STEP에서 하지 말 것** — 빌드+생성+눈검수까지만. **Cowork가 MCP로 KR 캐시(stock_briefings·news_briefs)를 검수한 뒤** 별도로 커밋(R3 밸류 누수 전례 때문에 생성 결과를 실제 행으로 확인하고 커밋).
> **전제**: STEP 603 커밋 이후.

## Cowork이 바꾼 것 (tsc EXIT=0 확인)
- `lib/stockNews.ts` — `fetchStockNews(q, limit, locale)` : locale='ko'면 `hl=ko&gl=KR&ceid=KR:ko`.
- `lib/dart.ts` — `getDartCorpName(6자리)` : `dart_corp_codes.corp_name`(예 "삼성전자") 조회.
- `app/api/news-brief/route.ts` (R3) — KR(6자리)이면 **한글명으로 한국 뉴스** 검색, 그 외 영어. 가드레일 프롬프트는 이미 한국어(밸류·목표가·전망 금지) 그대로.
- `app/api/brief/route.ts` (R2) — 공시 사실을 KR=**DART**(`fetchDartMaterial`), 그 외=EDGAR 8-K로 분기.
- `app/stock/[symbol]/page.tsx` — `StockNewsBrief`를 KR 포함 전 국가로 렌더(라우트가 내부 분기).

## 0) 빌드 + 타입
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 1) 🔴 KR 실제 생성 — 3개 종목 R2·R3 (dev 서버, .env.local 키 사용)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/kr_ai_dev.log 2>&1 &) ; sleep 14
for S in 005930.KS 000660.KS 035420.KS; do
  echo "===== $S : R2 브리핑 ====="; curl -s "http://localhost:3333/api/brief?symbol=$S" | head -c 700; echo
  echo "===== $S : R3 뉴스   ====="; curl -s "http://localhost:3333/api/news-brief?symbol=$S" | head -c 700; echo; echo
done
echo "----- 캐시 재호출(삼성전자, cached:true 나와야) -----"; curl -s "http://localhost:3333/api/brief?symbol=005930.KS" | head -c 200; echo
# 확인 후: pkill -f "next dev"
```
- [ ] R2(brief): `brief` 필드에 한국어 브리핑 + **DART 공시가 근거로 반영**(예 "…반기보고서/실적 공시…"), "오른다/사라/목표가" 없음.
- [ ] R3(news-brief): `summary`가 **한국어 구체 사건**(실적·계약·신제품 등)이거나, 사건 없으면 `null`. **목표주가·과대/저평가·전망 단어 없음**.
- [ ] 재호출 시 `"cached":true`.

## 2) 🔴 눈검수 — KR 종목 페이지
```bash
cd ~/stock-terminal && open "http://localhost:3333/stock/005930.KS"
```
- [ ] 상단 **StockBrief(R2)** 한국어 브리핑, **KrEventLayer(R1)** 공시 요약, **StockNewsBrief(R3)** 한국어 뉴스(또는 사건 없으면 숨김) — 세 층 다 뜨는지. (US 페이지와 동일 구조·한국어 데이터)

## 3) 결과 붙여넣기 → Cowork MCP 검수 대기
- 위 1) curl 출력(3종목 R2·R3)을 Cowork에 붙여넣기. **Cowork가 stock_briefings·news_briefs를 MCP로 직접 조회해 가드레일(무예측·무밸류) 통과 확인 후** 커밋 STEP(605)을 줌.
- **여기서 멈춤(커밋 X).**

## ✅ 통과 시 의미: "US 완성형 → 데이터만 교체"가 KR에서 실증. R1·R2·R3 KR 완성.
