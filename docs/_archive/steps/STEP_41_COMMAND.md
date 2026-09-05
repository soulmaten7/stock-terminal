# STEP 41 — 나머지 4개 분석 탭 정직 스텁 교체 (Quant · Dividend · Technical · Supply)

## 실행 명령어
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

## 목표
ValueAnalysis 를 제외한 4개 분석 탭(`QuantAnalysis` · `DividendAnalysis` · `TechnicalAnalysis` · `SupplyAnalysis`) 을 **정직한 dark-친화 스텁 카드**로 통일 교체. 각각 어떤 데이터 파이프라인이 필요한지 사용자에게 명시.

## 전제 상태
- 이전 커밋: `616f5c2` (STEP 40 ValueAnalysis 재작성)
- 4개 컴포넌트 현황 (라인 수):
  - `QuantAnalysis.tsx`: 282줄
  - `DividendAnalysis.tsx`: 320줄
  - `SupplyAnalysis.tsx`: 335줄
  - `TechnicalAnalysis.tsx`: 394줄
  - **합계 1,331줄**
- 모두 AI Summary 섹션 + placeholder 하드코딩 포함 예상

## 왜 실데이터 연결이 아닌 스텁으로 가는가
- `dividends` / `supply_demand` / `short_credit` / `insider_trades` / `stock_prices` 테이블이 시딩 안 됨 (또는 매우 부족)
- Quant 의 모멘텀/팩터 퍼센타일은 **시장 전체** 분포 데이터가 있어야 계산 의미가 있는데, 아직 해당 집계가 없음
- 현재 코드는 모두 하드코딩된 가짜 숫자(8.5%, 72퍼센타일 등) 로 채워져 있어서 **사용자에게 오정보**를 전달 중
- 정직한 스텁 → 각 파이프라인 구축 STEP 에서 점진적으로 활성화하는 게 로드맵상 깔끔

---

## Part A — 공통 스텁 카드 패턴

각 컴포넌트는 아래 동일한 뼈대로 교체. 아이콘·제목·설명·ETA 만 다르게.

```tsx
'use client';

import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import { <Icon> } from 'lucide-react';

interface Props {
  stockId: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function <ComponentName>({ stockId }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-dark-700 rounded-lg p-10 border border-dashed border-border text-center">
        <<Icon> className="w-12 h-12 mx-auto text-text-secondary mb-4" />
        <h3 className="text-lg font-bold text-text-primary mb-2">
          <한글 제목> — 준비 중
        </h3>
        <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed mb-4">
          <구체적 설명 — 어떤 데이터 파이프라인이 필요한지>
        </p>
        <span className="inline-block px-3 py-1 rounded text-xs bg-accent/10 text-accent font-bold border border-accent/20">
          예정: <구체적 STEP 번호 또는 Phase>
        </span>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
```

**핵심 원칙**
- `stockId` 파라미터는 props 시그니처 유지 (상위 `AnalysisPage.tsx` 가 같은 인터페이스로 호출). 본문에서 미사용이므로 eslint-disable 주석 1줄
- 기존 `createClient`, `useState`, `useEffect`, `recharts`, `calculateGrahamValue` 등 모든 import 제거 (dead code)
- `AIAnalysis` 타입 import 전면 제거
- 카드 배경 `bg-dark-700` + 대시선 테두리 → "placeholder 이지만 의도된 UI" 라는 신호

---

## Part B — 컴포넌트별 교체 내용

### B-1. `components/analysis/QuantAnalysis.tsx` (282줄 → ~35줄)
- Icon: `BarChart3` from lucide-react
- 제목: "퀀트 분석"
- 설명: "시장 전체 대비 가치·모멘텀·퀄리티 퍼센타일 산출에는 전종목 시장 데이터 집계 파이프라인이 필요합니다. 시총 TOP 100 기준 팩터 스코어는 후속 데이터 수집 이후 공개됩니다."
- ETA: "STEP 45+"

### B-2. `components/analysis/DividendAnalysis.tsx` (320줄 → ~35줄)
- Icon: `Coins` from lucide-react
- 제목: "배당 분석"
- 설명: "배당 수익률·배당 성향·배당 성장률 시계열을 위한 `dividends` 테이블이 아직 비어 있습니다. DART 배당 공시 수집 파이프라인 구축 이후 활성화 예정."
- ETA: "STEP 44"

