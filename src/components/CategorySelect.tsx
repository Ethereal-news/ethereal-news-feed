"use client";

import { CATEGORIES, Category } from "@/lib/types";

interface CategorySelectProps {
  value: Category;
  itemId: number;
  onChange: (itemId: number, category: Category) => void;
}

export default function CategorySelect({
  value,
  itemId,
  onChange,
}: CategorySelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(itemId, e.target.value as Category)}
      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
    >
      {CATEGORIES.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  );
}
