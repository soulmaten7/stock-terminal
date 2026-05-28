<!-- 2026-05-28 -->
# STEP 102 — 단타창 Volume + NetBuy + 공시 실데이터 (검증된 API 3개)

> **목표**: STEP 101 의 Movers 패턴을 단타창 나머지 6개 중 검증된 API 3개에 일괄 적용. 안전 우선.
> **세션**: #26
> **전제**: STEP 101 완료 (`0e01592`), Movers 패턴 확립됨
> **참조**: `components/cards/ScalperCards.tsx` 의 `MoversCard` 패턴

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_102_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **3개 카드 일괄 실데이터** — Volume · NetBuyBroker · 공시 (검증된 API)
2. **Movers 패턴 그대로 재사용** — useEffect + fetch + setInterval(10000) + 3상태 + FALLBACK
3. **신규 API 필요한 카드 (VI · 테마 · 공매도) 는 STEP 103** — 이 STEP 에서 건드리지 X
4. **빌드 안전 우선** — 한 카드 실패해도 다른 카드 영향 X (각 카드 독립)
5. **모든 FALLBACK 보존** — API 에러 시 더미 표시

---

## 작업 1 — 각 API 엔드포인트 진단

```bash
cd ~/stock-terminal
echo "=== KIS Volume API ===" && ls -la app/api/kis/volume* app/api/kis/volume-rank 2>/dev/null && cat app/api/kis/volume-rank/route.ts 2>/dev/null | head -50
echo ""
echo "=== KIS NetBuy/Investor API ===" && ls -la app/api/kis/investor* 2>/dev/null && cat app/api/kis/investor/route.ts 2>/dev/null | head -50
echo ""
echo "=== DART 공시 API ===" && find app/api/dart app/api/stocks -name "route.ts" 2>/dev/null | head -10 && cat app/api/dart/disclosures/route.ts 2>/dev/null | head -50 || cat app/api/stocks/disclosures/route.ts 2>/dev/null | head -50
```

확인:
- Volume: `/api/kis/volume-rank` 또는 비슷한 경로 + 응답 구조
- NetBuy: `/api/kis/investor` or `/api/kis/investor-rank` + 응답 구조
- 공시: `/api/dart/disclosures` 또는 `/api/stocks/disclosures` + 응답 구조

응답 매핑은 STEP 101 의 Movers 응답 패턴 (items[].symbol/name/priceText/changePercent) 과 유사할 가능성.

---

## 작업 2 — `ScalperCards.tsx` 의 VolumeCard 실데이터 연결

기존 VolumeCard 함수를 STEP 101 Movers 패턴 그대로 재사용 (변수명만 변경):

