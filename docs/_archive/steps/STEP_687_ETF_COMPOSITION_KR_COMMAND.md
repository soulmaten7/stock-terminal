<!-- 2026-07-10 -->
# STEP 687 — 📦 KR ETF 구성 (네이버 m.stock, MVP-B) — 빌드·커밋 + 배포 실측

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** 코드는 **Cowork(Opus)가 직접 작성·`tsc`=0·네이버 프로브 검증 완료.** 이 STEP은 **빌드 + 눈 검증 + 커밋/푸시 + 배포 도달성 실측**.
**바뀐 것 (설계: `docs/ETF_LENS_PLAN.md`):**
- `app/api/etf-holdings/route.ts` — **KR(6자리·`.KS`/`.KQ`) = 네이버 `m.stock/api/stock/{code}/etfAnalysis`** 분기 추가(상위10보유·섹터·추종지수·운용사·보수율). US=Yahoo 유지.
- `app/stock/[symbol]/EtfLensClient.tsx` — 섹터 라벨에 네이버 KR 코드(IT·INDUSTRIALS·FINANCIALS…) 매핑 + "추종·유형"(KR=추종지수) 표기.
- KRX getJsonData=LOGOUT(안티스크래핑)라 미채택 — 네이버 채택(키 없음).

---

## 1. 빌드 확인
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && (npm run dev &) ; sleep 7
curl -s "http://localhost:3333/api/etf-holdings?symbol=069500.KS" | head -c 500 ; echo
```
- 응답에 `"family":"삼성자산운용"`·`"category":"코스피 200"`·holdings(삼성전자 등)·sectors 있어야.

## 2. 눈으로 확인
- **`http://localhost:3333/stock/069500.KS`**(KODEX200) → 구성 페이지: 운용사 삼성자산운용·추종 코스피200·보수율 0.15%·**상위보유(삼성전자 32.95%…)**·섹터(IT·기술 등).
- **`/stock/SPY`** → 여전히 US 구성(회귀 없음). **`/stock/AAPL`** → 기존 종목 렌즈.
- console.log 없음. tsc 0.

## 3. 커밋 → 푸시 (+ CHANGELOG)
`docs/CHANGELOG.md` 4행 헤더 끝 `+ ETF 구성 KR(네이버)` 추가. 686 불릿 아래:
```
- **687**: 📦 **KR ETF 구성**(MVP-B·네이버 m.stock `etfAnalysis`·키 없음) — `api/etf-holdings` KR 분기(상위10보유·섹터·추종지수·운용사·보수율). KRX getJsonData=LOGOUT(안티스크래핑) 미채택. EtfLensClient 섹터 KR 코드 매핑. ⚠️ 네이버 Vercel 도달성은 §4 실측.
```
```bash
git add "app/api/etf-holdings/route.ts" "app/stock/[symbol]/EtfLensClient.tsx" docs/ETF_LENS_PLAN.md docs/CHANGELOG.md docs/STEP_687_ETF_COMPOSITION_KR_COMMAND.md
git commit -m "feat(etf): KR ETF 구성(네이버 m.stock etfAnalysis) — api/etf-holdings KR 분기(MVP-B)"
git push
```

## 4. 🔴 배포 후 도달성 실측 (중요 — 네이버가 Vercel 미 IP 막을 수 있음)
배포 완료(1~2분) 뒤:
```bash
curl -s "https://onetrillion.app/api/etf-holdings?symbol=069500.KS" | head -c 400 ; echo
```
- **holdings/family 정상** → KR ETF 구성 라이브 ✅ (Cowork 보고).
- **빈 응답/isFund:false** → 네이버가 Vercel 차단 → Cowork에 보고(크론 스냅샷 or off-Vercel로 전환 설계). **가짜 채우기 금지**(§보류 프로토콜).

## Cowork에게 보고
- 로컬 KODEX200 구성 뜨는지 + **배포 API(§4) 네이버 도달 여부**(이게 핵심 관문).
