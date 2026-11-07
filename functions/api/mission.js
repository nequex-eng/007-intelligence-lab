import { getNovel } from "../_lib/canon.js";
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id") || "casino-royale";
  const novel = getNovel(id);
  if (!novel) return json({ error: "未知小说任务" }, 404);
  const facts = (novel.facts || []).filter(f => f.canon_or_inference === "canon");
  const events = novel.events || [];
  return json({
    novel: { id: novel.novel_id, titleZh: novel.title_zh, titleEn: novel.title_en, year: novel.publication_year, timeline: novel.story_timeline, timelineEn: novel.story_timeline_en || null },
    chapters: (novel.chapters || []).map(c => ({ no: c.no, title: c.title, titleEn: c.title_en || c.titleEn || null, summary: c.summary, summaryEn: c.summary_en || c.summaryEn || null })),
    facts: facts.map(f => ({ chapter: f.chapter, entity: f.entity, entityEn: f.entity_en || null, fact: f.fact, factEn: f.fact_en || null, quote: f.quote || null, quoteEn: f.quote_en || null, quoteSource: f.quote_source || null })),
    events,
    missionMode: "interactive-adaptation",
    canonNotice: "任务选择与分支属于互动改编；引用的原著事实保留作品与章节出处。不得把玩家选择生成的分支描述为弗莱明原著事件。",
    canonNoticeEn: "Mission choices and branches are interactive adaptations. Sourced novel facts retain their work and chapter references; player-generated branches must never be presented as events from Fleming’s original novels."
  });
}
