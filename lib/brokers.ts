// 증권사 거래대금 순위 (리테일 국내주식 기준). ⚠️ 실시간 아님 — 분기별 갱신 고정값.
// 출처: 코스콤/금투협 집계 언론 보도. 점유%는 확인된 상위 3곳만(근거 없는 수치 금지).
// 중위권(4위~) 순서는 근사치(분기 변동) — 바뀌면 이 배열만 손보면 됨.
export type Broker = {
  rank: number;
  name: string;
  domain: string;
  url: string;
  share?: number; // 국내주식 거래대금 점유율 % (확인된 곳만)
  note?: string;
};

export const BROKERS: Broker[] = [
  { rank: 1, name: "키움증권", domain: "kiwoom.com", url: "https://www.kiwoom.com", share: 18, note: "20년 연속 1위" },
  { rank: 2, name: "미래에셋증권", domain: "securities.miraeasset.com", url: "https://securities.miraeasset.com", share: 13 },
  { rank: 3, name: "한국투자증권", domain: "truefriend.com", url: "https://www.truefriend.com", share: 11 },
  { rank: 4, name: "삼성증권", domain: "samsungpop.com", url: "https://www.samsungpop.com" },
  { rank: 5, name: "NH투자증권", domain: "nhqv.com", url: "https://www.nhqv.com" },
  { rank: 6, name: "KB증권", domain: "kbsec.com", url: "https://www.kbsec.com" },
  { rank: 7, name: "신한투자증권", domain: "shinhansec.com", url: "https://www.shinhansec.com" },
  { rank: 8, name: "하나증권", domain: "hanaw.com", url: "https://www.hanaw.com" },
  { rank: 9, name: "메리츠증권", domain: "imeritz.com", url: "https://www.imeritz.com" },
  { rank: 10, name: "토스증권", domain: "tossinvest.com", url: "https://www.tossinvest.com", note: "신규 계좌 급증" },
  { rank: 11, name: "대신증권", domain: "daishin.com", url: "https://www.daishin.com" },
  { rank: 12, name: "한화투자증권", domain: "hanwhawm.com", url: "https://www.hanwhawm.com" },
];
