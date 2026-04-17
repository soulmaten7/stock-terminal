#!/usr/bin/env python3
"""
stocks + link_hub 테이블 시딩 스크립트
- FinanceDataReader로 KOSPI+KOSDAQ 전체 종목 → stocks 테이블 upsert
- link_hub 데이터 → link_hub 테이블 upsert
"""
import os
import sys
import warnings
warnings.filterwarnings('ignore')

import FinanceDataReader as fdr
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: .env.local에 SUPABASE URL/KEY 누락")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_market(market_code: str, market_label: str):
    print(f"[{market_label}] 종목 리스트 가져오는 중...")
    df = fdr.StockListing(market_code)
    rows = []
    for _, row in df.iterrows():
        try:
            symbol = str(row.get('Code', '')).zfill(6)
            name = str(row.get('Name', ''))
            market_cap = int(row['Marcap']) if row.get('Marcap') and row['Marcap'] > 0 else None
            if not symbol or not name:
                continue
            rows.append({
                'symbol': symbol,
                'name_ko': name,
                'market': market_label,
                'country': 'KR',
                'market_cap': market_cap,
                'is_active': True,
            })
        except Exception as e:
            print(f"  WARN {row.get('Code', '?')}: {e}")
    print(f"[{market_label}] {len(rows)}건")
    return rows


# ========== stocks ==========
all_rows = fetch_market('KOSPI', 'KOSPI') + fetch_market('KOSDAQ', 'KOSDAQ')
print(f"\n[stocks] 총 {len(all_rows)}건 upsert 시작")

BATCH = 500
for i in range(0, len(all_rows), BATCH):
    chunk = all_rows[i:i + BATCH]
    supabase.table('stocks').upsert(chunk, on_conflict='symbol,market').execute()
    print(f"  upsert {i + len(chunk)}/{len(all_rows)}")

stocks_count = supabase.table('stocks').select('id', count='exact').execute().count
print(f"[stocks 완료] 테이블 총 {stocks_count}건\n")


