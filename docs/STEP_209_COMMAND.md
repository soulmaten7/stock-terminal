<!-- 2026-06-07 -->
# STEP 209 — 조회수 실제 증가 (방/채널 진입 시 +1, RPC 호출)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_209_COMMAND.md 파일 내용대로 실행해줘`

## 목표
방/채널 상세(`/room/{id}`) 진입 시 `view_count` +1 → 조회수·조회순 정렬이 진짜 의미 생김.
- **DB는 이미 적용됨**: `increment_room_view(uuid)` RPC(security definer, RLS 우회) — 운종 DB(`qxkmwlkchyxfzxbonhtj`)에 **Cowork이 MCP로 적용 완료**. 마이그레이션 파일 `supabase/migrations/024_room_view_increment.sql`도 생성됨(커밋만).
- 코드: `RoomDetailClient`에서 진입 시 1회 `supabase.rpc("increment_room_view", { p_room_id: id })` 호출.

## 전제 상태
- HEAD: STEP 208 상태 + 마이그레이션 024 **DB 적용 완료**
- 변경: `components/platform/RoomDetailClient.tsx`(effect 1개 추가) + `supabase/migrations/024_room_view_increment.sql`(커밋)

---

## 작업 1/1 — `RoomDetailClient.tsx` 조회수 +1 effect 추가

**찾기:**
```tsx
    load();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!room || !user) { setVote(null); return; }
```
**바꾸기:**
```tsx
    load();
    return () => { cancelled = true; };
  }, [id]);

  // 조회수 +1 (페이지 진입 시 1회, RPC — RLS 우회)
  useEffect(() => {
    createAnonClient().rpc("increment_room_view", { p_room_id: id });
  }, [id]);

  useEffect(() => {
    if (!room || !user) { setVote(null); return; }
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add supabase/migrations/024_room_view_increment.sql components/platform/RoomDetailClient.tsx && git commit -m "feat(db+v7): 리딩방/채널 조회수 +1 RPC(increment_room_view) + 진입 시 호출 (STEP 209)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 방/채널 상세 들어갔다 나와서 **새로고침하면 조회수(👁)가 1씩 늘어남**
- [ ] 홈 리딩방/채널 탭 **조회순** 정렬이 실제 조회수 반영
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 개발모드(React strict)에선 마운트 2회라 +2 될 수 있음 — 프로덕션은 +1(표준 카운터 특성).
- 표시 숫자는 진입 시점 값(증가는 다음 로드에 반영) — 정상.
- RPC는 익명도 호출 가능(조회수는 누구나). security definer라 RLS 우회.
- **문서 TODO**(다음 갱신): STEP 207~209 + 마이그레이션 024.
- 다음(순서대로): ② 채널 팔로워순(DB+유튜브) → ③ 종목상세 미세 폴리시.

---
> STEP 209 = 조회수 RPC. 전제 STEP 208+024. 다음: 채널 팔로워. 문서 묶어 갱신.
