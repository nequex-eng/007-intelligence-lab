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

export function minimaxPayload(messages) {
  return {
    model: MINIMAX_MODEL,
    messages,
    temperature: 1,
    max_completion_tokens: 4096,
    stream: false,
    reasoning_split: true,
    thinking: { type: "disabled" }
  };
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
    body: JSON.stringify(minimaxPayload(messages))
  });
  const raw = await response.text().catch(() => "");
  if (!response.ok) {
    const reason = `HTTP ${response.status}: ${raw.slice(0, 240)}`;
    console.error("MiniMax HTTP error", reason);
    return { ok: false, reason };
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    const reason = `Non-JSON response: ${raw.slice(0, 200)}`;
    console.error("MiniMax returned non-JSON response", reason);
    return { ok: false, reason };
  }
  if (data?.base_resp && Number(data.base_resp.status_code) !== 0) {
    const reason = `MiniMax ${data.base_resp.status_code}: ${data.base_resp.status_msg || "API error"}`;
    console.error("MiniMax API error", reason);
    return { ok: false, reason };
  }
  const message = data?.choices?.[0]?.message;
  const content = message?.content;
  const text = Array.isArray(content)
    ? content.map(x => typeof x === "string" ? x : x.text || "").join("")
    : content;
  if (typeof text === "string" && text.trim()) return { ok: true, text: text.trim() };
  const choice = data?.choices?.[0];
  const msg = choice?.message || {};
  const reason = `Empty content; top=${Object.keys(data || {}).join(",")}; choice=${Object.keys(choice || {}).join(",")}; message=${Object.keys(msg).join(",")}; finish=${choice?.finish_reason || "none"}; reasoningChars=${typeof msg.reasoning_content === "string" ? msg.reasoning_content.length : 0}; replyChars=${typeof data?.reply === "string" ? data.reply.length : 0}`;
  console.error("MiniMax response shape", reason);
  return { ok: false, reason };
}

export async function generate(env, messages) {
  if (!llmAvailable(env)) return { ok: false, code: "MODEL_NOT_CONNECTED" };
  try {
    const result = await callMiniMax(env, messages);
    return result.ok
      ? { ok: true, text: result.text, model: MINIMAX_MODEL }
      : { ok: false, code: "MODEL_ERROR", reason: result.reason };
  } catch (error) {
    console.error("MiniMax request failed", error?.message);
    return { ok: false, code: "MODEL_ERROR", reason: error?.message || "Unknown MiniMax error" };
  }
}
