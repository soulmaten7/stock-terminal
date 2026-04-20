import WidgetDetailStub from '@/components/common/WidgetDetailStub';

const COLS = ['순위', '종목명', '외국인 순매수(억)', '기관 순매수(억)', '현재가', '등락률'];
const NAMES = ['SK하이닉스','삼성전자','LG전자','POSCO홀딩스','KB금융','삼성바이오로직스','현대차','기아','LG에너지솔루션','셀트리온',
               'NAVER','카카오','SK이노베이션','삼성SDI','SK텔레콤','하이브','에코프로비엠','한화오션','두산에너빌리티','LS ELECTRIC'];
const ROWS = Array.from({ length: 20 }, (_, i) => ({
  순위: i + 1,
  종목명: NAMES[i],
  '외국인 순매수(억)': `+${Math.floor(Math.random() * 3000 + 100).toLocaleString('ko-KR')}`,
  '기관 순매수(억)': `${Math.random() > 0.5 ? '+' : '-'}${Math.floor(Math.random() * 2000 + 50).toLocaleString('ko-KR')}`,
  현재가: `${(Math.random() * 200000 + 5000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원`,
  등락률: `${(Math.random() * 6 - 1).toFixed(2)}%`,
}));

export default function NetBuyPage() {
  return (
    <WidgetDetailStub
      title="실시간 수급 TOP"
      description="외국인·기관 순매수 상위 종목입니다. KIS API FHPTJ04400000 기반."
      columns={COLS}
      rows={ROWS}
    />
  );
}
