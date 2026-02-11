import { NewNewsItem } from "../types";
import { getDefaultCategory } from "../categories";
import { getAuthHeader, getDescription } from "./github";

interface GitHubIssue {
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  body: string;
  pull_request?: { html_url: string };
}

export async function fetchNewEIPs(): Promise<NewNewsItem[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "ethereal-news-feed",
    ...getAuthHeader(),
  };

  try {
    // The /pulls endpoint doesn't support label filtering,
    // use /issues with labels param (PRs are a subset of issues)
    const res = await fetch(
      "https://api.github.com/repos/ethereum/EIPs/issues?labels=c-new&state=open&sort=created&direction=desc&per_page=30",
      { headers }
    );

    if (!res.ok) return [];

    const issues = (await res.json()) as GitHubIssue[];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return issues
      .filter((issue) => issue.pull_request) // PRs only
      .filter((issue) => new Date(issue.created_at) >= sevenDaysAgo)
      .map((issue) => ({
        title: issue.title,
        url: issue.pull_request!.html_url,
        description: getDescription(issue.body || ""),
        source_type: "eip" as const,
        source_name: "EIPs",
        category: getDefaultCategory("eip"),
        published_at: issue.created_at,
      }));
  } catch {
    return [];
  }
}
