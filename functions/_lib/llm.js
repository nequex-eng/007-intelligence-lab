// Production model policy: MiniMax only. Never silently route prompts to Cloudflare Workers AI.
export const MINIMAX_MODEL = "MiniMax-M3";
// MiniMax M3 is served through the OpenAI-compatible Chat Completions API.
// The legacy text/chatcompletion_v2 endpoint is documented for MiniMax-Text-01,
// not the current M3 family.
export const MINIMAX_URL = "https://api.minimaxi.com/v1/chat/completions";

export function minimaxKey(env) {
  const primary = typeof env?.MINIMAX_API_KEY === "string" ? env.MINIMAX_API_KEY.trim() : "";
  const alternate = typeof env?.MINIMAX_API_KEY1 === "string" ? env.MINIMAX_API_KEY1.trim() : "";
  return primary || alternate;
}

export function llmAvailable(env) {
  return Boolean(minimaxKey(env));
}

export function llmStatus(env) {
  if (llmAvailable(env)) return { provider: MINIMAX_MODEL, mode: "minimax", available: true };
  return { provider: null, mode: "not-configured", available: false, required: "MINIMAX_API_KEY or MINIMAX_API_KEY1" };
}

async function callMiniMax(env, messages) {
  const response = await fetch(MINIMAX_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + minimaxKey(env) },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      messages,
      temperature: 1,
      max_completion_tokens: 2048,
      stream: false,
      reasoning_split: true
    })
  });
  const raw = await response.text().catch(() => "");
  if (!response.ok) {
    console.error("MiniMax HTTP error", response.status, raw.slice(0, 500));
    return null;
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error("MiniMax returned non-JSON response", raw.slice(0, 300));
    return null;
  }
  if (data?.base_resp && Number(data.base_resp.status_code) !== 0) {
    console.error("MiniMax API error", data.base_resp.status_msg || data.base_resp.status_code);
    return null;
  }
  const message = data?.choices?.[0]?.message;
  const content = message?.content;
  const text = Array.isArray(content)
    ? content.map(x => typeof x === "string" ? x : x.text || "").join("")
    : content;
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
