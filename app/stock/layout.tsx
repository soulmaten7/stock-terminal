import type { ReactNode } from "react";
import RightFixedNav from "@/components/layout/RightFixedNav";

export default function StockLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <RightFixedNav />
    </>
  );
}
