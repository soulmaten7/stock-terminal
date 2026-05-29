<!-- 2026-05-29 -->
# STEP 107 — Chat 로딩 무한 진단 + Plain Supabase Client 교체

## 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

## 전제 상태
- 이전 커밋: `1604b92` (try/catch + console.log 추가)
- 현상: 브라우저 콘솔에 `[chat] loading messages for room: scalper` 만 찍히고 그 다음 로그 없음
- Network 탭에 `chat_messages` 요청이 **아예 안 나감** (0/125 requests)
- curl 테스트는 0.65초 만에 HTTP 200 응답 (서버·키·RLS 모두 정상)

## 원인 (가설)
`lib/supabase/client.ts` 가 `@supabase/ssr` 의 `createBrowserClient` 를 사용 중. 이건 Next.js App Router 의 쿠키·세션 자동 관리용. 익명 채팅(로그인 없음)에서는 오버킬이고, `getSession()` 내부 락에 걸려 후속 fetch 가 무한 대기하는 알려진 이슈.

## 해결 — Plain `@supabase/supabase-js` 익명 전용 클라이언트 신설

### 1. 신규 파일 — `lib/supabase/anon-client.ts`

채팅·관심종목·공개 데이터용 익명 클라이언트 (auth/쿠키 비활성화).

```typescript
"use client";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let _client: SupabaseClient | null = null;

/**
 * 익명 전용 Supabase 클라이언트.
 * - auth 세션 관리 비활성화 (쿠키·localStorage 사용 X)
 * - 채팅·공개 데이터 조회용
 * - @supabase/ssr 의 createBrowserClient 대신 사용 (세션 락 이슈 회피)
 */
export function createAnonClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. .env.local 의 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 확인 필요."
    );
  }
  if (!_client) {
    _client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return _client;
}
```

### 2. 수정 — `components/sidebar/ChatPanel.tsx`

**A. import 변경:**

```typescript
// 기존
import { createClient } from "@/lib/supabase/client";

// 변경
import { createAnonClient } from "@/lib/supabase/anon-client";
```

**B. 로드 useEffect 내부 — `createClient()` → `createAnonClient()`:**

기존:
```typescript
let supabase;
try {
  supabase = createClient();
} catch (err) {
```

변경:
```typescript
let supabase;
try {
  supabase = createAnonClient();
} catch (err) {
```

**C. Realtime useEffect 내부 — 동일하게 교체:**

기존:
```typescript
let supabase;
try { supabase = createClient(); } catch { return; }
```

변경:
```typescript
let supabase;
try { supabase = createAnonClient(); } catch { return; }
```

**D. sendMessage 내부 — 동일하게 교체:**

기존:
```typescript
let supabase;
try { supabase = createClient(); } catch { return; }
```

변경:
```typescript
let supabase;
try { supabase = createAnonClient(); } catch { return; }
```

**E. 로드 useEffect 의 select 에 10초 타임아웃 추가** (혹시 anon-client 도 막히면 무한 대기 방지):

기존:
```typescript
console.log("[chat] loading messages for room:", room);
const { data, error } = await supabase
  .from("chat_messages")
  .select("id, room, nickname, content, created_at")
  .eq("room", room)
  .eq("hidden", false)
  .order("created_at", { ascending: false })
  .limit(100);
```

변경:
```typescript
console.log("[chat] loading messages for room:", room);
const queryPromise = supabase
  .from("chat_messages")
  .select("id, room, nickname, content, created_at")
  .eq("room", room)
  .eq("hidden", false)
  .order("created_at", { ascending: false })
  .limit(100);

const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error("Supabase select timeout (10s)")), 10000)
);

const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as Awaited<typeof queryPromise>;
```

### 3. `@supabase/supabase-js` 패키지 확인

대부분 이미 설치돼있을 거지만 (`@supabase/ssr` 의 peer dependency) 혹시 없으면:

```bash
npm list @supabase/supabase-js
```

없다고 나오면:
```bash
npm install @supabase/supabase-js
```

### 4. 빌드 검증

```bash
npm run build 2>&1 | tail -30
```

에러 없어야 함.

### 5. 커밋 + 푸시

```bash
git add lib/supabase/anon-client.ts components/sidebar/ChatPanel.tsx
git commit -m "fix(chat): @supabase/ssr → plain @supabase/supabase-js (anon client)

원인: @supabase/ssr 의 createBrowserClient 가 쿠키·세션 자동 관리하면서
auth.getSession() 내부 락에 걸려 후속 .from().select() await 가
무한 대기. Network 탭에 fetch 요청 자체가 안 나감.

해결:
- lib/supabase/anon-client.ts 신설 — plain createClient 사용,
  auth { persistSession/autoRefreshToken/detectSessionInUrl } 전부 false
- ChatPanel: createClient() → createAnonClient() (3곳)
- 로드 select 에 10s 타임아웃 가드 추가 (Promise.race) — 만에 하나 또
  막히면 무한 대기 대신 명확한 에러 표시"
git push
```

## 검증

푸시 후 사용자에게 안내:
1. 브라우저 `http://localhost:3333/scalper` 하드 리프레시 (Cmd + Shift + R)
2. Console 에 다음 로그 떠야 함:
   - `[chat] loading messages for room: scalper`
   - `[chat] loaded 1 messages` ← ★ 이게 핵심
3. 화면 좌측 채팅창에 메시지 "단타창 첫 메시지 — Realtime 작동 확인" 표시
4. 만약 여전히 멈추면 10초 후 콘솔에 `[chat] unexpected error during load Error: Supabase select timeout (10s)` 떠야 함 (그러면 진짜 네트워크 차단 의심)

## 완료 후 보고

Claude Code 는 다음을 보고할 것:
- ✅/❌ 빌드 결과
- ✅/❌ 커밋 해시
- ✅/❌ 푸시 결과
- npm list @supabase/supabase-js 결과 (버전)
