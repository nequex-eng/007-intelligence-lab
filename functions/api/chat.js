import { findCharacter, talkSystemPrompt, groupSystemPrompt } from "../_lib/characters.js";
import { generate, llmStatus } from "../_lib/llm.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const ids = Array.isArray(body.characterIds) && body.characterIds.length
      ? body.characterIds
      : (body.characterId ? [body.characterId] : []);
    if (!ids.length) return json({ error: "请先选人物" }, 400);
    const chars = ids.map(findCharacter);
    if (chars.some((c) => !c)) return json({ error: "没有这个人物" }, 400);
    if (chars.length > 3) return json({ error: "同场最多3人" }, 400);
    const incoming = Array.isArray(body.messages) ? body.messages : [];
    const history = incoming
      .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
      .slice(-24)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 500) }));
    if (!history.length || history[history.length - 1].role !== "user") {
      return json({ error: "请先说一句话" }, 400);
    }
    const env = context.env || {};
    const system = chars.length === 1 ? talkSystemPrompt(chars[0]) : groupSystemPrompt(chars);
    const out = await generate(env, [{ role: "system", content: system }, ...history]);
    if (out.ok) return json({ reply: out.text, characterIds: ids, model: out.model });
    if (out.code === "MODEL_NOT_CONNECTED") {
      return json({ error: "模型尚未接入", code: "MODEL_NOT_CONNECTED", status: llmStatus(env) }, 503);
    }
    return json({ error: "对方一时接不上话，请再说一次", code: "MODEL_ERROR" }, 502);
  } catch (e) {
    return json({ error: "请求有误，请再试一次" }, 400);
  }
}

export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return json({ error: "只接受POST" }, 405);
}
