// 可替换Provider架构：主路MiniMax-M3，备用Workers AI Llama。
// 密钥只读env.MINIMAX_API_KEY，绝不写进前端、不写进代码。
// 未配置密钥时不发起任何模型调用，调用方返回明确的待接入状态。
export const MINIMAX_MODEL = "MiniMax-M3";
export const MINIMAX_URL = "https://api.minimaxi.com/v1/text/chatcompletion_v2";
export const LLAMA_MODELS = [
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "@cf/meta/llama-3.1-8b-instruct",
  "@cf/mistral/mistral-7b-instruct-v0.1"
];

export function llmAvailable(env) {
  return Boolean((env && env.MINIMAX_API_KEY) || (env && env.AI));
}

export function llmStatus(env) {
  if (env && env.MINIMAX_API_KEY) return { provider: MINIMAX_MODEL, mode: "minimax", available: true };
  if (env && env.AI) return { provider: LLAMA_MODELS[0], mode: "workers-ai", available: true };
  return { provider: null, mode: "offline", available: false };
}

async function callMiniMax(env, messages) {
  const r = await fetch(MINIMAX_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + env.MINIMAX_API_KEY },
    body: JSON.stringify({ model: MINIMAX_MODEL, messages, temperature: 0.8, max_tokens: 1024 })
  });
  if (!r.ok) return null;
  const d = await r.json();
  if (!d || !d.base_resp || d.base_resp.status_code !== 0) return null;
  const text = d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
  return text && text.trim() ? text.trim() : null;
}

async function callLlama(env, messages) {
  let lastErr = null;
  for (const model of LLAMA_MODELS) {
    try {
      const out = await env.AI.run(model, { messages, max_tokens: 350, temperature: 0.8 });
      const text = typeof out === "string" ? out : out.response || out.text || "";
      if (text && text.trim()) return { text: text.trim(), model };
      lastErr = new Error("empty response from " + model);
    } catch (e) { lastErr = e; }
  }
  console.error("llama fallback failed:", lastErr && lastErr.message);
  return null;
}

// 统一入口：返回{ok,text,model}或{ok:false,code}。
// code为MODEL_NOT_CONNECTED表示未接入模型；MODEL_ERROR表示调用失败。
export async function generate(env, messages) {
  if (env && env.MINIMAX_API_KEY) {
    try {
      const text = await callMiniMax(env, messages);
      if (text) return { ok: true, text, model: MINIMAX_MODEL };
      console.error("minimax returned no content, falling back");
    } catch (e) { console.error("minimax failed:", e && e.message); }
  }
  if (env && env.AI) {
    const out = await callLlama(env, messages);
    if (out) return { ok: true, text: out.text, model: out.model };
  }
  if (!llmAvailable(env)) return { ok: false, code: "MODEL_NOT_CONNECTED" };
  return { ok: false, code: "MODEL_ERROR" };
}
