"use client";

import { NewsItem as NewsItemType, Category, Status } from "@/lib/types";
import CategorySelect from "./CategorySelect";

interface NewsItemProps {
  item: NewsItemType;
  onStatusChange: (id: number, status: Status) => void;
  onCategoryChange: (id: number, category: Category) => void;
  onIssueUrlChange: (id: number, issueUrl: string | null) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function extractIssueLabel(url: string): string {
  // e.g. https://ethereal.news/ethereal-news-weekly-10 -> #10
  const match = url.match(/(\d+)\/?$/);
  return match ? `#${match[1]}` : "issue";
}

export default function NewsItem({
  item,
  onStatusChange,
  onCategoryChange,
  onIssueUrlChange,
}: NewsItemProps) {
  function handleSetIssueUrl() {
    const url = prompt("Ethereal news issue URL:", item.issue_url || "");
    if (url !== null) {
      onIssueUrlChange(item.id, url || null);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
        <span>
          {formatDate(item.published_at)} &middot; {item.source_name}
        </span>
        {item.prerelease && (
          <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
            pre-release
          </span>
        )}
        {item.issue_url && (
          <a
            href={item.issue_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
              <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
              <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 005.656 5.656l3-3a4 4 0 00-.225-5.865z" />
            </svg>
            {extractIssueLabel(item.issue_url)}
          </a>
        )}
      </div>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-slate-900 hover:text-indigo-600 transition-colors"
      >
        {item.title}
      </a>
      {item.description && (
        <p className="mt-1 text-sm text-slate-500 line-clamp-2">
          {item.description}
        </p>
      )}
      <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3">
        <button
          onClick={() => onStatusChange(item.id, "approved")}
          title="Approve"
          className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
            item.status === "approved"
              ? "bg-green-100 text-green-600"
              : "text-slate-300 hover:bg-green-50 hover:text-green-600"
          }`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          onClick={() => onStatusChange(item.id, "rejected")}
          title="Reject"
          className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
            item.status === "rejected"
              ? "bg-red-100 text-red-600"
              : "text-slate-300 hover:bg-red-50 hover:text-red-600"
          }`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
        <button
          onClick={() => onStatusChange(item.id, "pending")}
          title="Pending"
          className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
            item.status === "pending"
              ? "bg-amber-100 text-amber-600"
              : "text-slate-300 hover:bg-amber-50 hover:text-amber-600"
          }`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 .75.75 0 011.06 1.06zM10 15a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <CategorySelect
          value={item.category}
          itemId={item.id}
          onChange={onCategoryChange}
        />
        <button
          onClick={handleSetIssueUrl}
          title={item.issue_url ? "Edit issue link" : "Link to issue"}
          className={`ml-auto flex h-7 w-7 items-center justify-center rounded transition-colors ${
            item.issue_url
              ? "bg-indigo-100 text-indigo-600"
              : "text-slate-300 hover:bg-slate-100 hover:text-slate-500"
          }`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
            <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 005.656 5.656l3-3a4 4 0 00-.225-5.865z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
