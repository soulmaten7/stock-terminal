// STEP1050 — sectorSource 조인 키 수정 검증. Q1_ENABLED=true를 이 프로세스에만 오버라이드(파일 미수정)
// 하고 route.ts의 GET()을 직접 호출해 실제 API 응답에 sectorSource 값이 실리는지 확인한다.
// 🔴 읽기 전용 — DB 쓰기 0. Production 환경변수는 건드리지 않는다(이 스크립트 프로세스 안에서만 ON).
process.env.Q1_ENABLED = "true";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { GET } from "../app/api/q1/[symbol]/route";

const SYMBOLS = ["AAPL", "AAOI", "AAME", "CTO"]; // probe_1042가 쓴 표본과 동일

async function check(symbol: string) {
  const res = await GET(new Request(`http://x/api/q1/${symbol}`), { params: Promise.resolve({ symbol }) });
  const body = await res.json();
  console.log(`=== ${symbol} (status ${res.status}) ===`);
  console.log(JSON.stringify({ asOf: body.asOf, sector: body.sector, sectorSource: body.sectorSource, axes: body.axes }, null, 2));
}

async function main() {
  for (const s of SYMBOLS) await check(s);
}
main();
