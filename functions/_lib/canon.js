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
function romanChapterNumber(value) {
  const text = String(value ?? "").trim().toUpperCase();
  if (!/^[IVXLCDM]+$/.test(text)) return null;
  const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0, previous = 0;
  for (let i = text.length - 1; i >= 0; i--) {
    const current = values[text[i]];
    total += current < previous ? -current : current;
    previous = Math.max(previous, current);
  }
  return total > 0 ? total : null;
}

function chapterPosition(book, value) {
  if (value === null || value === undefined || value === "") return null;
  const key = String(value).trim().toUpperCase();
  const index = (book.chapters || []).findIndex(c => String(c.no).trim().toUpperCase() === key);
  if (index >= 0) return index + 1;
  const numeric = Number(value);
  if (Number.isInteger(numeric) && numeric > 0) return numeric;
  return romanChapterNumber(value);
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
    const selectedPosition = chapterPosition(book, chapterNo);
    const firstChapter = chapterPosition(book, character.first_appearance.first_chapter);
    const lastChapter = chapterPosition(book, character.first_appearance.last_chapter);
    if (selectedPosition === null) return { ok: false, error: "UNKNOWN_CHAPTER", status: "unknown-chapter", character, book };
    if (firstChapter !== null && selectedPosition < firstChapter) {
      return { ok: false, error: "CHARACTER_NOT_YET_APPEARED", status: "not-yet-appeared", character, book };
    }
    if (lastChapter !== null && selectedPosition > lastChapter) {
      return { ok: false, error: "CHARACTER_NO_LONGER_PRESENT", status: "no-longer-present", character, book };
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

export function canonSystemPrompt(character, book, status, question = "", chapterNo = null, language = "zh") {
  const english = language === "en";
  const terms = questionTerms(question);
  const candidates = [];
  for (const novel of novels) {
    if (novel.novel_id !== book.novel_id) continue;
    for (const fact of novel.facts || []) {
      if (fact.canon_or_inference !== "canon") continue;
      if (chapterNo !== null && chapterNo !== undefined) {
        const factChapter = chapterPosition(novel, fact.chapter);
        const selectedPosition = chapterPosition(book, chapterNo);
        if (factChapter === null || selectedPosition === null || factChapter > selectedPosition) continue;
      }
      const factText = english ? (fact.fact_en || "") : (fact.fact || "");
      const hay = [fact.entity, factText, english ? fact.quote_en : fact.quote].filter(Boolean).join(" ").toLocaleLowerCase();
      const score = terms.reduce((n, term) => n + (hay.includes(term) ? (term.length > 2 ? 3 : 1) : 0), 0);
      if (score > 0 && factText) candidates.push({ score, text: english ? "[" + novel.title_en + " / Chapter " + fact.chapter + "] " + factText : "[" + novel.title_zh + " / 第" + fact.chapter + "章] " + factText });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const facts = candidates.slice(0, 16).map(x => x.text);
  const sceneScope = (character.knowledge_scope || []).find(x => x.novel === book.novel_id);
  const priorScope = (character.knowledge_scope || []).filter(x => x.status === "present" && x.novel_no < book.novel_no);
  const priorKnowledge = english
    ? priorScope.map(x => (novels.find(n => n.novel_id === x.novel)?.title_en || x.novel) + ": character appears in this novel; do not infer knowledge beyond recorded canon.")
    : priorScope.map(x => (x.title_zh || x.novel) + "：已知" + ((x.known || []).join("；") || "未提供") + "；未知" + ((x.unknown || []).join("；") || "未提供"));
  const chapterLabel = english
    ? (chapterNo === null || chapterNo === undefined ? "end of the novel" : "end of Chapter " + chapterNo)
    : (chapterNo === null || chapterNo === undefined ? "全书结束（可使用本书全篇已发生事实）" : "第" + chapterNo + "章结束（严禁引用本章之后的事实）");
  const currentScopeText = english
    ? "Shared knowledge_scope status for this novel: " + (sceneScope?.status || "unknown") + ". This status is identical in Chinese and English modes. " + (chapterNo == null ? "The scene is set at the end of the novel." : "The scene is set at the end of Chapter " + chapterNo + "; all later events, revelations, relationship changes and deaths are outside the character's knowledge.")
    : (chapterNo === null || chapterNo === undefined
      ? "本书知识范围：已知：" + JSON.stringify(sceneScope?.known || []) + "；未知：" + JSON.stringify(sceneScope?.unknown || [])
      : "已启用章级知识截止。人物只能知道所选章节及此前已发生、且本人有机会获知的事实；不得提及后续章节的事件、身份揭露、关系变化、死亡或结局。章级模式不向模型提供全书背景与全书关系变化摘要。");
  const scopeText = [currentScopeText, priorKnowledge.length ? (english ? "Earlier appearances and shared knowledge boundaries: " : "此前作品中人物明确记录的知识边界（仅摘要，不注入其他人物的原著事实）：") + priorKnowledge.join(" | ") : ""].filter(Boolean).join("\n");
  const profile = english
    ? { appearance: character.appearance_en, age_clues: character.age_clues_en, personality: character.personality_en, habits: character.habits_en, background: chapterNo == null ? character.background_en : undefined, voice_style: character.voice_style_en, behavioral_boundaries: character.behavioral_boundaries_en, knowledge_boundaries: character.knowledge_boundaries_en, timeline_cutoff: chapterNo == null ? character.timeline_cutoff_en : "End of Chapter " + chapterNo + "; later facts prohibited" }
    : (chapterNo === null || chapterNo === undefined
      ? { appearance: character.appearance, age_clues: character.age_clues, personality: character.personality, habits: character.habits, background: character.background, relationships: character.relationships, voice_style: character.voice_style, behavioral_boundaries: character.behavioral_boundaries, knowledge_boundaries: character.knowledge_boundaries, timeline_cutoff: character.timeline_cutoff }
      : { appearance: character.appearance, age_clues: character.age_clues, personality: character.personality, habits: character.habits, voice_style: { tone: character.voice_style?.tone, sentence_pattern: character.voice_style?.sentence_pattern }, behavioral_boundaries: character.behavioral_boundaries, timeline_cutoff: "第" + chapterNo + "章结束；严格禁止使用后续章节事实" });
  if (english) return [
    "You are a character from Ian Fleming's original 007 novels. Role-play in natural English and follow original-book canon, never film continuity.",
    "Scene: " + book.title_en + " (" + book.publication_year + "). Character: " + character.name_en + ". Timeline point: " + chapterLabel + ".",
    "Character status in this novel: " + status + ". Canon profile and behavioural boundaries: " + JSON.stringify(profile),
    scopeText,
    "The timeline_cutoff and knowledge_scope are shared invariant state. A language switch changes expression only; it never changes character availability, chronology, or what the character knows.",
    "Treat retrieved canon facts as established facts. Mark inference as speculation. If the novels do not establish something, say you do not know. Never invent missing canon.",
    "Cite the novel and chapter when possible. Do not narrate events not witnessed by the character as personal knowledge; identify reliable hearsay as hearsay.",
    "Only the following canon facts from the selected novel and selected chapter cutoff may be used:",
    ...(facts.length ? facts : ["No directly relevant English canon evidence was retrieved. Say you do not know; do not fill the gap."])
  ].join("\n");
  return [
    "你是Ian Fleming的007原著世界角色。必须严格遵守以下正典约束。",
    "当前场景：" + book.title_zh + "（" + book.title_en + "），出版年" + book.publication_year + "。人物：" + (character.name_zh || character.name_en) + "。当前时间点：" + chapterLabel + "。",
    "该人物在本书状态：" + status + "。人物身份与行为边界：" + JSON.stringify(profile),
    scopeText,
    knowledgeControl.purpose,
    ...knowledgeControl.rules.map(r => r.id + " " + r.rule + "：" + r.text),
    "仅可将知识库canon事实作为确定事实；inference必须明确标为推测；原著未写必须回答不知道。不得把电影设定混入原著。",
    "回答涉及正典事实时，必须尽可能注明作品与章节。人物不在场小说的内情只能按可靠转述并注明来源，不得全知叙述。",
    "以下只包含当前所选原著中、且不晚于所选章节的canon事实；此前作品仅使用人物knowledge_scope明确记录的知识摘要，不注入其他人物的场景细节：",
    ...(facts.length ? facts : ["本次问题未检索到可直接引用的相关正典事实。请明确说明不知道，不要自行补全。"])
  ].join("\n");
}
