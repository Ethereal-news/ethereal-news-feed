import { NextResponse } from "next/server";
import { insertItems, getAllItemUrls, markItemsInIssue } from "@/lib/db";
import { fetchClientReleases } from "@/lib/fetchers/client-releases";
import { fetchDevToolReleases } from "@/lib/fetchers/dev-tool-releases";
import { fetchBlogPosts } from "@/lib/fetchers/blog-posts";
import { fetchNewEIPs } from "@/lib/fetchers/eips";
import { fetchNewERCs } from "@/lib/fetchers/ercs";
import { fetchLatestIssue, isUrlInIssue } from "@/lib/fetchers/issue-checker";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const [clients, devTools, blogs, eips, ercs, latestIssue] = await Promise.all([
      fetchClientReleases(),
      fetchDevToolReleases(),
      fetchBlogPosts(),
      fetchNewEIPs(),
      fetchNewERCs(),
      fetchLatestIssue(),
    ]);

    const allItems = [...clients, ...devTools, ...blogs, ...eips, ...ercs];
    const inserted = insertItems(allItems);

    // Check all items against the latest Ethereal news issue
    let issueMatched = 0;
    if (latestIssue) {
      const allUrls = getAllItemUrls();
      const matchingUrls = allUrls.filter((url) =>
        isUrlInIssue(url, latestIssue.links)
      );
      issueMatched = markItemsInIssue(latestIssue.url, matchingUrls);
    }

    return NextResponse.json({
      fetched: allItems.length,
      inserted,
      breakdown: {
        clients: clients.length,
        devTools: devTools.length,
        blogs: blogs.length,
        eips: eips.length,
        ercs: ercs.length,
      },
      issue: latestIssue
        ? { title: latestIssue.title, matched: issueMatched }
        : null,
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}
