<!-- 2026-07-08 (3rd) -->
# 🇨🇳 [완료] CN 공시층 + R1 — A주(cninfo) + HK(HKEXnews) 완결

> **✅ 2026-07-08 (3rd) 완결.** STEP 659(`f3fee9b`·A주 이벤트층)·660(`73dfc9b`·A주 R1 PDF)·661(`4404424`·HK 이벤트층+R1). VN과 달리 cninfo·HKEXnews = **진짜 공식 공시**라 US·KR·JP·GB 동급 달성. 원문 PDF=unpdf 텍스트추출. ⚠️ 배포 후 Vercel 도달성만 실측 대기. **▶ 다음 = 광고(대화 먼저).**
>
> _(아래는 착수 당시 원계획 — 히스토리로 보존.)_

---

# 🇨🇳 [원계획] CN(중국·홍콩) 공시층 + R1 원문요약

> **이 파일 하나로 다음 세션이 CN 공시를 처음부터 진행할 수 있게 만든 자급형 실행 계획.**
> 상위 맥락 = `docs/NEW_SESSION_HANDOFF.md` · 최신 배너 = `docs/SESSION_BOOT.md`.
> 새 세션: ① `NEW_SESSION_HANDOFF.md`로 전체 상태 → ② **이 파일로 CN 착수.**

---

## 0. 지금 어디까지 왔나 (2026-07-08 2nd 종료 시점)
- **공식 공시 R1 = US(EDGAR)·KR(DART)·JP(EDINET)·GB(RNS) 4개국 완성.** HEAD `1b8e1e1`.
- **VN 마감**: 공식 공시원문 소스 부재로 이벤트층(뉴스·이벤트)+R3만. R1 보류. (`docs/NEXT_SESSION_VN_PLAN.md` 결과 기록)
- **CN 탭 자체는 이미 있음**(STEP 612~620): 종목보드(HK 항셍·A주 상하이/선전·야후 `.HK`/`.SS`/`.SZ`)·R3 뉴스(`cn_names`·zh-HK 번체/zh-CN 간체 텐센트 소스)·매매처는 CN만 미보유. **없는 것 = 종목 페이지 "공시층 + R1".**

## 1. 목표 (JP/GB와 동급 — CN은 진짜 공시 가능성 높음)
CN 종목 페이지에:
1. **공시 이벤트층** — "최근 중대 공시" 카드 (`CnEventLayer`, JpEventLayer/GbEventLayer 복제).
2. **R1 원문 요약** — 각 공시 아래 중국어→한국어 사실 요약 (`CnFilingSummary`).

> ✅ **VN과 달리 CN엔 진짜 공식 공시 소스가 있다** — 아래 cninfo(巨潮资讯网)는 선전·상하이 거래소 지정 공식 공시 사이트(EDGAR/DART급). JSON API + PDF 원문.

## 2. 🔴 소스 후보 (착수 전 반드시 도달성 프로브부터)

> ⚠️⚠️ **최우선 리스크 = IP 차단.** 전례(STEP 618~619): **东方財富(eastmoney)이 KR·데이터센터 IP를 차단**(exit52/502)해서 텐센트로 우회함. **cninfo·HKEX도 Vercel(미국 데이터센터 IP)에서 차단될 수 있음** → **코드 짜기 전에 도달성부터 실측.**

### 후보 A: cninfo 巨潮资讯网 (A주 .SS/.SZ) — 공식·JSON·1순위
- `www.cninfo.com.cn` = 선전/상하이 거래소 지정 공식 공시 사이트. akshare/adata 등이 쓰는 공개 JSON API.
- **2단계 플로우**(Vietstock 토큰보다 깔끔·반위조 토큰 없음):
  1. **code→orgId 조회**: `POST http://www.cninfo.com.cn/new/information/topSearch/query` body `keyWord={code}&maxNum=10` → JSON에서 `orgId`(예: `gssz0000651`).
  2. **공시 목록**: `POST http://www.cninfo.com.cn/new/hisAnnouncement/query` body `pageNum=1&pageSize=20&column={szse|sse}&tabName=fulltext&stock={code},{orgId}&isHLtitle=true` → JSON `announcements[]` (`announcementTitle`·`announcementTime`(ms)·`adjunctUrl`=PDF 경로).
  3. 원문 PDF = `http://static.cninfo.com.cn/{adjunctUrl}`.
- **다음 세션 첫 할 일 = 프로브 스크립트**(`tmp/cn_probe.mjs`)로 위 2개 POST를 실측: 200+JSON 오는지, Vercel(배포 후 `/api/cn-events` 직접 호출)서도 되는지. UA·Referer(`http://www.cninfo.com.cn/`) 헤더 필요할 수 있음.
- 되면 = **JP EDINET급 진짜 공시.** ✅ 우선 목표.

