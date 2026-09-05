<!-- 2026-07-09 -->
# STEP 672B — 🔬 VCI GitHub Actions 프로브 (Azure IP 도달성)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**목표:** VCI가 Vercel(데이터센터 IP)에선 소프트 차단(200+빈배열)됨. **GitHub Actions 러너(Azure IP)에선 VCI가 데이터를 주는지** 최소 워크플로우로 실측. 되면 → off-Vercel 크론(HNX/차단소스 전부에 쓸 패턴) 확정. 안 되면 → 폴백(로컬 맥/롤백).
**대상:** `.github/workflows/vci_probe.yml` (임시 워크플로우 1개).

> 이 STEP은 **코드/빌드 없음** — 프로브만. 결과 확인 후 Cowork가 본 크론 STEP 설계.

---

## 1. 워크플로우 파일 생성
`.github/workflows/vci_probe.yml`:
```yaml
name: VCI Probe
on:
  workflow_dispatch: {}
jobs:
  probe:
    runs-on: ubuntu-latest
    steps:
      - name: Probe VCI gap-chart (HNX SHS)
        run: |
          node --input-type=module -e '
          const to = Math.floor(Date.now()/1000);
          const r = await fetch("https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart", {
            method: "POST",
            headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0", "Referer": "https://trading.vietcap.com.vn/" },
            body: JSON.stringify({ timeFrame: "ONE_DAY", symbols: ["SHS"], to, countBack: 10 })
          });
          const t = await r.text();
          console.log("STATUS", r.status);
          console.log("LEN", t.length);
          console.log("BODY", t.slice(0, 500));
          '
```

## 2. 커밋·푸시 (기본 브랜치여야 Actions에 뜸)
```bash
git add .github/workflows/vci_probe.yml
git commit -m "chore: VCI GitHub Actions 도달성 프로브(임시)"
git push
```

## 3. 실행 + 로그 확인
**방법 A — gh CLI(설치·인증돼 있으면):**
```bash
gh workflow run vci_probe.yml
sleep 25
gh run list --workflow=vci_probe.yml --limit 1
gh run view --log $(gh run list --workflow=vci_probe.yml --limit 1 --json databaseId -q '.[0].databaseId')
```
**방법 B — GitHub UI:** 리포 → Actions 탭 → "VCI Probe" → Run workflow → 완료 후 로그 열기.

## 4. 판정
- **BODY에 OHLC 데이터**(`[{...,"c":[...]}]`) → ✅ **GitHub Actions IP는 VCI 통과** → off-Vercel 크론 가능. Cowork가 본 STEP(스케줄 워크플로우가 VCI 긁어 Supabase upsert) 설계.
- **BODY가 `[]` 또는 빈값** → ❌ GH도 차단 → 폴백(로컬 맥 크론 or Yahoo HOSE 롤백). Cowork 보고.

> 프로브 성공하면 이 임시 워크플로우는 본 크론으로 교체(또는 유지). 실패면 삭제.

## Cowork에게 보고
- STATUS·LEN·BODY 앞부분 (데이터 vs 빈배열).
→ 성공 시: Supabase 크레덴셜을 GitHub Secrets로(사용자가 등록) + 스케줄 워크플로우가 `vnPerf`(VCI) 실행→`vn_stock_perf` upsert 하는 본 STEP. 실패 시: VN을 HOSE(Yahoo)로 두고 HNX 보류 문서화.
