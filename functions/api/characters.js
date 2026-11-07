import { CHARACTERS } from "../_lib/characters.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

export async function onRequest(context) {
  const list = CHARACTERS.map((c) => ({
    id: c.id, name: c.name, nameZh: c.nameZh, role: c.role,
    firstBook: c.firstBook, firstYear: c.firstYear, timelineCutoff: c.timelineCutoff,
    intro: c.intro, appearance: c.appearance, personality: c.personality,
    speech: c.speech, relationships: c.relationships, events: c.events,
    boundaries: c.boundaries, opener: c.opener, facts: c.facts
  }));
  return json({ characters: list, sample: true, notice: "示例数据·待TXT导入核验" });
}
