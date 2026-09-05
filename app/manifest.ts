import type { MetadataRoute } from "next";

// PWA 홈 화면 설치(STEP 777 §3) — 설치·standalone·아이콘까지만(오프라인 캐시=서비스워커는 스코프 아님).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EarthTicker",
    short_name: "EarthTicker",
    // 2026-09-05(ORDER_트릴리언모델잔재정리_0905): "TR-AI 렌즈" 표기 제거 — 새 문구 창작 없이 최소 사실 문장으로.
    // 2026-09-06(ORDER_리브랜딩1단계_텍스트_0906): 브랜드명 Trillion→EarthTicker, 나머지 문장은 그대로.
    description: "세계의 주식 정보를, 한 곳에서 — 증권사 리포트로 보는 주식 정보",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#0A0A0A",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
