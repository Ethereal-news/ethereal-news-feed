interface GitHubRelease {
  tag_name: string;
  name: string;
  html_url: string;
  published_at: string;
  body: string;
  prerelease: boolean;
  draft: boolean;
}

export function getAuthHeader(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return {};

  if (token.startsWith("github_pat_")) {
    return { Authorization: `Bearer ${token}` };
  }
  return { Authorization: `token ${token}` };
}

export async function fetchRecentReleases(
  owner: string,
  repo: string
): Promise<GitHubRelease[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "ethereal-news-feed",
    ...getAuthHeader(),
  };

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases?per_page=10`,
      { headers }
    );

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        const { Authorization: _, ...noAuth } = headers;
        const retryRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/releases?per_page=10`,
          { headers: noAuth }
        );
        if (!retryRes.ok) return [];
        return findRecentReleases((await retryRes.json()) as GitHubRelease[]);
      }
      return [];
    }

    return findRecentReleases((await res.json()) as GitHubRelease[]);
  } catch {
    return [];
  }
}

function findRecentReleases(releases: GitHubRelease[]): GitHubRelease[] {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return releases.filter((release) => {
    if (release.draft) return false;
    return new Date(release.published_at) >= sevenDaysAgo;
  });
}

export function extractVersion(tagName: string): string {
  return tagName.replace(/^v/, "");
}

export function getDescription(body: string, maxLength = 200): string {
  if (!body) return "";
  // Take first paragraph, strip markdown
  const cleaned = body
    .split("\n\n")[0]
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trimEnd() + "...";
}

// Process repos in batches with delay to avoid rate limits
export async function batchFetch<T, R>(
  items: T[],
  fn: (item: T) => Promise<R[]>,
  batchSize = 10,
  delayMs = 200
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    for (const r of batchResults) {
      results.push(...r);
    }
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
