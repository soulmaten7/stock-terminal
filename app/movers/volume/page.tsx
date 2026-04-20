import WidgetDetailStub from '@/components/common/WidgetDetailStub';

const COLS = ['순위', '종목명', '거래량', '평균거래량', '배수', '현재가', '등락률'];
const NAMES = ['에코프로비엠','포스코퓨처엠','셀트리온','카카오게임즈','HLB','에코프로','알테오젠','HPSP','레인보우로보틱스','한화오션',
               'SK하이닉스','삼성전자','NAVER','두산로보틱스','코스모신소재','미래에셋증권','나노신소재','현대로템','두산퓨얼셀','LS ELECTRIC'];
const ROWS = Array.from({ length: 20 }, (_, i) => ({
  순위: i + 1,
  종목명: NAMES[i],
  거래량: `${(Math.random() * 20000000 + 1000000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
  평균거래량: `${(Math.random() * 2000000 + 100000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
  배수: `${(Math.random() * 20 + 2).toFixed(1)}x`,
  현재가: `${(Math.random() * 200000 + 5000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원`,
  등락률: `+${(Math.random() * 15).toFixed(2)}%`,
}));

export default function VolumeMoversPage() {
  return (
    <WidgetDetailStub
      title="거래량 급등 TOP"
      description="오늘 평균 대비 거래량이 급등한 종목입니다. KIS API FHPST01710000 기반."
      columns={COLS}
      rows={ROWS}
    />
  );
}
