import { characterCore, timeline, novels } from "../_lib/canon.js";
const json = (data) => new Response(JSON.stringify(data), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
export async function onRequest(context) {
  const language = context?.request ? (new URL(context.request.url).searchParams.get("language") === "en" ? "en" : "zh") : "zh";
  return json({
    characters: characterCore.map(c => {
      const firstNovel = novels.find(n => n.novel_id === c.first_appearance?.novel);
      return {
        id: c.id, name: c.name_en, nameZh: c.name_zh, role: c.role,
        roleEn: c.role_en || c.roles_en?.[0] || "Core character",
        firstNovelId: c.first_appearance?.novel || null,
        firstBook: c.first_appearance?.title_zh || firstNovel?.title_zh,
        firstBookEn: firstNovel?.title_en || c.first_appearance?.title_en || c.first_appearance?.novel,
        firstYear: firstNovel?.publication_year,
        timelineCutoff: c.timeline_cutoff, timelineCutoffEn: c.timeline_cutoff_en,
        intro: c.background, introEn: c.background_en,
        appearance: c.appearance, appearanceEn: c.appearance_en,
        ageClues: c.age_clues, ageCluesEn: c.age_clues_en,
        personality: c.personality, personalityEn: c.personality_en,
        habits: c.habits, habitsEn: c.habits_en,
        relationships: c.relationships, speech: c.voice_style, speechEn: c.voice_style_en,
        knowledgeScope: c.knowledge_scope, knowledgeBoundaries: c.knowledge_boundaries,
        knowledgeBoundariesEn: c.knowledge_boundaries_en,
        behavioralBoundaries: c.behavioral_boundaries, behavioralBoundariesEn: c.behavioral_boundaries_en,
        sources: c.sources
      };
    }),
    timelineNovels: timeline.map(n => ({ id: n.novel, no: n.novel_no, title: language === "en" ? (novels.find(b => b.novel_id === n.novel)?.title_en || n.novel) : n.title_zh })),
    source: "verified-canon", count: characterCore.length
  });
}