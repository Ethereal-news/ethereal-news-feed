import { XMLParser } from "fast-xml-parser";
import { Category, NewNewsItem } from "../types";
import { getDefaultCategory } from "../categories";

interface BlogFeed {
  name: string;
  url: string;
  // Some feeds list entry links on a domain that differs from where the feed
  // itself is hosted; rewrite those links to a reachable host.
  rewriteUrl?: (url: string) => string;
}

const BLOG_FEEDS: BlogFeed[] = [
  {
    name: "Ethereum Foundation Blog",
    url: "https://blog.ethereum.org/feed.xml",
  },
  {
    name: "ECH",
    url: "https://blog.echinstitute.org/feed.xml",
  },
  {
    name: "Ethereum Remix Substack",
    url: "https://ethereumremix.substack.com/feed",
  },
  {
    name: "EthStaker Blog",
    url: "https://api.paragraph.com/blogs/rss/@ethstaker",
  },
  { name: "ethPandaOps Blog", url: "https://ethpandaops.io/posts/rss.xml" },
  {
    name: "Vitalik Buterin Blog",
    url: "https://vitalik.eth.limo/feed.xml",
    // The feed links entries to vitalik.ca, which no longer resolves for web
    // traffic (MX records only); the eth.limo mirror serves the same paths.
    rewriteUrl: (u) =>
      u.replace("https://vitalik.ca/", "https://vitalik.eth.limo/"),
  },
  { name: "Solidity Blog", url: "https://www.soliditylang.org/feed.xml" },
  { name: "Josh Stark Blog", url: "https://api.paragraph.com/blogs/rss/@josh-stark" },
  { name: "Geodework Blog", url: "https://geode.build/feed.xml" },
  { name: "Argot Blog", url: "https://www.argot.org/feed.xml" },
  // The site advertises this feed on its news pages; the conventional
  // feed.xml/rss.xml paths 404. Covers the whole MetaMask blog.
  { name: "MetaMask Blog", url: "https://metamask.io/news-rss.xml" },
  { name: "zkEVM Blog", url: "https://zkevm.ethereum.foundation/feed.xml" },
  { name: "PQ Ethereum Blog", url: "https://pq.ethereum.org/feed.xml" },
  { name: "Protocol Support Blog", url: "https://ps.ethereum.foundation/feed.xml" },
  { name: "Sourcify Blog", url: "https://docs.sourcify.dev/blog/rss.xml" },
  { name: "Erigon Blog", url: "https://erigon.tech/feed.xml" },
  { name: "Sigma Prime Blog", url: "https://blog.sigmaprime.io/feeds/all.atom.xml" },
  { name: "ChainSafe Blog", url: "https://blog.chainsafe.io/rss/" },
  { name: "ApeWorX Blog", url: "https://api.paragraph.com/blogs/rss/@apeworx" },
  {
    name: "Vyper Blog",
    url: "https://blog.vyperlang.org/index.xml",
    // The Hugo site's baseURL is misconfigured, so item <link>s come through
    // as relative paths (e.g. "/posts/selector-tables/"); prefix the host so
    // the URLs we store are absolute.
    rewriteUrl: (u) =>
      u.startsWith("/") ? `https://blog.vyperlang.org${u}` : u,
  },
];

const SCRAPED_BLOGS: ScrapedBlog[] = [
  {
    name: "Protocol Consensus Blog",
    listUrl: "https://consensus.ethereum.foundation/blog",
    baseUrl: "https://consensus.ethereum.foundation",
    category: "Layer 1",
    parse: parseConsensusBlog,
  },
  {
    name: "PSE Blog",
    listUrl: "https://pse.dev/blog",
    baseUrl: "https://pse.dev",
    parse: parsePseBlog,
  },
  {
    // The site advertises an Atom feed at /atom.xml in <head>, but that URL
    // 404s (Zola template ships the link without enabling feed generation),
    // so we scrape the post list off the homepage instead.
    name: "Fe Blog",
    listUrl: "https://blog.fe-lang.org/",
    baseUrl: "https://blog.fe-lang.org",
    parse: parseFeBlog,
  },
  {
    // This Astro site ships no RSS feed (feed.xml and every common feed path
    // 404), so we scrape the post list off the blog index.
    name: "IPTF Blog",
    listUrl: "https://iptf.ethereum.org/blog/",
    baseUrl: "https://iptf.ethereum.org",
    parse: parseIptfBlog,
  },
];

// Posts dated at midnight UTC would otherwise be cut off by hours when the
// fetcher runs later in the day, so floor the cutoff to the start of the day.
function getRecentCutoff(): Date {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 7);
  cutoff.setUTCHours(0, 0, 0, 0);
  return cutoff;
}

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

