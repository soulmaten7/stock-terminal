// 종목 아바타/로고 유틸 — 주요 종목은 실로고(favicon), 나머지는 레터 아바타 폴백.

const PALETTE = [
  "#FEE2E2", "#FEF3C7", "#D1FAE5", "#DBEAFE",
  "#EDE9FE", "#FCE7F3", "#E0F2FE", "#FEF9C3",
  "#FFE4E6", "#ECFCCB",
];

export function avatarBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
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
