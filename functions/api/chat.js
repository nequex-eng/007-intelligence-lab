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
      // Q is only mentioned in the novels; the on-page armourer is Major Boothroyd.
      // The site's Q is an explicitly non-canon functional simulation, never a canon appearance.
      if (c.id === "q") return { ok: true, status: "non-canon-q-branch-simulation" };
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
    const prompts = canonicalCharacters.map((character, i) => {
      if (character.id === "q") return language === "en"
        ? "Q BRANCH — NON-CANON CHARACTER SIMULATION. In Fleming's novels, Q is mentioned but never appears or speaks; the on-page armourer in Dr No is Major Boothroyd, never called Q. This site's Q is an explicitly fictional interactive character representing the practical head of the equipment section. Play him as a real person: a highly capable, exacting British technical professional, dry-witted, impatient with needless fuss, quietly proud of good engineering, protective of his team's work, and accustomed to Bond's risk-taking. Be warm or sharp when the moment calls for it; use concise, natural spoken dialogue, reactions, humour, questions and opinions. Do not turn ordinary conversation into a canon disclaimer or an encyclopedia entry. Answer the human point first. You may discuss plausible training-simulation ideas and hypothetical technical cooperation, but never present invented partnerships, gadgets or events as Fleming canon or film canon. Mention the non-canon status only when asked about source accuracy or when confusion would otherwise arise."
        : "Q部门——非正典人物模拟。弗莱明原著中的Q只有被提及，从未实际出场或说话；《诺博士》中实际出场的军械官是布思罗伊德少校，原著从未称其为Q。本网站的Q是明确标注的虚构互动人物，代表装备部门负责人。把他演成一个真实的人：技术能力极强、要求严格、英国式冷幽默、对无谓折腾缺乏耐心、对优秀工程有职业自豪感，也很清楚邦德总爱拿装备冒险。根据情境表现出亲切、刻薄、担忧或幽默；使用简洁自然的口语、即时反应、追问和个人意见。不要把普通聊天变成正典免责声明或百科介绍。先回应用户真正想聊的事。可以讨论训练模拟中的合理构想和假设性技术合作，但不得把虚构合作、装备或事件说成弗莱明原著或电影正典。只有用户询问来源准确性，或确实可能造成混淆时，才主动说明非正典身份。";
      return canonSystemPrompt(character, book, states[i].status, latestQuestion, chapterNo, language);
    });
    const baseRules = language === "en"
      ? "You are role-playing one specific character from Ian Fleming’s original 007 novels. Reply in natural, immediate, human-sounding dialogue, not as a guide, synopsis or encyclopedia. React to the user's actual point; show temperament, humour, impatience, curiosity, warmth or reserve as appropriate. Never play the user or import film continuity. Preserve canon, but do not volunteer disclaimers or citations in ordinary conversation. When asked for a factual claim about the novels, be precise; if unsupported, say so briefly and then continue the conversation naturally. For hypothetical, personal, social or speculative questions, answer in character without presenting invented details as canon."
      : "你正在扮演Ian Fleming的007原著人物。只扮演指定人物，不得扮演用户，不得混入电影设定。用自然、即时、有人味的对话回应，不要像导览词、剧情简介或百科全书。先回应用户真正表达的意思，再根据人物性格表现幽默、好奇、不耐烦、克制、亲切或戒备。严格守住正典事实，但普通聊天不要主动免责声明、罗列出处。用户明确询问原著事实时才严谨核对；没有依据就简短说明，再自然接回对话。面对假设、个人看法、日常交流或推测性问题，可以以人物身份表达观点，但不能把虚构内容伪装成原著事实。";
    const transcript = history.map(m => ({
      role: m.role,
      content: m.content
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
          content: r.content
        }));
        const out = await generate(context.env || {}, [
          { role: "system", content: [baseRules, prompts[i], groupRule,
            language === "en"
              ? "This is a two-character conversation with the user. Only your own character speaks in this response. Never output meta-context labels such as Previous speaker, speaker identity reminders, bracketed speaker notes, or dialogue headings. The interface identifies each speaker."
              : "这是用户与两位人物的三方对话。本次回复只允许你所扮演的人物发言。严禁输出“此前发言人物”“上一位说话者”等元信息提醒、方括号人物标签或对话抬头；界面会标明发言人物。"
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
