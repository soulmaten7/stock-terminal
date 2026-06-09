-- 026_link_hub_curation.sql
-- 2026-06-09 · 주식 관련 링크모음(link_hub) 큐레이션 25개 추가
-- 새 카테고리 analysis(재무·분석)·etf(ETF·펀드)·ipo(공모주·배당) + news/disclosure/community/macro 보강
-- ⚠️ 운종 DB(ref qxkmwlkchyxfzxbonhtj)에 MCP(execute_sql)로 이미 적용 완료(id 169~193). 본 파일은 repo 아카이브/재현용.

INSERT INTO public.link_hub (country, category, site_name, site_url, description, display_order, is_active) VALUES
('KR','analysis','FnGuide','https://www.fnguide.com','재무·실적·컨센서스 종합',10,true),
('KR','analysis','컴퍼니가이드','https://comp.fnguide.com','종목별 재무 스냅샷·지표',11,true),
('KR','analysis','한경 컨센서스','https://consensus.hankyung.com','증권사 애널리스트 리포트 모음',12,true),
('US','analysis','StockAnalysis','https://stockanalysis.com','무료 재무제표·지표·차트',20,true),
('US','analysis','TipRanks','https://www.tipranks.com','애널리스트 목표가·등급',21,true),
('US','analysis','Koyfin','https://www.koyfin.com','차트·재무 대시보드',22,true),
('US','analysis','Simply Wall St','https://simplywall.st','기업 가치 시각화 분석',23,true),
('KR','etf','ETF CHECK','https://www.etfcheck.co.kr','국내 ETF 비교·분석',10,true),
('KR','etf','KODEX','https://www.kodex.com','삼성자산운용 ETF',11,true),
('KR','etf','TIGER','https://www.tigeretf.com','미래에셋 ETF',12,true),
('KR','etf','금융투자협회 펀드정보','https://freesis.kofia.or.kr','펀드·금융투자 통계',13,true),
('US','etf','ETF.com','https://www.etf.com','미국 ETF 검색·비교',20,true),
('US','etf','ETFdb','https://etfdb.com','ETF 데이터베이스(VettaFi)',21,true),
('KR','ipo','38커뮤니케이션','https://www.38.co.kr','공모주·장외주식 정보',10,true),
('KR','ipo','IPO스탁','https://www.ipostock.co.kr','공모주 청약·일정',11,true),
('KR','ipo','SEIBRO 예탁결제원','https://www.seibro.or.kr','배당·권리·증권 정보',12,true),
('KR','disclosure','KIND 상장공시','https://kind.krx.co.kr','한국거래소 상장기업 공시',50,true),
('KR','news','더벨','https://www.thebell.co.kr','자본시장·IB 전문 매체',50,true),
('KR','news','조선비즈','https://biz.chosun.com','경제·산업 뉴스',51,true),
('US','news','Wall Street Journal','https://www.wsj.com','미국 경제 일간지',60,true),
('US','news','Financial Times','https://www.ft.com','글로벌 금융 일간지',61,true),
('US','news','Barron''s','https://www.barrons.com','미국 투자 주간지',62,true),
('KR','community','디시 주식 갤러리','https://gall.dcinside.com/board/lists/?id=stock','국내 주식 커뮤니티',50,true),
('KR','community','클리앙','https://www.clien.net','IT·재테크 커뮤니티',51,true),
('US','macro','Trading Economics','https://tradingeconomics.com','글로벌 경제지표·캘린더',50,true);
