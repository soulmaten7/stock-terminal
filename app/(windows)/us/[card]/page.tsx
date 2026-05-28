import type { Metadata } from "next";
import { CardDetail } from "@/components/cards/CardDetail";

type Params = Promise<{ card: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { card } = await params;
  return {
    title: `미국주식창 / ${card}`,
    description: `운종 미국주식창 ${card} 디테일 페이지.`,
  };
}

export default async function UsCardDetailPage({ params }: { params: Params }) {
  const { card } = await params;
  return <CardDetail window="us" card={card} />;
}
