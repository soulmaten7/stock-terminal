<!-- 2026-04-21 -->
# Step 9 — KIS API P1 이슈 해결 (상승/하락 + 거래량 급등 데이터 복구)

## 🔴 Opus 권장
2개 API 라우트 재작성 + KIS 파라미터 구조 변경 + 응답 필드 재매핑. 디버깅 여지 있으므로 Opus로.

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model opus
```

---

## 목표

홈 R4의 두 위젯이 "데이터 없음"으로 비어있는 P1 이슈 해결:

1. **상승/하락 TOP 10** (`MoversTop10Widget` → `/api/kis/movers`)
2. **거래량 급등 TOP 10** (`VolumeTop10Widget` → `/api/kis/volume-rank`)

## 전제 상태

- 이전 커밋: `49d449f` (Step 8 V1.5 푸시 완료) + 세션 #22 doc 업데이트 커밋
- 현재 `investor-rank`, `price`, `orderbook`, `execution` 등 다른 KIS 엔드포인트는 정상 작동 중 (토큰/rate limit 이슈 아님)

---

## 근본 원인 (KIS 공식 GitHub 샘플 코드 확인 결과)

### 문제 1 — `movers` 엔드포인트가 완전히 잘못됨

**KIS 공식 문서 기준 등락률 순위:**
- ✅ 올바른 경로: `/uapi/domestic-stock/v1/ranking/fluctuation`
- ✅ TR ID: `FHPST01700000`
- ✅ 파라미터 키: `fid_rsfl_rate1`, `fid_rsfl_rate2`, `fid_input_cnt_1`, `fid_prc_cls_code` **포함 필수** (현재 코드에 없음)
- ❌ 현재 코드가 쓰는 경로: `/uapi/domestic-stock/v1/quotations/volume-rank` — **완전히 다른 API에 쐈음**

### 문제 2 — `volume-rank` 파라미터 값 오류

**KIS 샘플 코드 verbatim 기본값:**
- `FID_COND_SCR_DIV_CODE`: **`'20171'`** (현재 `'20101'` 잘못됨)
- `FID_INPUT_DATE_1`: **`'0'`** (현재 `''` 빈 문자열 = KIS가 400 또는 빈 배열 반환)
- `FID_BLNG_CLS_CODE`: **`'1'`** (거래증가율 = "급등"에 부합, 현재 `'0'`은 평균거래량 기준)

### 문제 3 (보너스 개선) — spike 계산 이중 연산

- 현재: `volume / avgVolume` 수동 계산
- API가 직접 `vol_inrt` (거래량증가율 %) 반환 → 사용하면 정확도 ↑

---

## 변경 #1: `app/api/kis/movers/route.ts` — 완전 재작성

**파일 전체를 아래 내용으로 교체:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

// 국내주식 등락률 순위 (KIS tr_id: FHPST01700000)
// 공식 엔드포인트: /uapi/domestic-stock/v1/ranking/fluctuation
// ?dir=up (상승순, default) | down (하락순)
export async function GET(request: NextRequest) {
  const dir = request.nextUrl.searchParams.get('dir') === 'down' ? '1' : '0';
  // fid_rank_sort_cls_code: 0=상승률순, 1=하락률순, 2=시가대비상승률, 3=시가대비하락률, 4=변동률순

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/ranking/fluctuation',
      trId: 'FHPST01700000',
      params: {
        FID_RSFL_RATE2: '',           // 등락률 상한 (공백=제한없음)
        FID_COND_MRKT_DIV_CODE: 'J',  // J=주식, ETF, ETN
        FID_COND_SCR_DIV_CODE: '20170',
        FID_INPUT_ISCD: '0000',        // 0000=전체, 0001=코스피, 1001=코스닥
        FID_RANK_SORT_CLS_CODE: dir,
        FID_INPUT_CNT_1: '0',          // 누적일수 (0=당일)
        FID_PRC_CLS_CODE: '0',         // 가격 구분 (0=전체)
        FID_INPUT_PRICE_1: '',         // 가격 하한 (공백=제한없음)
        FID_INPUT_PRICE_2: '',         // 가격 상한
        FID_VOL_CNT: '',               // 거래량 하한
        FID_TRGT_CLS_CODE: '0',        // 대상구분 (0=전체)
        FID_TRGT_EXLS_CLS_CODE: '0',   // 대상제외 (0=없음)
        FID_DIV_CLS_CODE: '0',         // 분류 (0=전체)
        FID_RSFL_RATE1: '',            // 등락률 하한
      },
    });

    const items = (data.output || []).slice(0, 10).map((item: Record<string, string>, idx: number) => ({
      rank: idx + 1,
      // 등락률 순위는 stck_shrn_iscd 가 표준이지만 mksc_shrn_iscd 도 fallback
      symbol: item.stck_shrn_iscd || item.mksc_shrn_iscd || '',
      name: item.hts_kor_isnm || '',
      price: parseInt(item.stck_prpr || '0', 10).toLocaleString('ko-KR'),
      changePercent: parseFloat(item.prdy_ctrt || '0'),
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('[api/kis/movers]', err);
    return NextResponse.json({ items: [], error: String(err) }, { status: 502 });
  }
}
```

