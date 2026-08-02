// STEP 868 — vitest는 tsconfig의 "@/*" 경로 별칭을 모른다.
// app/api/revdcf/route.test.ts가 route.ts를 import하면서 처음으로 "@/..."를 쓰는
// 테스트가 생겼고, 별칭 해석이 없어 즉시 실패했다. tsconfig.json의 "@/*" -> "./*"와 동일하게만 맞춘다.
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
