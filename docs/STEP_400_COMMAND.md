<!-- 2026-06-25 -->
# STEP 400 — 유튜브 주간 갱신 안전가드 (빈 테이블 사고 방지)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_400_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
주간 유튜브 갱신(`lib/youtube.ts`)이 **`delete(country=KR)` → `insert(rows)`** 순서라, YouTube API 실패·할당량 초과·부분 수집 시 **테이블이 비거나 몇 개만 남아** 유튜브 탭이 다음 갱신까지 빈약해짐. → **수집이 충분(≥30)할 때만 교체**하는 가드를 delete 직전에 추가. 부족하면 throw(크론 로그) + **기존 데이터 보존**.

## 전제
- 최신 main. 배포 X(배치). 서버 lib 변경 → 빌드로 타입 검증(로컬 실행 불필요, 실제 크론은 prod에서 동작).

---

## 1단계 — `lib/youtube.ts` 가드 추가

찾기:
```ts
  // 4) 한국 채널 전체 교체(delete → insert)
  const supabase = createAdminClient();
  await supabase.from("youtube_channels").delete().eq("country", "KR");
  const { error } = await supabase.from("youtube_channels").insert(rows);
  if (error) throw new Error(`DB insert 실패: ${error.message}`);
```

바꾸기:
```ts
  // 4) 한국 채널 전체 교체 — 수집이 충분할 때만(빈/부분 수집으로 테이블 비우는 사고 방지)
  if (rows.length < 30) {
    throw new Error(`수집 채널 ${rows.length}개로 너무 적음 — 기존 데이터 보존(교체 중단)`);
  }
  const supabase = createAdminClient();
  await supabase.from("youtube_channels").delete().eq("country", "KR");
  const { error } = await supabase.from("youtube_channels").insert(rows);
  if (error) throw new Error(`DB insert 실패: ${error.message}`);
```

## 2단계 — 빌드 + 로컬 커밋 (푸시·배포 X)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add lib/youtube.ts
git commit -m "fix(STEP 400): 유튜브 주간 갱신 안전가드(수집<30이면 보존) — 빈 테이블 사고 방지"
```

## 확인
- 빌드 통과(타입). 동작은 다음 주간 크론(또는 수동 호출) 시 적용 — 수집 부족하면 기존 100건 유지.
