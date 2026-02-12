export const CATEGORIES = [
  "Ecosystem",
  "Enterprise",
  "Applications",
  "Developers",
  "Security",
  "Layer 1",
  "Research",
  "Staking",
  "Layer 2",
  "Regulation",
  "General",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Status = "pending" | "included" | "excluded";

export type SourceType = "client_release" | "dev_tool_release" | "blog_post" | "eip" | "research";

export interface NewsItem {
  id: number;
  title: string;
  url: string;
  description: string;
  source_type: SourceType;
  source_name: string;
  category: Category;
  published_at: string;
  fetched_at: string;
  status: Status;
  version: string | null;
  prerelease: boolean;
  issue_url: string | null;
}

export interface NewNewsItem {
  title: string;
  url: string;
  description: string;
  source_type: SourceType;
  source_name: string;
  category: Category;
  published_at: string;
  version?: string | null;
  prerelease?: boolean;
}
