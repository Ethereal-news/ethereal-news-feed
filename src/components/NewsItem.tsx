"use client";

import { NewsItem as NewsItemType, Category, Status } from "@/lib/types";
import CategorySelect from "./CategorySelect";

interface NewsItemProps {
  item: NewsItemType;
  onStatusChange: (id: number, status: Status) => void;
  onCategoryChange: (id: number, category: Category) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function extractIssueLabel(url: string): string {
  const match = url.match(/(\d+)\/?$/);
  return match ? `#${match[1]}` : "issue";
}

function isOlderThan7Days(dateStr: string): boolean {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return new Date(dateStr) < sevenDaysAgo;
}

export default function NewsItem({
  item,
  onStatusChange,
  onCategoryChange,
}: NewsItemProps) {
  const stale = !!item.issue_url || isOlderThan7Days(item.published_at);

  return (
    <div
      className={`px-3 py-1.5 ${stale ? "opacity-40" : ""}`}
      style={{
        background: "var(--white)",
        border: "2px solid var(--black)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0">
          <button
            onClick={() => onStatusChange(item.id, "included")}
            title="Include"
            className="flex h-6 w-6 items-center justify-center transition-colors"
            style={{
              background: item.status === "included" ? "var(--green)" : "transparent",
              color: item.status === "included" ? "var(--white)" : "var(--gray)",
              border: item.status === "included" ? "2px solid var(--black)" : "2px solid transparent",
            }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => onStatusChange(item.id, "excluded")}
            title="Exclude"
            className="flex h-6 w-6 items-center justify-center transition-colors"
            style={{
              background: item.status === "excluded" ? "var(--red)" : "transparent",
              color: item.status === "excluded" ? "var(--white)" : "var(--gray)",
              border: item.status === "excluded" ? "2px solid var(--black)" : "2px solid transparent",
            }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
          <button
            onClick={() => onStatusChange(item.id, "pending")}
            title="Pending"
            className="flex h-6 w-6 items-center justify-center transition-colors"
            style={{
              background: item.status === "pending" ? "var(--yellow)" : "transparent",
              color: item.status === "pending" ? "var(--black)" : "var(--gray)",
              border: item.status === "pending" ? "2px solid var(--black)" : "2px solid transparent",
            }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 .75.75 0 011.06 1.06zM10 15a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sm truncate transition-colors"
          style={{ color: "var(--black)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--blue)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--black)"; }}
        >
          <span className="text-xs font-bold uppercase" style={{ color: "var(--gray-dark)" }}>{item.source_name}:</span>{" "}
          {item.title}
        </a>
        <span className="ml-auto flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-medium" style={{ color: "var(--gray-dark)" }}>
            {formatDate(item.published_at)}
          </span>
          {item.prerelease && (
            <span
              className="px-1.5 py-0.5 text-[10px] font-bold text-white"
              style={{ background: "var(--purple)", border: "2px solid var(--black)" }}
            >
              PRE
            </span>
          )}
          {item.issue_url && (
            <a
              href={item.issue_url}
              target="_blank"
              rel="noopener noreferrer"
              title={`In ${extractIssueLabel(item.issue_url)}`}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-white transition-colors"
              style={{ background: "var(--blue)", border: "2px solid var(--black)" }}
            >
              {extractIssueLabel(item.issue_url)}
            </a>
          )}
          <CategorySelect
            value={item.category}
            itemId={item.id}
            onChange={onCategoryChange}
          />
        </span>
      </div>
    </div>
  );
}
