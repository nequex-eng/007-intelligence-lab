import { generate, llmStatus } from "../_lib/llm.js";

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const language = body.language === "en" ? "en" : "zh";
    const scene = String(body.scene || "").slice(0, 100);
    const setting = String(body.setting || "").slice(0, 1600);
    const action = String(body.action || "").trim().slice(0, 1000);
    if (!scene || !action) return json({ error: language === "en" ? "Choose a scene and describe your action." : "请选择场景并描述行动。" }, 400);
    const history = (Array.isArray(body.history) ? body.history : [])
      .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
      .slice(-12).map(m => ({ role: m.role, content: m.content.slice(0, 1200) }));
    const system = language === "en"
      ? "You are the interactive game master for a branching, realistic James Bond field-operation simulation. The USER is James Bond, 007. You control every other character and the world; never speak or decide for Bond. Treat the scene as lived reality, not a book or film. Maintain continuity with the supplied history. Every action has uncertain consequences: assess plausibility, exposure, time, money, equipment, injuries, trust and intelligence. Do not make every action succeed. Sometimes actions fail, partially succeed, trigger complications, consume resources or close routes. Avoid arbitrary punishment: explain consequences through the situation. Write vivid, concise thriller prose with dialogue and sensory detail. End each turn with exactly three distinct actionable options, but explicitly allow the user to type any other action. Do not reveal hidden checks or probabilities. Do not resolve the entire mission in one reply."
      : "你是一个分支式、写实风格的詹姆斯·邦德实战模拟游戏主持人。用户就是詹姆斯·邦德，007。你控制其他所有人物和外部世界，绝不替邦德说话或替他做决定。把场景当作真实生活，不得提及书籍或电影。严格延续提供的历史。每个行动都有不确定后果：评估合理性、暴露、时间、资金、装备、伤势、信任和情报。不要让每个行动都成功。行动可能失败、部分成功、引发意外、消耗资源或关闭路线。后果必须由场景逻辑推动，不要无缘无故惩罚玩家。用有画面感、简洁的间谍惊悚叙事，包含人物对话和感官细节。每轮结尾给出恰好三个不同的可执行选项，同时允许用户输入其他行动。不要透露隐藏检定或成功概率。不要一条回复就结束整场任务。";
    const out = await generate(context.env || {}, [
      { role: "system", content: system + "\n\nCURRENT SCENE: " + scene + "\nSCENE BRIEF: " + setting },
      ...history,
      { role: "user", content: action }
    ]);
    if (!out.ok) {
      if (out.code === "MODEL_NOT_CONNECTED") return json({ error: language === "en" ? "The MiniMax model is not configured." : "MiniMax模型尚未配置。", code: out.code, status: llmStatus(context.env || {}) }, 503);
      return json({ error: language === "en" ? "The field simulation could not continue. Please try again." : "实战模拟暂时无法继续，请重试。", code: out.code }, 502);
    }
    return json({ reply: out.text, model: out.model });
  } catch (e) {
    return json({ error: "Invalid request." }, 400);
  }
}

export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return json({ error: "Method not allowed." }, 405);
}
