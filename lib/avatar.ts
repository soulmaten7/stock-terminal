// 종목 아바타/로고 유틸 — 주요 종목은 실로고(favicon), 나머지는 레터 아바타 폴백.

const PALETTE = [
  "#FEE2E2", "#FEF3C7", "#D1FAE5", "#DBEAFE",
  "#EDE9FE", "#FCE7F3", "#E0F2FE", "#FEF9C3",
  "#FFE4E6", "#ECFCCB",
];

export function avatarBg(name: string): string {
  const s = name || "";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function avatarChar(name: string): string {
  const t = (name || "").trim();
  return t ? t.charAt(0).toUpperCase() : "?";
}

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

/** 실로고 URL (logo.dev). 미국=티커 자동, 국내=도메인 매핑. 없으면 null(→아바타). */
export function logoUrl(code: string): string | null {
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
  const domain = DOMAIN_MAP[code];
  if (!domain) return null;
  return LOGODEV_TOKEN
    ? `https://img.logo.dev/${domain}?token=${LOGODEV_TOKEN}&size=128&retina=true`
    : `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
}

/** 레버리지/인버스 ETF면 배지 정보(이름 파싱), 아니면 null */
export function leverageInfo(name: string): { label: string; inverse: boolean } | null {
  const n = (name || "").toUpperCase();
  const inverse = /인버스|INVERSE|BEAR/.test(n);
  let mult: string | null = null;
  if (/3\s*X|3배/.test(n)) mult = "3x";
  else if (/2\s*X|2배/.test(n)) mult = "2x";
  else if (/레버리지|LEVERAGE|BULL/.test(n)) mult = "2x";
  if (mult) return { label: mult, inverse };
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
