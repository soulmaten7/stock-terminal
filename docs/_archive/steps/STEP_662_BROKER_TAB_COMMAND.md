<!-- 2026-07-08 (3rd) -->
# STEP 662 — 🏦 증권사 독립 탭 신설 (additive)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** HEAD `4404424`(STEP 661, CN 완결). 문서 `docs/UI_BROKER_LENS_REDESIGN.md` = 전체 설계.
**목표:** 지금 종목·상품 탭 우측 사이드바에 있는 `증권사 바로가기`(BrokerRanking)를 **상단 독립 '증권사' 탭**으로도 노출한다. **이번엔 additive** — 보드 사이드바는 그대로 두고(다음 STEP 663에서 그 자리를 AI 렌즈 미리보기로 교체·사이드바 제거), 증권사 발견 경로부터 먼저 만든다.
**왜:** 테스터가 "종목 화면인데 왜 증권사?" 혼란 → 증권사는 별도 목적지로 분리.

> BrokerRanking은 `region` 기준(현재 한국어권=KR 고정·`export default function BrokerRanking({ hideHeader=false, region='KR' })`). 언어 스위처 생기면 region만 교체. **전 국가 탭에서 KR 증권사 노출**(한국어 사용자 기준). CN 갭 없음.

---

## 파일: `components/toolbox/ToolboxClient.tsx`

**(a) TAB_ORDER에 `broker` 추가** (34~35행) — 거래소·기관 옆(집행 창구라 거래소와 형제):
```ts
const TAB_ORDER = ['market', 'chart', 'news', 'disclosure', 'research', 'analysis', 'macro', 'etf', 'ipo', 'broker', 'exchange', 'community', 'youtube', 'room'];
```
> 위치는 조정 가능(원하면 앞쪽으로). 지금은 ipo 다음·exchange 앞.

**(b) SPECIAL_LABELS에 추가** (39행):
```ts
const SPECIAL_LABELS: Record<string, string> = { market: '종목·상품', broker: '증권사', youtube: '유튜브', room: '리딩방·검증' };
```

**(c) 탭 노출 로직** (154~160행 근처) — broker는 market처럼 **전 국가 노출**(KR 증권사 언어권 기준):
```ts
const tabs = TAB_ORDER.map((slug) => {
  const special = SPECIAL_LABELS[slug];
  if (special) {
    // market·broker = 전 국가 노출(각각 Yahoo 라이브·KR 증권사 언어권 기준). youtube·room = KR 전용.
    if (slug === 'market' || slug === 'broker') return { slug, label: special };
    return country === 'KR' ? { slug, label: special } : null;
  }
  // ... 기존 로직 유지
```

**(d) 콘텐츠 렌더 분기** — 특수탭 콘텐츠를 렌더하는 곳(youtube→`YoutubeRanking`, room→`AdvisorDirectory` 렌더하는 switch/조건부)을 찾아 `broker` 분기 추가. BrokerRanking을 **풀폭·헤더 포함**으로:
```tsx
{activeTab === 'broker' && (
  <div className="mx-auto w-full max-w-3xl">
    <BrokerRanking />
  </div>
)}
```
- `import BrokerRanking from './BrokerRanking';` 상단에 추가(이미 있으면 생략).
- `hideHeader` 안 줌 = 자체 헤더("증권사 바로가기" 등) 표시. 풀폭이라 사이드바보다 여유 있게.

> ⚠️ 보드 사이드바(`MarketBoard` 등 6개 보드의 우측 BrokerRanking)는 **이번 STEP에선 건드리지 않음.** STEP 663에서 그 자리를 AI 렌즈 미리보기로 교체하며 제거. (662~663 과도기엔 증권사가 탭·사이드바 양쪽 노출 — 짧고 수용 가능.)

---

## 검증 → 커밋
```bash
npx tsc --noEmit          # EXIT 0
```
- 클라이언트 컴포넌트라 HMR 즉시. (라우트/서버 변경 없음 → 클린 재시작 불필요. 단 `TAB_ORDER`는 클라 상수라 반영됨.)
- 확인: 상단 탭바에 **'증권사'** 탭 노출(KR·US·JP·CN·VN·GB 전부) → 클릭 시 KR 증권사 리스트 풀폭 렌더. 종목·상품 탭 사이드바 증권사도 아직 그대로(정상).
- console.log 금지.
```bash
git add "components/toolbox/ToolboxClient.tsx"
git commit -m "feat(ui): STEP 662 증권사 독립 탭 신설 (BrokerRanking 풀폭·전 국가 노출·additive, 사이드바는 663서 교체)"
git push
```

## Cowork에게 보고
- 증권사 탭 노출·렌더 정상 여부(전 국가) + 탭 위치 느낌(앞으로 뺄지).
→ 다음 = **STEP 663**(보드 우측 레일 = AI 렌즈 미리보기 교체 + 사이드바 제거 + 수익률 패노라마 병합 + 폭 확대, KR 보드 레퍼런스 먼저). 이건 Cowork이 패노라마/렌즈 fetch 코드 보고 설계.
