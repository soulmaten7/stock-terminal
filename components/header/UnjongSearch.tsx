"use client";

import { Search } from "lucide-react";
import { useState } from "react";

export function UnjongSearch() {
  const [query, setQuery] = useState("");

  return (
    <div className="relative flex-1 max-w-xl">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted">
        <Search size={16} />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="종목·뉴스·공시 통합 검색  ·  Layer 5 에서 활성화"
        className="w-full rounded-md border border-unjong-border bg-unjong-background py-1.5 pl-9 pr-3 text-sm text-unjong-primary placeholder:text-unjong-muted focus:outline-none focus:border-unjong-accent transition-colors"
        aria-label="운종 통합 검색"
      />
    </div>
  );
}
