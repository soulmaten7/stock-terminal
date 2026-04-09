-- 주요 종목 시드 데이터
-- Supabase SQL Editor에서 실행

INSERT INTO stocks (symbol, name_ko, name_en, market, country, sector) VALUES
-- 코스피
('005930', '삼성전자', 'Samsung Electronics', 'KOSPI', 'KR', '반도체'),
('000660', 'SK하이닉스', 'SK Hynix', 'KOSPI', 'KR', '반도체'),
('373220', 'LG에너지솔루션', 'LG Energy Solution', 'KOSPI', 'KR', '2차전지'),
('207940', '삼성바이오로직스', 'Samsung Biologics', 'KOSPI', 'KR', '바이오'),
('005380', '현대차', 'Hyundai Motor', 'KOSPI', 'KR', '자동차'),
('000270', '기아', 'Kia', 'KOSPI', 'KR', '자동차'),
('005490', 'POSCO홀딩스', 'POSCO Holdings', 'KOSPI', 'KR', '철강'),
('035420', 'NAVER', 'NAVER', 'KOSPI', 'KR', 'IT/플랫폼'),
('035720', '카카오', 'Kakao', 'KOSPI', 'KR', 'IT/플랫폼'),
('006400', '삼성SDI', 'Samsung SDI', 'KOSPI', 'KR', '2차전지'),

-- 코스닥
('247540', '에코프로비엠', 'EcoPro BM', 'KOSDAQ', 'KR', '2차전지'),
('086520', '에코프로', 'EcoPro', 'KOSDAQ', 'KR', '2차전지'),
('196170', '알테오젠', 'Alteogen', 'KOSDAQ', 'KR', '바이오'),
('028300', 'HLB', 'HLB', 'KOSDAQ', 'KR', '바이오'),
('058470', '리노공업', 'LEENO Industrial', 'KOSDAQ', 'KR', '반도체'),

-- 미국
('AAPL', '애플', 'Apple', 'NASDAQ', 'US', 'Technology'),
('MSFT', '마이크로소프트', 'Microsoft', 'NASDAQ', 'US', 'Technology'),
('GOOGL', '알파벳', 'Alphabet', 'NASDAQ', 'US', 'Technology'),
('AMZN', '아마존', 'Amazon', 'NASDAQ', 'US', 'Consumer Cyclical'),
('NVDA', '엔비디아', 'NVIDIA', 'NASDAQ', 'US', 'Technology'),
('TSLA', '테슬라', 'Tesla', 'NASDAQ', 'US', 'Consumer Cyclical'),
('META', '메타', 'Meta Platforms', 'NASDAQ', 'US', 'Technology'),
('NFLX', '넷플릭스', 'Netflix', 'NASDAQ', 'US', 'Communication Services'),
('AMD', 'AMD', 'AMD', 'NASDAQ', 'US', 'Technology'),
('PLTR', '팔란티어', 'Palantir Technologies', 'NYSE', 'US', 'Technology')
ON CONFLICT (symbol, market) DO UPDATE SET
  name_ko = EXCLUDED.name_ko,
  name_en = EXCLUDED.name_en,
  market = EXCLUDED.market,
  country = EXCLUDED.country,
  sector = EXCLUDED.sector;
