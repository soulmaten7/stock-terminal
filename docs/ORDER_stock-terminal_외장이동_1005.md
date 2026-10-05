# 명령서 — stock-terminal 저장소를 외장하드(APFS 이미지)로 이동 (2026-10-05)

## 실행 방식

이 세션에서 직접, STEP 순서대로, 끝까지 한 번에 수행한다. STEP 사이에 사용자 확인을 기다리지 말고, 백그라운드 에이전트로 분리하지 마라. 판단이 필요한 지점은 이 명령서의 기본값으로 진행하고, 보고에 「판단 사항」으로 명시해라. 🔴 **STEP 3의 이동은 STEP 2 검증이 전부 통과한 뒤에만** 한다.

## 배경

- 사용자 규칙: 로컬 저장소는 전부 외장하드 `/Volumes/soulmaten`에 둔다. 현재 이 저장소(`~/stock-terminal`)만 내장 디스크에 남아 있다.
- 외장하드는 **exFAT**이라 심볼릭 링크·파일 권한을 지원하지 않는다. Node/Next.js 프로젝트는 `node_modules/.bin` 등 심볼릭 링크와 실행 권한에 의존하므로 exFAT에 직접 두면 깨진다.
- 해법: 외장하드 안에 **APFS 디스크 이미지(sparsebundle)** 를 만들어 마운트하고, 그 볼륨 안에 저장소를 둔다. 드라이브를 포맷하지 않고, 기존 데이터는 그대로 둔다.
- 2026-10-03에 `docs/probe_951_cache`(9.8G)를 `/Volumes/soulmaten/stock-terminal-cache/probe_951_cache`로 옮기고 심볼릭 링크로 연결해 둔 상태다. 이 링크는 절대경로라 저장소가 이동해도 그대로 유효해야 한다 — STEP 4에서 확인한다.

## 공통 규칙

- 답변에는 **이번에 실제로 연 파일·줄번호**를 적는다.
- 🔴 `.env.local` 등 비밀값은 어떤 형태로도 출력하지 마라. 파일이 함께 이동했는지는 **파일명·크기·키 개수**로만 확인한다.
- 🔴 이동 전 `git status`가 깨끗하고 push 안 된 커밋이 없어야 한다. 아니면 먼저 커밋·push한다.
- 🔴 삭제는 하지 않는다. 원래 위치는 STEP 3에서 **심볼릭 링크로 대체**한다(원본 폴더는 이동되므로 남지 않는다).

---

## STEP 1 — 사전 확인

- `df -h /Volumes/soulmaten` — 마운트 여부와 여유 공간. 마운트 안 돼 있으면 멈추고 보고.
- `du -sh ~/stock-terminal` — 현재 크기(10-03 정리 후 약 1.2G).
- `git status` / `git log origin/main..HEAD` — 미커밋·미push 확인.
- `~/stock-terminal` 안에서 **절대경로로 `/Users/maegbug/stock-terminal`을 가리키는 설정**이 있는지 검색(`.env.local`은 키 이름만, `.vercel/`, `.claude/settings.local.json`, `package.json` scripts, `supabase/config.toml`, launchd plist `~/Library/LaunchAgents/*` 중 이 저장소를 가리키는 것). 있으면 목록으로 보고하고 STEP 3에서 고친다.
- 실행 중인 `next dev`·`supabase` 프로세스가 있으면 멈추고 보고(이동 중 파일 잠김 방지).

---

## STEP 2 — APFS 이미지 생성·마운트·검증

### 2-1. 생성

```
hdiutil create -size 100g -type SPARSEBUNDLE -fs APFS -volname stock-terminal-apfs /Volumes/soulmaten/stock-terminal.sparsebundle
```

sparsebundle은 실제 쓴 만큼만 차지한다(100g는 상한). 외장하드 여유가 100g 미만이면 멈추고 보고.

### 2-2. 마운트