```tsx
// VOLUME_SURGE const 를 VOLUME_FALLBACK 으로 이름만 변경

type VolumeItem = {
  code: string;
  name: string;
  volume: string;
  ratio: string;
};

export function VolumeCard() {
  const setSelectedSymbol = useSelectedSymbol((s) => s.setSelectedSymbol);
  const [data, setData] = useState<VolumeItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/kis/volume-rank", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const rawList = Array.isArray(json)
          ? json
          : Array.isArray(json.items)
          ? json.items
          : Array.isArray(json.data)
          ? json.data
          : [];

        const mapped: VolumeItem[] = rawList.slice(0, 5).map((item: Record<string, unknown>) => ({
          code: String(item.symbol ?? item.code ?? item.mksc_shrn_iscd ?? ""),
          name: String(item.name ?? item.hts_kor_isnm ?? "").trim(),
          volume: typeof item.volume === "string"
            ? item.volume
            : Number(item.volume ?? item.acml_vol ?? 0).toLocaleString("ko-KR"),
          // 전일 대비 거래량 배수 — KIS 응답에 따라 조정
          ratio: typeof item.ratio === "string"
            ? item.ratio
            : item.ratio !== undefined
            ? `${Number(item.ratio).toFixed(1)}x`
            : item.volumeRatio !== undefined
            ? `${Number(item.volumeRatio).toFixed(1)}x`
            : "—",
        }));

        if (mounted) {
          setData(mapped.length > 0 ? mapped : null);
          setError(null);
          setLastUpdate(new Date());
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 10_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const displayData = data ?? (error ? VOLUME_FALLBACK : []);
  const isUsingFallback = !data && error !== null;

  return (
    <CardContainer
      id="card-volume"
      detailHref="/scalper/volume"
      title="Volume · 거래량 폭증"
      emoji="🔥"
      subtitle={
        lastUpdate
          ? `실시간 · ${lastUpdate.toLocaleTimeString("ko-KR")}`
          : "전일 대비 3배+"
      }
      hint={
        isUsingFallback
          ? `⚠️ API 에러 (${error}) · fallback 표시`
          : data
          ? "Layer 1 — KIS volume-rank API 연결됨 ✅"
          : "Layer 1 — KIS volume-rank API 로딩 중..."
      }
    >
      {loading && data === null && !error ? (
        <div className="text-xs text-unjong-muted text-center py-4">⏳ 로딩 중...</div>
      ) : displayData.length === 0 ? (
        <div className="text-xs text-unjong-muted text-center py-4">데이터 없음</div>
      ) : (
        <ul className="space-y-2">
          {displayData.map((v) => (
            <li
              key={v.code}
              onClick={() =>
                setSelectedSymbol({
                  code: v.code,
                  name: v.name,
                  market: v.code.startsWith("0") ? "KOSPI" : "KOSDAQ",
                })
              }
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
            >
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary truncate">{v.name}</span>
                <span className="text-[10px] text-unjong-muted font-mono">{v.volume} 주</span>
              </div>
              <span className="text-[11px] font-bold text-unjong-accent flex-shrink-0">{v.ratio}</span>
            </li>
          ))}
        </ul>
      )}
    </CardContainer>
  );
}
```

⚠️ `VOLUME_SURGE` const 를 `VOLUME_FALLBACK` 으로 이름 변경.

---

## 작업 3 — NetBuyBrokerCard 실데이터 연결

`/api/kis/investor` 또는 `/api/kis/investor-rank` 활용. 거래원 매수 1위 정보가 같이 오는지 확인 후 매핑.

```tsx
type NetBuyItem = {
  code: string;
  name: string;
  foreign: number;      // 외인 (억)
  institution: number;  // 기관 (억)
  topBroker: string;    // 거래원 1위 (없으면 "—")
};

export function NetBuyBrokerCard() {
  const setSelectedSymbol = useSelectedSymbol((s) => s.setSelectedSymbol);
  const [data, setData] = useState<NetBuyItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // 시도 1: investor-rank (외인/기관 TOP10)
        const res = await fetch("/api/kis/investor-rank", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const rawList = Array.isArray(json)
          ? json
          : Array.isArray(json.items)
          ? json.items
          : Array.isArray(json.data)
          ? json.data
          : [];

        const mapped: NetBuyItem[] = rawList.slice(0, 5).map((item: Record<string, unknown>) => ({
          code: String(item.symbol ?? item.code ?? ""),
          name: String(item.name ?? "").trim(),
          foreign: Number(item.foreign ?? item.frgn ?? 0),
          institution: Number(item.institution ?? item.orgn ?? 0),
          // 거래원 1위 — API 응답에 없으면 "—"
          topBroker: String(item.topBroker ?? item.broker ?? "—"),
        }));

        if (mounted) {
          setData(mapped.length > 0 ? mapped : null);
          setError(null);
          setLastUpdate(new Date());
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 10_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const displayData = data ?? (error ? NETBUY_WITH_BROKERS_FALLBACK : []);
  const isUsingFallback = !data && error !== null;

  return (
    <CardContainer
      id="card-netbuy"
      detailHref="/scalper/netbuy"
      title="NetBuy + 거래원"
      emoji="💰"
      subtitle={
        lastUpdate
          ? `실시간 · ${lastUpdate.toLocaleTimeString("ko-KR")}`
          : "외인·기관 + 매수 1위"
      }
      hint={
        isUsingFallback
          ? `⚠️ API 에러 (${error}) · fallback 표시`
          : data
          ? "Layer 1 — KIS investor-rank API 연결됨 ✅"
          : "Layer 1 — KIS investor-rank 로딩 중..."
      }
    >
      {loading && data === null && !error ? (
        <div className="text-xs text-unjong-muted text-center py-4">⏳ 로딩 중...</div>
      ) : displayData.length === 0 ? (
        <div className="text-xs text-unjong-muted text-center py-4">데이터 없음</div>
      ) : (
        <ul className="space-y-2">
          {displayData.map((n) => {
            const foreignUp = n.foreign >= 0;
            const instUp = n.institution >= 0;
            return (
              <li
                key={n.code}
                onClick={() =>
                  setSelectedSymbol({
                    code: n.code,
                    name: n.name,
                    market: n.code.startsWith("0") ? "KOSPI" : "KOSDAQ",
                  })
                }
                className="flex flex-col gap-1 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-unjong-primary">{n.name}</span>
                  <span className="text-[10px] text-unjong-muted">
                    거래원 1위{" "}
                    <span className="font-semibold text-unjong-accent">{n.topBroker}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="text-unjong-muted">외인</span>
                    <span className={foreignUp ? "text-unjong-success font-semibold" : "text-unjong-danger font-semibold"}>
                      {foreignUp ? "+" : ""}{n.foreign}억
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-unjong-muted">기관</span>
                    <span className={instUp ? "text-unjong-success font-semibold" : "text-unjong-danger font-semibold"}>
                      {instUp ? "+" : ""}{n.institution}억
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </CardContainer>
  );
}
```

