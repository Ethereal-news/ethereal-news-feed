import { NextResponse } from "next/server";
import { insertItems, getAllItemUrls, markItemsInIssue, getDistinctIssueUrls } from "@/lib/db";
import { fetchClientReleases } from "@/lib/fetchers/client-releases";
import { fetchDevToolReleases } from "@/lib/fetchers/dev-tool-releases";
import { fetchBlogPosts } from "@/lib/fetchers/blog-posts";
import { fetchNewEIPs } from "@/lib/fetchers/eips";
import { fetchNewERCs } from "@/lib/fetchers/ercs";
import { fetchEthResearch } from "@/lib/fetchers/eth-research";
import { fetchLatestIssue, isUrlInIssue } from "@/lib/fetchers/issue-checker";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const [clients, devTools, blogs, eips, ercs, research, latestIssue] = await Promise.all([
      fetchClientReleases(),
      fetchDevToolReleases(),
      fetchBlogPosts(),
      fetchNewEIPs(),
      fetchNewERCs(),
      fetchEthResearch(),
      fetchLatestIssue(),
    ]);

    // Detect whether the latest issue is new (not yet seen in DB)
    let isNewIssue = false;
    if (latestIssue) {
      const knownIssueUrls = getDistinctIssueUrls();
      if (!knownIssueUrls.includes(latestIssue.url)) {
        isNewIssue = true;
      }
    }

    // Insert new items
    const allItems = [...clients, ...devTools, ...blogs, ...eips, ...ercs, ...research];
    const inserted = insertItems(allItems);

    // Check all items against the latest Ethereal news issue (URL matching)
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
        research: research.length,
      },
      issue: latestIssue
        ? { title: latestIssue.title, matched: issueMatched, isNewIssue }
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
