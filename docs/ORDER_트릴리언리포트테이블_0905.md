# ORDER — Trillion 리포트 테이블 설계 (2026-09-05)

방향 전환의 핵심 배관 1단계. 채널이 만드는 리포트를 담을 Supabase
테이블을 설계한다. 리포트는 종목 페이지(`/stock/[symbol]`)에 종목코드로
매달려 시간순 레이어로 쌓인다(otpage1의 날짜순 단일 목록과 다름 —
종목별 누적이 목적).

이 STEP은 **설계·마이그레이션 SQL 초안 보고까지**. 실제 테이블 생성
(마이그레이션 적용)은 사용자 확정 후 다음 단계에서 채팅(MCP)이 적용한다.
이 STEP에서 DB를 실제로 바꾸지 않는다.

## 확정된 설계 방향 (사용자 확정 2026-09-05)
- 리포트 = 채널 landing.json 데이터를 Trillion으로 옮긴 것. 필드는
  landing.json을 그대로 매핑 + **종목코드 컬럼 추가**.
- 종목 식별: **채널이 종목코드를 넣어 보낸다**(KR 6자리, US 티커). 이름
  매칭·역조회는 만들지 않는다(조사 결과: 역조회 함수 부재·이름 유일성
  DB 미보장·사명변경 리스크 때문에 코드 방식 채택).
- 표시: 종목 페이지에서 `종목코드 = X ORDER BY 발행일 DESC`로 뽑아
  최신이 위로 쌓이는 레이어.
- 국가: 지금은 KR만. US는 이후 — 스키마에 country 컬럼을 두어 확장만
  열어두고, 이번엔 US 필드를 억지로 채우지 않는다.
- 번역: 원문 1벌만 저장. 언어 표시는 이후 별도 STEP(translation_cache
  재사용). 이번 스키마는 원문 저장에 집중.

## STEP 1 — 설계 보고 (DB 변경 없음, 보고 후 대기)

1. **기존 자산 재확인**: landing.json 필드 정의(채널 조사 기준: date·
   reportDate·stockName·broker·verdict·targetPrice·currentPrice·upside·
   reasons[{title,detail}]·earningsSummary)와 Trillion 기존 컨벤션
   (kr_stock_snapshot의 symbol 형식, RLS 패턴, 기존 테이블 네이밍·컬럼
   타입 관례)을 대조해서 보고. 기존 테이블과 스타일이 어긋나지 않게.
2. **테이블 스키마 초안**: 리포트 테이블(예: channel_reports) 컬럼 설계.
   최소 포함:
   - id(PK) · symbol(종목코드, 인덱스) · stock_name(표시·검색용) ·
     country(기본 'KR') · report_date(발행일) · assembled_date(조립일) ·
     broker · verdict(상향/유지/하향) · target_price·current_price·upside
     (landing.json대로 서술형 문자열 그대로 — 숫자 파싱은 나중 과제) ·
     reasons(jsonb — [{title,detail}]) · earnings_summary · source_lang
     (원문 언어, 기본 'ko') · episode_folder(채널 원본 추적용) ·
     created_at
   - 각 컬럼의 타입·NULL 허용·근거를 표로. landing.json에 없는 컬럼
     (country·source_lang·symbol 등)은 왜 넣는지 명시.
3. **중복·재적재 정책**: 같은 종목의 리포트가 여러 번 올 때(채널은 같은
   종목이 재등장하면 새 폴더 생성). 무엇을 유니크 키로 볼지 —
   (symbol, report_date, broker) 조합? episode_folder? — 후보와
   트레이드오프 보고. 같은 리포트를 두 번 push해도 중복 안 쌓이게 하는
   방식(upsert 키) 제안.
4. **인덱스·RLS**: 종목 페이지 조회(symbol로 필터+날짜 정렬)에 맞는
   인덱스. RLS는 기존 공개 데이터 테이블 패턴(RLS on + anon 읽기 허용·
   쓰기 봉인, 쓰기는 service-role) 따르기 — 채널이 service-role로 push할
   전제.
5. **마이그레이션 SQL 초안**: supabase/migrations/ 아카이브 컨벤션에 맞는
   .sql 파일 내용(CREATE TABLE + 인덱스 + RLS). 파일로 저장하되 **적용은
   하지 않는다**(채팅이 MCP로 적용 예정). 미적용 상태임을 보고에 명시.
6. **미매칭 처리 설계**: 코드 없이(또는 잘못된 코드로) 온 리포트를 어떻게
   격리·로깅할지 — 종목 페이지에 잘못 붙는 것 방지. 스키마/정책 차원의
   제안만(구현은 push 단계 STEP).

## STEP 2 — 확정 후
사용자가 스키마 확정하면, 채팅(MCP)이 마이그레이션 적용 → 다음 STEP은
"종목 페이지가 이 테이블 읽어 렌더" + "채널이 이 테이블에 push".
(이 두 개는 이번 ORDER 범위 아님 — 테이블이 확정돼야 대상이 정해짐.)

## 하지 말 것
- 이번 STEP에서 마이그레이션 적용(테이블 실제 생성) 금지 — 초안만.
- 모델 크론·계산·기존 테이블 변경 금지.
- US 필드 설계에 시간 쓰지 말 것(country 컬럼으로 확장만 열어두기).
- 종목 페이지 렌더·채널 push는 이번 범위 아님.

## 보고 형식
work-protocol ⓪줄 + 스키마 표 + 중복정책 트레이드오프 + 마이그레이션
SQL 초안(미적용 명시) + 못 한 것. "다 됐다"로 적지 않는다.
