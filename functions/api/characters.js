import { characterCore, timeline, novels } from "../_lib/canon.js";
const json = (data) => new Response(JSON.stringify(data), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
export async function onRequest(context) {\n  const language = new URL(context.request.url).searchParams.get("language") === "en" ? "en" : "zh";
  return json({
    characters: characterCore.map(c => ({
      id: c.id, name: c.name_en, nameZh: c.name_zh, role: c.role,
      firstNovelId: c.first_appearance?.novel || null,
      firstBook: c.first_appearance?.title_zh, firstYear: novels.find(n => n.novel_no === c.first_appearance?.novel_no)?.publication_year,
      timelineCutoff: c.timeline_cutoff, intro: c.background,
      appearance: c.appearance, ageClues: c.age_clues, personality: c.personality,
      habits: c.habits, relationships: c.relationships, speech: c.voice_style,
      knowledgeScope: c.knowledge_scope, knowledgeBoundaries: c.knowledge_boundaries,
      behavioralBoundaries: c.behavioral_boundaries, sources: c.sources
    })),
    timelineNovels: timeline.map(n => ({ id: n.novel, no: n.novel_no, title: language === "en" ? (novels.find(b => b.novel_id === n.novel)?.title_en || n.novel) : n.title_zh })),
    source: "verified-canon", count: characterCore.length
  });
}
