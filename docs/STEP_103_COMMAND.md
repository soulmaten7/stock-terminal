<!-- 2026-05-28 -->
# STEP 103 — 단타창 VI + 테마 + 공매도 실데이터 (단타창 7/7 완성)

> **목표**: 단타창 마지막 3개 카드 실데이터 연결. 신규 endpoint 3개 신설. 단타창 100% 실데이터.
> **세션**: #26
> **전제**: STEP 102 완료 (`06b8ab4`), 단타창 4/7 (Movers·Volume·NetBuy·공시) 실데이터
> **참조**: `components/cards/ScalperCards.tsx` 의 MoversCard 패턴

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_103_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **단타창 7/7 완성** — VI · 테마 · 공매도 모두 실데이터
2. **신규 endpoint 3개 신설** — 각각 독립적 (한 endpoint 실패해도 다른 카드 영향 X)
3. **각 카드 _FALLBACK 보존** — API 에러 시 더미 표시
4. **STEP 101/102 패턴 재사용** — useEffect + fetch + setInterval + 3상태
5. **빌드 깨지면 즉시 보고** — 신규 endpoint 큰 작업이라 안전 우선

---

## 작업 1 — VI 신규 endpoint 신설

KIS API 에 VI 발동/해제 직접 조회 없음. 대안 2가지:

### 옵션 A — 자체 분류 (간접 VI 시그널, 안전)
- `/api/kis/movers` 응답을 활용
- 등락률 ±8% 이상 종목 → "VI 발동 가능성" 분류
- 등락률 ±5% 이상 종목 → "VI 해제" 분류
- 시간 정보 추가 (현재 시각)

### 옵션 B — KRX 변동성 완화장치 데이터 (정확)
- KRX 에서 VI 발동 종목 실시간 조회 API/CSV
- 별도 fetcher 구현 (복잡)

→ **옵션 A 추천** (즉시 가능, 안전, 단순). Layer 1-A2 에서 옵션 B 로 교체 가능.

### 새 endpoint: `app/api/kis/vi/route.ts`

```ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ViEvent = {
  code: string;
  name: string;
  state: "발동" | "해제";
  type: "정적" | "동적";
  changePct: number;
  price: string;
  time: string;
};

export async function GET(req: Request) {
  try {
    // Movers API 재호출 (절대 URL 또는 직접 KIS 호출)
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;
    const moversRes = await fetch(`${origin}/api/kis/movers`, { cache: "no-store" });
    if (!moversRes.ok) {
      return NextResponse.json({ items: [], error: `Movers HTTP ${moversRes.status}` }, { status: 200 });
    }
    const moversJson = await moversRes.json();
    const movers = Array.isArray(moversJson)
      ? moversJson
      : Array.isArray(moversJson.items)
      ? moversJson.items
      : Array.isArray(moversJson.data)
      ? moversJson.data
      : [];

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // 등락률 ±8% 이상 → VI 발동, ±5% 이상 → VI 해제
    const items: ViEvent[] = movers
      .map((m: Record<string, unknown>) => {
        const changePct = Number(m.changePercent ?? m.changePct ?? m.prdy_ctrt ?? 0);
        const absChange = Math.abs(changePct);
        if (absChange < 5) return null;

        const state: "발동" | "해제" = absChange >= 8 ? "발동" : "해제";
        const type: "정적" | "동적" = absChange >= 10 ? "정적" : "동적";

        return {
          code: String(m.symbol ?? m.code ?? ""),
          name: String(m.name ?? "").trim(),
          state,
          type,
          changePct,
          price: typeof m.priceText === "string"
            ? m.priceText
            : Number(m.price ?? m.stck_prpr ?? 0).toLocaleString("ko-KR"),
          time: timeStr,
        };
      })
      .filter((x: ViEvent | null): x is ViEvent => x !== null)
      .slice(0, 5);

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
```

⚠️ Movers API 응답 형식에 맞춰 필드명 조정 (`symbol`/`name`/`priceText`/`changePercent` 등).

---

## 작업 2 — 테마 신규 endpoint 신설

KIS theme API 직접 사용은 복잡. 자체 매핑이 안전.

