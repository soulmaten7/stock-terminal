<!-- 2026-07-09 -->
# 🅿️ 보류 기능 — VN HNX (VCI·거주지 IP 필요) · 배선 완비, 스위치만 OFF

> **상태: 코드·데이터·방법 전부 준비됨. VPS(거주지 IP)만 붙이면 즉시 활성화.**
> 관련: `docs/LOCALE_SOURCE_PLAYBOOK.md` §8-11(G7 교훈) · `docs/STEP_672~672D`.

## 1. 왜 보류했나 (한 줄)
- **HNX(하노이 거래소·중형주 ~299개)**는 야후 `.VN`가 커버 안 함 → 유일 소스 = **VCI(Vietcap)**.
- **VCI는 클라우드 IP(Vercel·GitHub Actions/Azure)를 지속요청 시 소프트차단(`[]`).** 로컬 맥/거주지 IP만 안정.
- 소형 시장 하나에 상시 인프라(VPS/프록시)를 지금 세울 우선순위 아님 → **HOSE 403(Yahoo)으로 확정**, HNX는 여기 보류.
- ✅ **HOSE는 정상**(매일 야후로 업데이트). HNX만 OFF.

## 2. 이미 깔아둔 배선 (pre-laid)
- **VCI 요청(검증됨)**: `POST https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart` · body `{timeFrame:"ONE_DAY", symbols:["SHS", ...배치], to:<unixSec>, countBack:300}` (심볼 `.VN` 제거) · 응답 `[{symbol,o,h,l,c,v,t 배열}]`. **가격 = c[last] 풀 VND(×1000 아님).** 거래대금 = c[last]*v[last].
- **페처 스크립트**: `scripts/vn_hnx_vci_cron.mjs` — VCI 배치(40개씩)→r1d~r1y·price·amount→`vn_stock_perf` upsert. (env: `SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`.) **이 스크립트는 그대로 두면 됨 — 거주지 IP에서 실행만 하면 동작.**
- **HNX 심볼 소스**: `vnstock`(파이썬) `Listing().symbols_by_exchange()` → exchange=='HNX' & type=='stock' = **299종목(베트남어명)**. (STEP 671에서 생성해봄.)
- **DB**: `vn_stock_perf` 스키마 그대로(price·amount·r1y 컬럼 있음). `vn-list`는 이미 테이블 서빙 → HNX 행 생기면 자동 노출.

## 3. 활성화 체크리스트 (나중에 이대로만 하면 켜짐)
1. **거주지/현지 IP 실행환경 확보** — VN·싱가포르 리전 **VPS 월 $4~6**(예: 소형 인스턴스) 또는 거주지 프록시. ⚠️ **먼저 그 IP에서 VCI 배치가 `[]` 아닌 데이터 주는지 검증**(클라우드면 또 막힘·"일회 프로브 통과≠지속 통과" 함정).
2. **VPS 세팅** — node 20 설치 + env 2개(`SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`).
3. **HNX 심볼 복원** — `vnstock`으로 HNX 299 재생성 → `data/vn_symbols.json`에 `market:'hnx'`로 추가(HOSE와 합침).
4. **스케줄** — VPS crontab에 `scripts/vn_hnx_vci_cron.mjs` 매일 1회(예: 09:00 UTC = VN 마감 후).
5. **끝** — 다음 실행부터 `vn_stock_perf`에 HNX 채워지고 보드가 자동으로 HOSE+HNX 표시.

## 4. 비용·노력
- VPS ~월 몇천 원 + 초기 설정 ~30분. 상시 유지보수 낮음(스크립트 안정 시).

## 5. 재사용 (이게 진짜 가치)
이 패턴 = **"클라우드 IP 차단 소스 → 거주지 IP VPS에서 크론 → Supabase"**. 같은 방식으로:
- **CN 소형주 추가**(东方財富 등 막히면), **다른 언어권**의 IP차단 소스도 **VPS 하나에 여러 크론**으로 묶어 처리 가능. → HNX 켤 때 VPS를 "차단소스 전용 데이터 워커"로 만들면 여러 시장을 한 번에.
