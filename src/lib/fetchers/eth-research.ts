import { execSync } from "child_process";
import { XMLParser } from "fast-xml-parser";
import { NewNewsItem, Category } from "../types";

interface DiscourseSource {
  name: string;
  url: string;
  category: Category;
}

const DISCOURSE_FEEDS: DiscourseSource[] = [
  { name: "Eth Research", url: "https://ethresear.ch/latest.rss", category: "Research" },
  { name: "Eth Magicians", url: "https://ethereum-magicians.org/latest.rss", category: "Layer 1" },
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

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

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  "dc:creator"?: string;
}

async function fetchRss(url: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch {
    // Fallback to curl (works around WSL2 networking issues)
    return execSync(`curl -s --connect-timeout 10 ${url}`, { encoding: "utf8" });
  }
}

async function fetchDiscourse(source: DiscourseSource): Promise<NewNewsItem[]> {
  try {
    console.log(`Fetching ${source.name} from ${source.url}...`);
    const xml = await fetchRss(source.url);

    const data = parser.parse(xml) as {
      rss?: { channel?: { item?: RssItem[] | RssItem } };
    };

    const channel = data?.rss?.channel;
    if (!channel?.item) return [];

    const items = Array.isArray(channel.item) ? channel.item : [channel.item];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log(`${source.name}: ${items.length} total items in feed`);

    return items
      .filter((item) => {
        const published = new Date(item.pubDate);
        if (published < sevenDaysAgo || isNaN(published.getTime())) return false;
        // Only top-level topics (URLs end with /t/slug/id, not /t/slug/id/postnum)
        const url = String(item.link || "");
        if (/\/t\/[^/]+\/\d+\/\d+/.test(url)) return false;
        return true;
      })
      .map((item) => ({
        title: String(item.title || ""),
        url: String(item.link || ""),
        description: truncate(stripHtml(String(item.description || ""))),
        source_type: "research" as const,
        source_name: source.name,
        category: source.category,
        published_at: new Date(item.pubDate).toISOString(),
      }));
  } catch (error) {
    console.error(`${source.name} fetch error:`, error);
    return [];
  }
}

export async function fetchEthResearch(): Promise<NewNewsItem[]> {
  const results = await Promise.all(DISCOURSE_FEEDS.map(fetchDiscourse));
  return results.flat();
}
