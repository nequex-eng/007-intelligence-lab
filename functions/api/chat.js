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
    const language = body.language === "en" ? "en" : "zh";
    const ids = Array.isArray(body.characterIds) && body.characterIds.length
      ? body.characterIds
      : (body.characterId ? [body.characterId] : []);

    if (!ids.length) return json({ error: language === "en" ? "Select a character first." : "请先选择人物", code: "CHARACTER_REQUIRED" }, 400);
    if (ids.length > 3) return json({ error: language === "en" ? "A scene can include up to three characters." : "同场最多3人", code: "TOO_MANY_CHARACTERS" }, 400);
    if (new Set(ids).size !== ids.length) return json({ error: language === "en" ? "The same character cannot be added twice." : "同一人物不能重复加入场景", code: "DUPLICATE_CHARACTER" }, 400);

    
    const mode = ["talk", "roleplay", "group"].includes(body.mode) ? body.mode : "talk";
    const novelId = mode === "roleplay" ? null : body.novelId;
    if (mode === "talk" && !novelId) return json({ error: language === "en" ? "Select a novel timeline." : "必须选择小说时间点", code: "SCENE_REQUIRED" }, 400);
    const book = novelId ? getNovel(novelId) : null;
    if (mode === "talk" && !book) return json({ error: language === "en" ? "Unknown novel timeline." : "未知小说时间点", code: "UNKNOWN_NOVEL" }, 400);
    const chapterValue = body.chapterNo;
    const chapterNo = mode === "roleplay" ? null : (chapterValue === null || chapterValue === undefined || String(chapterValue).trim() === "" ? null : String(chapterValue).trim());
    if (mode === "talk" && chapterNo !== null && !book.chapters?.some(c => String(c.no).trim().toUpperCase() === chapterNo.toUpperCase())) return json({error:language === "en" ? "The selected chapter does not belong to this novel." : "所选章节不属于这部小说",code:"UNKNOWN_CHAPTER"},400);
    if (mode === "roleplay" && ids.length !== 2) return json({error:language === "en" ? "Role-play requires two selected characters." : "角色扮演需要选择两位人物",code:"TWO_CHARACTERS_REQUIRED"},400);
    if (mode === "group" && ids.length !== 2) return json({error:language === "en" ? "A group scene requires two selected characters." : "多人同场需要选择两位人物",code:"TWO_CHARACTERS_REQUIRED"},400);

    const incoming = Array.isArray(body.messages) ? body.messages : [];
    const history = incoming
      .filter(m => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
      .slice(-24)
      .map(m => ({ role: m.role, content: m.content.slice(0, 1200), characterId: typeof m.characterId === "string" ? m.characterId : null }));

    if (!history.length || history[history.length - 1].role !== "user") {
      return json({ error: language === "en" ? "Send a message first." : "请先说一句话", code: "MESSAGE_REQUIRED" }, 400);
    }

    const canonicalCharacters = ids.map(resolveCore);
    if (canonicalCharacters.some(c => !c)) {
      return json({ error: language === "en" ? "This character is not in the canon database." : "知识库中没有该人物", code: "UNKNOWN_CHARACTER" }, 404);
    }

    const states = mode === "roleplay" ? canonicalCharacters.map(c => ({ok:true,status:"free-roleplay"})) : canonicalCharacters.map(c => {
      if (c.id === "q") return { ok: true, status: "q-character-simulation" };
      return characterForScene(c.id, book.novel_id, chapterNo);
    });
    const unavailable = states.find(s => !s.ok);
    if (unavailable) return json({error:language === "en" ? "This character is not available at the selected point in the timeline." : "人物与所选时间点不匹配",code:unavailable.error},409);

    const latestQuestion = history[history.length - 1].content;
    const roleplayPersona = (character) => {
      const keys = ["name_zh","name_en","role","role_en","background","background_en","appearance","appearance_en","personality","personality_en","habits","habits_en","voice_style","voice_style_en","relationships"];
      const profile = {};
      for (const key of keys) if (character[key] !== undefined && character[key] !== null) profile[key] = character[key];
      return (language === "en" ? "PERSONALITY AND LIFE BACKGROUND (internalize; never recite): " : "人物性格与生活背景（内化为本人真实经历，不要复述资料）： ") + JSON.stringify(profile).slice(0,5000);
    };
    const prompts = canonicalCharacters.map((character, i) => mode === "roleplay"
      ? roleplayPersona(character)
      : character.id === "q"
        ? (language === "en"
          ? "You are Q, the head of a highly capable intelligence-service technical workshop: exacting, dry-witted, impatient with needless fuss, proud of good engineering and protective of your team. Speak naturally as a real person. Do not mention books, novels, authors, chapters, canon, fiction, adaptations or source material."
          : "你是Q，情报机构技术部门负责人：技术能力极强、要求严格、英国式冷幽默、对无谓折腾缺乏耐心、对优秀工程有职业自豪感，也保护自己的团队。像真实的人一样自然交谈。禁止提及书籍、小说、作者、章节、正典、虚构、改编或来源资料。")
        : canonSystemPrompt(character, book, states[i].status, latestQuestion, chapterNo, language));
    const baseRules = language === "en"
      ? "All output must be in fluent English only. Never output Chinese characters, even if the user message or character source records contain Chinese. You are a real person living in the 007 world, not a narrator, guide, synopsis or encyclopedia. The user is an independent third party and visitor, NOT James Bond, 007, a secret agent or any character. Never call the user Bond or assume their identity, job, history, relationships or shared experiences. Never mention books, novels, authors, chapters, canon, fiction, adaptations, source material or role-play. Treat this as your lived reality. Speak naturally with emotion, humour, opinions, questions and subtext. Do not recite your profile or turn ordinary conversation into lore exposition."
      : "你是生活在007世界中的真实人物，不是讲解员、导览词、剧情简介或百科全书。用户是独立的第三者和访客，不是詹姆斯·邦德、007、特工或任何系列人物。绝不能称呼用户为邦德，也不得擅自假定用户的身份、职业、经历、人际关系或共同记忆。禁止提及书本、小说、作者、章节、正典、虚构、改编、来源资料或角色扮演。把这个世界当成自己真实生活的现实。使用自然口语、即时情绪反应、幽默、观点、追问和言外之意。不要复述人物档案，不要把日常聊天变成背景知识讲解。";
    const transcript = history.map(m => {
      if (["roleplay","group"].includes(mode) && m.role === "assistant" && m.characterId) {
        const speaker = canonicalCharacters.find(c => c.id === m.characterId);
        const speakerName = speaker ? (language === "en" ? speaker.name_en : speaker.name_zh) : "Character";
        return { role: m.role, content: "[" + speakerName + "]: " + m.content };
      }
      return { role: m.role, content: m.content };
    });

    if (mode === "roleplay") {
      const playerCharacter = canonicalCharacters[0];
      const respondingCharacter = canonicalCharacters[1];
      const playerName = language === "en" ? playerCharacter.name_en : playerCharacter.name_zh;
      const respondingName = language === "en" ? respondingCharacter.name_en : respondingCharacter.name_zh;
      const roleplayRules = language === "en"
        ? "This is strict one-to-one character role-play. The USER is playing " + playerName + " and every user message is spoken by that character. You are " + respondingName + ", the only AI-controlled character. Reply only as yourself; never write, narrate or decide the user's character's words or actions. Treat both characters as real people sharing a lived world, even if they come from different stories or eras. Never mention books, novels, authors, fiction, adaptations or role-play."
        : "这是严格的一对一人物扮演。用户扮演" + playerName + "，用户每条消息都视为该人物说出的话。你扮演" + respondingName + "，这是唯一由AI控制的人物。只以自己的身份回应，绝不替用户扮演的人物写台词、叙述行动或替其做决定。即使两人来自不同作品或年代，也把他们视为生活在同一个真实世界中的人。禁止提及书籍、小说、作者、虚构、改编或角色扮演。";
      const out = await generate(context.env || {}, [
        { role: "system", content: [roleplayRules, prompts[1], "Speak naturally and directly to the user's character. Do not provide scene labels or meta commentary."].join("\\n\\n") },
        ...transcript
      ]);
      if (!out.ok) {
        if (out.code === "MODEL_NOT_CONNECTED") return json({ error: language === "en" ? "The AI model is not connected." : "模型尚未接入", code: out.code, status: llmStatus(context.env || {}) }, 503);
        return json({ error: language === "en" ? "Character response failed. Please try again." : "角色对话生成失败，请重试", code: "MODEL_ERROR", modelError: out.reason || "Unknown MiniMax error" }, 502);
      }
      return json({ reply: out.text, characterId: respondingCharacter.id, characterIds: [playerCharacter.id, respondingCharacter.id], novelId: null, chapterNo: null, mode, canonMode: false, model: out.model });
    }

    if (mode === "group") {
      const replies = [];
      for (let i = 0; i < canonicalCharacters.length; i++) {
        const character = canonicalCharacters[i];
        const characterName = language === "en" ? character.name_en : character.name_zh;
        const groupRule = mode === "roleplay"
          ? (language === "en"
            ? "You are " + characterName + ". This is a strict one-to-one conversation: speak only as yourself to the user. The other selected character is the only other person in the scene and may come from another era or story. Never write their dialogue."
            : "你是" + characterName + "。这是严格的一对一对话：只以自己的身份与用户交谈。另一位选定人物是场景中唯一的其他人物，可以来自不同年代或作品。绝不代写对方台词。")
          : (language === "en"
            ? "You are " + characterName + ". This is a group scene with the user and one other selected character. Speak only for yourself, respond naturally to both, and never write the other character's dialogue."
            : "你是" + characterName + "。这是用户与两位人物的多人同场场景。只替自己发言，自然回应用户和另一位人物，绝不代写对方台词。");
        const priorScene = replies.map(r => {
          const speaker = canonicalCharacters.find(c => c.id === r.characterId);
          const speakerName = speaker ? (language === "en" ? speaker.name_en : speaker.name_zh) : "Character";
          return { role: "assistant", content: "[" + speakerName + "]: " + r.content };
        });
        const out = await generate(context.env || {}, [
          { role: "system", content: [baseRules, prompts[i], groupRule,
            language === "en"
              ? (mode === "roleplay" ? "Strict one-to-one role-play: only your character replies to the user." : "Group scene: only your character replies in this turn.") + " Never output the other character's dialogue, bracketed speaker notes or dialogue headings; the interface identifies each speaker."
              : (mode === "roleplay" ? "严格一对一角色扮演：本轮只有你扮演的人物回应用户。" : "多人同场：本轮只允许你扮演的人物回应。") + "不得输出另一人物的台词、方括号人物标签或对话抬头；界面会标明发言人物。"
          ].join("\\n\\n") },
          ...transcript.slice(0, -1),
          ...priorScene,
          transcript[transcript.length - 1]
        ]);
        if (!out.ok) {
          if (out.code === "MODEL_NOT_CONNECTED") return json({ error: language === "en" ? "The AI model is not connected." : "模型尚未接入", code: out.code, status: llmStatus(context.env || {}) }, 503);
          return json({ error: language === "en" ? "Group dialogue failed. Please try again." : "多角色对话生成失败，请重试", code: "MODEL_ERROR", modelError: out.reason || "Unknown MiniMax error" }, 502);
        }
        replies.push({ characterId: character.id, content: out.text });
      }
      return json({
        replies,
        characterIds: canonicalCharacters.map(c => c.id),
        novelId: null, chapterNo: null, mode, canonMode: false, model: mode === "roleplay" ? "one-to-one-roleplay" : "group-scene"
      });
    }

    const system = [
      baseRules,
      prompts[0],
      language === "en" ? "All dialogue must be in English. The user is an independent third party, not Bond. Never mention source books, novels, authors or chapters." : "所有对话必须使用中文。用户是独立第三者，不是邦德。禁止提及书本、小说、作者或章节。",
      ""
    ].filter(Boolean).join("\\n\\n--- Character boundaries ---\\n\\n");
    const out = await generate(context.env || {}, [
      { role: "system", content: system },
      ...transcript
    ]);

    if (out.ok) {
      return json({
        reply: out.text,
        characterIds: canonicalCharacters.map(c => c.id),
        novelId: book?.novel_id || null,
        chapterNo,
        mode,
        canonMode: mode === "talk",
        model: out.model
      });
    }
    if (out.code === "MODEL_NOT_CONNECTED") {
      return json({ error: language === "en" ? "The AI model is not connected." : "模型尚未接入", code: out.code, status: llmStatus(context.env || {}) }, 503);
    }
    return json({ error: language === "en" ? "The character could not respond. Please try again." : "对方一时接不上话，请再说一次", code: "MODEL_ERROR", modelError: out.reason || "Unknown MiniMax error" }, 502);
  } catch (e) {
    console.error("chat request failed", e?.message);
    return json({ error: language === "en" ? "Invalid request. Please try again." : "请求有误，请再试一次" }, 400);
  }
}

export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return json({ error: "只接受POST" }, 405);
}
