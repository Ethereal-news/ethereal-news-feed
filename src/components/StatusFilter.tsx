"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { label: "Pending", value: "pending", color: "var(--yellow)", textColor: "var(--black)" },
  { label: "Included", value: "included" as const, color: "var(--green)", textColor: "var(--white)" },
  { label: "Excluded", value: "excluded" as const, color: "var(--red)", textColor: "var(--white)" },
  { label: "All", value: "", color: "var(--black)", textColor: "var(--white)" },
] as const;

export default function StatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") || "";

  function handleClick(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex gap-0 mb-6">
      {TABS.map((tab, i) => {
        const active = current === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => handleClick(tab.value)}
            className="px-4 py-2 text-sm font-bold uppercase transition-transform"
            style={{
              background: active ? tab.color : "var(--white)",
              color: active ? tab.textColor : "var(--black)",
              border: "var(--border)",
              marginLeft: i === 0 ? 0 : "-3px",
              boxShadow: active ? "var(--shadow-sm)" : "none",
              position: active ? "relative" : undefined,
              zIndex: active ? 1 : undefined,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