⚠️ 기존 `NETBUY_WITH_BROKERS` const 를 `NETBUY_WITH_BROKERS_FALLBACK` 으로 이름 변경.

⚠️ 거래원 1위 정보가 KIS investor-rank API 에 없으면 "—" 표시 → Layer 1-A2 에서 별도 거래원 API 신설

---

## 작업 4 — ScalperDisclosureCard 실데이터 연결

DART API 활용. 엔드포인트는 진단 결과에 맞춰 조정.

```tsx
type DisclosureItem = {
  code: string;
  name: string;
  type: string;  // 자기주식 취득, 주식분할 결정 등
  time: string;  // 10:42 형식
};

export function ScalperDisclosureCard() {
  const setSelectedSymbol = useSelectedSymbol((s) => s.setSelectedSymbol);
  const [data, setData] = useState<DisclosureItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // 진단 결과에 맞춰 엔드포인트 선택
        const res = await fetch("/api/dart/disclosures?limit=5", { cache: "no-store" });
        if (!res.ok) {
          // 폴백 엔드포인트 시도
          const fallbackRes = await fetch("/api/stocks/disclosures?limit=5&market=KR", { cache: "no-store" });
          if (!fallbackRes.ok) throw new Error(`HTTP ${res.status} / ${fallbackRes.status}`);
          const fallbackJson = await fallbackRes.json();
          // ... 매핑
          return;
        }
        const json = await res.json();

        const rawList = Array.isArray(json)
          ? json
          : Array.isArray(json.items)
          ? json.items
          : Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.disclosures)
          ? json.disclosures
          : [];

        const mapped: DisclosureItem[] = rawList.slice(0, 5).map((item: Record<string, unknown>) => {
          const time = String(item.time ?? item.rcept_dt ?? item.rceptDt ?? "");
          // YYYYMMDDHHMM 형식이면 HH:MM 만 추출
          const formattedTime = time.length >= 12
            ? `${time.slice(8, 10)}:${time.slice(10, 12)}`
            : time.slice(-5) || "—";

          return {
            code: String(item.code ?? item.stock_code ?? item.corp_code ?? ""),
            name: String(item.name ?? item.corp_name ?? "").trim(),
            type: String(item.type ?? item.report_nm ?? item.title ?? "").trim(),
            time: formattedTime,
          };
        });

        if (mounted) {
          setData(mapped.length > 0 ? mapped : null);
          setError(null);
          setLastUpdate(new Date());
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 30_000); // 공시는 30초 (덜 빈번)
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const displayData = data ?? (error ? DISCLOSURES_FALLBACK : []);
  const isUsingFallback = !data && error !== null;

  return (
    <CardContainer
      id="card-disclosure"
      detailHref="/scalper/disclosure"
      title="공시 · 실시간"
      emoji="📄"
      subtitle={
        lastUpdate
          ? `DART · ${lastUpdate.toLocaleTimeString("ko-KR")}`
          : "DART"
      }
      hint={
        isUsingFallback
          ? `⚠️ DART API 에러 · fallback 표시`
          : data
          ? "Layer 1 — DART Open API 연결됨 ✅"
          : "Layer 1 — DART API 로딩 중..."
      }
    >
      {loading && data === null && !error ? (
        <div className="text-xs text-unjong-muted text-center py-4">⏳ 로딩 중...</div>
      ) : displayData.length === 0 ? (
        <div className="text-xs text-unjong-muted text-center py-4">데이터 없음</div>
      ) : (
        <ul className="space-y-2">
          {displayData.map((d, i) => (
            <li
              key={`${d.code}-${i}`}
              onClick={() =>
                d.code
                  ? setSelectedSymbol({
                      code: d.code,
                      name: d.name,
                      market: d.code.startsWith("0") ? "KOSPI" : "KOSDAQ",
                    })
                  : undefined
              }
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={12} className="text-unjong-muted flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary truncate">{d.name}</span>
                  <span className="text-[10px] text-unjong-muted truncate">{d.type}</span>
                </div>
              </div>
              <span className="text-[10px] text-unjong-muted flex-shrink-0">{d.time}</span>
            </li>
          ))}
        </ul>
      )}
    </CardContainer>
  );
}
```

