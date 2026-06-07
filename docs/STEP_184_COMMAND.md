<!-- 2026-06-06 -->
# STEP 184 — 종목 로고 logo.dev 연동 (미국 티커 자동 + 국내 도메인 확장)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_184_COMMAND.md 파일 내용대로 실행해줘`

## 목표
구글 파비콘(저화질·일부 틀림) → **logo.dev**(고화질·정확).
- **미국**: 영문 티커로 `img.logo.dev/ticker/{TICKER}` — NYSE·NASDAQ 등 7만 종목 **전부 자동**(맵 불필요)
- **국내**: 6자리 코드 → 도메인 매핑(20→42개 확장) → `img.logo.dev/{domain}` (고화질). 맵에 없으면 아바타
- 토큰 없으면 기존 파비콘/아바타로 **무탈 폴백**(빌드 안 깨짐)

## ⚠️ 전제 — `.env.local` 에 토큰 (사용자가 먼저)
1. https://www.logo.dev 가입(무료·카드 X) → 대시보드에서 **Publishable token**(`pk_...`) 복사
2. `~/stock-terminal/.env.local` 에 한 줄 추가 (Claude Code에 "토큰은 pk_… 야, .env.local에 추가해줘" 해도 됨):
   ```
   NEXT_PUBLIC_LOGODEV_TOKEN=pk_여기에_복사한_공개토큰
   ```
   - `NEXT_PUBLIC_` 접두사 필수(클라이언트 `<img>`에서 읽음). 공개키라 노출 OK.
   - `.env.local` 은 **git에 안 올라감**(gitignore) — 커밋 금지.
3. 토큰 추가 후 **dev 서버 재시작**(env는 시작 시 1회 로드).

## 전제 상태
- HEAD: STEP 183 적용된 상태
- 변경: `lib/avatar.ts`(도메인맵+logoUrl 블록 교체) 1파일

---

## 작업 1/1 — `lib/avatar.ts`

**찾기:**
```ts
// 종목코드(KR 6자리)/티커(US) → 회사 도메인. 주요 종목만(나머지는 아바타 폴백).
// 로고가 이상하게 나오는 종목은 이 맵의 도메인만 고치면 됨.
const DOMAIN_MAP: Record<string, string> = {
  // ── 국내 ──
  "005930": "samsung.com",          // 삼성전자
  "005935": "samsung.com",          // 삼성전자우
  "000660": "skhynix.com",          // SK하이닉스
  "035420": "navercorp.com",        // NAVER
  "035720": "kakaocorp.com",        // 카카오
  "005380": "hyundai.com",          // 현대차
  "000270": "kia.com",              // 기아
  "066570": "lge.co.kr",            // LG전자
  "068270": "celltrion.com",        // 셀트리온
  "207940": "samsungbiologics.com", // 삼성바이오로직스
  "006400": "samsungsdi.com",       // 삼성SDI
  "051910": "lgchem.com",           // LG화학
  "373220": "lgensol.com",          // LG에너지솔루션
  "015760": "kepco.co.kr",          // 한국전력
  "017670": "sktelecom.com",        // SK텔레콤
  "030200": "kt.com",               // KT
  "105560": "kbfg.com",             // KB금융
  "055550": "shinhangroup.com",     // 신한지주
  "086790": "hanafn.com",           // 하나금융지주
  "000810": "samsungfire.com",      // 삼성화재
  // ── 미국 ──
  AAPL: "apple.com",
  TSLA: "tesla.com",
  NVDA: "nvidia.com",
  MSFT: "microsoft.com",
  GOOGL: "google.com",
  AMZN: "amazon.com",
  META: "meta.com",
  NFLX: "netflix.com",
};

/** 주요 종목이면 실로고 URL, 아니면 null(→아바타 폴백) */
export function logoUrl(code: string): string | null {
  const domain = DOMAIN_MAP[code];
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
}
```

