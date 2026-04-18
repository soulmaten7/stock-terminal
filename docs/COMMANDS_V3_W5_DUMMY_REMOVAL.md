<!-- 2026-04-18 -->
# COMMANDS V3 — W5 더미 데이터 제거 (1차: ComingSoonCard + 4개 위젯)

## 목표
- `components/common/ComingSoonCard.tsx` 공통 스켈레톤 신설
- 더미 데이터만 들어있는 4개 위젯 → ComingSoonCard로 교체
  - `ProgramTrading.tsx`
  - `GlobalFutures.tsx`
  - `WarningStocks.tsx`
  - `IpoSchedule.tsx`
- 각 위젯 원래 DUMMY 상수·하드코딩 값 완전 제거
- ScreenerClient는 이미 실연결(W2.5~) — 이번 작업 대상 아님
- EarningsCalendar / EconomicCalendar는 별도 후속 태스크(#38 DART / #39 ECOS)

## 범위 밖 (이번 세션 건너뜀)
- EarningsCalendar 실데이터 연결 → Task #38
- EconomicCalendar 실데이터 연결 → Task #39
- ScreenerClient 손대지 않음 (이미 `/api/stocks/screener` 연결 상태)

---

## STEP 0 — 사전 확인 (discovery)
```bash
cd ~/Desktop/OTMarketing
grep -rn "DUMMY\|더미\|dummy" components/home | head -40
ls -la components/common/ 2>/dev/null || mkdir -p components/common
cat components/home/HomeClient.tsx | grep -E "ProgramTrading|GlobalFutures|WarningStocks|IpoSchedule" | head -10
```

## STEP 1 — `components/common/ComingSoonCard.tsx` 신규 작성

```bash
cat > components/common/ComingSoonCard.tsx <<'TSX'
'use client';

import { Clock } from 'lucide-react';
import type { ReactNode } from 'react';

interface ComingSoonCardProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  eta?: string;
}

export default function ComingSoonCard({
  title,
  icon,
  description,
  eta = 'Phase 2',
}: ComingSoonCardProps) {
  return (
    <div className="p-4 h-full flex flex-col">
      <h3 className="text-black font-bold text-sm mb-3 flex items-center gap-2">
        {icon ?? <Clock className="w-4 h-4 text-[#999999]" />}
        <span>{title}</span>
      </h3>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-2 bg-[#F5F7FA] rounded border border-dashed border-[#E5E7EB]">
        <div className="text-[#666666] text-sm font-bold mb-2">데이터 준비 중</div>
        {description && (
          <p className="text-[#999999] text-xs leading-relaxed mb-3 max-w-[240px]">
            {description}
          </p>
        )}
        <span className="inline-block px-2.5 py-1 rounded text-[11px] bg-[#0ABAB5]/10 text-[#0ABAB5] font-bold border border-[#0ABAB5]/20">
          예정: {eta}
        </span>
      </div>
    </div>
  );
}
TSX
```

## STEP 2 — `components/home/ProgramTrading.tsx` 교체

```bash
cat > components/home/ProgramTrading.tsx <<'TSX'
'use client';

import { TrendingUp } from 'lucide-react';
import ComingSoonCard from '@/components/common/ComingSoonCard';

export default function ProgramTrading() {
  return (
    <ComingSoonCard
      title="프로그램 매매"
      icon={<TrendingUp className="w-4 h-4 text-[#0ABAB5]" />}
      description="차익·비차익 거래 집계 — KRX 크롤링 연동 후 공개"
      eta="KRX 데이터 연결 후"
    />
  );
}
TSX
```

## STEP 3 — `components/home/GlobalFutures.tsx` 교체

```bash
cat > components/home/GlobalFutures.tsx <<'TSX'
'use client';

import { Globe } from 'lucide-react';
import ComingSoonCard from '@/components/common/ComingSoonCard';

export default function GlobalFutures() {
  return (
    <ComingSoonCard
      title="글로벌 선물"
      icon={<Globe className="w-4 h-4 text-[#0ABAB5]" />}
      description="S&P 500, NASDAQ, WTI, Gold 등 해외 선물 실시간 — 외부 API 연동 후 공개"
      eta="외부 선물 API 연결 후"
    />
  );
}
TSX
```

## STEP 4 — `components/home/WarningStocks.tsx` 교체

```bash
cat > components/home/WarningStocks.tsx <<'TSX'
'use client';

import { AlertTriangle } from 'lucide-react';
import ComingSoonCard from '@/components/common/ComingSoonCard';

export default function WarningStocks() {
  return (
    <ComingSoonCard
      title="투자주의/경고"
      icon={<AlertTriangle className="w-4 h-4 text-[#FF9500]" />}
      description="KRX 지정 투자주의·경고·위험 종목 실시간 — KRX 크롤링 연동 후 공개"
      eta="KRX 데이터 연결 후"
    />
  );
}
TSX
```

## STEP 5 — `components/home/IpoSchedule.tsx` 교체

```bash
cat > components/home/IpoSchedule.tsx <<'TSX'
'use client';

import { CalendarPlus } from 'lucide-react';
import ComingSoonCard from '@/components/common/ComingSoonCard';

export default function IpoSchedule() {
  return (
    <ComingSoonCard
      title="IPO 일정"
      icon={<CalendarPlus className="w-4 h-4 text-[#0ABAB5]" />}
      description="신규 공모주 청약·상장 일정 — DART·KRX 공시 기반 연동 후 공개"
      eta="공시 파이프라인 연결 후"
    />
  );
}
TSX
```

## STEP 6 — 빌드 검증

```bash
npm run build 2>&1 | tail -30
```

**통과 조건**: 에러 0건, 경고 OK. 빌드 실패 시 stop — 이전 상태 복구 후 재시도.

## STEP 7 — dev 서버 재시작 (선택)

```bash
lsof -ti :3333 | xargs kill -9 2>/dev/null; true
rm -rf .next
npm run dev &
```

## STEP 8 — git commit + push

```bash
git add components/common/ComingSoonCard.tsx \
       components/home/ProgramTrading.tsx \
       components/home/GlobalFutures.tsx \
       components/home/WarningStocks.tsx \
       components/home/IpoSchedule.tsx \
       docs/COMMANDS_V3_W5_DUMMY_REMOVAL.md && \
git commit -m "$(cat <<'EOF'
feat(W5): ComingSoonCard 공통 스켈레톤 + 4개 위젯 더미 제거

- components/common/ComingSoonCard.tsx 신규 (제목·아이콘·설명·eta 뱃지)
- ProgramTrading / GlobalFutures / WarningStocks / IpoSchedule 4개
  더미 상수 완전 제거 → ComingSoonCard 로 교체
  · ProgramTrading: KRX 크롤링 연동 후 공개
  · GlobalFutures: 외부 선물 API 연결 후
  · WarningStocks: KRX 지정 종목 연동 후
  · IpoSchedule: DART·KRX 공시 파이프라인 연결 후
- ScreenerClient 는 /api/stocks/screener 로 이미 실연결 (손대지 않음)
- EarningsCalendar · EconomicCalendar 는 후속 태스크 #38 / #39 에서 실데이터 연결

range out: /admin/partners CRUD, 리드 대시보드, UTM 대시보드 (W4 Phase 2)
EOF
)" && \
git push origin main
```

---

## 검증 체크리스트 (Cowork Chrome MCP)

- [ ] `/` 홈 접속 → 이전 더미 종목명(테스트A/B/C, TechBio 등) 0건
- [ ] 4개 위젯 자리에 "데이터 준비 중" + eta 뱃지 렌더링
- [ ] WidgetCard grid 높이 깨짐 없음 (300px 유지)
- [ ] 빌드 에러 없음
- [ ] console error 없음