⚠️ 기존 `DISCLOSURES` const 를 `DISCLOSURES_FALLBACK` 으로 이름 변경.

---

## 작업 5 — 변수명 이름 변경 (FALLBACK 패턴 통일)

기존 ScalperCards.tsx 상단 const 영역:
- `MOVERS` → 이미 `MOVERS_FALLBACK` (STEP 101)
- `VOLUME_SURGE` → `VOLUME_FALLBACK`
- `NETBUY_WITH_BROKERS` → `NETBUY_WITH_BROKERS_FALLBACK`
- `DISCLOSURES` → `DISCLOSURES_FALLBACK`
- 나머지 (`VI_EVENTS`, `THEME_TOP10`, `SHORT_INTEREST`) 는 STEP 103 까지 그대로

---

## 작업 6 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build 2>&1 | grep -E "(error TS|Error:|✓|Failed)" | head -10
```

확인:
- 빌드 성공, TypeScript 오류 0
- 3개 카드 모두 정상 컴파일

빌드 깨지면:
- API 응답 매핑 타입 오류 가능성 → 진단 결과에 맞춰 조정
- 한 카드만 깨졌다면 그 카드만 FALLBACK 유지 + 보고

---

## 작업 7 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add components/cards/ScalperCards.tsx docs/STEP_102_COMMAND.md
git status
git commit -m "feat: STEP 102 - 단타창 Volume + NetBuy + 공시 실데이터 (검증된 API 3개)

ScalperCards.tsx 3개 카드 실데이터 연결 (Movers 패턴 재사용):

VolumeCard:
- 더미 → /api/kis/volume-rank 실시간 (10초 갱신)
- VOLUME_SURGE → VOLUME_FALLBACK 이름 변경

NetBuyBrokerCard:
- 더미 → /api/kis/investor-rank 실시간 (10초 갱신)
- NETBUY_WITH_BROKERS → NETBUY_WITH_BROKERS_FALLBACK
- 거래원 1위 정보 — API 응답에 있으면 표시, 없으면 '—'

ScalperDisclosureCard:
- 더미 → DART API 실시간 (30초 갱신, 공시는 덜 빈번)
- DISCLOSURES → DISCLOSURES_FALLBACK
- code 가 없으면 클릭 비활성

응답 매핑 — 모든 카드 공통 패턴:
- 가능 필드 후보 다중 fallback (items/data/배열 직접)
- 표시 데이터: data ?? (error ? FALLBACK : [])
- subtitle: 마지막 갱신 시각
- hint: API 상태 (연결됨/로딩/에러+fallback)

단타창 카드 7개 중 실데이터 4개 완성:
- ✅ Movers (STEP 101)
- ✅ Volume, NetBuy, 공시 (이번)
- ⏸️ VI, 테마, 공매도 (STEP 103 신규 endpoint 필요)

다음 STEP 103: VI + 테마 + 공매도 (신규 endpoint 신설)"
git push
```

