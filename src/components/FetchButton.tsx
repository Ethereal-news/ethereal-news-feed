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
        setResult(
          `Fetched ${data.fetched} items (${data.inserted} new): ${data.breakdown.clients} clients, ${data.breakdown.devTools} dev tools, ${data.breakdown.blogs} blogs`
        );
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
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Fetching..." : "Fetch"}
      </button>
      {result && (
        <span className="text-sm text-slate-600">{result}</span>
      )}
    </div>
  );
}
