import WidgetDetailStub from '@/components/common/WidgetDetailStub';

const COLS = ['접수일', '회사명', '공시 제목', '공시 유형', '링크'];
const CORPS = ['삼성전자','LG화학','셀트리온','현대차','POSCO홀딩스','SK이노베이션','KB금융','삼성바이오로직스','카카오','LG에너지솔루션',
               'SK하이닉스','NAVER','기아','삼성SDI','SK텔레콤','HLB','두산에너빌리티','한화솔루션','OCI홀딩스','GS칼텍스'];
const TITLES = ['자기주식 취득 결정','분기보고서 (2026.Q1)','임상3상 결과 공시','최대주주 지분 변경','유상증자 결정',
                '사업보고서 (2025)','반기보고서','감사보고서 제출','합병 결정 공시','주요사항보고서',
                '기타공시','단기차입금 한도 증액','수시공시','주주총회 결과','임원·주요주주 지분변동',
                '대규모 내부거래 이사회 결의','특수관계인 거래','전환사채 발행','신주인수권부사채','무상증자 결정'];
const ROWS = Array.from({ length: 20 }, (_, i) => ({
  접수일: `2026-04-${String(20 - Math.floor(i / 2)).padStart(2, '0')}`,
  회사명: CORPS[i],
  '공시 제목': TITLES[i],
  '공시 유형': ['주요사항','정기공시','지분공시','감사보고','공시'][i % 5],
  링크: 'DART 원문',
}));

export default function FilingsPage() {
  return (
    <WidgetDetailStub
      title="DART 공시 피드"
      description="금융감독원 전자공시시스템(DART) 최신 공시 목록입니다."
      columns={COLS}
      rows={ROWS}
    />
  );
}