### 후보 B: HKEXnews (홍콩 .HK) — 공식
- `www1.hkexnews.hk` = 홍콩거래소 공시. `.HK` 종목용. 티커→stockId 매핑 후 검색 API(또는 서버렌더 목록). A주(cninfo)와 별도 소스로 `.HK`는 이걸로.
- 프로브: `mcp__workspace__web_fetch`로 서버렌더 여부 확인 + akshare `stock_hk_notice_report` 등이 쓰는 엔드포인트 참고.

### ⛔ 피할 것: 东方財富(eastmoney) — KR/데이터센터 IP 차단 전례. 정 안 되면 텐센트(`qt.gtimg`)는 시세용이라 공시엔 부적합.

## 3. 빌드 계획 (JP 패턴 미러 — R1이 PDF라 JP와 유사)
> **CN 원문 = PDF** (cninfo adjunctUrl). JP EDINET(CSV unzip)과 결이 비슷 — GB(HTML)보다 JP를 미러하는 게 가깝다. PDF 텍스트 추출 필요(스캔이 아니라 텍스트 PDF면 `pdf-parse`류로 추출 가능·스캔이면 요약 스킵).

### STEP A: CN 공시 이벤트층
- **`app/api/cn-events/route.ts`** — `?symbol=000651.SZ`(또는 `.SS`/`.HK`) → 거래소 판별 → [A: cninfo code→orgId→announcement query / B(.HK): HKEXnews] → 노이즈 필터 후 최근 8 → 온디맨드 + 10분 캐시.
- **`StockLensClient.tsx`**: `CnEventLayer`(JpEventLayer 복제)·`const isCN = /\.(SS|SZ|HK)$/i.test(symbol);` 추가 · 렌더 삼항식에 `isCN` 배선(isGB/isVN 옆).
- 중국어 docType/제목 → 한국어 라벨(JP docType 한국어 라벨 방식 참고).
- tsc EXIT=0 → 커밋 → **라이브 도달성 실측**(cninfo가 Vercel서 되는지 최대 관건).

### STEP B: CN R1 원문 요약
- **`app/api/cn-events/summary/route.ts`** — PDF(adjunctUrl) 다운로드 → 텍스트 추출 → **gpt-4o-mini 중국어→한국어 사실 요약** → `filing_summaries`(accession=`CN`+id·SSRF: cninfo/hkex 도메인 한정). 프롬프트: 통화 위안(元)·간체/번체 무관 한국어 요약·예측 금지·한국어 아님→번역 폴백(R3 방식).
- **`CnFilingSummary`**(JpFilingSummary 복제) → CnEventLayer 각 항목 배선.
- 라이브 검증: 貴州茅台(600519.SS)·比亚迪(002594.SZ)·텐센트(0700.HK) 공시 밑 한국어 요약.

## 4. 참조 (그대로 베낄 원본)
- **미러 원본(JP·PDF 결)**: `app/api/jp-events/route.ts`·`app/api/jp-events/summary/route.ts`·`JpEventLayer`·`JpFilingSummary`·`isJP`·배선 삼항식. (GB는 HTML 파서 참고용.)
- **공용**: `filing_summaries`(accession PK·summary_ko·model·symbol — CN도 `CN`+id로 합류)·`OPENAI_API_KEY`(Vercel 등록됨)·`createAdminClient()`.
- **CN 이름**: `cn_names`(zh-HK 번체/zh-CN 간체)·R3가 이미 씀·SSR `lib/stockName.ts`·`lib/cnName.ts`.
- **완전성 룰**(CLAUDE.md): MVP=축소 아님·소스 막히면 대체·DoD 빠짐없이. **단 VN 교훈: 소스가 근본적으로 없으면(=공식 공시원문 부재) 무한 삽질 말고 이벤트층+R3로 마감하고 보고.** CN은 cninfo가 있어 VN보다 가능성 높음.

## 5. ⚠️ 주의 / 함정
- **IP 차단이 1순위 리스크**(东方財富 전례) — **cninfo/HKEX가 Vercel서 되는지 배포 후 `/api/cn-events` 직접 호출로 반드시 실측.** 막히면 헤더(UA·Referer) 조정 → 그래도 막히면 대체 소스 정찰 or 마감 판단.
- **PDF 원문** — 텍스트 PDF면 추출 OK, 스캔 PDF면 R1 스킵(항목별 숨김). JP는 CSV라 깔끔했지만 CN PDF는 케이스 확인 필요.
- **간체/번체·중국어 출력** — LLM이 중국어로 답할 수 있음(JP/VN 전례) → 한국어 아님→번역 폴백 필수. 통화 위안(元) 교정(R3에 이미 있음).
- **A주 vs HK 분리** — `.SS/.SZ`=cninfo, `.HK`=HKEXnews. 두 소스라 route에서 분기.

## 6. CN 다음엔 → **광고**(사용자와 대화 먼저 — 사용자 지침) 또는 인도·대만 등 국가 확장.

---
*작성: 2026-07-08 (2nd) · VN 마감 직후. 코드 HEAD `1b8e1e1`. CN 빌드는 다음 세션.*