**핵심 변경:**
- 경로: `quotations/volume-rank` → `ranking/fluctuation` ✅
- 파라미터: 13개 완전 재구성 (KIS 공식 샘플 기준)
- 응답 symbol 필드: `stck_shrn_iscd` 우선, `mksc_shrn_iscd` fallback

---

## 변경 #2: `app/api/kis/volume-rank/route.ts` — 파라미터 교정 + spike 개선

**파일 전체를 아래 내용으로 교체:**

```typescript
import { NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

// 국내주식 거래량 순위 (KIS tr_id: FHPST01710000)
// 공식 엔드포인트: /uapi/domestic-stock/v1/quotations/volume-rank
// FID_BLNG_CLS_CODE: 0=평균거래량, 1=거래증가율(급등), 2=평균거래회전율, 3=거래금액순, 4=평균거래금액회전율
export async function GET() {
  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/volume-rank',
      trId: 'FHPST01710000',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_COND_SCR_DIV_CODE: '20171',   // ✓ 수정: 20101 → 20171
        FID_INPUT_ISCD: '0000',            // 0000=전체
        FID_DIV_CLS_CODE: '0',             // 0=전체, 1=보통주, 2=우선주
        FID_BLNG_CLS_CODE: '1',            // ✓ 수정: 0 → 1 (거래증가율 기준 = "급등")
        FID_TRGT_CLS_CODE: '111111111',    // 9자리 플래그 (전부 포함)
        FID_TRGT_EXLS_CLS_CODE: '000000',  // 6자리 플래그 (제외 없음)
        FID_INPUT_PRICE_1: '0',
        FID_INPUT_PRICE_2: '0',
        FID_VOL_CNT: '0',
        FID_INPUT_DATE_1: '0',             // ✓ 수정: '' → '0' (빈 문자열이면 KIS 에러)
      },
    });

    const items = (data.output || []).slice(0, 10).map((item: Record<string, string>) => {
      const volume = parseInt(item.acml_vol || '0', 10);
      const avgVolume = parseInt(item.avrg_vol || '1', 10);
      // KIS가 직접 주는 vol_inrt (거래량증가율 %) 우선 사용, 없으면 수동 계산
      const volIncreaseRate = parseFloat(item.vol_inrt || '0');
      const spike = volIncreaseRate > 0
        ? parseFloat((volIncreaseRate / 100 + 1).toFixed(1))  // +250% → 3.5x
        : (avgVolume > 0 ? parseFloat((volume / avgVolume).toFixed(1)) : 0);

      return {
        symbol: item.mksc_shrn_iscd || '',
        name: item.hts_kor_isnm || '',
        price: parseInt(item.stck_prpr || '0', 10),
        changePercent: parseFloat(item.prdy_ctrt || '0'),
        volume,
        avgVolume,
        spike,
      };
    });

    return NextResponse.json({ stocks: items });
  } catch (err) {
    console.error('[api/kis/volume-rank]', err);
    return NextResponse.json({ stocks: [], error: String(err) }, { status: 502 });
  }
}
```

**핵심 변경:**
- `FID_COND_SCR_DIV_CODE`: `20101` → `20171` ✅
- `FID_INPUT_DATE_1`: `''` → `'0'` ✅
- `FID_BLNG_CLS_CODE`: `'0'` → `'1'` (급등 기준) ✅
- spike: `vol_inrt` 우선 사용 (API 반환값) + 수동 계산 fallback

