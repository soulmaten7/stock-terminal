<!-- 2026-07-07 -->
# STEP 636 — SEO ② sitemap 전 종목 확장

> **문제**: `app/sitemap.ts`가 정적 5개(홈·coin·about·terms·privacy)뿐 → 봇이 **수천 종목 페이지를 발견할 경로가 없음**. STEP 635로 종목 페이지가 검색용으로 좋아졌어도, 목록에 없으면 구글이 안 옴.
>
> **해결**: 6개국 전 종목 + 공개 페이지를 sitemap에 추가.
> - KR(한국시장 우선): `kr_stock_snapshot` 6자리 · priority 0.7 · daily
> - 해외(US/JP/CN/VN/GB): 번들 JSON `data/*_symbols.json` · priority 0.5 · weekly
> - 공개 페이지: 홈·coin·about·advertise·business·terms·privacy
> - 하루 1회 재생성(`revalidate=86400`)
>
> **규모**: 해외 19,038 + KR ~2,800 = **약 21,800 URL** (구글 단일 사이트맵 한도 5만 이하 → OK).
>
> **Cowork이 이미 함** (tsc EXIT=0): `app/sitemap.ts` 재작성 (KR 6자리는 보드 링크 `/stock/{6자리}`와 동일 형식 → canonical 중복 없음).
>
> **전제**: STEP 635(`ff7f95d`) 이후. 이 STEP은 **빌드 + 커밋만**.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error|sitemap" | head -12
```
- ✅ 기대: `Compiled successfully`. sitemap이 동적(ƒ)으로 잡혀도 정상(Supabase 조회 때문).

## 1) 변경 확인
```bash
cd ~/stock-terminal && git status --short | grep sitemap
```
- 기대: `M app/sitemap.ts`

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add app/sitemap.ts docs/STEP_636_COMMAND.md && git commit -m "seo(sitemap): 전 종목 확장 — KR 스냅샷+해외 번들 JSON 약 21.8k URL(정적 5개→전종목)" && git push
```

## 3) (배포 후) Cowork이 라이브 검증 — STEP 638에서
- `onetrillion.app/sitemap.xml` 열어 `<loc>.../stock/005930</loc>` 등 종목 URL 다수 존재 확인.

## ✅ 완료 시 → SEO ③ STEP 637: **홈 WebSite/Organization JSON-LD + 검색창**(구글이 사이트 엔티티 인식).
