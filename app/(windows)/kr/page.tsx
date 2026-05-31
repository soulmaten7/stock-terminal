import type { Metadata } from "next";
import { KrCards } from "@/components/cards/KrCards";

export const metadata: Metadata = {
  title: "한국주식 — 운종",
  description:
    "운종 한국주식 — Movers · Volume · NetBuy · 단타공시 · 장타공시. " +
    "정확도 보장되는 핵심 시그널만.",
};

export default function KrPage() {
  return <KrCards />;
}
