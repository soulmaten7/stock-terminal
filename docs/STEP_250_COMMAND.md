<!-- 2026-06-15 -->
# STEP 250 — '1 Issue' 해결: Supabase 익명 클라이언트 storageKey 분리

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_250_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (기능적 완성 #4)
좌하단 dev '1 Issue' = 콘솔 경고 **"Multiple GoTrueClient instances detected in the same browser context"**.
- 원인: 인증 클라(`client.ts`)와 익명 클라(`anon-client.ts`)가 **같은 기본 storage key**(`sb-<ref>-auth-token`)를 공유. 둘 다 싱글톤이지만 키가 같아 충돌.
- 해결: **익명 클라에 별도 `storageKey`** 부여 → 키 분리 → 경고 사라짐. (기능 영향 0 — 익명 클라는 `persistSession:false`라 세션 저장 안 함)

> MCP(Chrome)로 콘솔 직접 읽어 확인한 단 하나의 경고. 빌드는 계속 통과했었음(비치명적이지만 정리).

## 전제 상태
- 현재 HEAD: STEP 249 적용 후(`539c5fb` 이후)
- 변경 **1파일**: `lib/supabase/anon-client.ts` (auth 옵션 1줄 추가)

---

## 작업 1/1 — `lib/supabase/anon-client.ts`

**찾기:**
```ts
    _client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
```
**바꾸기:**
```ts
    _client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: "sb-unjong-anon", // 인증 클라(sb-<ref>-auth-token)와 키 분리 → "Multiple GoTrueClient instances" 경고 제거
      },
    });
```

> `storageKey`만 다르게 주면 두 GoTrueClient가 서로 다른 키로 등록 → 충돌·경고 없음. 익명 클라는 세션 저장 안 하므로 키 값은 무의미하지만 '구분용'으로만 필요.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add lib/supabase/anon-client.ts && git commit -m "fix(v7): Supabase 익명 클라 storageKey 분리 → 'Multiple GoTrueClient' 경고 제거(1 Issue) (STEP 250)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 서버 재시작 + 하드 새로고침 후 좌하단 '1 Issue' 사라짐** (콘솔에 GoTrueClient 경고 없음)
- [ ] 로그인·채팅·종목 조회 등 Supabase 기능 정상(키만 분리, 동작 동일)

## 주의·예상 이슈
- dev 오버레이 카운트는 **서버 재시작·하드 새로고침** 후 갱신됨.
- 혹시 다른 경고가 또 있으면(다른 컴포넌트가 별도 클라 생성 등) 그건 별건 — 다시 콘솔 확인.
- **문서 TODO**(다음 갱신): STEP 248~250.

---
> STEP 250 = '1 Issue'(Multiple GoTrueClient) 해결. 전제 STEP 249.
> 이걸로 '틀 기능적 완성' 일단락(#2·#3·#4 ✅, #1 ETN·펀드는 외부 소스 대기).
