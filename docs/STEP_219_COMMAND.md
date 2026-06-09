<!-- 2026-06-07 -->
# STEP 219 — 로고 커버리지 대폭 확장 (국내 도메인 +58 · ETF 브랜드 배지)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_219_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시)
국내 랭킹 100개로 늘며 빈 로고가 많아짐 → 로고를 전체적으로 채움.
- **개별 종목**: `DOMAIN_MAP` 42 → ~100개(시총·거래대금 상위 대형·중형주 도메인 추가) → logo.dev 실로고.
- **일반 ETF**(KODEX 200·TIGER…): **브랜드 배지**(브랜드별 색 pill + 약자). 레버리지/인버스는 기존 2x/3x 배지 유지.
- 한계: logo.dev에 **소형주 로고는 없음** → 꼬리는 레터 아바타(정상). 도메인 틀린 게 보이면 한 줄로 수정.

## 전제 상태
- HEAD: STEP 218 상태
- 변경 2파일: `lib/avatar.ts`(DOMAIN_MAP 확장 + `etfBrand()` 추가) · `components/ui/StockLogo.tsx`(ETF 배지 단계 삽입)
- DB 변경 0

---

## 작업 1/3 — `lib/avatar.ts` DOMAIN_MAP 확장 (+58)

**찾기:**
```ts
  "010140": "samsungshi.com",       // 삼성중공업
  "011200": "hmm21.com",            // HMM
};
```
**바꾸기:**
```ts
  "010140": "samsungshi.com",       // 삼성중공업
  "011200": "hmm21.com",            // HMM
  // ── 엔터·게임 ──
  "352820": "hybecorp.com",         // 하이브
  "041510": "smentertainment.com",  // 에스엠
  "035900": "jype.com",             // JYP Ent.
  "122870": "ygfamily.com",         // 와이지엔터테인먼트
  "036570": "ncsoft.com",           // 엔씨소프트
  "251270": "netmarble.com",        // 넷마블
  "263750": "pearlabyss.com",       // 펄어비스
  "293490": "kakaogames.com",       // 카카오게임즈
  "112040": "wemade.com",           // 위메이드
  "078340": "com2us.com",           // 컴투스
  // ── 2차전지·소재·화학·정유 ──
  "247540": "ecoprobm.co.kr",       // 에코프로비엠
  "086520": "ecopro.co.kr",         // 에코프로
  "003670": "poscofuturem.com",     // 포스코퓨처엠
  "011170": "lottechem.com",        // 롯데케미칼
  "011780": "kkpc.com",             // 금호석유
  "010950": "s-oil.com",            // S-Oil
  "096770": "skinnovation.com",     // SK이노베이션
  "009830": "hanwhasolutions.com",  // 한화솔루션
  // ── 반도체·디스플레이·전자부품 ──
  "011070": "lginnotek.com",        // LG이노텍
  "034220": "lgdisplay.com",        // LG디스플레이
  "000990": "dbhitek.com",          // DB하이텍
  "357780": "soulbrain.co.kr",      // 솔브레인
  // ── 바이오·제약 ──
  "196170": "alteogen.com",         // 알테오젠
  "145020": "hugel.com",            // 휴젤
  "000100": "yuhan.co.kr",          // 유한양행
  "302440": "skbioscience.com",     // SK바이오사이언스
  "326030": "skbp.com",             // SK바이오팜
  // ── 자동차·부품 ──
  "018880": "hanonsystems.com",     // 한온시스템
  "161390": "hankooktire.com",      // 한국타이어앤테크놀로지
  "064350": "hyundai-rotem.co.kr",  // 현대로템
  // ── 조선·중공업·방산·기계 ──
  "012450": "hanwhaaerospace.com",  // 한화에어로스페이스
  "042660": "hanwhaocean.com",      // 한화오션
  "034020": "doosanenerbility.com", // 두산에너빌리티
  "241560": "doosanbobcat.com",     // 두산밥캣
  // ── 철강·건설 ──
  "004020": "hyundai-steel.com",    // 현대제철
  "000720": "hdec.co.kr",           // 현대건설
  "006360": "gsenc.com",            // GS건설
  "047040": "daewooenc.com",        // 대우건설
  "375500": "dlenc.co.kr",          // DL이앤씨
  // ── 통신·유틸·필수소비 ──
  "032640": "lguplus.com",          // LG유플러스
  "036460": "kogas.or.kr",          // 한국가스공사
  "033780": "ktng.com",             // KT&G
  // ── 유통·소비재·항공 ──
  "139480": "emart.com",            // 이마트
  "004170": "shinsegae.com",        // 신세계
  "023530": "lotteshopping.com",    // 롯데쇼핑
  "282330": "bgfretail.com",        // BGF리테일
  "161890": "kolmar.co.kr",         // 한국콜마
  "001040": "cj.net",               // CJ
  "003490": "koreanair.com",        // 대한항공
  // ── 금융(증권·보험·카드·지주) ──
  "005940": "nhqv.com",             // NH투자증권
  "016360": "samsungpop.com",       // 삼성증권
  "039490": "kiwoom.com",           // 키움증권
  "071050": "truefriend.com",       // 한국금융지주
  "029780": "samsungcard.com",      // 삼성카드
  "001450": "hi.co.kr",             // 현대해상
  "138930": "bnkfg.com",            // BNK금융지주
  "175330": "jbfg.com",             // JB금융지주
  "000880": "hanwha.co.kr",         // 한화
  "004990": "lotte.co.kr",          // 롯데지주
};
```

