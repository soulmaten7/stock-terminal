<!-- 2026-05-31 -->
# STEP 123 — UI 일관성 다듬기 (공통 상태 + 카드 통일)

🟢 **Sonnet 가능** (작은 리팩토링 + 공통 컴포넌트 추출)

## 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

## 전제 상태
- 이전 커밋: `a971eaf` (STEP 122 시장·종목별 뉴스)
- 운종 V5 PC 기능 완성: 새 홈·종목 페이지·토론·채팅·뉴스·관심종목·검색·차트·인증 코드
- 시각적으로 미세하게 어색한 부분 다수 존재 (사용자 시각 확인 X)

## 이 STEP 의 범위 (좁게)

⚠️ **큰 시각 변경 X** — 사용자가 화면 직접 보고 결정할 영역. 이번 STEP 은 **코드 일관성·중복 제거·공통 컴포넌트** 만.

| 영역 | 변경 |
|------|------|
| **공통 컴포넌트 추출** | LoadingState · EmptyState · ErrorState (지금 페이지마다 다르게 적힘) |
| **카드 컨테이너 통일** | bg-unjong-surface + border + rounded-lg + 비슷한 padding 통일 (CardContainer 활용) |
| **색상 시스템 점검** | 운종 색상 변수 외 inline color (#ffffff 등) 검출·교체 |
| **빈 상태 메시지 통일** | "데이터 없음" "관련 뉴스가 없습니다" "첫 토론을 남겨보세요" 등 톤 통일 |

## 작업 디테일

### [1] 공통 상태 컴포넌트 신규 — `components/ui/State.tsx`

```tsx
import { type ReactNode } from "react";

type StateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function LoadingState({ title = "로딩 중...", description, action, className = "" }: Partial<StateProps>) {
  return (
    <div className={`text-center text-xs text-unjong-muted italic py-4 ${className}`}>
      <p>⏳ {title}</p>
      {description && <p className="mt-1 text-[10px]">{description}</p>}
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, description, action, className = "" }: StateProps) {
  return (
    <div className={`text-center py-6 ${className}`}>
      {icon && <div className="text-3xl mb-2 opacity-50">{icon}</div>}
      <p className="text-xs text-unjong-primary mb-1">{title}</p>
      {description && <p className="text-[10px] text-unjong-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, description, action, className = "" }: StateProps) {
  return (
    <div className={`text-center py-4 ${className}`}>
      <p className="text-xs text-unjong-danger mb-1">❌ {title}</p>
      {description && <p className="text-[10px] text-unjong-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
```

### [2] 컴포넌트별 적용 — 일관 톤 적용

다음 파일들의 로딩·빈상태 메시지를 `LoadingState`/`EmptyState`/`ErrorState` 로 교체:

- `components/stock/DiscussionBoard.tsx` — "⏳ 로딩 중...", "첫 토론을 남겨보세요"
- `components/stock/StockChatPanel.tsx` — "⏳ 로딩 중...", "첫 메시지를 남겨보세요"
- `components/stock/StockNewsModule.tsx` — "⏳ 로딩 중...", "관련 최근 뉴스가 없습니다"
- `components/stock/StockInfoPanel.tsx` — 로딩 표시
- `components/home-v5/HotDiscussionsModule.tsx` — "⏳ 로딩 중...", "첫 토론을 남겨보세요"
- `components/home-v5/HotChatRoomsModule.tsx` — "⏳", "아직 종목별 채팅이 없습니다"
- `components/home-v5/MarketNewsModule.tsx` — "⏳ 로딩 중...", "뉴스 로딩 실패"
- `components/sidebar/ChatPanel.tsx` — "⏳ 채팅 로딩 중...", "첫 메시지를 남겨보세요"
- `components/sidebar/WatchlistPanel.tsx` — "⏳ 로딩 중...", "관심종목이 없습니다"
- 카드 컴포넌트들 (ScalperCards, UsCards) — 각 카드 로딩·빈상태

예시 (DiscussionBoard 의 빈 상태):
```tsx
// 기존
<div className="bg-unjong-surface rounded-lg border border-unjong-border p-8 text-center text-xs text-unjong-muted">
  첫 토론을 남겨보세요.
</div>

// 변경
<div className="bg-unjong-surface rounded-lg border border-unjong-border p-4">
  <EmptyState
    icon="💬"
    title="첫 토론을 남겨보세요"
    description="이 종목에 대한 의견·분석·질문을 자유롭게."
  />
</div>
```

### [3] 색상 점검 — 운종 색상 외 inline color 검출

```bash
echo "=== 운종 색상 외 inline 색상 (자주 사용된 것만) ==="
grep -rn "bg-emerald-50\|bg-red-50\|bg-amber-50\|bg-blue-50\|bg-purple-50\|text-emerald-700\|text-blue-700\|#FEE500" \
  --include="*.tsx" components/ app/ 2>/dev/null | grep -v node_modules | head -20
```

이 색상들은 의미 있는 곳에만 사용:
- `bg-emerald-50`: 매수·상승·정상 (KOSPI 배지·호가 매수)
- `bg-red-50`: 매도·하락 (호가 매도)
- `bg-amber-50`: 경고·로그인 필요 (DiscussionItem 비로그인 안내)
- `bg-blue-50`: 정보·시장 배지 (KOSPI)
- `bg-purple-50`: 미국 시장 (US 배지)
- `#FEE500`: 카카오 브랜드 (로그인 버튼 — 변경 X)

→ **기존 사용 OK**. 다만 inline 색상 코드 (`#xxx`) 가 있으면 운종 색상 변수로 교체 시도.

### [4] 카드 패딩·border-radius 통일 점검

검출:
```bash
grep -rn "rounded-lg.*p-3\|rounded-lg.*p-4\|rounded.*p-2\|rounded.*p-3" \
  --include="*.tsx" components/ 2>/dev/null | grep -v node_modules | wc -l
```

대략적인 패턴:
- 최외곽 카드: `rounded-lg border border-unjong-border p-4`
- 내부 모듈: `rounded p-3` 또는 `rounded p-2`
- 헤더: `px-4 py-3` 또는 `px-3 py-2`

→ 이미 비교적 일관됨. 큰 작업 X.

### [5] 이모지 사용 정리

검출:
```bash
grep -rn "🚀\|🔥\|⚡\|🌳\|🌙\|🇰🇷\|🇺🇸\|💬\|⭐\|📊\|📈\|📉\|📰\|📄\|💰\|🚨\|🎯\|⚠️\|🏆\|✓\|❤" \
  --include="*.tsx" components/ 2>/dev/null | grep -v node_modules | wc -l
```

운종 이모지 가이드 (강제 X, 통일성):
- 🇰🇷 🇺🇸: 국가 (한국주식·미국주식)
- 🚀: Movers·등락률
- 🔥: HOT·핫 이슈·Volume
- 💰: 외인/기관·돈
- 📄: 공시
- 📊: 지수·차트·분석
- 📈: 차트·상승
- 📉: 하락
- 📰: 뉴스
- 💬: 토론·채팅
- ⚡: 단타·실시간
- 🌳: 장기·장타
- 🌙: 미국·야간
- ⭐: 관심종목
- ⚠️: 경고
- 🏆: Tier 3
- ✓: Tier 2

→ 검증만 (변경 X). 명확한 가이드 위반만 정리.

### [6] CardContainer 활용 확인

```bash
grep -rn "from \"@/components/cards/CardContainer\"\|from \"../CardContainer\"" \
  --include="*.tsx" components/ 2>/dev/null | grep -v node_modules
```

새로 추가된 모듈 (MarketNewsModule·StockNewsModule·HotDiscussionsModule 등) 이 CardContainer 를 안 쓰고 있을 수 있음. 검토 후 통일:
- CardContainer 는 `title`, `emoji`, `subtitle`, `hint`, `detailHref` props 받음
- 새 모듈도 일관성 있게 CardContainer 사용 검토

→ 단 새 모듈은 사이드바·인라인 등 다양한 위치라 CardContainer 가 맞지 않을 수 있음. 적용 가능한 것만.

### [7] 빌드 검증

```bash
npm run build 2>&1 | tail -15
```

### [8] 4개 문서 헤더 갱신

### [9] 커밋 + 푸시

```bash
git add -A
git commit -m "chore(ui): 공통 상태 컴포넌트 추출 + 일관성 다듬기

신규:
- components/ui/State.tsx — LoadingState · EmptyState · ErrorState 공통 컴포넌트
  - 톤 통일: ⏳ 로딩 / 빈 상태 (이모지+title+desc+action) / ❌ 에러
  - className override 가능

적용:
- DiscussionBoard · StockChatPanel · StockNewsModule · StockInfoPanel
- HotDiscussionsModule · HotChatRoomsModule · MarketNewsModule
- ChatPanel · WatchlistPanel
- ScalperCards · UsCards (각 카드 로딩·빈상태)

검증:
- 운종 색상 외 inline 색상 = 의미 있는 곳에만 사용 (의도된 것)
  - emerald/red/blue/amber/purple 배지·하이라이트는 의미 부여 유지
  - 카카오 브랜드 #FEE500 = 변경 X
- 카드 padding·radius 일관 (큰 작업 X)
- 이모지 가이드 = 검증만, 변경 X

다음 STEP — 사용자 시각 확인 후:
- 큰 시각 변경 (헤더·푸터·홈 레이아웃 등)
- 모바일 반응형 (PC 완성 후)
- Vercel 배포 (도메인 결정 후)"
git push
```

## 검증 (사용자 안내용)

푸시 후 하드 리프레시:

1. 빈 토론 종목 페이지 (예: 새로 만든 종목) → 토론 영역에 "💬 첫 토론을 남겨보세요" 일관 형태로 표시
2. 빈 채팅 → "💬 첫 메시지를 남겨보세요. 트레이더와 실시간 대화" 표시
3. 빈 뉴스 → "📰 관련 최근 뉴스가 없습니다" 표시
4. 로딩 중 → "⏳ 로딩 중..." 일관
5. 에러 시 → "❌ XXX" 일관

## 완료 후 보고

- ✅/❌ 빌드 클린
- ✅/❌ State.tsx 신규 + 적용 파일 수
- ✅/❌ 색상·이모지 검증 결과
- ✅/❌ 커밋 + 푸시

## 다음 STEP (사용자 결정)

| 항목 | 우선순위 |
|------|---------|
| 댓글 기능 (discussion_comments 테이블 + UI) | 중간 |
| 미국 주식 시고저·52주·PER (Yahoo quoteSummary) | 중간 |
| 큰 시각 디자인 변경 (사용자 피드백 기반) | 사용자 결정 |
| 네이버 검색 API 통합 (키 발급 후) | 사용자 |
| 모바일 반응형 (< 1024px) | PC 완성 후 |
| Vercel 배포 + 도메인 | 사용자 |
| 카카오 OAuth 활성화 | 도메인 후 |

## 🔴 잔여 보안 권장 (사용자)

STEP 119 작성 때 노출된 `SUPABASE_ACCESS_TOKEN` (sbp_aedc6b23...) — 아직 폐기 안 하셨으면:
1. https://supabase.com/dashboard/account/tokens
2. 해당 토큰 **Revoke**
3. 새 PAT 발급 → `.env.local` 갱신
