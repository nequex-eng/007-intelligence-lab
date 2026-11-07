import { manifest, novels, characterCore, indexes, relationships, timeline, searchCanon, resolveEntity, getNovel, getCharacter, characterForScene } from "../_lib/canon.js";
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const action = url.searchParams.get("action") || "search";
  const q = url.searchParams.get("q") || "";
  if (action === "manifest") return json({ source: "007-intelligence-lab-knowledge", generated: manifest.generated, novels: manifest.novel_count, entities: { characters: indexes.characters.characters.length, organizations: indexes.organizations.organizations.length, locations: indexes.locations.locations.length, equipment: indexes.equipment.equipment.length }, facts: novels.reduce((n, b) => n + (b.facts?.length || 0), 0), charactersCore: characterCore.length, knownGaps: manifest.known_gaps || [] });
  if (action === "books") return json({ books: novels.map(n => ({ id: n.novel_id, no: n.novel_no, titleZh: n.title_zh, titleEn: n.title_en, year: n.publication_year, chapters: n.chapters?.length || 0, kind: n.kind })) });
  if (action === "chapters") {
    const novel = getNovel(url.searchParams.get("novel"));
    if (!novel) return json({ error: "未知小说" }, 404);
    return json({
      novel: { id: novel.novel_id, titleZh: novel.title_zh, titleEn: novel.title_en },
      chapters: (novel.chapters || []).map(c => ({ no: c.no, title: c.title, summary: c.summary }))
    });
  }
  if (action === "character") {
    const character = getCharacter(url.searchParams.get("id"));
    return character ? json({ character }) : json({ error: "人物不存在" }, 404);
  }
  if (action === "scene") {
    const chapterValue = url.searchParams.get("chapter");
    const chapterNo = chapterValue === null || chapterValue === "" ? null : Number(chapterValue);
    const result = characterForScene(url.searchParams.get("character"), url.searchParams.get("novel"), chapterNo);
    return result.ok ? json({ character: result.character, book: { id: result.book.novel_id, title: result.book.title_zh }, status: result.status }) : json({ error: result.error, status: result.status || null }, 409);
  }
  if (action === "relationships") { const id = url.searchParams.get("id") || ""; return json({ relationships: relationships.filter(p => !id || p.a === id || p.b === id) }); }
  if (action === "timeline") return json({ timeline });
  if (action === "resolve") return json({ result: resolveEntity(q, url.searchParams.get("kind") || undefined) });
  return json({ results: searchCanon(q, url.searchParams.get("kind") || "all", Math.min(Number(url.searchParams.get("limit")) || 30, 100)) });
}
