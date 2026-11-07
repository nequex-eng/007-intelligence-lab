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
    const hit = entries.find((x) => String(x.id || "").trim() === String(query || "").trim());
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
export function characterForScene(id, novelId, chapterNo = null) {
  const character = getCharacter(id);
  if (!character) return { ok: false, error: "UNKNOWN_CHARACTER" };
  const book = getNovel(novelId);
  if (!book) return { ok: false, error: "UNKNOWN_NOVEL" };
  const scope = character.knowledge_scope || [];
  const entry = Array.isArray(scope) ? scope.find(x => x.novel === book.novel_id || Number(x.novel_no) === Number(book.novel_no)) : null;
  const status = entry?.status || "unknown";
  if (status !== "present") {
    return { ok: false, error: "CHARACTER_UNAVAILABLE_AT_SCENE", status, character, book };
  }
  if (chapterNo !== null && chapterNo !== undefined && character.first_appearance?.novel === book.novel_id) {
    const firstChapter = Number(character.first_appearance.first_chapter);
    if (Number.isFinite(firstChapter) && Number(chapterNo) < firstChapter) {
      return { ok: false, error: "CHARACTER_NOT_YET_APPEARED", status: "not-yet-appeared", character, book };
    }
  }
  return { ok: true, character, book, status };
}

function questionTerms(question) {
  const q = normalize(question);
  const english = q.match(/[a-z0-9][a-z0-9'-]{1,}/g) || [];
  const chinese = [...q.matchAll(/[\u4e00-\u9fff]{2,}/g)].flatMap(m => {
    const word = m[0], out = [word];
    for (let i = 0; i < word.length - 1; i++) out.push(word.slice(i, i + 2));
    return out;
  });
  return [...new Set([...english, ...chinese])];
}

export function canonSystemPrompt(character, book, status, question = "", chapterNo = null) {
  const allowedNovelNos = new Set((character.knowledge_scope || [])
    .filter(x => x.status === "present" && x.novel_no <= book.novel_no)
    .map(x => x.novel_no));
  const terms = questionTerms(question);
  const candidates = [];
  for (const novel of novels) {
    if (novel.novel_no > book.novel_no || !allowedNovelNos.has(novel.novel_no)) continue;
    for (const fact of novel.facts || []) {
      if (fact.canon_or_inference !== "canon") continue;
      if (novel.novel_no === book.novel_no && chapterNo !== null && chapterNo !== undefined) {
        const factChapter = Number(String(fact.chapter).match(/\\d+/)?.[0]);
        if (Number.isFinite(factChapter) && factChapter > Number(chapterNo)) continue;
      }
      const hay = [fact.entity, fact.fact, fact.quote].filter(Boolean).join(" ").toLocaleLowerCase();
      const score = terms.reduce((n, term) => n + (hay.includes(term) ? (term.length > 2 ? 3 : 1) : 0), 0);
      if (score > 0) candidates.push({ score, text: `[${novel.title_zh} / 第${fact.chapter}章] ${fact.fact}` });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const facts = candidates.slice(0, 16).map(x => x.text);
  const sceneScope = (character.knowledge_scope || []).find(x => x.novel === book.novel_id);
  const chapterLabel = chapterNo === null || chapterNo === undefined
    ? "全书结束（可使用本书全篇已发生事实）"
    : `第${chapterNo}章结束（严禁引用本章之后的事实）`;
  const scopeText = chapterNo === null || chapterNo === undefined
    ? `本书知识范围：已知：${JSON.stringify(sceneScope?.known || [])}；未知：${JSON.stringify(sceneScope?.unknown || [])}`
    : "已启用章级知识截止。人物只能知道所选章节及此前已发生、且本人有机会获知的事实；不得提及后续章节的事件、身份揭露、死亡或结局。";
  return [
    "你是Ian Fleming的007原著世界角色。必须严格遵守以下正典约束。",
    `当前场景：${book.title_zh}（${book.title_en}），出版年${book.publication_year}。人物：${character.name_zh || character.name_en}。当前时间点：${chapterLabel}。`,
    `该人物在本书状态：${status}。人物身份与行为边界：${JSON.stringify({ appearance: character.appearance, age_clues: character.age_clues, personality: character.personality, habits: character.habits, background: character.background, relationships: character.relationships, voice_style: character.voice_style, behavioral_boundaries: character.behavioral_boundaries, knowledge_boundaries: character.knowledge_boundaries, timeline_cutoff: character.timeline_cutoff })}`,
    scopeText,
    knowledgeControl.purpose,
    ...knowledgeControl.rules.map(r => `${r.id} ${r.rule}：${r.text}`),
    "仅可将知识库canon事实作为确定事实；inference必须明确标为推测；原著未写必须回答不知道。不得把电影设定混入原著。",
    "回答涉及正典事实时，必须尽可能注明作品与章节。人物不在场小说的内情只能按可靠转述并注明来源，不得全知叙述。",
    "以下是按当前人物已出场作品范围及用户问题检索出的canon事实；不代表人物亲历了所有事件：",
    ...(facts.length ? facts : ["本次问题未检索到可直接引用的相关正典事实。请明确说明不知道，不要自行补全。"])
  ].join("\n");
}
