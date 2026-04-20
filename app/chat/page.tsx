import WidgetDetailStub from '@/components/common/WidgetDetailStub';

const COLS = ['시각', '닉네임', '메시지', '종목 태그', '좋아요'];
const NICKS = ['주식고수','투자왕','차트맨','배당러버','스윙트레이더','가치투자자','퀀트왕','바이더딥','선물왕','ETF부자',
               '코스닥전문가','반도체덕후','바이오투자','배터리왕','AI투자자','부동산보다주식','장기투자자','단타왕','ETF마니아','인덱스투자'];
const MSGS = [
  '$005930 오늘 HBM 호재로 강세. 2% 이상 유지 중',
  '코스피 오후 들어서 회복세. 외인 순매수 전환',
  '$셀트리온 FDA 허가 이후 바이오 섹터 동반 상승',
  '미국 CPI 낮게 나오면 내일 갭업 가능성 있음',
  '$000660 목표가 23만 유지, 현재가에서 매력적',
  'FOMC 전까지는 관망. 금리 동결 기대감',
  '$삼성SDI 배터리 수주 뉴스. 강세 지속 예상',
  '오늘 외인 순매수 종목 위주로 접근',
  '코스닥 급등 후 피로감. 차익실현 구간',
  '$NAVER 광고 실적 개선 기대. 분기보고서 주목',
];
const ROWS = Array.from({ length: 20 }, (_, i) => ({
  시각: `15:${String(29 - Math.floor(i / 2)).padStart(2, '0')}:${String(58 - (i % 2) * 23).padStart(2, '0')}`,
  닉네임: NICKS[i],
  메시지: MSGS[i % 10],
  '종목 태그': i % 3 === 0 ? '$005930' : i % 3 === 1 ? '$000660' : '-',
  좋아요: Math.floor(Math.random() * 20),
}));

export default function ChatPage() {
  return (
    <WidgetDetailStub
      title="실시간 채팅"
      description="실시간 투자자 채팅입니다. Supabase Realtime 기반 (Phase B에서 실연동 예정)."
      columns={COLS}
      rows={ROWS}
    />
  );
}
