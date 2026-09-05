# STEP 747 — /en 픽스 2건: 매매처 언어권 배선 + 종목상세 meta 한글 제거

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet — 3파일 소규모 수정)

**전제 상태**: HEAD `76030d2` · 트리 클린

**배경 (07-18 US 3중 검수에서 발견 · 베타 전 필수 픽스)**:
- 갭1: `<BrokerRanking />`이 region 없이 호출 → `region='KR'` 하드 디폴트 → **영어(/en) 사용자도 한국 증권사(키움·미래에셋) 노출**. `brokers` 테이블엔 US 17행 이미 있음 + note 한글은 Cowork이 MCP로 영어화 완료(코드 밖·완료됨).
- 갭2: `/en` 종목상세 meta description·keywords에 한글 병기 — "Apple Inc.**(애플**·AAPL)…" — 구글 미국 검색자에게 한글 스니펫. 원인 = `generateMetadata`의 `sub`(보조 이름 병기)가 en에서도 한글 오버라이드명을 넣음.

**원칙**: ko 출력은 **byte 동일**(한국어 화면·SEO 불변). en만 바뀐다.

---

## 수정 1 — `components/toolbox/ToolboxClient.tsx` (매매처 로케일 배선)

`activeTab === 'broker'` 분기의:
```tsx
            <BrokerRanking />
```
을 다음으로 교체 (`locale`은 이미 156행 부근 `const locale = useLocale();`로 존재 — 재선언 금지):
```tsx
            <BrokerRanking region={locale === 'en' ? 'US' : 'KR'} />
```

## 수정 2 — `components/toolbox/BrokerRanking.tsx` (KR 폴백이 en에서 번쩍이는 것 방지)

```tsx
  const [brokers, setBrokers] = useState<Broker[]>(BROKERS); // 초기 = 정적 KR(폴백·즉시표시)
```
을 다음으로 교체:
```tsx
  // 정적 폴백(BROKERS)은 KR 전용 — en(US)에서 한국 증권사가 먼저 번쩍이지 않게 KR일 때만 초기값.
  const [brokers, setBrokers] = useState<Broker[]>(region === 'KR' ? BROKERS : []);
```
그리고 파일 상단 주석 12~14행의 "지금은 한국어 전용 → region=KR 고정" 부분을 현행화:
```
// 매매처 = 언어권(사용자 지역) 기준. ToolboxClient가 로케일로 region 전달(ko→KR·en→US). (STEP 747)
```

## 수정 3 — `app/[locale]/stock/[symbol]/page.tsx` (en meta 한글 병기 제거)

```ts
  const sub = isEn ? (en ? name : undefined) : en; // 괄호/키워드에 병기할 보조 이름
```
을 다음으로 교체:
```ts
  // en은 보조 이름 병기 안 함 — 한글 오버라이드명(애플·삼성전자)이 en_US meta description/keywords에 새는 것 방지(STEP 747).
  const sub = isEn ? undefined : en;
```
(`main`·title·ko 분기 불변 — `sub`는 en에서 `idPart`·`kw`에만 쓰였음.)

---

## 검증 (전부 통과해야 커밋)

1. `npx tsc --noEmit` → 0 에러
2. `npm run test` → 전부 통과
3. `npm run build` → 성공
4. **ko byte 동일 확인**: 수정 3이 ko 분기를 안 건드렸는지 diff 육안 확인(`sub` 한 줄과 주석 외 변경 0).
5. push 후 **라이브 실측** (배포 완료 대기 후 · 캐시버스터 붙여도 됨):
   - `curl -s "https://onetrillion.app/en/stock/AAPL?v=747" | grep -o 'name="description" content="[^"]*"'` → **한글(애플) 없음**
   - `curl -s "https://onetrillion.app/stock/AAPL?v=747" | grep -o 'name="description" content="[^"]*"'` → ko 현행 그대로("애플(Apple Inc.·AAPL) 주가와…")
   - `/en` 매매처 탭은 클라 렌더라 curl로 안 보임 → Cowork이 Chrome으로 확인 예정. 대신 `curl -s "https://onetrillion.app/api/brokers?region=US"` 200 + US 증권사·영어 note 확인.

## 커밋

```bash
git add components/toolbox/ToolboxClient.tsx components/toolbox/BrokerRanking.tsx "app/[locale]/stock/[symbol]/page.tsx" docs/STEP_747_COMMAND.md
git commit -m "STEP 747: locale-aware broker region (en->US) + drop Korean aliases from /en stock meta"
git push
```

## 완료 보고 → Cowork에게
- tsc/vitest/build + 라이브 curl 3개 결과 + 커밋 해시. (문서 STATE/CHANGELOG는 Cowork 담당.)
