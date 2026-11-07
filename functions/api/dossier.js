import { manifest, novels, indexes, searchCanon } from "../_lib/canon.js";
const json = (data) => new Response(JSON.stringify(data), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const kind = url.searchParams.get("kind") || "all";
  if (q) return json({ source: "verified-canon", results: searchCanon(q, kind, Math.min(Number(url.searchParams.get("limit")) || 30, 100)) });
  const books = novels.map(n => ({ id: n.novel_id, no: n.novel_no, titleZh: n.title_zh, titleEn: n.title_en, year: n.publication_year, kind: n.kind, kindEn: n.kind === "长篇" ? "Novel" : n.kind === "短篇集" ? "Short-story collection" : n.kind, chapters: n.chapters?.length || 0, summary: n.story_timeline, summaryEn: n.synopsis_en || n.story_timeline }));
  const data = { source: "verified-canon", generated: manifest.generated };
  if (kind === "all" || kind === "books") data.books = books;
  if (kind === "all" || kind === "characters") data.characters = indexes.characters.characters;
  if (kind === "all" || kind === "locations") data.locations = indexes.locations.locations;
  if (kind === "all" || kind === "organizations") data.organizations = indexes.organizations.organizations;
  if (kind === "all" || kind === "equipment") data.equipment = indexes.equipment.equipment;
  if (kind === "all" || kind === "events") data.events = indexes.events.events;
  if (kind === "all" || kind === "timeline") data.timeline = indexes.timeline.entries;
  return json(data);
}
