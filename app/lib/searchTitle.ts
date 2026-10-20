import titles from "../../data/seo-titles.json";
export function searchTitle(path: string, fallback: string): string {
  return (titles as Record<string,string>)[path] || fallback;
}
