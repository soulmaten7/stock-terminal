import WidgetDetailStub from '@/components/common/WidgetDetailStub';

const COLS = ['종목명', '종목코드', '현재가', '등락률', '거래량', '시가총액', '추가일'];
const ROWS = Array.from({ length: 20 }, (_, i) => ({
  종목명: ['삼성전자','SK하이닉스','NAVER','LG에너지솔루션','카카오','현대차','셀트리온','POSCO홀딩스','KB금융','삼성SDI',
           '기아','LG전자','SK이노베이션','삼성물산','SK텔레콤','하이브','에코프로비엠','HLB','롯데케미칼','두산에너빌리티'][i],
  종목코드: ['005930','000660','035420','373220','035720','005380','068270','005490','105560','006400',
             '000270','066570','096770','028260','017670','352820','247540','028300','011170','034020'][i],
  현재가: `${(Math.random() * 200000 + 10000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원`,
  등락률: `${(Math.random() * 6 - 3).toFixed(2)}%`,
  거래량: `${(Math.random() * 5000000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
  시가총액: `${(Math.random() * 50 + 1).toFixed(1)}조`,
  추가일: `2026-04-${String(i + 1).padStart(2, '0')}`,
}));

export default function WatchlistPage() {
  return (
    <WidgetDetailStub
      title="관심종목"
      description="내가 등록한 관심 종목 목록입니다. 실데이터는 로그인 후 Supabase에서 불러옵니다."
      columns={COLS}
      rows={ROWS}
    />
  );
}