---

## 검증 단계

빌드 후 dev 서버 띄우고 두 엔드포인트 직접 호출:

```bash
# 빌드 에러 없는지
npm run build 2>&1 | tail -20

# dev 서버 백그라운드 실행 (기존 있으면 kill)
lsof -ti :3333 | xargs -r kill -9
npm run dev &
sleep 8

# API 직접 호출 — 실데이터 확인
echo "=== movers?dir=up ==="
curl -s 'http://localhost:3333/api/kis/movers?dir=up' | head -c 500
echo ""
echo "=== movers?dir=down ==="
curl -s 'http://localhost:3333/api/kis/movers?dir=down' | head -c 500
echo ""
echo "=== volume-rank ==="
curl -s 'http://localhost:3333/api/kis/volume-rank' | head -c 500
echo ""
```

**성공 기준:**
- 3개 호출 모두 `items` 또는 `stocks` 배열에 **10개 항목** 포함
- 각 항목에 `symbol`, `name`, `price`, `changePercent` 값이 실데이터로 채워져 있음
- `error` 필드 없음
- 빌드 에러 0, warning 기존 수준 유지

---

## 커밋 & 푸시

```bash
git add app/api/kis/movers/route.ts app/api/kis/volume-rank/route.ts

git commit -m "fix(kis): 등락률/거래량 순위 API 빈 응답 해결 (P1)

movers (등락률 순위):
- 엔드포인트 경로 수정: /quotations/volume-rank → /ranking/fluctuation
  (현재 경로와 TR ID(FHPST01700000)가 불일치하여 빈 output 반환)
- 파라미터 구성 완전 재작성: fid_rsfl_rate1/2, fid_input_cnt_1, fid_prc_cls_code 추가
  (KIS 공식 샘플 코드 기준)
- symbol 필드: stck_shrn_iscd 우선 + mksc_shrn_iscd fallback

volume-rank (거래량 순위):
- FID_COND_SCR_DIV_CODE: 20101 → 20171 (공식 샘플 값)
- FID_INPUT_DATE_1: '' → '0' (빈 문자열 거부 이슈)
- FID_BLNG_CLS_CODE: 0 → 1 (거래증가율 기준 = '급등' 개념 부합)
- spike: KIS vol_inrt (거래량증가율 %) 우선 사용 + 수동 계산 fallback

근거: https://github.com/koreainvestment/open-trading-api
  examples_llm/domestic_stock/fluctuation/ + volume_rank/

P1 → 해결 (/r4 상승/하락 TOP 10, 거래량 급등 TOP 10 실데이터 복구)"

git push origin main
```

---

## 실행 후 Cowork에게 보고

아래 항목 전부 확인해서 알려줘:

1. `npm run build` 결과 (성공 / 실패+스택트레이스)
2. `curl movers?dir=up` 응답 — items 배열 10건 나왔는지, 첫 1-2건 종목명/등락률
3. `curl movers?dir=down` 응답 — 상동
4. `curl volume-rank` 응답 — stocks 배열 10건, 첫 1-2건 spike 배수 합리적인지
5. 브라우저 http://localhost:3333 에서 R4 위젯 3개 전부 실데이터 표시 스크린샷
6. 푸시 커밋 해시

---

## 롤백 (만약 치명적 오류 발생)

```bash
git reset --hard 49d449f
lsof -ti :3333 | xargs -r kill -9
npm run dev
```

---

## 만약 `volume-rank` 여전히 빈 배열일 때 대응 (Plan B)

- `FID_BLNG_CLS_CODE`를 `'0'` (평균거래량) 으로 되돌리기 — 급등 아닌 "누적 거래량 순위"
- `FID_INPUT_DATE_1`: `'0'` → `''` → 다음 시도 `'20260421'` (오늘 날짜 YYYYMMDD)
- 서버 로그에서 `KIS API error [FHPST01710000]:` 메시지 확인하여 KIS의 실제 에러 메시지 파악

장마감 후라면 정상 응답이 없을 수도 있음 — 장중(09:00~15:30 KST) 재확인 권장.