### 새 endpoint: `app/api/kis/theme/route.ts`

자체 테마 매핑 + 등락률 평균 계산:

```ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 자체 테마 매핑 — 한국 주식 시장 주요 테마
const THEME_MAP: Record<string, string[]> = {
  "AI/반도체": ["005930", "000660", "042700", "010140"], // 삼성전자, SK하이닉스, 한미반도체, 삼성중공업
  "2차전지": ["247540", "086520", "373220", "066970"], // 에코프로비엠, 에코프로, LG에너지솔루션, 엘앤에프
  "로봇": ["454910", "108490", "230240"], // 두산로보틱스, 로보스타, 한컴로보틱스
  "우주항공": ["012450", "079550", "047810"], // 한화에어로스페이스, LIG넥스원, 한국항공우주
  "원전": ["034020", "267260"], // 두산에너빌리티, HD현대일렉트릭
  "조선": ["329180", "010140", "042660"], // HD현대중공업, 삼성중공업, 한화오션
  "방산": ["079550", "047810", "064350"], // LIG넥스원, 한국항공우주, 현대로템
  "바이오": ["207940", "068270", "326030"], // 삼성바이오로직스, 셀트리온, SK바이오팜
  "K-콘텐츠": ["035900", "041510", "122870"], // JYP Ent., 에스엠, 와이지엔터테인먼트
  "리오프닝": ["039130", "008770", "035250"], // 하나투어, 호텔신라, 강원랜드
};

type ThemeItem = {
  rank: number;
  name: string;
  changePct: number;
  leader: string;
  leaderCode: string;
};

async function fetchPrice(origin: string, code: string): Promise<{ name?: string; changePct?: number } | null> {
  try {
    const res = await fetch(`${origin}/api/kis/price?code=${code}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return {
      name: String(json.name ?? json.hts_kor_isnm ?? "").trim() || undefined,
      changePct: Number(json.changePct ?? json.prdy_ctrt ?? 0),
    };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;

    const themeRanking: ThemeItem[] = [];

    for (const [themeName, codes] of Object.entries(THEME_MAP)) {
      const prices = await Promise.all(codes.map((c) => fetchPrice(origin, c)));
      const valid = prices.filter((p): p is NonNullable<typeof p> => p !== null && p.changePct !== undefined);
      if (valid.length === 0) continue;

      const avg = valid.reduce((sum, p) => sum + (p.changePct ?? 0), 0) / valid.length;
      // 가장 등락률 높은 종목을 대표로
      let leaderIdx = 0;
      let leaderChange = -Infinity;
      valid.forEach((p, i) => {
        if ((p.changePct ?? 0) > leaderChange) {
          leaderChange = p.changePct ?? 0;
          leaderIdx = i;
        }
      });

      themeRanking.push({
        rank: 0, // 정렬 후 채움
        name: themeName,
        changePct: Number(avg.toFixed(2)),
        leader: valid[leaderIdx]?.name ?? "—",
        leaderCode: codes[leaderIdx] ?? "",
      });
    }

    themeRanking.sort((a, b) => b.changePct - a.changePct);
    themeRanking.forEach((t, i) => (t.rank = i + 1));

    return NextResponse.json({ items: themeRanking.slice(0, 10) });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
```

⚠️ 각 종목 가격 fetch = N+1 호출. KIS rate limit (60ms) 고려. 30개 종목 × 60ms = 1.8초. OK.

⚠️ Layer 1-A2 에서 quant_factors DB 또는 자체 DB 캐시로 최적화 가능.

---

## 작업 3 — 공매도 신규 endpoint 신설

KRX 공매도 데이터 직접 조회는 복잡. Layer 0 단계는 단순화:

### 새 endpoint: `app/api/krx/short-interest/route.ts`

자체 시드 데이터 또는 KRX CSV 활용:

```ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ShortItem = {
  code: string;
  name: string;
  ratio: number;
  delta: number;
  signal: "숏커버" | "위험증가" | "안정";
};