# ========== link_hub ==========
link_hub_seed = [
    # KR - news
    ('KR', 'news', '네이버 증권 뉴스', 'https://finance.naver.com/news/', '종합 주식 뉴스, 실시간 속보', 1),
    ('KR', 'news', '한국경제', 'https://www.hankyung.com/economy', '경제 전문 일간지', 2),
    ('KR', 'news', '매일경제', 'https://www.mk.co.kr/economy', '경제 전문 일간지', 3),
    ('KR', 'news', '이데일리', 'https://www.edaily.co.kr', '증권/금융 전문 미디어', 4),
    ('KR', 'news', '머니투데이', 'https://www.mt.co.kr', '경제/금융 뉴스', 5),
    ('KR', 'news', '파이낸셜뉴스', 'https://www.fnnews.com', '금융 전문 뉴스', 6),
    ('KR', 'news', '서울경제', 'https://www.sedaily.com', '종합 경제 뉴스', 7),
    ('KR', 'news', '아시아경제', 'https://www.asiae.co.kr', '종합 경제 뉴스', 8),
    ('KR', 'news', '연합인포맥스', 'https://www.yonhapnews.co.kr', '실시간 금융정보', 9),
    # KR - disclosure
    ('KR', 'disclosure', 'DART 전자공시시스템', 'https://dart.fss.or.kr', '상장기업 공시, 재무제표, 감사보고서', 1),
    ('KR', 'disclosure', '금융감독원', 'https://www.fss.or.kr', '금융감독 정보, 기업분석', 2),
    ('KR', 'disclosure', 'NICE신용평가', 'https://www.nicerating.com', '기업 신용등급, 신용분석', 3),
    ('KR', 'disclosure', '한국신용평가', 'https://www.kisrating.com', '기업 신용등급 평가', 4),
    # KR - exchange
    ('KR', 'exchange', '한국거래소(KRX)', 'https://www.krx.co.kr', '수급 데이터, 공매도 잔고, 거래량, 시가총액', 1),
    ('KR', 'exchange', 'KRX 정보데이터시스템', 'http://data.krx.co.kr', '상세 시장 데이터, 통계', 2),
    ('KR', 'exchange', 'KOSCOM', 'https://www.koscom.co.kr', '금융 데이터 서비스', 3),
    # KR - macro
    ('KR', 'macro', '한국은행 ECOS', 'https://ecos.bok.or.kr', '기준금리, GDP, CPI, 통화량 등 경제통계', 1),
    ('KR', 'macro', '통계청 KOSIS', 'https://kosis.kr', '국가 통계 데이터', 2),
    ('KR', 'macro', '기획재정부', 'https://www.moef.go.kr', '경제정책, 재정 현황', 3),
    # KR - chart
    ('KR', 'chart', 'TradingView', 'https://www.tradingview.com', '실시간 차트, 기술적 분석, 글로벌 시장', 1),
    ('KR', 'chart', '알파스퀘어', 'https://www.alphasquare.co.kr', '퀀트 분석, 종목 스크리너', 2),
    ('KR', 'chart', 'Investing.com', 'https://kr.investing.com', '글로벌 시장 데이터, 경제 캘린더', 3),
    ('KR', 'chart', 'Finviz', 'https://finviz.com', '미국 주식 스크리너, 히트맵', 4),
    # KR - research
    ('KR', 'research', '키움증권 리서치', 'https://www.kiwoom.com', '종목분석, 산업분석 리포트', 1),
    ('KR', 'research', '미래에셋증권 리서치', 'https://securities.miraeasset.com', '투자전략, 종목분석', 2),
    ('KR', 'research', '삼성증권 리서치', 'https://www.samsungpop.com', '시장분석, 종목분석', 3),
    ('KR', 'research', 'NH투자증권 리서치', 'https://www.nhqv.com', '투자전략 리포트', 4),
    ('KR', 'research', '한국투자증권 리서치', 'https://www.truefriend.com', '종목분석, 시장전망', 5),
    # KR - community
    ('KR', 'community', '네이버 종목토론방', 'https://finance.naver.com', '종목별 투자자 토론', 1),
    ('KR', 'community', '팍스넷', 'https://www.paxnet.co.kr', '주식 커뮤니티, 종목토론', 2),
    ('KR', 'community', 'Investing.com 포럼', 'https://kr.investing.com/analysis', '투자 분석, 의견 교환', 3),
    # US - news
    ('US', 'news', 'Bloomberg', 'https://www.bloomberg.com', '글로벌 금융 뉴스', 1),
    ('US', 'news', 'Reuters', 'https://www.reuters.com/business', '글로벌 비즈니스 뉴스', 2),
    ('US', 'news', 'CNBC', 'https://www.cnbc.com', '미국 금융 전문 미디어', 3),
    ('US', 'news', 'MarketWatch', 'https://www.marketwatch.com', '시장 데이터, 뉴스', 4),
    ('US', 'news', 'Seeking Alpha', 'https://seekingalpha.com', '투자 분석, 종목 리서치', 5),
    ('US', 'news', 'Yahoo Finance', 'https://finance.yahoo.com', '종합 금융 데이터', 6),
    # US - disclosure
    ('US', 'disclosure', 'SEC EDGAR', 'https://www.sec.gov/edgar', '미국 기업 공시 (10-K, 10-Q, 8-K)', 1),
    ('US', 'disclosure', 'Macrotrends', 'https://www.macrotrends.net', '장기 재무 데이터, 차트', 2),
    ('US', 'disclosure', 'GuruFocus', 'https://www.gurufocus.com', '가치투자 분석, 재무 데이터', 3),
    # US - exchange
    ('US', 'exchange', 'NYSE', 'https://www.nyse.com', '뉴욕증권거래소', 1),
    ('US', 'exchange', 'NASDAQ', 'https://www.nasdaq.com', '나스닥 증권거래소', 2),
    ('US', 'exchange', 'CBOE', 'https://www.cboe.com', '옵션/변동성 데이터', 3),
    # US - macro
    ('US', 'macro', 'FRED', 'https://fred.stlouisfed.org', '미국 연준 경제데이터', 1),
    ('US', 'macro', 'BLS', 'https://www.bls.gov', '미국 노동통계국', 2),
    ('US', 'macro', 'BEA', 'https://www.bea.gov', '미국 경제분석국', 3),
    # US - chart
    ('US', 'chart', 'TradingView', 'https://www.tradingview.com', '실시간 차트, 기술적 분석', 1),
    ('US', 'chart', 'Finviz', 'https://finviz.com', '스크리너, 히트맵, 뉴스', 2),
    ('US', 'chart', 'StockCharts', 'https://stockcharts.com', '기술적 분석 차트', 3),
    ('US', 'chart', 'Barchart', 'https://www.barchart.com', '시장 데이터, 옵션 분석', 4),
    # US - research
    ('US', 'research', 'Morningstar', 'https://www.morningstar.com', '펀드/주식 분석 리서치', 1),
    ('US', 'research', 'Zacks', 'https://www.zacks.com', '종목 등급, 실적 추정치', 2),
    ('US', 'research', 'S&P Global', 'https://www.spglobal.com', '신용등급, 시장 분석', 3),
    # US - community
    ('US', 'community', 'Reddit r/investing', 'https://www.reddit.com/r/investing', '투자 토론 커뮤니티', 1),
    ('US', 'community', 'Reddit r/wallstreetbets', 'https://www.reddit.com/r/wallstreetbets', '개인투자자 커뮤니티', 2),
    ('US', 'community', 'StockTwits', 'https://stocktwits.com', '종목별 실시간 의견', 3),
]

link_rows = [
    {
        'country': c, 'category': cat, 'site_name': name, 'site_url': url,
        'description': desc, 'display_order': order, 'is_active': True
    }
    for (c, cat, name, url, desc, order) in link_hub_seed
]

print(f"[link_hub] 총 {len(link_rows)}건 upsert 시작")
supabase.table('link_hub').delete().neq('id', 0).execute()
supabase.table('link_hub').insert(link_rows).execute()
link_count = supabase.table('link_hub').select('id', count='exact').execute().count
print(f"[link_hub 완료] 테이블 총 {link_count}건")

print("\n✅ 전체 시딩 완료")