async function fetchFeed(feed: BlogFeed, retries = 2): Promise<NewNewsItem[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithRedirects(feed.url);
      if (!res || !res.ok) {
        if (attempt < retries) {
          console.warn(`[blog-posts] ${feed.name}: HTTP ${res?.status ?? 'no response'}, retrying (${attempt + 1}/${retries})`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        console.error(`[blog-posts] ${feed.name}: failed after ${retries + 1} attempts`);
        return [];
      }

      const xml = await res.text();
      const entries = parseFeed(xml);

      const cutoff = getRecentCutoff();

      return entries
        .filter((entry) => {
          const published = new Date(entry.published_at);
          return published >= cutoff && !isNaN(published.getTime());
        })
        .map((entry) => ({
          title: entry.title,
          url: feed.rewriteUrl ? feed.rewriteUrl(entry.url) : entry.url,
          description: entry.description,
          source_type: "blog_post" as const,
          source_name: feed.name,
          category: getDefaultCategory("blog_post"),
          published_at: entry.published_at,
        }));
    } catch (err) {
      if (attempt < retries) {
        console.warn(`[blog-posts] ${feed.name}: ${err instanceof Error ? err.message : 'unknown error'}, retrying (${attempt + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      console.error(`[blog-posts] ${feed.name}: failed after ${retries + 1} attempts:`, err instanceof Error ? err.message : err);
      return [];
    }
  }
  return [];
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

interface ScrapedEntry {
  href: string;
  title: string;
  description: string;
  published: Date;
}

interface ScrapedBlog {
  name: string;
  listUrl: string;
  baseUrl: string;
  category?: Category;
  parse: (html: string) => ScrapedEntry[];
}

function parseConsensusBlog(html: string): ScrapedEntry[] {
  const itemRegex = /<div class="blog-list-item"><a href="([^"]+)"><div class="blog-list-item-date">([^<]+)<\/div><div class="blog-list-item-title">([^<]+)<\/div><div class="blog-list-item-excerpt">([^<]+)<\/div>/g;

  const entries: ScrapedEntry[] = [];
  let match;
  while ((match = itemRegex.exec(html)) !== null) {
    const [, href, dateStr, title, excerpt] = match;
    entries.push({
      href,
      title: decodeEntities(title),
      description: decodeEntities(excerpt),
      published: new Date(dateStr),
    });
  }
  return entries;
}

function parsePseBlog(html: string): ScrapedEntry[] {
  // Each post card opens with <a class="group flex flex-col gap-4" href="/blog/SLUG">.
  // Inside: a date <span class="text-xs ... uppercase ...">May 8, 2026</span>,
  // a title <a class="font-display ..." href="/blog/SLUG">Title</a>,
  // and an optional excerpt <span class="text-sm font-san font-normal ...">Excerpt</span>.
  const cardOpen = /<a class="group[^"]*" href="(\/blog\/[a-z0-9-]+)"/g;
  const dateRe = /<span class="text-xs[^"]*uppercase[^"]*">([^<]+)<\/span>/;
  const titleRe = /<a class="font-display[^"]*" href="\/blog\/[^"]+">([^<]+)<\/a>/;
  const excerptRe = /<span class="text-sm font-san[^"]*">([^<]+)<\/span>/;

  const entries: ScrapedEntry[] = [];
  const seen = new Set<string>();
  let m;
  while ((m = cardOpen.exec(html)) !== null) {
    const href = m[1];
    if (seen.has(href)) continue;
    seen.add(href);

    // Look at the chunk after this card open, bounded by the next card open
    // (or 4 KB, whichever is shorter — enough to cover one card).
    const start = m.index;
    const next = html.indexOf('<a class="group', start + 1);
    const chunk = html.slice(start, next === -1 ? start + 4000 : next);

    const dateMatch = chunk.match(dateRe);
    const titleMatch = chunk.match(titleRe);
    if (!dateMatch || !titleMatch) continue;

    const excerptMatch = chunk.match(excerptRe);
    entries.push({
      href,
      title: decodeEntities(titleMatch[1]),
      description: excerptMatch ? decodeEntities(excerptMatch[1]) : "",
      // "May 8, 2026" parses as local midnight; force UTC so the cutoff
      // comparison doesn't drift by the server's timezone offset.
      published: new Date(`${dateMatch[1]} UTC`),
    });
  }
  return entries;
}

function parseFeBlog(html: string): ScrapedEntry[] {
  // Each post in the Zola list template renders as:
  //   <section class="list-item">
  //     <h1 class="title"><a href=URL>Title</a></h1>     ← href is unquoted
  //     <time>YYYY-MM-DD</time>                          ← entities like &#x2F;
  //     ...
  //   </section>
  const itemRegex = /<section class="list-item">[\s\S]*?<h1 class="title">\s*<a href=["']?([^"'\s>]+)["']?>([^<]+)<\/a>[\s\S]*?<time>(\d{4}-\d{2}-\d{2})<\/time>/g;

  const entries: ScrapedEntry[] = [];
  let match;
  while ((match = itemRegex.exec(html)) !== null) {
    const [, rawHref, title, dateStr] = match;
    entries.push({
      href: decodeEntities(rawHref),
      title: decodeEntities(title),
      description: "",
      // Append T00:00:00Z so the date is parsed as UTC midnight rather than
      // local time, keeping the cutoff comparison timezone-independent.
      published: new Date(`${dateStr}T00:00:00Z`),
    });
  }
  return entries;
}

function parseIptfBlog(html: string): ScrapedEntry[] {
  // Astro blog list: each post is a single anchor row —
  //   <a href="/blog/SLUG/" class="post-row">
  //     <div class="post-thumb"><img ...></div>
  //     <div class="post-body">
  //       <div class="post-meta"><time>YYYY-MM-DD</time><span>· Author</span></div>
  //       <h3>Title</h3>
  //       <p>Excerpt</p>
  //     </div>
  //   </a>
  // The data-astro-cid-* attributes carry a per-build hash, so match loosely.
  const rowOpen = /<a href="(\/blog\/[a-z0-9-]+)\/?"[^>]*class="post-row"/g;
  const dateRe = /<time[^>]*>(\d{4}-\d{2}-\d{2})<\/time>/;
  const titleRe = /<h3[^>]*>([^<]+)<\/h3>/;
  const excerptRe = /<p[^>]*>([^<]+)<\/p>/;

  const entries: ScrapedEntry[] = [];
  let m;
  while ((m = rowOpen.exec(html)) !== null) {
    const href = m[1];
    // Bound the chunk to this row by stopping at the next row's anchor.
    const start = m.index;
    const next = html.indexOf('<a href="/blog/', start + m[0].length);
    const chunk = html.slice(start, next === -1 ? start + 4000 : next);

    const dateMatch = chunk.match(dateRe);
    const titleMatch = chunk.match(titleRe);
    if (!dateMatch || !titleMatch) continue;

    const excerptMatch = chunk.match(excerptRe);
    entries.push({
      href,
      title: decodeEntities(titleMatch[1].trim()),
      description: excerptMatch ? decodeEntities(excerptMatch[1].trim()) : "",
      // Append T00:00:00Z so the date is parsed as UTC midnight rather than
      // local time, keeping the cutoff comparison timezone-independent.
      published: new Date(`${dateMatch[1]}T00:00:00Z`),
    });
  }
  return entries;
}

async function scrapeBlog(blog: ScrapedBlog, retries = 2): Promise<NewNewsItem[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithRedirects(blog.listUrl);
      if (!res || !res.ok) {
        if (attempt < retries) {
          console.warn(`[blog-posts] ${blog.name}: HTTP ${res?.status ?? 'no response'}, retrying (${attempt + 1}/${retries})`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        console.error(`[blog-posts] ${blog.name}: failed after ${retries + 1} attempts`);
        return [];
      }

      const html = await res.text();
      const cutoff = getRecentCutoff();

      return blog.parse(html)
        .filter((entry) => !isNaN(entry.published.getTime()) && entry.published >= cutoff)
        .map((entry) => ({
          title: entry.title,
          url: new URL(entry.href, blog.baseUrl).toString(),
          description: truncate(entry.description),
          source_type: "blog_post" as const,
          source_name: blog.name,
          category: blog.category ?? getDefaultCategory("blog_post"),
          published_at: entry.published.toISOString(),
        }));
    } catch (err) {
      if (attempt < retries) {
        console.warn(`[blog-posts] ${blog.name}: ${err instanceof Error ? err.message : 'unknown error'}, retrying (${attempt + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      console.error(`[blog-posts] ${blog.name}: failed after ${retries + 1} attempts:`, err instanceof Error ? err.message : err);
      return [];
    }
  }
  return [];
}

export async function fetchBlogPosts(): Promise<NewNewsItem[]> {
  const results: NewNewsItem[] = [];

  for (const feed of BLOG_FEEDS) {
    const posts = await fetchFeed(feed);
    results.push(...posts);
    // Small delay between feeds to be polite
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  for (const blog of SCRAPED_BLOGS) {
    const posts = await scrapeBlog(blog);
    results.push(...posts);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}
