import { Suspense } from "react";
import RoomDetailClient from "@/components/platform/RoomDetailClient";

export const metadata = { title: "리딩방 평가 — 운종" };

type Props = { params: Promise<{ id: string }> };

export default async function RoomDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center">⏳ 로딩 중...</div>}>
      <RoomDetailClient id={id} />
    </Suspense>
  );
}
