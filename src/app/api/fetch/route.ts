import { NextResponse } from "next/server";
import { insertItems } from "@/lib/db";
import { fetchClientReleases } from "@/lib/fetchers/client-releases";
import { fetchDevToolReleases } from "@/lib/fetchers/dev-tool-releases";
import { fetchBlogPosts } from "@/lib/fetchers/blog-posts";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const [clients, devTools, blogs] = await Promise.all([
      fetchClientReleases(),
      fetchDevToolReleases(),
      fetchBlogPosts(),
    ]);

    const allItems = [...clients, ...devTools, ...blogs];
    const inserted = insertItems(allItems);

    return NextResponse.json({
      fetched: allItems.length,
      inserted,
      breakdown: {
        clients: clients.length,
        devTools: devTools.length,
        blogs: blogs.length,
      },
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}
