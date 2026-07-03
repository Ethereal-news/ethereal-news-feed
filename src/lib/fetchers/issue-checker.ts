import { XMLParser } from "fast-xml-parser";

const ETHEREAL_NEWS_RSS = "https://ethereal.news/rss.xml";

interface IssueInfo {
  url: string;
  title: string;
  links: Set<string>;
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove www. prefix, lowercase host
    const host = u.host.toLowerCase().replace(/^www\./, "");
    // Collapse duplicate slashes in path, remove trailing slash
    const pathname = u.pathname.replace(/\/+/g, "/").replace(/\/$/, "");
    let normalized = `${u.protocol}//${host}${pathname}${u.search}${u.hash}`;
    // Decode percent-encoding for comparison
    normalized = decodeURIComponent(normalized);
    return normalized;
  } catch {
    return url;
  }
}

export async function fetchLatestIssue(): Promise<IssueInfo | null> {
  try {
    // 1. Get latest issue URL from RSS
    const rssRes = await fetch(ETHEREAL_NEWS_RSS);
    if (!rssRes.ok) return null;

    const rssXml = await rssRes.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const data = parser.parse(rssXml) as {
      rss?: {
        channel?: {
          item?: Array<{ title: string; link: string }> | { title: string; link: string };
        };
      };
    };

    const items = data?.rss?.channel?.item;
    if (!items) return null;

    const latest = Array.isArray(items) ? items[0] : items;
    if (!latest?.link) return null;

    const issueUrl = latest.link;
    const issueTitle = latest.title;

    // 2. Fetch the issue page and extract all links
    const pageRes = await fetch(issueUrl);
    if (!pageRes.ok) return null;

    const html = await pageRes.text();

    // Extract all href URLs from the page
    const hrefRegex = /href="(https?:\/\/[^"]+)"/g;
    const links = new Set<string>();
    let match;
    while ((match = hrefRegex.exec(html)) !== null) {
      links.add(normalizeUrl(match[1]));
    }

    return { url: issueUrl, title: issueTitle, links };
  } catch {
    return null;
  }
}

// A normalized URL has a "real" path when something remains after the origin,
// e.g. https://host/news/post has a path but a bare https://host does not.
function hasPath(normalizedUrl: string): boolean {
  try {
    return new URL(normalizedUrl).pathname.replace(/\/+$/, "") !== "";
  } catch {
    return false;
  }
}

export function isUrlInIssue(itemUrl: string, issueLinks: Set<string>): boolean {
  const normalized = normalizeUrl(itemUrl);
  // Exact match
  if (issueLinks.has(normalized)) return true;
  // Check if any issue link is a sub-path of the item URL or vice versa
  // e.g. item: .../pull/11254, issue: .../pull/11254/changes
  // Only when the shorter (parent) URL has a real path — otherwise a bare
  // homepage link like https://metamask.io would match every article on the
  // domain, wrongly suppressing them.
  for (const link of issueLinks) {
    if (link.startsWith(normalized + "/") && hasPath(normalized)) return true;
    if (normalized.startsWith(link + "/") && hasPath(link)) return true;
  }
  return false;
}
