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
  { rank: 1, name: "키움증권", domain: "kiwoom.com", url: "https://www.kiwoom.com", share: 18, note: "리테일 거래 강세·HTS 영웅문" },
  { rank: 2, name: "미래에셋증권", domain: "securities.miraeasset.com", url: "https://securities.miraeasset.com", share: 13, note: "미래에셋그룹·대형 종합증권" },
  { rank: 3, name: "한국투자증권", domain: "truefriend.com", url: "https://www.truefriend.com", share: 11, note: "한국금융지주 계열" },
  { rank: 4, name: "삼성증권", domain: "samsungpop.com", url: "https://www.samsungpop.com", note: "삼성 계열 대형사" },
  { rank: 5, name: "NH투자증권", domain: "nhqv.com", url: "https://www.nhqv.com", note: "NH농협금융 계열" },
  { rank: 6, name: "KB증권", domain: "kbsec.com", url: "https://www.kbsec.com", note: "KB금융 계열" },
  { rank: 7, name: "신한투자증권", domain: "shinhansec.com", url: "https://www.shinhansec.com", note: "신한금융 계열" },
  { rank: 8, name: "하나증권", domain: "hanaw.com", url: "https://www.hanaw.com", note: "하나금융 계열" },
  { rank: 9, name: "메리츠증권", domain: "imeritz.com", url: "https://www.imeritz.com", note: "메리츠금융 계열" },
  { rank: 10, name: "토스증권", domain: "tossinvest.com", url: "https://www.tossinvest.com", note: "토스(비바리퍼블리카)·간편 MTS" },
  { rank: 11, name: "대신증권", domain: "daishin.com", url: "https://www.daishin.com", note: "대신금융그룹(독립계)" },
  { rank: 12, name: "한화투자증권", domain: "hanwhawm.com", url: "https://www.hanwhawm.com", note: "한화 계열" },
  { rank: 13, name: "카카오페이증권", domain: "kakaopaysec.com", url: "https://www.kakaopaysec.com", note: "카카오 계열·간편 증권" },
  { rank: 14, name: "유안타증권", domain: "myasset.com", url: "https://www.myasset.com", note: "대만 유안타금융 계열(옛 동양)" },
  { rank: 15, name: "현대차증권", domain: "hmsec.com", url: "https://www.hmsec.com", note: "현대차그룹 계열" },
  { rank: 16, name: "교보증권", domain: "iprovest.com", url: "https://www.iprovest.com", note: "교보생명 계열" },
  { rank: 17, name: "SK증권", domain: "sks.co.kr", url: "https://www.sks.co.kr", note: "독립계 종합증권" },
  { rank: 18, name: "유진투자증권", domain: "eugenefn.com", url: "https://www.eugenefn.com", note: "유진그룹 계열" },
  { rank: 19, name: "IBK투자증권", domain: "ibks.com", url: "https://www.ibks.com", note: "IBK기업은행 계열" },
  { rank: 20, name: "DB증권", domain: "dbsec.co.kr", url: "https://www.dbsec.co.kr", note: "DB금융그룹 계열(옛 동부)" },
];
