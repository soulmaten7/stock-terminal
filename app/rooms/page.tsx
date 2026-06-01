import { Suspense } from "react";
import RoomsClient from "@/components/platform/RoomsClient";

export const metadata = { title: "리딩방 디렉토리 — 운종" };

export default function RoomsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">⏳ 로딩 중...</div>}>
      <RoomsClient />
    </Suspense>
  );
}
