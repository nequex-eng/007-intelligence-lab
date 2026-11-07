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

    const language = body.language === "en" ? "en" : "zh";
    const mode = ["talk", "report", "quartermaster", "group"].includes(body.mode) ? body.mode : "talk";
    if (mode === "report" && ids[0] !== "m") return json({ error: "向M汇报模式必须由M接收汇报", code: "REPORT_REQUIRES_M" }, 400);
    if (mode === "quartermaster" && ids[0] !== "q") return json({ error: "装备领取模式必须由Q负责", code: "QUARTERMASTER_REQUIRES_Q" }, 400);
    const novelId = body.novelId;
    if (!novelId) {
      return json({ error: "必须选择小说时间点，才能启动正典人物对话。", code: "SCENE_REQUIRED" }, 400);
    }
    const book = getNovel(novelId);
    if (!book) return json({ error: "未知小说时间点", code: "UNKNOWN_NOVEL" }, 400);
    const chapterValue = body.chapterNo;
    const chapterNo = chapterValue === null || chapterValue === undefined || String(chapterValue).trim() === "" ? null : String(chapterValue).trim();
    if (chapterNo !== null && !book.chapters?.some(c => String(c.no).trim().toUpperCase() === chapterNo.toUpperCase())) {
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

    const states = canonicalCharacters.map(c => {
      // Q is only mentioned, not physically present, in Casino Royale. The quartermaster
      // experience is an explicitly non-canon training extension, not a claim about the novel.
      if (mode === "quartermaster" && c.id === "q" && book.novel_id === "casino-royale") {
        return { ok: true, status: "non-canon-quartermaster-simulation" };
      }
      return characterForScene(c.id, book.novel_id, chapterNo);
    });
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
      canonSystemPrompt(character, book, states[i].status, latestQuestion, chapterNo, language)
    );
    const system = [
      language === "en" ? "You are running a canon-grounded role-play in Ian Fleming’s original 007 novels. Play only the assigned character(s), never the user. Reply entirely in natural English." : "你正在运行007原著正典角色模拟。只扮演本请求指定的人物，不得扮演用户。",
      language === "en" ? "All dialogue, explanations, labels and source references must be in English. Preserve the same timeline_cutoff and knowledge_scope as Chinese mode. Never import film continuity." : "",
      ...prompts,
      "多人场景规则：每次发言必须以对应人物姓名开头；每个人物只能使用自己的知识范围及场景中明确获知的信息；不得把一个人物的私有知识转移给另一个人物；不得共享彼此未获知的信息。",
      "如果检索事实不足，明确说不知道；不得以电影设定、其他小说的未来事件或常识补写原著空白。",
      mode === "report" ? "当前是向M汇报模式：M是接收汇报的上级。以情报主管口吻听取行动结果，追问时间、地点、人物、证据和风险；区分已证实事实与推测，不要把M扮演成邦德。" : "",
      mode === "quartermaster" ? "当前是Q部门装备领取模式：Q负责装备与技术说明。注意：Q在《皇家赌场》中仅被M提及，并未正式出场；本次是明确标注的非正典训练扩展，不得声称这是原著情节，也不得照搬电影版Q的发明或口吻。仅根据知识库可证实的职责提供谨慎的装备建议，区分原著事实与模拟建议；根据任务目的询问必要条件，说明用途、限制和归还要求。" : "",
      mode === "group" ? "当前是多角色同场模式：所有被选人物都必须参与；每轮至少让每位人物各发言一次，姓名置于发言开头；人物之间不得共享未获知的私有知识。" : ""
    ].filter(Boolean).join("\n\n--- 人物边界 ---\n\n");

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
        mode,
        canonMode: true,
        model: out.model
      });
    }
    if (out.code === "MODEL_NOT_CONNECTED") {
      return json({ error: "模型尚未接入", code: out.code, status: llmStatus(context.env || {}) }, 503);
    }
    return json({ error: "对方一时接不上话，请再说一次", code: "MODEL_ERROR", modelError: out.reason || "Unknown MiniMax error" }, 502);
  } catch (e) {
    console.error("chat request failed", e?.message);
    return json({ error: "请求有误，请再试一次" }, 400);
  }
}

export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return json({ error: "只接受POST" }, 405);
}
