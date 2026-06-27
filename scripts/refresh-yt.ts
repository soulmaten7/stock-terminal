// 일회성: 유튜브 Top100 재수집(+정리된 description 저장). 실행: npx tsx scripts/refresh-yt.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { refreshYoutubeTop100 } = await import("../lib/youtube");
  const r = await refreshYoutubeTop100();
  console.log("✅ 유튜브 갱신:", r);
}
main().then(() => process.exit(0)).catch((e) => { console.error("❌ 실패:", e); process.exit(1); });
