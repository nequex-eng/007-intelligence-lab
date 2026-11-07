import { generate, llmStatus } from "../_lib/llm.js";
import { characterCore, getNovel, characterForScene, canonSystemPrompt, resolveEntity } from "../_lib/canon.js";

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

const legacyIds = {
  lechiffre: "le-chiffre",
  vesper: "vesper-lynd",
  leiter: "felix-leiter",
  tatiana: "tatiana-romanova"
};

function resolveCore(id) {
  const canonical = legacyIds[id] || id;
  return characterCore.find(c => c.id === canonical)
    || resolveEntity(canonical, "characters")?.entity
    || null;
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const ids = Array.isArray(body.characterIds) && body.characterIds.length
      ? body.characterIds
      : (body.characterId ? [body.characterId] : []);

    if (!ids.length) return json({ error: "请先选择人物", code: "CHARACTER_REQUIRED" }, 400);
    if (ids.length > 3) return json({ error: "同场最多3人", code: "TOO_MANY_CHARACTERS" }, 400);
    if (new Set(ids).size !== ids.length) return json({ error: "同一人物不能重复加入场景", code: "DUPLICATE_CHARACTER" }, 400);

    const novelId = body.novelId;
    if (!novelId) {
      return json({ error: "必须选择小说时间点，才能启动正典人物对话。", code: "SCENE_REQUIRED" }, 400);
    }
    const book = getNovel(novelId);
    if (!book) return json({ error: "未知小说时间点", code: "UNKNOWN_NOVEL" }, 400);
    const chapterValue = body.chapterNo;
    const chapterNo = chapterValue === null || chapterValue === undefined || chapterValue === "" ? null : Number(chapterValue);
    if (chapterNo !== null && (!Number.isInteger(chapterNo) || !book.chapters?.some(c => Number(c.no) === chapterNo))) {
      return json({ error: "所选章节不属于这部小说", code: "UNKNOWN_CHAPTER" }, 400);
    }

    const incoming = Array.isArray(body.messages) ? body.messages : [];
    const history = incoming
      .filter(m => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
      .slice(-24)
      .map(m => ({ role: m.role, content: m.content.slice(0, 1200) }));

    if (!history.length || history[history.length - 1].role !== "user") {
      return json({ error: "请先说一句话", code: "MESSAGE_REQUIRED" }, 400);
    }

    const canonicalCharacters = ids.map(resolveCore);
    if (canonicalCharacters.some(c => !c)) {
      return json({ error: "知识库中没有该人物", code: "UNKNOWN_CHARACTER" }, 404);
    }

    const states = canonicalCharacters.map(c => characterForScene(c.id, book.novel_id, chapterNo));
    const unavailable = states.find(s => !s.ok);
    if (unavailable) {
      return json({
        error: unavailable.error === "CHARACTER_NOT_YET_APPEARED" ? "该人物在所选章节尚未登场" : unavailable.error === "CHARACTER_NO_LONGER_PRESENT" ? "该人物在所选章节已经离场或死亡" : "该人物在所选小说时间点不可出场",
        code: unavailable.error,
        status: unavailable.status
      }, 409);
    }

    const latestQuestion = history[history.length - 1].content;
    const prompts = canonicalCharacters.map((character, i) =>
      canonSystemPrompt(character, book, states[i].status, latestQuestion, chapterNo)
    );
    const system = [
      "你正在运行007原著正典角色模拟。只扮演本请求指定的人物，不得扮演用户。",
      ...prompts,
      "多人场景规则：每次发言必须以对应人物姓名开头；每个人物只能使用自己的知识范围及场景中明确获知的信息；不得把一个人物的私有知识转移给另一个人物；不得共享彼此未获知的信息。",
      "如果检索事实不足，明确说不知道；不得以电影设定、其他小说的未来事件或常识补写原著空白。"
    ].join("\n\n--- 人物边界 ---\n\n");

    const out = await generate(context.env || {}, [
      { role: "system", content: system },
      ...history
    ]);

    if (out.ok) {
      return json({
        reply: out.text,
        characterIds: canonicalCharacters.map(c => c.id),
        novelId: book.novel_id,
        chapterNo,
        canonMode: true,
        model: out.model
      });
    }
    if (out.code === "MODEL_NOT_CONNECTED") {
      return json({ error: "模型尚未接入", code: out.code, status: llmStatus(context.env || {}) }, 503);
    }
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