---

## 검증 체크리스트

- [ ] VolumeCard 실데이터 (VOLUME_FALLBACK 보존)
- [ ] NetBuyBrokerCard 실데이터 (NETBUY_WITH_BROKERS_FALLBACK 보존)
- [ ] ScalperDisclosureCard 실데이터 (DISCLOSURES_FALLBACK 보존)
- [ ] 3개 카드 모두 10초/30초 자동 갱신 작동
- [ ] subtitle 에 마지막 갱신 시각 표시
- [ ] hint 에 API 상태 표시 (연결됨/로딩/에러)
- [ ] FALLBACK 패턴 — API 에러 시 더미 표시
- [ ] 다른 카드 (Movers·VI·테마·공매도) 수정 X
- [ ] 빌드 클린
- [ ] git push 완료

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 102 완료. 단타창 Volume + NetBuy + 공시 실데이터 (검증된 API 3개) 끝.

API 진단 결과:
- Volume: /api/kis/volume-rank → [응답 구조]
- NetBuy: /api/kis/investor-rank → [응답 구조]
- 공시: /api/dart/disclosures (또는 폴백) → [응답 구조]

변경:
- VolumeCard, NetBuyBrokerCard, ScalperDisclosureCard 3개 실데이터
- Movers 패턴 (useEffect + fetch + setInterval) 재사용
- FALLBACK 변수명 통일 (VOLUME_FALLBACK · NETBUY_WITH_BROKERS_FALLBACK · DISCLOSURES_FALLBACK)

빌드 클린, git push 완료 (커밋 [해시])

단타창 7개 중 4개 실데이터 완성:
- ✅ Movers (STEP 101)
- ✅ Volume (이번)
- ✅ NetBuy + 거래원 (이번)
- ✅ 공시 (이번)
- ⏸️ VI (STEP 103 — KIS VI endpoint 신설)
- ⏸️ 테마 (STEP 103 — KIS theme endpoint 또는 자체)
- ⏸️ 공매도 (STEP 103 — KRX 크롤링)

브라우저에서 확인:
  /scalper 페이지
  · Volume 카드 — 실시간 거래량 폭증 TOP 5
  · NetBuy 카드 — 외인/기관 순매수 + 거래원 1위
  · 공시 카드 — DART 실시간 공시 TOP 5

다음 STEP 103: VI + 테마 + 공매도 (신규 endpoint 신설 + 연결)
```

---

## ⚠️ 주의 사항

1. **3개 카드만 수정** — Movers (이미 STEP 101) + VI/테마/공매도 (STEP 103) 는 건드리지 X
2. **응답 매핑은 진단 결과 우선** — 작업 1 의 응답 구조에 따라 조정
3. **FALLBACK 이름 통일** — 모든 더미 const 를 `*_FALLBACK` 으로
4. **공시 카드는 갱신 주기 30초** — 공시는 10초마다 빈번하지 않음 (rate limit 절약)
5. **NetBuy 의 거래원 1위** — API 응답에 없으면 "—" 표시. 별도 거래원 API 신설은 Layer 1-A2 의 STEP 103
6. **빌드 깨지면 즉시 보고** — 한 카드만 깨졌으면 그 카드만 FALLBACK 유지하고 다른 2개는 진행
7. **console.log 남기지 말 것**
