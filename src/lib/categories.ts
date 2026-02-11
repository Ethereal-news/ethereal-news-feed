import { Category, SourceType } from "./types";

export function getDefaultCategory(sourceType: SourceType): Category {
  switch (sourceType) {
    case "client_release":
      return "Staking";
    case "dev_tool_release":
      return "Developers";
    case "blog_post":
      return "Ecosystem";
  }
}
