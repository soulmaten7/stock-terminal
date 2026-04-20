import WidgetDetailStub from '@/components/common/WidgetDetailStub';

const COLS = ['순위', '종목명', '등락률', '현재가', '전일가', '거래량', '시장'];
const NAMES = ['HLB','에코프로비엠','엔켐','씨에스윈드','한화오션','카카오뱅크','두산로보틱스','HPSP','레인보우로보틱스','알테오젠',
               '카카오게임즈','CJ CGV','두산퓨얼셀','한미반도체','리노공업','휴젤','메가스터디','OCI홀딩스','한샘','삼성바이오로직스'];
const ROWS = Array.from({ length: 20 }, (_, i) => ({
  순위: i + 1,
  종목명: NAMES[i],
  등락률: i < 10 ? `+${(Math.random() * 29 + 1).toFixed(2)}%` : `-${(Math.random() * 15 + 1).toFixed(2)}%`,
  현재가: `${(Math.random() * 200000 + 5000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원`,
  전일가: `${(Math.random() * 200000 + 5000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원`,
  거래량: `${(Math.random() * 10000000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
  시장: i % 3 === 0 ? 'KOSPI' : 'KOSDAQ',
}));

export default function PriceMoversPage() {
  return (
    <WidgetDetailStub
      title="상승/하락 TOP"
      description="오늘 등락률 상위/하위 종목입니다. KIS API 등락률 순위 기반."
      columns={COLS}
      rows={ROWS}
    />
  );
}
