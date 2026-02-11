"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { label: "Pending", value: "pending" },
  { label: "Included", value: "approved" },
  { label: "Excluded", value: "rejected" },
  { label: "All", value: "" },
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
    <div className="flex gap-1 rounded-lg bg-slate-100 p-1 mb-6">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => handleClick(tab.value)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            current === tab.value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
