"use client";

import { useState } from "react";
import { NewsItem as NewsItemType, Category, Status } from "@/lib/types";
import NewsItem from "./NewsItem";

interface CategorySectionProps {
  category: Category;
  items: NewsItemType[];
  onStatusChange: (id: number, status: Status) => void;
  onCategoryChange: (id: number, category: Category) => void;
}

export default function CategorySection({
  category,
  items,
  onStatusChange,
  onCategoryChange,
}: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 text-left mb-3"
      >
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${
            collapsed ? "" : "rotate-90"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
        <h2 className="text-lg font-semibold text-slate-800">{category}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {items.length}
        </span>
      </button>
      {!collapsed && (
        <div className="ml-6 space-y-3">
          {items.map((item) => (
            <NewsItem
              key={item.id}
              item={item}
              onStatusChange={onStatusChange}
              onCategoryChange={onCategoryChange}
            />
          ))}
        </div>
      )}
    </section>
  );
}
