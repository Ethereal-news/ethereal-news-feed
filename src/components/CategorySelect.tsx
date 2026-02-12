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
      className="px-2 py-0.5 text-xs font-medium focus:outline-none cursor-pointer"
      style={{
        background: "var(--white)",
        color: "var(--black)",
        border: "2px solid var(--black)",
      }}
    >
      {CATEGORIES.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  );
}