**바꾸기:**
```ts
// logo.dev 공개 토큰 (.env.local 의 NEXT_PUBLIC_LOGODEV_TOKEN). 없으면 파비콘/아바타 폴백.
const LOGODEV_TOKEN = process.env.NEXT_PUBLIC_LOGODEV_TOKEN;

// 국내 6자리 코드 → 회사 도메인. (미국은 티커로 logo.dev 자동 → 맵 불필요)
// 로고가 이상하면 이 맵의 도메인만 고치면 됨. 여기 없는 국내 종목은 아바타.
const DOMAIN_MAP: Record<string, string> = {
  "005930": "samsung.com",          // 삼성전자
  "005935": "samsung.com",          // 삼성전자우
  "000660": "skhynix.com",          // SK하이닉스
  "035420": "navercorp.com",        // NAVER
  "035720": "kakaocorp.com",        // 카카오
  "005380": "hyundai.com",          // 현대차
  "000270": "kia.com",              // 기아
  "066570": "lge.co.kr",            // LG전자
  "068270": "celltrion.com",        // 셀트리온
  "207940": "samsungbiologics.com", // 삼성바이오로직스
  "006400": "samsungsdi.com",       // 삼성SDI
  "051910": "lgchem.com",           // LG화학
  "373220": "lgensol.com",          // LG에너지솔루션
  "015760": "kepco.co.kr",          // 한국전력
  "017670": "sktelecom.com",        // SK텔레콤
  "030200": "kt.com",               // KT
  "105560": "kbfg.com",             // KB금융
  "055550": "shinhangroup.com",     // 신한지주
  "086790": "hanafn.com",           // 하나금융지주
  "000810": "samsungfire.com",      // 삼성화재
  // ── 추가 대형/중형주 ──
  "005490": "posco.co.kr",          // POSCO홀딩스
  "012330": "mobis.co.kr",          // 현대모비스
  "009150": "samsungsem.com",       // 삼성전기
  "323410": "kakaobank.com",        // 카카오뱅크
  "259960": "krafton.com",          // 크래프톤
  "003550": "lg.com",               // LG
  "034730": "sk.com",               // SK
  "032830": "samsunglife.com",      // 삼성생명
  "028260": "samsungcnt.com",       // 삼성물산
  "018260": "samsungsds.com",       // 삼성SDS
  "024110": "ibk.co.kr",            // 기업은행
  "316140": "woorifg.com",          // 우리금융지주
  "138040": "meritz.co.kr",         // 메리츠금융지주
  "010130": "koreazinc.co.kr",      // 고려아연
  "051900": "lghnh.com",            // LG생활건강
  "090430": "amorepacific.com",     // 아모레퍼시픽
  "097950": "cj.co.kr",             // CJ제일제당
  "006800": "miraeasset.com",       // 미래에셋증권
  "128940": "hanmi.co.kr",          // 한미약품
  "047810": "koreaaero.com",        // 한국항공우주(KAI)
  "010140": "samsungshi.com",       // 삼성중공업
  "011200": "hmm21.com",            // HMM
};

/** 실로고 URL (logo.dev). 미국=티커 자동, 국내=도메인 매핑. 없으면 null(→아바타). */
export function logoUrl(code: string): string | null {
  // 미국: 영문 티커 → logo.dev 티커 엔드포인트(7만 종목 자동)
  if (/^[A-Z]{1,5}$/.test(code)) {
    return LOGODEV_TOKEN
      ? `https://img.logo.dev/ticker/${code}?token=${LOGODEV_TOKEN}&size=128&retina=true`
      : null;
  }
  // 국내: 6자리 → 도메인 매핑
  const domain = DOMAIN_MAP[code];
  if (!domain) return null;
  return LOGODEV_TOKEN
    ? `https://img.logo.dev/${domain}?token=${LOGODEV_TOKEN}&size=128&retina=true`
    : `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
}
```

> 미국은 맵 없이 티커로 자동. 국내는 42종목 도메인 매핑(나머지 아바타). 토큰 없으면 국내는 파비콘, 미국은 아바타로 폴백.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후 (`.env.local` 은 add 안 함 — gitignore):
```bash
cd ~/stock-terminal && git add lib/avatar.ts && git commit -m "feat(v7): 종목 로고 logo.dev 연동 — 미국 티커 자동(7만)+국내 도메인맵 42개, 파비콘 폴백 (STEP 184)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **토큰 추가 + dev 재시작** 후: 미국 탭(AAPL·NVDA·TSLA 등) **실로고**, 국내 대형주(삼성전자·SK하이닉스·현대차 등) **실로고**
- [ ] 레버리지/인버스 ETF는 STEP 183 배지 그대로(로고 안 붙음)
- [ ] 토큰 전이거나 맵에 없는 종목은 레터 아바타(정상)
- ⚠️ 토큰 넣었는데 로고 안 뜨면: ① `.env.local` 의 `NEXT_PUBLIC_` 철자 ② dev 서버 **완전 재시작**(env 캐시) ③ `.next` stale

## 주의·예상 이슈
- 토큰은 공개키(`pk_`)라 `<img src>` 노출 정상. 비밀키(`sk_`) 쓰지 말 것.
- 국내 도메인이 틀려 엉뚱한 로고면 그 한 줄만 고치면 됨(맵 주석에 회사명 표기).
- 국내 롱테일(중소형주)은 도메인 맵 없으면 아바타 — 필요시 코드 추가로 확장.
- 미국 일부 비주류 티커는 logo.dev 모노그램(글자) 표시될 수 있음(깨짐 아님).

---
> STEP 184 = 로고 logo.dev. 전제 STEP 183. 다음: 카테고리 2열 레이아웃 등 잔여 토스 정렬. 문서 묶어 갱신.
