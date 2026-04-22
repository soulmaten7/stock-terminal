# 경제 캘린더 데이터 업데이트 가이드

`data/economic-events.json` 은 월 1회 수동으로 갱신합니다. 자동 API가 아직 붙지 않아 사람이 직접 일정을 복사-업데이트해야 정확합니다.

## 업데이트 주기
- **매월 1일** 다음 60일치 주요 지표 반영
- 긴급 이벤트(임시 FOMC, 깜짝 BOJ 회의 등) 발생 시 즉시 추가

## 출처 (우선순위 순)
1. **Investing.com 경제 캘린더** — https://kr.investing.com/economic-calendar/
2. **FOMC 공식 일정** — https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
3. **한국은행 보도자료 일정** — https://www.bok.or.kr/portal/bbs/B0000338/list.do
4. **통계청 공표 일정** — https://kostat.go.kr/anse/

## 이벤트 필드
| 필드 | 설명 | 예시 |
|------|------|------|
| date | ISO 날짜 | "2026-05-13" |
| time | KST 24시간제 | "21:30" |
| country | ISO 국가코드 | "US", "KR", "JP", "EU", "GB" |
| flag | 국기 이모지 | "🇺🇸" |
| title | 한국어 지표명 | "CPI 월간" |
| importance | 중요도 1-3 | 3 = 상 (FOMC/CPI/NFP/BOJ), 2 = 중, 1 = 하 |
| forecast | 시장 예상치 | "0.2%", "150K", "5.50%", "-" |
| previous | 직전 실제치 | "0.3%", "-" |

## 중요도 가이드
- **3 (상, 빨강 점)**: 중앙은행 금리 결정, CPI, NFP, GDP 속보치, FOMC 회의록, PCE
- **2 (중, 주황)**: 소매판매, 내구재, 신규실업수당, 미시건 소비자심리
- **1 (하, 회색)**: 기타 2차 지표

## 파일 갱신 후
```bash
cd ~/Desktop/OTMarketing
npm run build  # 빌드 에러 없는지 확인
git add data/economic-events.json
git commit -m "chore: update economic events for {YYYY-MM}"
git push
```
`updatedAt` 필드도 함께 갱신하는 것을 잊지 말 것.

## 향후 자동화 계획
Finnhub 또는 FRED 키 확보 시 `/api/calendar/upcoming` 내부만 API 호출로 교체. 컴포넌트와 JSON 스키마는 그대로 유지되어 마이그레이션 비용 최소.
