import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BusinessClaimClient from "@/components/business/BusinessClaimClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "내 업체·리딩방 관리" };

export default async function BusinessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-unjong-primary">내 업체·리딩방 관리</h1>
      <p className="mb-6 text-sm leading-relaxed text-unjong-muted">
        금감원에 유사투자자문 신고된 업체만 게재할 수 있어요. 본인 업체를 찾아 인증을 신청하면, 관리자 확인 후 직접 리딩방·채널 링크를 관리할 수 있습니다.
      </p>
      <BusinessClaimClient />
    </div>
  );
}
