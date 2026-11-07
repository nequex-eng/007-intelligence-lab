import { generate, llmStatus } from "../_lib/llm.js";
import { searchCanon } from "../_lib/canon.js";

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const question = String(body.question || "").trim().slice(0, 1200);
    if (!question) return json({ error: "请输入文学研究问题", evidence: [] }, 400);
    const compact = question.replace(/如何|为什么|怎样|怎么|是否|以及|通过|推动|分析|研究|比较|请问|请你|帮我|一下|对于|关于|的|了|吗|呢|？|\?/g, "");
    const terms = Array.from(new Set([
      ...(question.match(/[A-Za-z0-9-]{2,}/g) || []),
      ...Array.from({ length: Math.max(0, compact.length - 1) }, (_, i) => compact.slice(i, i + 2)).filter(term => term.length === 2)
    ])).filter(term => term.length >= 2).slice(0, 18);
    const hits = [];
    for (const term of terms) {
      for (const item of searchCanon(term, "all", 5)) hits.push(item);
      if (hits.length >= 48) break;
    }
    const seen = new Set();
    const evidence = hits.filter(item => {
      const key = [item.kind, item.id, item.entity, item.fact, item.title_zh, item.name_zh].join("|");
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).slice(0, 12).map(item => ({
      title: item.title_zh || item.name_zh || item.name || item.entity || item.id || "原著记录",
      kind: item.canon_or_inference === "inference" ? "推测" : item.canon_or_inference === "canon" ? "正典事实" : item.kind || "档案",
      source: [item.title_zh && item.novel_id ? item.title_zh : null, item.chapter ? "第" + item.chapter + "章" : null].filter(Boolean).join(" · ") || item.novel_id || (item.sources || []).join("；") || "索引记录",
      detail: item.fact || item.description || item.summary || item.role || item.quote || "该条目没有提供摘要字段。"
    }));
    const system = [
      "你是007文学研究与创作实验室的研究员，研究对象是伊恩·弗莱明的邦德小说。",
      "只根据用户问题和给定的核验知识库证据作答。清楚区分原著事实、研究推断和原创创作建议。",
      "没有证据支持的细节必须明确标注为未知，不得把电影设定当作小说事实，不得编造章节、引文或人物行为。",
      "请用中文输出结构清晰、有实质分析的回答：核心观点、叙事/人物/悬念分析、证据依据、证据不足之处。"
    ].join("\n");
    const out = await generate(context.env || {}, [
      { role: "system", content: system },
      { role: "user", content: "研究问题：" + question + "\n\n核验知识库检索结果：\n" + JSON.stringify(evidence) }
    ]);
    if (out.ok) return json({ answer: out.text, model: out.model, evidence });
    return json({
      error: out.code === "MODEL_NOT_CONNECTED"
        ? "MiniMax 尚未配置：已返回知识库检索证据；配置生产环境 MINIMAX_API_KEY 后即可生成文学分析。"
        : "MiniMax 请求失败：请检查 API Key、模型权限与账户额度。以下保留已检索证据。",
      code: out.code,
      modelStatus: llmStatus(context.env || {}),
      evidence
    }, out.code === "MODEL_NOT_CONNECTED" ? 503 : 502);
  } catch (error) {
    console.error("literary request failed", error?.message);
    return json({ error: "文学研究请求处理失败，请稍后重试。", evidence: [] }, 400);
  }
}

export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return json({ error: "只接受POST" }, 405);
}
