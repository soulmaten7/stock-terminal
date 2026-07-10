<!-- 2026-07-10 -->
# STEP 690 — 🐞 ETF 영숫자 코드 버그 + 감지 + "상품 구성" 라벨 정정 — 빌드·커밋 + 배포 실측

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** 코드는 **Cowork(Opus)가 직접 작성·`tsc`=0·네이버 프로브로 원인/데이터 검증.** 이 STEP은 **빌드 + 눈 검증 + 커밋/푸시 + 배포 실측**.
**문제(사용자 발견):** 단일종목/신형 ETF(예: KODEX SK하이닉스단일종목레버리지)가 미리보기에 "렌즈 정보 준비 중"으로 비어 있었음. + ETF 구성은 AI 분석이 아닌데 "TR-AI 렌즈"로 라벨돼 정체성 위반.
**원인:** 이 상품들의 KRX 단축코드가 **영숫자**(`0193T0`)라 `krCode` 정규식 `/^\d{6}$/`가 못 잡아 → 야후로 빠짐 → 빈 응답. (네이버엔 데이터 있음: SK하이닉스 92.49%·stockEndType="etf".)
**바뀐 것:**
- `app/api/etf-holdings/route.ts` — `krCode` 정규식 `/^\d{6}$/` → **`/^\d[0-9A-Z]{5}$/`**(첫 글자 숫자 + 영숫자 6자리 = 069500·0193T0 등. 미국 티커는 문자로 시작 → 제외).
- `lib/instrumentType.ts` — KR 감지를 야후 quoteType → **네이버 `integration` stockEndType**(etf/etn/stock)로(야후가 신형 영숫자 코드 미보유). US 등은 야후 유지.
- `app/stock/[symbol]/EtfLensClient.tsx` + `components/toolbox/LensPreview.tsx` — ETF 구성 헤더/CTA를 **"TR-AI 렌즈"→"상품 구성"**(AI 분석 아님 명시·`Layers` 아이콘). 미리보기 CTA도 ETF면 "상품 구성 자세히 보기". + 섹터 미분류 라벨 "기타"(QA).

---

## 1. 빌드 → 로컬 확인
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && (npm run dev &) ; sleep 7
curl -s "http://localhost:3333/api/etf-holdings?symbol=0193T0" | head -c 300 ; echo
```
- 응답 `isFund:true`·`삼성자산운용`·holdings에 `SK하이닉스`(92%대). (이전엔 isFund:false였음.)

## 2. 눈으로 확인
- 한국 탭 → **ETF** → **KODEX SK하이닉스단일종목레버리지 클릭** → 미리보기에 **"상품 구성"**(AI 분석 아님) + SK하이닉스·원화현금 + "상품 구성 자세히 보기" → 상세는 **"상품 구성"** 헤더(TR-AI 렌즈 아님).
- 일반 종목(삼성전자) 클릭 → 여전히 "TR-AI 렌즈"·브리핑(회귀 없음).
- KODEX 200·레버리지·인버스도 구성 뜸.
- console.log 없음. tsc 0.

## 3. 커밋 → 푸시 (+ CHANGELOG)
`docs/CHANGELOG.md` 688 불릿 아래:
```
- **689/690**: 🐞 ETF **영숫자 KRX 코드**(0193T0 단일종목ETF) 인식 버그 수정(`krCode /^\d[0-9A-Z]{5}$/`) + KR 유형감지 네이버 stockEndType으로. 📛 ETF 구성 라벨 **"TR-AI 렌즈"→"상품 구성"**(AI 분석 아님·정체성). 섹터 미분류 "기타".
```
```bash
git add lib/instrumentType.ts "app/api/etf-holdings/route.ts" "app/stock/[symbol]/EtfLensClient.tsx" components/toolbox/LensPreview.tsx docs/CHANGELOG.md docs/STEP_690_ETF_ALNUM_CODE_LABEL_COMMAND.md
git commit -m "fix(etf): 영숫자 KRX 코드(단일종목ETF) 인식 + KR 감지 네이버화 + 구성 라벨 'TR-AI 렌즈'→'상품 구성'"
git push
```

## 4. 🔴 배포 후 실측
```bash
curl -s "https://onetrillion.app/api/etf-holdings?symbol=0193T0" | head -c 300 ; echo
```
- `isFund:true` + SK하이닉스 holdings → 라이브 ✅ (Cowork 보고).

## Cowork에게 보고
- 로컬/배포 0193T0 구성 뜨는지 + 라벨 "상품 구성"인지 + 일반 종목 회귀 없는지.
