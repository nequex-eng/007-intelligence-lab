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
      .map(m => ({ role: m.role, content: m.content.slice(0, 1200), characterId: typeof m.characterId === "string" ? m.characterId : null }));

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
    const baseRules = language === "en"
      ? "You are running a canon-grounded role-play in Ian Fleming’s original 007 novels. Reply entirely in natural English. Never play the user. Never import film continuity. If evidence is insufficient, say you do not know."
      : "你正在运行007原著正典角色模拟。只扮演指定人物，不得扮演用户，不得混入电影设定。证据不足时明确回答不知道。";
    const transcript = history.map(m => ({
      role: m.role,
      content: m.role === "assistant" && m.characterId
        ? (language === "en" ? "[Previous speaker: " : "[此前发言人物：") + (canonicalCharacters.find(c => c.id === m.characterId)?.[language === "en" ? "name_en" : "name_zh"] || m.characterId) + "] " + m.content
        : m.content
    }));

    if (mode === "group") {
      const replies = [];
      for (let i = 0; i < canonicalCharacters.length; i++) {
        const character = canonicalCharacters[i];
        const characterName = language === "en" ? character.name_en : character.name_zh;
        const groupRule = language === "en"
          ? "You are only " + characterName + ". Speak only as this character, using only this character's own canon knowledge. Respond to the user's latest message and, where relevant, the other character's already-spoken words. Do not write the other character's dialogue. Keep this reply distinct and in character."
          : "你现在只扮演" + characterName + "。只能使用该人物自己的正典知识。回应用户最新发言，并可针对另一位人物已经说过的话作出反应。不得代写另一位人物的台词。保持人物独立、口吻鲜明。";
        const priorScene = replies.map(r => ({
          role: "assistant",
          content: (language === "en" ? "[The other character said: " : "[另一位人物刚才说：") + r.content + "]"
        }));
        const out = await generate(context.env || {}, [
          { role: "system", content: [baseRules, prompts[i], groupRule,
            language === "en"
              ? "This is a two-character conversation with the user. Only your own character speaks in this response. Do not add speaker headings or labels."
              : "这是用户与两位人物的三方对话。本次回复只允许你所扮演的人物发言，不要添加说话人抬头或姓名标签。"
          ].join("\\n\\n") },
          ...transcript.slice(0, -1),
          ...priorScene,
          transcript[transcript.length - 1]
        ]);
        if (!out.ok) {
          if (out.code === "MODEL_NOT_CONNECTED") return json({ error: "模型尚未接入", code: out.code, status: llmStatus(context.env || {}) }, 503);
          return json({ error: "多角色对话生成失败，请重试", code: "MODEL_ERROR", modelError: out.reason || "Unknown MiniMax error" }, 502);
        }
        replies.push({ characterId: character.id, content: out.text });
      }
      return json({
        replies,
        characterIds: canonicalCharacters.map(c => c.id),
        novelId: book.novel_id, chapterNo, mode, canonMode: true, model: "multi-character"
      });
    }

    const system = [
      baseRules,
      prompts[0],
      language === "en" ? "All dialogue, explanations and source references must be in English." : "",
      mode === "report" ? (language === "en" ? "Report mode: M receives the report as senior officer. Ask about time, place, people, evidence and risk; separate facts from speculation." : "当前是向M汇报模式：M作为上级接收汇报，追问时间、地点、人物、证据和风险；区分事实与推测。") : "",
      mode === "quartermaster" ? (language === "en" ? "Q Branch equipment mode: distinguish documented canon from this non-canon training simulation. Ask about mission requirements and explain use, limits and return conditions." : "当前是Q部门装备领取模式：区分原著事实与非正典训练模拟，根据任务目的说明装备用途、限制和归还要求。") : ""
    ].filter(Boolean).join("\\n\\n--- Character boundaries ---\\n\\n");
    const out = await generate(context.env || {}, [
      { role: "system", content: system },
      ...transcript
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
