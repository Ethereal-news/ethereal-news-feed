"use client";

import { useState, useEffect } from "react";
import { NewsItem as NewsItemType, Category, Status, CATEGORIES } from "@/lib/types";
import CategorySection from "./CategorySection";

interface DashboardProps {
  initialItems: NewsItemType[];
}

export default function Dashboard({ initialItems }: DashboardProps) {
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  async function handleStatusChange(id: number, status: Status) {
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
    }
  }

  async function handleCategoryChange(id: number, category: Category) {
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
    }
  }

  // Group items by category in the defined order
  const grouped = CATEGORIES.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-bold uppercase" style={{ color: "var(--black)" }}>No items yet</p>
        <p className="text-sm mt-1 font-medium" style={{ color: "var(--gray-dark)" }}>
          Click the Fetch button to load items from sources
        </p>
      </div>
    );
  }

  return (
    <div>
      {grouped.map(({ category, items }) => (
        <CategorySection
          key={category}
          category={category}
          items={items}
          onStatusChange={handleStatusChange}
          onCategoryChange={handleCategoryChange}
        />
      ))}
    </div>
  );
}
