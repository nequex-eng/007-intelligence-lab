// Production model policy: MiniMax only. Never silently route prompts to Cloudflare Workers AI.
export const MINIMAX_MODEL = "MiniMax-M3";
export const MINIMAX_URL = "https://api.minimaxi.com/v1/text/chatcompletion_v2";

export function llmAvailable(env) {
  return Boolean(env && typeof env.MINIMAX_API_KEY === "string" && env.MINIMAX_API_KEY.trim());
}

export function llmStatus(env) {
  if (llmAvailable(env)) return { provider: MINIMAX_MODEL, mode: "minimax", available: true };
  return { provider: null, mode: "not-configured", available: false, required: "MINIMAX_API_KEY" };
}

async function callMiniMax(env, messages) {
  const response = await fetch(MINIMAX_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + env.MINIMAX_API_KEY },
    body: JSON.stringify({ model: MINIMAX_MODEL, messages, temperature: 0.8, max_tokens: 2048 })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("MiniMax HTTP error", response.status, detail.slice(0, 500));
    return null;
  }
  const data = await response.json();
  if (data?.base_resp && data.base_resp.status_code !== 0) {
    console.error("MiniMax API error", data.base_resp.status_msg || data.base_resp.status_code);
    return null;
  }
  const content = data?.choices?.[0]?.message?.content;
  const text = Array.isArray(content) ? content.map(x => typeof x === "string" ? x : x.text || "").join("") : content;
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

export async function generate(env, messages) {
  if (!llmAvailable(env)) return { ok: false, code: "MODEL_NOT_CONNECTED" };
  try {
    const text = await callMiniMax(env, messages);
    return text ? { ok: true, text, model: MINIMAX_MODEL } : { ok: false, code: "MODEL_ERROR" };
  } catch (error) {
    console.error("MiniMax request failed", error?.message);
    return { ok: false, code: "MODEL_ERROR" };
  }
}
