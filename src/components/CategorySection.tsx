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
    <section className="mb-5">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 text-left mb-2"
      >
        <svg
          className={`h-3 w-3 transition-transform ${collapsed ? "" : "rotate-90"}`}
          style={{ color: "var(--black)" }}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={3}
          stroke="currentColor"
        >
          <path
            strokeLinecap="square"
            strokeLinejoin="miter"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
        <h2 className="text-sm font-black uppercase" style={{ letterSpacing: "-0.02em" }}>
          {category}
        </h2>
        <span
          className="px-2 py-0.5 text-[10px] font-bold"
          style={{
            background: "var(--gray)",
            border: "2px solid var(--black)",
          }}
        >
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
