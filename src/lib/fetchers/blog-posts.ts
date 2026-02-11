import { XMLParser } from "fast-xml-parser";
import { NewNewsItem } from "../types";
import { getDefaultCategory } from "../categories";

interface BlogFeed {
  name: string;
  url: string;
}

const BLOG_FEEDS: BlogFeed[] = [
  {
    name: "Ethereum Foundation Blog",
    url: "https://blog.ethereum.org/en/feed.xml",
  },
  {
    name: "Ethereum Cat Herders Blog",
    url: "https://medium.com/feed/ethereum-cat-herders",
  },
  {
    name: "Ethereum Remix Substack",
    url: "https://ethereumremix.substack.com/feed",
  },
  {
    name: "EthStaker Blog",
    url: "https://raw.githubusercontent.com/eth-educators/github-actions/refs/heads/main/_data/blog_data.xml",
  },
  { name: "ethPandaOps Blog", url: "https://ethpandaops.io/posts/rss.xml" },
  { name: "Vitalik Buterin Blog", url: "https://vitalik.eth.limo/feed.xml" },
  { name: "Solidity Blog", url: "https://www.soliditylang.org/feed.xml" },
  { name: "Josh Stark Blog", url: "https://api.paragraph.com/blogs/rss/@josh-stark" },
  { name: "Geodework Blog", url: "https://geode.build/feed.xml" },
  { name: "Argot Blog", url: "https://www.argot.org/feed.xml" },
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

async function fetchWithRedirects(
  url: string,
  maxRedirects = 5
): Promise<Response | null> {
  let currentUrl = url;
  for (let i = 0; i < maxRedirects; i++) {
    const res = await fetch(currentUrl, { redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return null;
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    return res;
  }
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, maxLength = 200): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

interface FeedEntry {
  title: string;
  url: string;
  description: string;
  published_at: string;
}

function parseRss2(data: Record<string, unknown>): FeedEntry[] {
  const channel = (data as { rss?: { channel?: unknown } })?.rss
    ?.channel as Record<string, unknown> | undefined;
  if (!channel) return [];

  const rawItems = channel.item;
  if (!rawItems) return [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items.map((item: Record<string, unknown>) => ({
    title: String(item.title || ""),
    url: String(item.link || ""),
    description: truncate(
      stripHtml(String(item.description || item["content:encoded"] || ""))
    ),
    published_at: new Date(
      String(item.pubDate || item["dc:date"] || "")
    ).toISOString(),
  }));
}

function parseAtom(data: Record<string, unknown>): FeedEntry[] {
  const feed = (data as { feed?: unknown })?.feed as Record<string, unknown> | undefined;
  if (!feed) return [];

  const rawEntries = feed.entry;
  if (!rawEntries) return [];
  const entries = Array.isArray(rawEntries) ? rawEntries : [rawEntries];

  return entries.map((entry: Record<string, unknown>) => {
    let url = "";
    const link = entry.link;
    if (Array.isArray(link)) {
      const alt = link.find(
        (l: Record<string, unknown>) =>
          l["@_rel"] === "alternate" || !l["@_rel"]
      ) as Record<string, unknown> | undefined;
      url = String(alt?.["@_href"] || link[0]?.["@_href"] || "");
    } else if (typeof link === "object" && link !== null) {
      url = String((link as Record<string, unknown>)["@_href"] || "");
    } else {
      url = String(link || "");
    }

    const content = entry.content;
    const summary = entry.summary;
    let description = "";
    if (typeof content === "object" && content !== null) {
      description = String(
        (content as Record<string, unknown>)["#text"] || ""
      );
    } else if (content) {
      description = String(content);
    } else if (typeof summary === "object" && summary !== null) {
      description = String(
        (summary as Record<string, unknown>)["#text"] || ""
      );
    } else if (summary) {
      description = String(summary);
    }

    return {
      title: typeof entry.title === "object"
        ? String((entry.title as Record<string, unknown>)["#text"] || "")
        : String(entry.title || ""),
      url,
      description: truncate(stripHtml(description)),
      published_at: new Date(
        String(entry.published || entry.updated || "")
      ).toISOString(),
    };
  });
}

function parseFeed(xml: string): FeedEntry[] {
  const data = parser.parse(xml) as Record<string, unknown>;

  // Try RSS 2.0 first
  if ((data as { rss?: unknown }).rss) {
    return parseRss2(data);
  }
  // Try Atom
  if ((data as { feed?: unknown }).feed) {
    return parseAtom(data);
  }

  return [];
}

async function fetchFeed(feed: BlogFeed): Promise<NewNewsItem[]> {
  try {
    const res = await fetchWithRedirects(feed.url);
    if (!res || !res.ok) return [];

    const xml = await res.text();
    const entries = parseFeed(xml);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return entries
      .filter((entry) => {
        const published = new Date(entry.published_at);
        return published >= sevenDaysAgo && !isNaN(published.getTime());
      })
      .map((entry) => ({
        title: entry.title,
        url: entry.url,
        description: entry.description,
        source_type: "blog_post" as const,
        source_name: feed.name,
        category: getDefaultCategory("blog_post"),
        published_at: entry.published_at,
      }));
  } catch {
    return [];
  }
}

export async function fetchBlogPosts(): Promise<NewNewsItem[]> {
  const results: NewNewsItem[] = [];

  for (const feed of BLOG_FEEDS) {
    const posts = await fetchFeed(feed);
    results.push(...posts);
    // Small delay between feeds to be polite
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}
