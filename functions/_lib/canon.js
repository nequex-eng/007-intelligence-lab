import { canonData } from "../_data/canon-data.js";

const get = (path) => canonData[path];
export const manifest = get("knowledge/manifest.json");
export const novels = Array.from({ length: 14 }, (_, i) => get(`knowledge/novels/novel-${String(i + 1).padStart(2, "0")}.json`));
export const characterCore = get("knowledge/canon-rules/character-core.json").characters;
export const knowledgeControl = get("knowledge/canon-rules/knowledge-control.json");
export const adaptationBoundaries = get("knowledge/canon-rules/adaptation-boundaries.json");
export const aliases = get("knowledge/resolution/aliases.json").aliases;
export const relationships = get("knowledge/resolution/relationships.json").pairs;
export const timeline = get("knowledge/resolution/timeline.json").entries;
export const indexes = {
  characters: get("knowledge/characters/index.json"),
  organizations: get("knowledge/organizations/index.json"),
  locations: get("knowledge/locations/index.json"),
  equipment: get("knowledge/equipment/index.json"),
  events: get("knowledge/events/index.json"),
  timeline: get("knowledge/timeline/index.json")
};

const normalize = (s) => String(s || "").trim().toLocaleLowerCase();
export function resolveEntity(query, kind) {
  const q = normalize(query);
  if (!q) return null;
  const all = Object.entries(indexes).filter(([k]) => !kind || k === kind);
  for (const [category, index] of all) {
    const entries = index[category] || index.entries || [];
    const hit = entries.find((x) => normalize(x.id) === q);
    if (hit) return { kind: category, entity: hit, ambiguous: false };
  }
  const found = aliases.filter((x) => normalize(x.alias) === q && (!kind || x.kind === kind));
  if (found.length > 1 || found.some((x) => x.ambiguous)) {
    return { ambiguous: true, candidates: found.flatMap((x) => x.candidates || [x.canonical_id]), kind: found[0]?.kind };
  }
  if (found.length === 1) {
    const item = found[0];
    const index = indexes[item.kind];
    const entries = index?.[item.kind] || index?.entries || [];
    return { kind: item.kind, entity: entries.find((x) => x.id === item.canonical_id) || null, ambiguous: false };
  }
  return null;
}

export function searchCanon(query, kind = "all", limit = 30) {
  const q = normalize(query);
  if (!q) return [];
  const results = [];
  const add = (category, items, fields) => {
    for (const item of items || []) {
      const hay = fields.map((f) => item[f]).filter(Boolean).join(" ").toLocaleLowerCase();
      if (hay.includes(q)) results.push({ kind: category, ...item });
      if (results.length >= limit) return;
    }
  };
  const categories = kind === "all" ? Object.keys(indexes) : [kind];
  for (const category of categories) {
    const index = indexes[category];
    const entries = index?.[category] || index?.entries || [];
    add(category, entries, ["id", "name", "name_en", "name_zh", "aliases", "description", "role", "summary"]);
  }
  for (const novel of novels) {
    if (results.length >= limit) break;
    if (kind !== "all" && kind !== "facts" && kind !== "events" && kind !== "books") continue;
    if (kind === "books" && [novel.title_zh, novel.title_en, novel.novel_id].some((v) => normalize(v).includes(q))) {
      results.push({ kind: "books", id: novel.novel_id, title_zh: novel.title_zh, title_en: novel.title_en, publication_year: novel.publication_year, chapter_count: novel.chapters?.length });
    }
    if (kind === "all" || kind === "facts") {
      for (const fact of novel.facts || []) {
        const hay = [fact.entity, fact.fact, fact.quote, fact.chapter, novel.title_zh, novel.title_en].filter(Boolean).join(" ").toLocaleLowerCase();
        if (hay.includes(q)) results.push({ kind: "facts", novel_id: novel.novel_id, title_zh: novel.title_zh, title_en: novel.title_en, ...fact });
        if (results.length >= limit) break;
      }
    }
    if (kind === "all" || kind === "events") {
      for (const event of novel.events || []) {
        if ([event.id, event.title, event.description, event.summary].filter(Boolean).join(" ").toLocaleLowerCase().includes(q)) {
          results.push({ kind: "events", novel_id: novel.novel_id, title_zh: novel.title_zh, ...event });
        }
      }
    }
  }
  return results.slice(0, limit);
}

export function getNovel(id) {
  return novels.find((n) => n.novel_id === id || String(n.novel_no) === String(id)) || null;
}
export function getCharacter(id) {
  return characterCore.find((c) => c.id === id) || null;
}
export function characterForScene(id, novelId) {
  const character = getCharacter(id);
  if (!character) return { ok: false, error: "UNKNOWN_CHARACTER" };
  const book = getNovel(novelId);
  if (!book) return { ok: false, error: "UNKNOWN_NOVEL" };
  const scope = character.knowledge_scope || [];
  const entry = Array.isArray(scope) ? scope.find(x => x.novel === book.novel_id || Number(x.novel_no) === Number(book.novel_no)) : null;
  const status = entry?.status || "unknown";
  if (status === "dead" || status === "not_yet_introduced" || status === "absent") {
    return { ok: false, error: "CHARACTER_UNAVAILABLE_AT_SCENE", status, character, book };
  }
  return { ok: true, character, book, status };
}

export function canonSystemPrompt(character, book, status) {
  const facts = [];
  for (const novel of novels) {
    if (novel.novel_no > book.novel_no) break;
    for (const fact of novel.facts || []) {
      if (fact.canon_or_inference !== "canon") continue;
      const entity = String(fact.entity || "").toLowerCase();
      const id = character.id.toLowerCase();
      if (entity.includes(id) || (character.name_en && entity.includes(character.name_en.toLowerCase())) || (character.name_zh && entity.includes(character.name_zh.toLowerCase()))) {
        facts.push(`[${novel.title_zh} / ${fact.chapter}] ${fact.fact}`);
      }
      if (facts.length >= 20) break;
    }
    if (facts.length >= 20) break;
  }
  return [
    "你是Ian Fleming的007原著世界角色。必须严格遵守以下正典约束。",
    `当前场景：${book.title_zh}（${book.title_en}），出版年${book.publication_year}。人物：${character.name_zh || character.name_en}。`,
    `该人物在本书状态：${status}。人物身份：${JSON.stringify(character)}`,
    knowledgeControl.purpose,
    ...knowledgeControl.rules.map((r) => `${r.id} ${r.rule}：${r.text}`),
    "仅可将知识库canon事实作为确定事实；inference必须明确标为推测；原著未写必须回答不知道。不得把电影设定混入原著。",
    "回答涉及正典事实时，尽可能注明作品与章节。不得声称以下提示中没有的事实已被检索确认。",
    "相关人物事实摘录（仅供辅助，必须服从人物knowledge_scope）：",
    ...facts
  ].join("\n");
}