### B-3. `components/analysis/TechnicalAnalysis.tsx` (394줄 → ~35줄)
- Icon: `LineChart` from lucide-react
- 제목: "기술적 분석"
- 설명: "이동평균·볼린저밴드·RSI 등 기술 지표는 일봉 시계열이 필요합니다. `stock_prices` 테이블 시딩 후 활성화 예정 — 현재는 `/stocks/[symbol]` 기본 페이지의 1년 라인차트만 제공합니다."
- ETA: "STEP 42"

### B-4. `components/analysis/SupplyAnalysis.tsx` (335줄 → ~35줄)
- Icon: `Users` from lucide-react
- 제목: "수급 분석"
- 설명: "종목별 외국인·기관·개인 순매수 일별 시계열은 KIS per-stock investor-flow API(FHKST01010900) 수집 파이프라인이 필요합니다. `/analysis` 페이지 전체 시장 수급 위젯은 이미 실데이터로 동작 중입니다."
- ETA: "STEP 43"

---

## Part C — 파일 덮어쓰기 작업

Claude Code 가 각 파일을 Part A 의 뼈대 + Part B 의 맞춤 값으로 **완전 덮어쓰기**. 기존 모든 로직 제거.

### C-1. QuantAnalysis.tsx 전체 교체
```tsx
'use client';

import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import { BarChart3 } from 'lucide-react';

interface Props {
  stockId: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function QuantAnalysis({ stockId }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-dark-700 rounded-lg p-10 border border-dashed border-border text-center">
        <BarChart3 className="w-12 h-12 mx-auto text-text-secondary mb-4" />
        <h3 className="text-lg font-bold text-text-primary mb-2">
          퀀트 분석 — 준비 중
        </h3>
        <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed mb-4">
          시장 전체 대비 가치·모멘텀·퀄리티 퍼센타일 산출에는 전종목 시장 데이터 집계 파이프라인이 필요합니다.
          시총 TOP 100 기준 팩터 스코어는 후속 데이터 수집 이후 공개됩니다.
        </p>
        <span className="inline-block px-3 py-1 rounded text-xs bg-accent/10 text-accent font-bold border border-accent/20">
          예정: STEP 45+
        </span>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
```

### C-2. DividendAnalysis.tsx 전체 교체
```tsx
'use client';

import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import { Coins } from 'lucide-react';

interface Props {
  stockId: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function DividendAnalysis({ stockId }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-dark-700 rounded-lg p-10 border border-dashed border-border text-center">
        <Coins className="w-12 h-12 mx-auto text-text-secondary mb-4" />
        <h3 className="text-lg font-bold text-text-primary mb-2">
          배당 분석 — 준비 중
        </h3>
        <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed mb-4">
          배당 수익률·배당 성향·배당 성장률 시계열을 위한 dividends 테이블이 아직 비어 있습니다.
          DART 배당 공시 수집 파이프라인 구축 이후 활성화 예정.
        </p>
        <span className="inline-block px-3 py-1 rounded text-xs bg-accent/10 text-accent font-bold border border-accent/20">
          예정: STEP 44
        </span>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
```

### C-3. TechnicalAnalysis.tsx 전체 교체
```tsx
'use client';

import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import { LineChart } from 'lucide-react';

interface Props {
  stockId: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function TechnicalAnalysis({ stockId }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-dark-700 rounded-lg p-10 border border-dashed border-border text-center">
        <LineChart className="w-12 h-12 mx-auto text-text-secondary mb-4" />
        <h3 className="text-lg font-bold text-text-primary mb-2">
          기술적 분석 — 준비 중
        </h3>
        <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed mb-4">
          이동평균·볼린저밴드·RSI 등 기술 지표는 일봉 시계열이 필요합니다.
          stock_prices 테이블 시딩 후 활성화 예정 — 현재는 /stocks/[symbol] 기본 페이지의 1년 라인차트만 제공합니다.
        </p>
        <span className="inline-block px-3 py-1 rounded text-xs bg-accent/10 text-accent font-bold border border-accent/20">
          예정: STEP 42
        </span>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
```