---

## 작업 2/3 — `lib/avatar.ts` ETF 브랜드 배지 함수 추가 (파일 끝)

**찾기:**
```ts
  if (inverse) return { label: "인", inverse: true };
  return null;
}
```
**바꾸기:**
```ts
  if (inverse) return { label: "인", inverse: true };
  return null;
}

// 일반 ETF 브랜드 → 배지 {약자, 색}. (레버리지/인버스는 leverageInfo 가 먼저 처리)
// 이름 앞부분이 브랜드면 매칭. 개별주는 한글명이라 오탐 없음.
const ETF_BRANDS: { re: RegExp; short: string; color: string; label: string }[] = [
  { re: /^KODEX/i,     short: "KO", color: "#1428A0", label: "KODEX (삼성자산운용)" },
  { re: /^TIGER/i,     short: "TI", color: "#E8540E", label: "TIGER (미래에셋자산운용)" },
  { re: /^RISE/i,      short: "RI", color: "#5B3FD6", label: "RISE (KB자산운용)" },
  { re: /^KBSTAR/i,    short: "KB", color: "#F5A623", label: "KBSTAR (KB자산운용)" },
  { re: /^ACE/i,       short: "AC", color: "#D81F2A", label: "ACE (한국투자신탁운용)" },
  { re: /^SOL/i,       short: "SO", color: "#00A9A5", label: "SOL (신한자산운용)" },
  { re: /^PLUS/i,      short: "PL", color: "#F36F21", label: "PLUS (한화자산운용)" },
  { re: /^ARIRANG/i,   short: "AR", color: "#F36F21", label: "ARIRANG (한화자산운용)" },
  { re: /^HANARO/i,    short: "HN", color: "#00A65A", label: "HANARO (NH아문디자산운용)" },
  { re: /^KOSEF/i,     short: "KS", color: "#7C3AED", label: "KOSEF (키움투자자산운용)" },
  { re: /^KIWOOM/i,    short: "KW", color: "#B91C1C", label: "KIWOOM (키움투자자산운용)" },
  { re: /^TIMEFOLIO/i, short: "TF", color: "#374151", label: "TIMEFOLIO" },
];

/** 일반 ETF면 브랜드 배지 정보, 아니면 null */
export function etfBrand(name: string): { short: string; color: string; label: string } | null {
  const n = (name || "").trim();
  for (const b of ETF_BRANDS) {
    if (b.re.test(n)) return { short: b.short, color: b.color, label: b.label };
  }
  return null;
}
```

---

## 작업 3/3 — `components/ui/StockLogo.tsx` ETF 브랜드 배지 단계 삽입

**찾기 (import):**
```tsx
import { avatarBg, avatarChar, logoUrl, leverageInfo } from "@/lib/avatar";
```
**바꾸기:**
```tsx
import { avatarBg, avatarChar, logoUrl, leverageInfo, etfBrand } from "@/lib/avatar";
```

**찾기 (레버리지 배지 다음 → 실로고 사이에 삽입):**
```tsx
  }

  // 2) 주요 종목 실로고
  const url = logoUrl(code);
```
**바꾸기:**
```tsx
  }

  // 1.5) 일반 ETF(국내 6자리만) → 브랜드 배지 (KODEX·TIGER… / 레버리지는 위에서 처리)
  //      6자리 가드 → 미국 영문명(SOL·ACE 등) 오탐 방지
  const etf = /^\d{6}$/.test(code) ? etfBrand(name) : null;
  if (etf) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
        style={{ width: size, height: size, background: etf.color, fontSize: Math.round(size * 0.34) }}
        title={etf.label}
      >
        {etf.short}
      </span>
    );
  }

  // 2) 주요 종목 실로고
  const url = logoUrl(code);
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add lib/avatar.ts components/ui/StockLogo.tsx && git commit -m "feat(v7): 로고 커버리지 확장 — 국내 도메인 42→100 + ETF 브랜드 배지(KODEX·TIGER…) (STEP 219)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 홈/마켓 국내 100 리스트에서 **실로고가 확 늘어남**(하이브·에코프로·LG이노텍·현대건설·키움증권 등)
- [ ] **일반 ETF에 브랜드 배지**(KODEX→`KO` 남색, TIGER→`TI` 주황, RISE→`RI` 보라 등), 빈칸 아님
- [ ] **레버리지/인버스 ETF는 여전히 2x/3x/인 배지**(KODEX 레버리지 등)
- [ ] 개별 종목 한글명이 ETF 배지로 **오탐되지 않음**(에이스침대 등 한글 → 정상 로고/아바타)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 도메인은 **best-effort** — 혹시 엉뚱하거나 빠진 로고 있으면 그 종목명만 알려주면 `DOMAIN_MAP` 한 줄 수정.
- logo.dev에 **소형주 로고는 없을 수 있음** → 레터 아바타 폴백(정상, 빈칸 아님).
- ETF 배지 약자 충돌 회피(KODEX `KO`↔KOSEF `KS`, TIGER `TI`↔TIMEFOLIO `TF`).
- **문서 TODO**(다음 갱신): STEP 162·215~219.

---
> STEP 219 = 로고 커버리지(국내 도메인 +58 · ETF 브랜드 배지). 전제 STEP 218. 문서 묶어 갱신.
