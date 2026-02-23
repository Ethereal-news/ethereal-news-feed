"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FetchButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleFetch() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/fetch", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        let msg = `Fetched ${data.fetched} items (${data.inserted} new): ${data.breakdown.clients} clients, ${data.breakdown.devTools} dev tools, ${data.breakdown.blogs} blogs, ${data.breakdown.eips} EIPs, ${data.breakdown.ercs} ERCs, ${data.breakdown.research} research`;
        if (data.issue) {
          if (data.issue.isNewIssue) {
            msg += ` | New issue detected.`;
          }
          msg += ` | ${data.issue.title}: ${data.issue.matched} linked`;
        }
        setResult(msg);
        router.refresh();
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch {
      setResult("Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleFetch}
        disabled={loading}
        className="px-5 py-2 text-sm font-bold uppercase text-white disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:translate-x-[2px] active:translate-y-[2px]"
        style={{
          background: "var(--blue)",
          border: "var(--border)",
          boxShadow: loading ? "none" : "var(--shadow)",
          transform: loading ? "translate(2px, 2px)" : undefined,
        }}
        onMouseEnter={(e) => {
          if (!loading) e.currentTarget.style.transform = "translate(-1px, -1px)";
        }}
        onMouseLeave={(e) => {
          if (!loading) e.currentTarget.style.transform = "";
        }}
      >
        {loading ? "Fetching..." : "Fetch"}
      </button>
      {result && (
        <span className="text-xs font-medium" style={{ color: "var(--gray-dark)" }}>{result}</span>
      )}
    </div>
  );
}