### C-4. SupplyAnalysis.tsx 전체 교체
```tsx
'use client';

import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import { Users } from 'lucide-react';

interface Props {
  stockId: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SupplyAnalysis({ stockId }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-dark-700 rounded-lg p-10 border border-dashed border-border text-center">
        <Users className="w-12 h-12 mx-auto text-text-secondary mb-4" />
        <h3 className="text-lg font-bold text-text-primary mb-2">
          수급 분석 — 준비 중
        </h3>
        <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed mb-4">
          종목별 외국인·기관·개인 순매수 일별 시계열은 KIS per-stock investor-flow API (FHKST01010900) 수집 파이프라인이 필요합니다.
          /analysis 페이지 전체 시장 수급 위젯은 이미 실데이터로 동작 중입니다.
        </p>
        <span className="inline-block px-3 py-1 rounded text-xs bg-accent/10 text-accent font-bold border border-accent/20">
          예정: STEP 43
        </span>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
```

---

## Part D — 빌드 검증

### D-1. 타입체크
```bash
npx tsc --noEmit 2>&1 | tail -30
```
**기대**: 에러 0건.

**위험 포인트**:
- 다른 파일에서 `QuantAnalysis` 나 `DividendAnalysis` 등을 import 하면서 기존 props(예: 없음) 를 쓰고 있다면 문제없음 — props 시그니처(stockId) 유지
- `types/stock.ts` 의 `AIAnalysis` type 이 다른 곳에서도 쓰이는지 grep 해서 확인:
  ```bash
  grep -rn "AIAnalysis" components/ app/ lib/ --include='*.ts' --include='*.tsx'
  ```
  - ValueAnalysis 는 이미 STEP 40 에서 제거됨
  - Quant/Dividend 에서 쓰였다가 이제 제거되면 `types/stock.ts` 의 `AIAnalysis` 는 고아 타입이 되지만 그대로 두어도 타입 에러 없음. 제거는 나중에 클린업 STEP 으로 미룸.
- 기존 `stockCalculations`, `format` 유틸 중 ValueAnalysis + 다른 탭에서만 쓰이던 함수가 있으면 고아 코드가 될 수 있음. 이번엔 유틸 건드리지 말고 두기 — 추후 STEP 에서 grep 으로 dead code 정리.

### D-2. 빌드
```bash
npm run build 2>&1 | tail -50
```
**기대**: 성공. 실패 시 에러 로그 보고 즉시 수정.

---

## Part E — 브라우저 검증

### E-1. 개발 서버
```bash
npm run dev
```

### E-2. 체크 URL — 삼성전자 기준
- `http://localhost:3000/stocks/005930/analysis`
- 탭 5개: 가치투자 · 기술적분석 · 퀀트 · 배당투자 · 수급분석

**체크 포인트**:
- [ ] 가치투자 탭: STEP 40 재작성된 실데이터 차트 정상
- [ ] 기술적분석 탭: 대시선 테두리 스텁 카드 "준비 중 — 예정: STEP 42"
- [ ] 퀀트 탭: 스텁 카드 "준비 중 — 예정: STEP 45+"
- [ ] 배당투자 탭: 스텁 카드 "준비 중 — 예정: STEP 44"
- [ ] 수급분석 탭: 스텁 카드 "준비 중 — 예정: STEP 43"

**예상 UX**: 가짜 숫자가 있던 4개 탭이 "준비 중" 스텁으로 대체됨. 사용자는 "덜 구현됐네" 보다 "정직하게 로드맵 알려주네" 로 느낌 받아야 함.

### E-3. 콘솔 에러 점검
브라우저 DevTools Console 에서 에러 없는지 확인 (특히 제거된 컴포넌트/유틸 관련 런타임 에러).

---

## Part F — 문서 + 커밋

### F-1. 문서 4개 헤더 날짜 오늘로 갱신
- `CLAUDE.md`, `docs/CHANGELOG.md`, `session-context.md`, `docs/NEXT_SESSION_START.md`

