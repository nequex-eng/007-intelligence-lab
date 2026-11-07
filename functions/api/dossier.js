import { BOOKS, LOCATIONS, ORGANIZATIONS, WEAPONS, TIMELINE, searchDossier } from "../_lib/knowledge.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const q = url.searchParams.get("q") || "";
  const kind = url.searchParams.get("kind") || "all";
  if (q) return json(searchDossier(q));
  const data = { sample: true, notice: "示例数据·待TXT导入核验" };
  if (kind === "all" || kind === "books") data.books = BOOKS;
  if (kind === "all" || kind === "locations") data.locations = LOCATIONS;
  if (kind === "all" || kind === "organizations") data.organizations = ORGANIZATIONS;
  if (kind === "all" || kind === "weapons") data.weapons = WEAPONS;
  if (kind === "all" || kind === "timeline") data.timeline = TIMELINE;
  return json(data);
}
