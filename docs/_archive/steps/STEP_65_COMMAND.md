# STEP 65 — ChatWidget 폴리싱 + /chat 페이지 실데이터화

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**목표:**
1. `ChatWidget`: 종목 태그(`$005930`, `$삼성전자`) 를 자동 링크화(→ `/chart?symbol=`), 로그인 유도 UX 개선.
2. `/chat` 페이지: 기존 `WidgetDetailStub` 제거 + 실시간 채팅 풀페이지로 전환 (위젯 컴포넌트 재사용 + 참여자 패널 상시 노출).
3. 채팅 메시지 높이 확장(최대 200 → 300 px 내외), placeholder 안내 텍스트 개선.

**전제 상태 (직전 커밋):** STEP 64 완료 (TrendingThemes + /analysis 폴리싱)

---

## 1. ChatWidget 종목 태그 하이라이트 — `components/widgets/ChatWidget.tsx`

기존 파일에서 메시지 렌더 부분만 교체.

**Edit 1:** 파일 상단 import 섹션에 헬퍼 추가 (이미 `Link` 가 없을 수 있으니 추가):

```typescript
import Link from 'next/link';
```

(기존 import 블록 맨 아래에 삽입)

**Edit 2:** `fmtTime` 함수 아래에 종목 태그 파싱 헬퍼 추가

```typescript
// $005930, $삼성전자 형태 감지 → Link 렌더
function renderWithTags(content: string) {
  const regex = /\$([A-Za-z0-9가-힣]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    const symbol = match[1];
    parts.push(
      <Link
        key={`tag-${key++}`}
        href={`/chart?symbol=${encodeURIComponent(symbol)}`}
        className="text-[#0ABAB5] font-bold hover:underline"
      >
        ${symbol}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) parts.push(content.slice(lastIndex));
  return parts;
}
```

**Edit 3:** 메시지 렌더 `<p>` 태그를 아래로 교체

```tsx
                <p className="text-sm text-[#333] leading-snug break-all">{renderWithTags(m.content)}</p>
```

---

## 2. `/chat` 페이지 풀페이지화 — `app/chat/page.tsx`

전체 교체 (stub 제거):

```typescript
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ChatWidget from '@/components/widgets/ChatWidget';

export const metadata: Metadata = { title: '실시간 채팅 — StockTerminal' };

export default function ChatPage() {
  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-black mb-1">실시간 채팅</h1>
        <p className="text-sm text-[#666]">
          투자자 간 실시간 메시지. $종목명 또는 $005930 형식으로 태그하면 자동 링크. Supabase Realtime 기반.
        </p>
      </div>

      <div className="h-[calc(100vh-200px)] min-h-[500px]">
        <ChatWidget />
      </div>
    </div>
  );
}
```

---

## 3. 검증

```bash
cd ~/Desktop/OTMarketing
npm run build
```

수동 테스트:
- 메시지 입력 `$005930 테스트` → 해당 부분이 teal 색 Link 로 렌더
- 클릭 시 `/chart?symbol=005930` 이동
- `/chat` 페이지에서 채팅 풀사이즈(약 500+ 높이) 표시

커밋 + push:

```bash
git add -A
git commit -m "feat(chat): 종목 태그 자동 링크 + /chat 페이지 stub 제거

- ChatWidget: \$005930 / \$삼성전자 패턴 감지 → /chart 링크
- renderWithTags 파서 추가
- app/chat/page.tsx stub → ChatWidget 풀페이지

STEP 65 / REFERENCE_PLATFORM_MAPPING.md P1"
git push
```

---

## 4. 다음 STEP

완료 후 `@docs/STEP_66_COMMAND.md 파일 내용대로 실행해줘` 로 TickWidget + /ticks 폴리싱 진행. (마지막 STEP)
