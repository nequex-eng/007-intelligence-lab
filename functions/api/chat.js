import { findCharacter, talkSystemPrompt, groupSystemPrompt } from "../_lib/characters.js";
import { generate, llmStatus } from "../_lib/llm.js";
import { characterCore, getNovel, characterForScene, canonSystemPrompt, resolveEntity } from "../_lib/canon.js";
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const legacyIds = { lechiffre: "le-chiffre", vesper: "vesper-lynd", leiter: "felix-leiter", tatiana: "tatiana-romanova" };
function resolveCore(id) {
  const canonical = legacyIds[id] || id;
  return characterCore.find(c => c.id === canonical) || resolveEntity(id, "characters")?.entity || null;
}
export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const ids = Array.isArray(body.characterIds) && body.characterIds.length ? body.characterIds : (body.characterId ? [body.characterId] : []);
    if (!ids.length) return json({ error: "请先选人物" }, 400);
    if (ids.length > 3) return json({ error: "同场最多3人" }, 400);
    const incoming = Array.isArray(body.messages) ? body.messages : [];
    const history = incoming.filter(m => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant")).slice(-24).map(m => ({ role: m.role, content: m.content.slice(0, 1200) }));
    if (!history.length || history[history.length - 1].role !== "user") return json({ error: "请先说一句话" }, 400);
    const env = context.env || {};
    const novelId = body.novelId || null;
    let system;
    let canonicalCharacters = [];
    if (novelId) {
      const book = getNovel(novelId);
      if (!book) return json({ error: "未知小说时间点", code: "UNKNOWN_NOVEL" }, 400);
      canonicalCharacters = ids.map(resolveCore);
      if (canonicalCharacters.some(c => !c)) return json({ error: "知识库中没有该人物", code: "UNKNOWN_CHARACTER" }, 404);
      const states = canonicalCharacters.map(c => characterForScene(c.id, book.novel_id));
      const unavailable = states.find(s => !s.ok);
      if (unavailable) return json({ error: "该人物在所选小说时间点不可出场", code: unavailable.error, status: unavailable.status }, 409);
      system = canonicalCharacters.map((c, i) => canonSystemPrompt(c, book, states[i].status, history[history.length - 1].content)).join("\n\n--- 同场人物分隔 ---\n\n");
      system += "\n\n多人场景规则：你只扮演被指定的人物；每次发言必须以对应人物姓名开头；人物不得共享彼此未获知的信息。";
    } else {
      const chars = ids.map(id => findCharacter(id));
      if (chars.some(c => !c)) return json({ error: "请先选择有效人物或指定小说时间点", code: "SCENE_REQUIRED" }, 400);
      system = chars.length === 1 ? talkSystemPrompt(chars[0]) : groupSystemPrompt(chars);
      system += "\n\n注意：未选择小说时间点，本轮仅为旧版演示模式，不可宣称已执行全库时间线校验。";
    }
    const out = await generate(env, [{ role: "system", content: system }, ...history]);
    if (out.ok) return json({ reply: out.text, characterIds: ids, novelId, canonMode: Boolean(novelId), model: out.model });
    if (out.code === "MODEL_NOT_CONNECTED") return json({ error: "模型尚未接入", code: out.code, status: llmStatus(env) }, 503);
    return json({ error: "对方一时接不上话，请再说一次", code: "MODEL_ERROR" }, 502);
  } catch (e) {
    console.error("chat request failed", e?.message);
    return json({ error: "请求有误，请再试一次" }, 400);
  }
}
export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return json({ error: "只接受POST" }, 405);
}
