import type { Metadata } from "next";
import { CardDetail } from "@/components/cards/CardDetail";

type Params = Promise<{ card: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { card } = await params;
  return {
    title: `한국주식 / ${card}`,
    description: `운종 한국주식 ${card} 디테일 페이지.`,
  };
}

export default async function KrCardDetailPage({ params }: { params: Params }) {
  const { card } = await params;
  return <CardDetail window="kr" card={card} />;
}
