<!-- 2026-07-01 -->
# STEP 483 — 일본 종목 로고(도메인 맵) + 코드 `.T` 정리

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_483_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (2파일: `lib/avatar.ts` + `components/toolbox/JpMarketBoard.tsx`)
일본 종목표에 **실제 로고** 표시(현재 이니셜만). 원인 = `logoUrl("6146.T")`가 US(영문 티커)·KR(6자리) 어디에도 안 맞아 null. → **일본 티커 도메인 맵 추가**(KR과 동일 방식·logo.dev/파비콘). + 표시 코드에서 `.T` 접미어 숨김(현지식 4자리).
> 클라이언트 파일만 → HMR 즉시(재시작 불필요).

---

## 1) `lib/avatar.ts`

### 1-A. `DOMAIN_MAP` 상수 **닫는 `};` 바로 다음**에 일본 맵 추가
(KR `DOMAIN_MAP`가 끝나는 `};` 다음 줄에 붙여넣기)
```ts

// 일본: NNNN.T → 회사 도메인 (로고 조회용). 없으면 아바타 폴백.
const JP_DOMAIN_MAP: Record<string, string> = {
  "7203.T": "toyota.com", "6758.T": "sony.com", "9984.T": "softbank.jp",
  "8306.T": "mufg.jp", "6861.T": "keyence.com", "9983.T": "fastretailing.com",
  "6098.T": "recruit.co.jp", "8058.T": "mitsubishicorp.com", "6501.T": "hitachi.com",
  "8035.T": "tel.com", "6857.T": "advantest.com", "4063.T": "shinetsu.co.jp",
  "9432.T": "ntt.com", "9433.T": "kddi.com", "7974.T": "nintendo.com",
  "6902.T": "denso.com", "7267.T": "honda.com", "8316.T": "smfg.co.jp",
  "8411.T": "mizuho-fg.com", "6367.T": "daikin.com", "4519.T": "chugai-pharm.co.jp",
  "6594.T": "nidec.com", "6702.T": "fujitsu.com", "6503.T": "mitsubishielectric.com",
  "7741.T": "hoya.com", "4568.T": "daiichisankyo.com", "8001.T": "itochu.co.jp",
  "8031.T": "mitsui.com", "2914.T": "jt.com", "4502.T": "takeda.com",
  "6981.T": "murata.com", "7751.T": "canon.com", "6301.T": "komatsu.com",
  "8766.T": "tokiomarinehd.com", "9020.T": "jreast.co.jp", "4661.T": "olc.co.jp",
  "6273.T": "smcworld.com", "6954.T": "fanuc.co.jp", "4543.T": "terumo.com",
  "7011.T": "mhi.com", "8053.T": "sumitomocorp.com", "8002.T": "marubeni.com",
  "9022.T": "jr-central.co.jp", "4901.T": "fujifilm.com", "6752.T": "panasonic.com",
  "7269.T": "suzuki.co.jp", "7201.T": "nissan-global.com", "8267.T": "aeon.info",
  "3382.T": "7andi.com", "9613.T": "nttdata.com", "6146.T": "disco.co.jp",
  "6920.T": "lasertec.co.jp", "8591.T": "orix.co.jp", "8725.T": "ms-ad-hd.com",
  "4452.T": "kao.com", "2802.T": "ajinomoto.com", "4523.T": "eisai.com",
  "6971.T": "kyocera.com", "6762.T": "tdk.com", "5108.T": "bridgestone.com",
  "7270.T": "subaru.co.jp", "7259.T": "aisin.com", "6326.T": "kubota.com",
  "4578.T": "otsuka.com", "9101.T": "nyk.com", "5401.T": "nipponsteel.com",
  "8801.T": "mitsuifudosan.co.jp", "8802.T": "mec.co.jp", "9434.T": "softbank.jp",
  "4689.T": "lycorp.co.jp", "6178.T": "japanpost.jp", "7182.T": "jp-bank.japanpost.jp",
  "8630.T": "sompo-hd.com",
};
```

### 1-B. `logoUrl` — 일본 분기 추가 (US 분기 다음)
**찾을 것:**
```ts
  // 미국: 영문 티커 → logo.dev 티커 엔드포인트(7만 종목 자동)
  if (/^[A-Z]{1,5}$/.test(code)) {
    return LOGODEV_TOKEN
      ? `https://img.logo.dev/ticker/${code}?token=${LOGODEV_TOKEN}&size=128&retina=true`
      : null;
  }
  // 국내: 6자리 → 도메인 매핑
```
**바꿀 것:**
```ts
  // 미국: 영문 티커 → logo.dev 티커 엔드포인트(7만 종목 자동)
  if (/^[A-Z]{1,5}$/.test(code)) {
    return LOGODEV_TOKEN
      ? `https://img.logo.dev/ticker/${code}?token=${LOGODEV_TOKEN}&size=128&retina=true`
      : null;
  }
  // 일본: NNNN.T → 도메인 매핑
  const jp = JP_DOMAIN_MAP[code];
  if (jp) {
    return LOGODEV_TOKEN
      ? `https://img.logo.dev/${jp}?token=${LOGODEV_TOKEN}&size=128&retina=true`
      : `https://www.google.com/s2/favicons?sz=128&domain=${jp}`;
  }
  // 국내: 6자리 → 도메인 매핑
```

---

## 2) `components/toolbox/JpMarketBoard.tsx` — 표시 코드 `.T` 숨김 (3곳)
> ⚠️ `<StockLogo code={r.symbol} …>`의 `code`는 **건드리지 말 것**(로고 조회는 풀 심볼 `6146.T` 필요). 아래 3곳은 **텍스트 표시**만.

**2-A. 데스크탑 표 종목명 셀 — 찾을 것:**
```tsx
                          <span className="font-bold text-unjong-primary">{r.symbol}</span>
```
**바꿀 것:**
```tsx
                          <span className="font-bold text-unjong-primary">{r.symbol.replace(/\.T$/, '')}</span>
```

**2-B. 모바일 카드 — 찾을 것:**
```tsx
<span className="font-bold">{r.symbol}</span>
```
**바꿀 것:**
```tsx
<span className="font-bold">{r.symbol.replace(/\.T$/, '')}</span>
```

**2-C. 바텀시트 헤더 — 찾을 것:**
```tsx
                  <p className="font-bold leading-snug text-unjong-primary">{selectedStock.symbol}</p>
```
**바꿀 것:**
```tsx
                  <p className="font-bold leading-snug text-unjong-primary">{selectedStock.symbol.replace(/\.T$/, '')}</p>
```

---

## 3) 빌드 + 검증
```bash
npm run build
```
- [ ] 🇯🇵 일본 → 종목·상품: 도요타·소니·키엔스 등 **실제 로고** 표시(이니셜 X). 로고 없는 종목만 이니셜.
- [ ] 코드가 `6146`처럼(=`.T` 없이) 표시.

## 4) 커밋
```bash
git add lib/avatar.ts components/toolbox/JpMarketBoard.tsx && git commit -m "feat(jp): 일본 종목 로고(도메인 맵 73) + 코드 .T 표시 정리 (STEP 483)" && git push
```

## ⚠️ 일본 탭 남은 것 (키 필요 → 사용자 발급 후)
- **공시(EDINET) 라이브 피드** — EDINET API v2 키.
- **거시(BOJ/e-Stat) 라이브 피드** — e-Stat 앱 ID.
- (지금은 두 탭에 링크는 있어 정보 접근 가능.) 이 둘 빼면 일본 탭 현지 수준 완성.