### F-2. `docs/CHANGELOG.md` 상단 블록
```markdown
## 2026-04-22 — STEP 41: 나머지 4개 분석 탭 정직 스텁 교체

**코드 변경**
- `components/analysis/QuantAnalysis.tsx`: 282줄 → 35줄 (스텁)
- `components/analysis/DividendAnalysis.tsx`: 320줄 → 35줄 (스텁)
- `components/analysis/TechnicalAnalysis.tsx`: 394줄 → 35줄 (스텁)
- `components/analysis/SupplyAnalysis.tsx`: 335줄 → 35줄 (스텁)
- **총 1,331줄 → 약 140줄** (1,191줄 감소)

**제거된 기술 부채**
- AI Summary 섹션 4개 (V3 방향성 위반)
- 하드코딩된 수익률/퍼센타일/팩터 스코어 (모멘텀 8.5%, 퍼센타일 72 등)
- `ai_analyses` 테이블 쿼리 4개 (테이블 시딩 없음)
- placeholder fallback 숫자 (per ?? 12.5, roe ?? 12.3 등)

**방향성**
- 각 스텁 카드에 활성화 예정 STEP 번호 명시 (STEP 42~45+)
- "근거 없는 숫자 표시 금지" (CLAUDE.md 절대규칙) 준수
- V3 "AI 리포트 전면 제외" 준수
```

### F-3. `session-context.md` 완료 블록
```markdown
## 2026-04-22 세션 — STEP 41 완료

- [x] Quant/Dividend/Technical/Supply 4개 탭 정직 스텁 교체
- [x] 총 1,191줄 dead code 제거
- [x] 브라우저 검증 (5개 탭 모두 정상 렌더)
- [ ] STEP 42: `seed-stock-prices.py` 실행 → TechnicalAnalysis 재활성화
- [ ] STEP 43: KIS per-stock investor-flow 수집 → SupplyAnalysis 재활성화
- [ ] STEP 44: DART 배당 공시 수집 → DividendAnalysis 재활성화
- [ ] STEP 45+: 시장 전체 팩터 집계 → QuantAnalysis 재활성화
```

### F-4. `docs/NEXT_SESSION_START.md` 갱신
- ValueAnalysis 실데이터 / 나머지 4개 탭 스텁화 완료
- 다음: STEP 42 (Technical 활성화 가장 빠름 — 기존 seed-stock-prices.py 존재)

### F-5. 커밋 + 푸시
```bash
git add components/analysis/QuantAnalysis.tsx \
        components/analysis/DividendAnalysis.tsx \
        components/analysis/TechnicalAnalysis.tsx \
        components/analysis/SupplyAnalysis.tsx \
        CLAUDE.md docs/CHANGELOG.md docs/NEXT_SESSION_START.md session-context.md \
        docs/STEP_41_COMMAND.md
git status
git commit -m "$(cat <<'EOF'
STEP 41: 나머지 4개 분석 탭 정직 스텁 교체

- QuantAnalysis: 282→35줄 (스텁, 예정 STEP 45+)
- DividendAnalysis: 320→35줄 (스텁, 예정 STEP 44)
- TechnicalAnalysis: 394→35줄 (스텁, 예정 STEP 42)
- SupplyAnalysis: 335→35줄 (스텁, 예정 STEP 43)

제거: AI Summary · 하드코딩 수익률/퍼센타일 · ai_analyses 쿼리 · placeholder fallback
총 1,331→140줄 (1,191줄 감소)
각 스텁에 활성화 예정 STEP 번호 + 필요 파이프라인 명시
EOF
)"
git push
```

---

## STEP 42 예고

**TechnicalAnalysis 재활성화 — `stock_prices` 시딩**

1. `scripts/seed-stock-prices.py` 검토 (기존 파일)
2. 테마 50종목 + 시총 TOP 50 대상 1년치 일봉 시딩
3. TechnicalAnalysis.tsx 재작성:
   - 이동평균선(5·20·60·120일)
   - RSI (14일)
   - 볼린저밴드
   - 거래량 오버레이
4. `/stocks/[symbol]` 메인 페이지의 기존 차트와 중복되지 않게 고급 지표 중심으로 차별화

---

## 롤백
```bash
git revert HEAD
git push
```
