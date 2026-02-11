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

export async function fetchNewERCs(): Promise<NewNewsItem[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "ethereal-news-feed",
    ...getAuthHeader(),
  };

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const res = await fetch(
      "https://api.github.com/repos/ethereum/ERCs/issues?labels=c-new&state=open&sort=created&direction=desc&per_page=30",
      { headers }
    );

    if (!res.ok) return [];

    const issues = (await res.json()) as GitHubIssue[];

    return issues
      .filter((issue) => issue.pull_request) // PRs only
      .filter((issue) => new Date(issue.created_at) >= sevenDaysAgo)
      .map((issue) => ({
        title: issue.title,
        url: issue.pull_request!.html_url,
        description: getDescription(issue.body || ""),
        source_type: "eip" as const,
        source_name: "ERCs",
        category: "Developers",
        published_at: issue.created_at,
      }));
  } catch {
    return [];
  }
}
