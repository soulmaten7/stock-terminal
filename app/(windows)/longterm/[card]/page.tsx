import type { Metadata } from "next";
import { CardDetail } from "@/components/cards/CardDetail";

type Params = Promise<{ card: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { card } = await params;
  return {
    title: `장타창 / ${card}`,
    description: `운종 장타창 ${card} 디테일 페이지.`,
  };
}

export default async function LongtermCardDetailPage({ params }: { params: Params }) {
  const { card } = await params;
  return <CardDetail window="longterm" card={card} />;
}