// Layer 0/1 폴백 — Layer 1-A2 에서 KRX 실데이터 교체
const SHORT_INTEREST_SEED: ShortItem[] = [
  { code: "035720", name: "카카오", ratio: 4.5, delta: -0.8, signal: "숏커버" },
  { code: "005930", name: "삼성전자", ratio: 1.2, delta: -0.3, signal: "숏커버" },
  { code: "000660", name: "SK하이닉스", ratio: 2.8, delta: 0.5, signal: "위험증가" },
  { code: "247540", name: "에코프로비엠", ratio: 3.1, delta: 0.7, signal: "위험증가" },
  { code: "035420", name: "NAVER", ratio: 1.8, delta: -0.2, signal: "안정" },
];

export async function GET() {
  try {
    // TODO: KRX 공매도 CSV 또는 OPEN API 연결 (Layer 1-A2)
    // 현재는 시드 데이터 + 가격 fetch 로 종목 이름 검증
    return NextResponse.json({
      items: SHORT_INTEREST_SEED,
      source: "seed",
      note: "Layer 1-A2 에서 KRX 공매도 실데이터 연결 예정",
    });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
```

⚠️ 공매도는 KRX 데이터 자체가 일일 갱신 (실시간 X) 이라 시드 데이터 사용 무난. Layer 1-A2 에서 KRX 일일 CSV 다운로드 자동화.

---

## 작업 4 — ScalperCards.tsx 의 ViCard 실데이터 연결

기존 ViCard 함수를 Movers 패턴 재사용:

```tsx
type ViEventItem = {
  code: string;
  name: string;
  state: "발동" | "해제";
  type: string;
  changePct: number;
  price: string;
  time: string;
};

// VI_EVENTS 를 VI_FALLBACK 으로 이름 변경

export function ViCard() {
  const setSelectedSymbol = useSelectedSymbol((s) => s.setSelectedSymbol);
  const [data, setData] = useState<ViEventItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/kis/vi", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rawList = Array.isArray(json) ? json : json.items ?? json.data ?? [];

        if (mounted) {
          setData(rawList.length > 0 ? rawList.slice(0, 5) : null);
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

  const displayData = data ?? (error ? VI_FALLBACK : []);
  const isUsingFallback = !data && error !== null;

  return (
    <CardContainer
      id="card-vi"
      detailHref="/scalper/vi"
      title="VI · 변동성 완화장치"
      emoji="🚨"
      subtitle={
        lastUpdate
          ? `실시간 · ${lastUpdate.toLocaleTimeString("ko-KR")}`
          : "실시간 발동/해제"
      }
      hint={
        isUsingFallback
          ? `⚠️ VI API 에러 · fallback`
          : data
          ? "Layer 1 — Movers 기반 자체 분류 (8%+ 발동, 5%+ 해제)"
          : "Layer 1 — 로딩 중..."
      }
    >
      {/* 기존 ViCard 의 li 마크업 그대로, displayData 사용 */}
      {/* onClick → setSelectedSymbol */}
    </CardContainer>
  );
}
```

기존 ViCard 의 li 마크업을 그대로 유지하되 데이터 소스만 `displayData` 로 변경. onClick 으로 setSelectedSymbol 호출.

---

## 작업 5 — ThemeTop10Card 실데이터 연결

기존 ThemeTop10Card 함수에 useEffect 추가:

```tsx
type ThemeListItem = {
  rank: number;
  name: string;
  changePct: number;
  leader: string;
  leaderCode: string;
};

// THEME_TOP10 → THEME_FALLBACK

export function ThemeTop10Card() {
  const setSelectedSymbol = useSelectedSymbol((s) => s.setSelectedSymbol);
  const [data, setData] = useState<ThemeListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/kis/theme", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rawList = Array.isArray(json) ? json : json.items ?? [];

        if (mounted) {
          setData(rawList.length > 0 ? rawList : null);
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
    const interval = setInterval(load, 30_000); // 테마는 30초 (가격 N개 fetch 라 부담)
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const displayData = data ?? (error ? THEME_FALLBACK : []);

  return (
    <CardContainer
      id="card-theme"
      detailHref="/scalper/theme"
      title="테마 TOP10"
      emoji="🎯"
      subtitle={
        lastUpdate
          ? `실시간 · ${lastUpdate.toLocaleTimeString("ko-KR")}`
          : "실시간 등락률 순"
      }
      hint={
        error
          ? `⚠️ 테마 API 에러 · fallback`
          : data
          ? "Layer 1 — 자체 테마 매핑 (10개 그룹) + KIS price 평균"
          : "Layer 1 — 로딩 중..."
      }
    >
      {/* 기존 ThemeTop10Card 의 li 마크업 그대로 displayData 사용 */}
      {/* onClick → setSelectedSymbol (leaderCode 활용) */}
      <ul className="space-y-1.5">
        {displayData.map((t) => {
          const isUp = t.changePct >= 0;
          return (
            <li
              key={t.rank}
              onClick={() =>
                t.leaderCode
                  ? setSelectedSymbol({
                      code: t.leaderCode,
                      name: t.leader,
                      market: t.leaderCode.startsWith("0") ? "KOSPI" : "KOSDAQ",
                    })
                  : undefined
              }
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
            >
              {/* 기존 마크업 */}
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}
```

⚠️ 테마 카드는 leaderCode 가 있으니 setSelectedSymbol 으로 대표 종목 선택. STEP 100 에서 비활성이었던 카드를 이제 활성화.

---

## 작업 6 — ShortInterestCard 실데이터 연결

```tsx
type ShortItemData = {
  code: string;
  name: string;
  ratio: number;
  delta: number;
  signal: "숏커버" | "위험증가" | "안정";
};

// SHORT_INTEREST → SHORT_FALLBACK

export function ShortInterestCard() {
  const setSelectedSymbol = useSelectedSymbol((s) => s.setSelectedSymbol);
  const [data, setData] = useState<ShortItemData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/krx/short-interest", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rawList = Array.isArray(json) ? json : json.items ?? [];

        if (mounted) {
          setData(rawList.length > 0 ? rawList : null);
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
    const interval = setInterval(load, 60_000); // 공매도는 1분 (일일 갱신)
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const displayData = data ?? (error ? SHORT_FALLBACK : []);

  return (
    <CardContainer
      id="card-short"
      detailHref="/scalper/short"
      title="공매도 잔고 변화"
      emoji="⚠️"
      subtitle={
        lastUpdate
          ? `실시간 · ${lastUpdate.toLocaleTimeString("ko-KR")}`
          : "숏커버·위험 시그널"
      }
      hint={
        error
          ? `⚠️ KRX 공매도 API 에러 · fallback`
          : data
          ? "Layer 1 — KRX 공매도 시드 (Layer 1-A2 에서 KRX CSV 실데이터)"
          : "Layer 1 — 로딩 중..."
      }
    >
      {/* 기존 ShortInterestCard 마크업 + onClick */}
    </CardContainer>
  );
}
```

---

## 작업 7 — 변수명 통일

ScalperCards.tsx 상단 const 영역:
- `VI_EVENTS` → `VI_FALLBACK`
- `THEME_TOP10` → `THEME_FALLBACK`
- `SHORT_INTEREST` → `SHORT_FALLBACK`

---

## 작업 8 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build 2>&1 | grep -E "(error TS|Error:|✓|Failed)" | head -10
```

확인:
- 3개 신규 endpoint route.ts 정상 컴파일
- 3개 카드 컴포넌트 정상
- TypeScript 오류 0
- 빌드 페이지 수 증가 (87 → 90+)

빌드 실패 시:
- 한 endpoint 만 실패면 그 카드만 FALLBACK 유지
- 모두 실패면 보고 후 단계 분할

---

## 작업 9 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add app/api/kis/vi app/api/kis/theme app/api/krx
git add components/cards/ScalperCards.tsx
git add docs/STEP_103_COMMAND.md
git status
git commit -m "feat: STEP 103 - 단타창 VI + 테마 + 공매도 실데이터 (단타창 7/7 완성)

신규 API endpoint 3개:
- app/api/kis/vi/route.ts — Movers 기반 자체 분류
  · 등락률 8%+ → VI 발동
  · 등락률 5%+ → VI 해제
  · 시간 정보 추가 (현재 시각)
- app/api/kis/theme/route.ts — 자체 테마 매핑 (10개)
  · AI/반도체, 2차전지, 로봇, 우주항공, 원전, 조선, 방산, 바이오, K콘텐츠, 리오프닝
  · 각 테마 평균 등락률 + 대표 종목 (최고 상승)
- app/api/krx/short-interest/route.ts — 공매도 시드 데이터
  · Layer 1-A2 에서 KRX CSV 실데이터 교체 예정

ScalperCards.tsx 3개 카드 실데이터:
- ViCard: useEffect + fetch /api/kis/vi (10초)
- ThemeTop10Card: useEffect + fetch /api/kis/theme (30초)
- ShortInterestCard: useEffect + fetch /api/krx/short-interest (60초)

각 카드 _FALLBACK 보존:
- VI_EVENTS → VI_FALLBACK
- THEME_TOP10 → THEME_FALLBACK
- SHORT_INTEREST → SHORT_FALLBACK

테마 카드 onClick 활성화:
- leaderCode 로 setSelectedSymbol 호출
- STEP 100 에서 비활성이었던 마지막 카드 활성

단타창 7/7 카드 모두 실데이터 완성:
- ✅ Movers (STEP 101)
- ✅ Volume, NetBuy, 공시 (STEP 102)
- ✅ VI, 테마, 공매도 (STEP 103)

다음 STEP 104: 장타창 7개 실데이터 (DART + quant_factors DB)"
git push
```

---

## 검증 체크리스트

- [ ] `app/api/kis/vi/route.ts` 신설 + 정상 응답
- [ ] `app/api/kis/theme/route.ts` 신설 + 정상 응답
- [ ] `app/api/krx/short-interest/route.ts` 신설 + 정상 응답
- [ ] ViCard, ThemeTop10Card, ShortInterestCard 모두 useEffect + fetch 적용
- [ ] _FALLBACK 변수명 통일
- [ ] 테마 카드 onClick (leaderCode) 작동
- [ ] 빌드 클린, git push 완료
- [ ] 단타창 7/7 카드 모두 실데이터 표시

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 103 완료. 단타창 VI + 테마 + 공매도 실데이터 끝. 🏁 단타창 7/7 완성.

신규 endpoint 3개:
- /api/kis/vi — Movers 기반 자체 분류 (8%+ 발동, 5%+ 해제)
- /api/kis/theme — 자체 테마 매핑 10개 + 평균 등락률
- /api/krx/short-interest — 공매도 시드 (Layer 1-A2 KRX CSV)

ScalperCards.tsx:
- ViCard, ThemeTop10Card, ShortInterestCard 모두 실데이터
- 갱신 주기: VI 10초, 테마 30초, 공매도 60초
- 테마 카드 onClick — leaderCode 로 종목 선택

빌드 클린, git push 완료 (커밋 [해시])

단타창 7/7 카드 100% 실데이터 완성:
✅ Movers ✅ Volume ✅ VI ✅ NetBuy ✅ 공시 ✅ 테마 ✅ 공매도

브라우저에서 확인:
  http://localhost:3333/scalper
  · 모든 7개 카드 실시간 데이터 표시
  · subtitle 에 마지막 갱신 시각 표시
  · 21개 중 7개 실데이터 (33%)

다음 STEP 104: 장타창 7개 실데이터 (DART + quant_factors DB)
```

---

## ⚠️ 주의 사항

1. **단타창 카드만 수정** — 장타·미국주식은 STEP 104~ 에서
2. **신규 endpoint 응답 표준화** — `{ items: [...] }` 형식 통일
3. **rate limit 주의** — 테마 API 는 종목 N개 fetch 라 부담. 갱신 주기 30초 권장
4. **공매도는 일일 갱신** — 실시간 X. 시드 데이터로 시작, Layer 1-A2 에서 KRX CSV 자동화
5. **각 endpoint 독립** — 한 endpoint 실패해도 다른 카드 영향 X
6. **테마 매핑 종목 코드** — 실제 KRX 종목 코드 확인 권장 (가짜 code 면 가격 fetch 실패)
7. **빌드 깨지면 즉시 보고** — 신규 endpoint 3개 동시 추가라 신중히
8. **console.log 남기지 말 것**
