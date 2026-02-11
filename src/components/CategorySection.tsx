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
    <section className="mb-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 text-left mb-1.5"
      >
        <svg
          className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
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
        <h2 className="text-sm font-semibold text-slate-800">{category}</h2>
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
          {items.length}
        </span>
      </button>
      {!collapsed && (
        <div className="ml-5 space-y-1">
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
