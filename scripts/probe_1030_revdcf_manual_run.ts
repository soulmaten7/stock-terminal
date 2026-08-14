// STEP 1030 — revdcf 프로덕션 크론 1회 수동 호출(장은태 승인). CRON_SECRET VALUE는 어디에도 출력하지 않는다.
// 🔴 STEP948의 401 실패 원인(.env.local의 큰따옴표를 셸 cut이 안 벗김)을 피하려고 Node dotenv 파싱을 그대로 재사용한다.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const PROD_URL = "https://onetrillion.app/api/cron/revdcf";

async function main() {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.log(JSON.stringify({ error: "CRON_SECRET not set in .env.local" }));
    process.exit(1);
  }
  console.log(JSON.stringify({ url: PROD_URL, secretLength: secret.length, startedAt: new Date().toISOString() }));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 340_000); // 340s > maxDuration(300s)
  const t0 = Date.now();
  try {
    const r = await fetch(PROD_URL, {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
      signal: controller.signal,
    });
    const elapsedMs = Date.now() - t0;
    const text = await r.text();
    console.log(JSON.stringify({ status: r.status, elapsedMs, bodyLength: text.length }));
    console.log("BODY_START");
    console.log(text);
    console.log("BODY_END");
  } catch (e) {
    const elapsedMs = Date.now() - t0;
    console.log(JSON.stringify({ error: String(e), elapsedMs }));
  } finally {
    clearTimeout(timeout);
  }
}
main();