```
hdiutil attach /Volumes/soulmaten/stock-terminal.sparsebundle
```

마운트 경로(기본 `/Volumes/stock-terminal-apfs`)를 확인해 보고한다.

### 2-3. 검증 — 이게 통과해야 이동한다

마운트된 볼륨 안에 임시 폴더를 만들어:
- 심볼릭 링크 생성·추적(`ln -s` 후 `readlink`)
- 실행 권한 부여·유지(`chmod +x` 후 `ls -l`)
- 작은 `npm init -y && npm install` 로 `node_modules/.bin` 링크가 정상 생성되는지

셋 다 통과하면 임시 폴더를 지우고 STEP 3으로. 하나라도 실패하면 **이동하지 말고** 원인을 보고.

---

## STEP 3 — 이동

- `mv ~/stock-terminal /Volumes/stock-terminal-apfs/stock-terminal` (같은 물리 디스크가 아니므로 복사+삭제로 동작, 시간이 걸릴 수 있음).
- 이동 후 `ls -la /Volumes/stock-terminal-apfs/stock-terminal` 로 `.env.local`·`.git`·`.vercel`·`.claude` 등 숨김 항목이 같이 왔는지 확인(`.env.local`은 파일명·크기·키 개수만).
- 원래 자리에 링크: `ln -s /Volumes/stock-terminal-apfs/stock-terminal ~/stock-terminal` — 옛 경로를 쓰는 설정·습관이 깨지지 않게.
- STEP 1에서 찾은 절대경로 설정을 새 경로로 고친다.

---

## STEP 4 — 동작 확인

새 경로에서:
- `git status` 정상, `git remote -v` 그대로.
- `ls docs/probe_951_cache/ | head` — 10-03 링크가 외장 캐시를 그대로 가리키는지.
- `npm install` 후 `npm run build` 통과(이동으로 `node_modules` 링크가 깨졌을 수 있으니 재설치).
- `npm run dev` 기동 → 로컬 주소 응답 확인 → 종료.
- `supabase/`·`.vercel/` 관련 명령이 새 경로에서 프로젝트를 인식하는지(`vercel whoami` 수준, 배포는 하지 않음).

---

## STEP 5 — 재부팅 시 자동 마운트

sparsebundle은 재부팅 뒤 자동으로 안 붙는다. 로그인 시 자동 마운트되게 LaunchAgent 하나를 `~/Library/LaunchAgents/`에 만든다(`hdiutil attach` 실행, 외장하드가 아직 안 붙었으면 몇 초 간격으로 재시도 후 포기). 🔴 외장하드 자체가 자동 마운트 안 되는 문제(2026-09-27 `diskutil mount disk6s1`)는 별개이며 이 명령서 범위 밖이다 — 그 경우 사용자가 먼저 외장하드를 마운트해야 한다는 점을 보고에 적는다. 만든 LaunchAgent는 `launchctl load`로 즉시 등록하고 `launchctl list`로 확인한다.

---

## STEP 6 — 기록·커밋

- 저장소 안 문서(README 또는 개발 환경 문서)에 새 경로·마운트 절차·자동 마운트 LaunchAgent 위치를 적는다.
- `.claude/rules/`에 해당 규칙 파일이 있으면 "이 저장소는 `/Volumes/stock-terminal-apfs/stock-terminal`에 있으며 `~/stock-terminal`은 링크다"를 한 줄 추가.
- 기록해야 하는 문서를 전수 확인한다.
- 이 작업과 관련된 파일만 골라 커밋하고 push한다.

---

## 보고

STEP별로 연 파일·줄번호와 함께 보고한다. STEP 2-3의 **세 가지 검증 결과**, STEP 4의 **build·dev 기동 결과**, 그리고 **창2를 다시 켤 때 쓸 `cd` 경로 한 줄**을 반드시 적는다. 판단 사항은 따로 모아 적는다. 보고 항목명은 한글로 쓴다.
