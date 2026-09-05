<!-- 2026-06-25 -->
# STEP 401 — 공모주 피드 빈결과/에러 캐시 (스크래핑 깨질 때 재시도 폭주 방지)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_401_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
`app/api/ipo/feed/route.ts`(38커뮤니케이션 스크래핑)는 **정상 결과만 1시간 캐시**하고, 빈 결과(`list.length===0`)·예외는 캐시 안 함 → 38.co.kr 마크업 변경/장애 시 **매 요청마다 8초 스크래핑 재시도**(지연 폭주). → 빈결과/에러도 **5분 캐시**해 폭주를 막고, 5분마다만 재시도.

## 전제
- 최신 main. 배포 X(배치). 서버 라우트 변경 → 빌드 타입검증.

---

## 1단계 — `app/api/ipo/feed/route.ts` 4곳 수정

### (A) 캐시 타입에 `empty` 추가
찾기:
```ts
let cache: { at: number; data: unknown } | null = null;
```
바꾸기:
```ts
let cache: { at: number; data: unknown; empty: boolean } | null = null;
```

### (B) 읽기 — 빈결과는 5분 TTL
찾기:
```ts
export async function GET() {
  if (cache && Date.now() - cache.at < 60 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }
```
바꾸기:
```ts
export async function GET() {
  // 정상 1h, 빈 결과 5m 캐시(스크래핑 깨졌을 때 매 요청 재시도 폭주 방지)
  if (cache && Date.now() - cache.at < (cache.empty ? 5 * 60 * 1000 : 60 * 60 * 1000)) {
    return NextResponse.json(cache.data);
  }
```

### (C) 성공 경로 — 항상 캐시(빈여부 기록)
찾기:
```ts
    if (list.length > 0) cache = { at: Date.now(), data };
```
바꾸기:
```ts
    cache = { at: Date.now(), data, empty: list.length === 0 };
```

### (D) 예외 경로 — 에러도 5분 캐시
찾기:
```ts
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) });
  }
```
바꾸기:
```ts
  } catch (e) {
    const data = { items: [], error: String(e) };
    cache = { at: Date.now(), data, empty: true };
    return NextResponse.json(data);
  }
```

## 2단계 — 빌드 + 로컬 커밋 (푸시·배포 X)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add app/api/ipo/feed/route.ts
git commit -m "fix(STEP 401): 공모주 피드 빈결과/에러 5분 캐시 — 스크래핑 장애 시 재시도 폭주 방지"
```

## 확인
- 빌드 통과(타입). 공모주 탭은 평소와 동일(정상 결과 1h 캐시), 38 장애 시에만 5분 캐시로 폭주 차단.
