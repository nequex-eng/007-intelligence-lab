import assert from "node:assert/strict";
import { onRequest as status } from "../functions/api/status.js";
import { onRequest as dossier } from "../functions/api/dossier.js";
import { onRequest as characters } from "../functions/api/characters.js";
import { onRequest as world } from "../functions/api/world.js";
import { onRequest as mission } from "../functions/api/mission.js";
import { onRequest as canon } from "../functions/api/canon.js";
import { onRequestPost as chat } from "../functions/api/chat.js";
import { onRequestPost as literary } from "../functions/api/literary.js";
import { llmAvailable, llmStatus, minimaxKey, minimaxPayload, MINIMAX_URL, MINIMAX_MODEL, generate } from "../functions/_lib/llm.js";

const ctx = (path) => ({ request: new Request("http://localhost" + path), env: {} });
const postCtx = (path, body) => ({
  request: new Request("http://localhost" + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  }),
  env: {}
});
const json = async (response) => ({ status: response.status, body: await response.json() });
assert.equal(llmAvailable({ MINIMAX_API_KEY1: "same-key" }), true, "alternate secret name is accepted");
assert.equal(minimaxKey({ MINIMAX_API_KEY: "", MINIMAX_API_KEY1: "same-key" }), "same-key");
assert.equal(llmStatus({ MINIMAX_API_KEY1: "same-key" }).mode, "minimax");
assert.equal(MINIMAX_URL, "https://api.minimaxi.com/v1/chat/completions", "M3 must use the OpenAI-compatible chat endpoint");
assert.equal(MINIMAX_MODEL, "MiniMax-M3");
const payload = minimaxPayload([{ role: "user", content: "ping" }]);
assert.equal(payload.thinking.type, "disabled", "M3 thinking must be disabled for latency-sensitive roleplay");
assert.equal(payload.max_completion_tokens, 4096);
assert.equal(payload.model, "MiniMax-M3");
const originalFetch = globalThis.fetch;
let mockedRequest;
try {
  globalThis.fetch = async (url, options) => {
    mockedRequest = { url, body: JSON.parse(options.body) };
    return new Response(JSON.stringify({ choices: [{ message: { content: "M3 mock reply" } }] }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const generated = await generate({ MINIMAX_API_KEY1: "same-key" }, [{ role: "user", content: "ping" }]);
  assert.equal(generated.ok, true, "MiniMax response parser accepts OpenAI-compatible message.content");
  assert.equal(generated.text, "M3 mock reply");
  assert.equal(mockedRequest.url, MINIMAX_URL);
  assert.equal(mockedRequest.body.thinking.type, "disabled");
} finally {
  globalThis.fetch = originalFetch;
}

const s = await json(await status(ctx("/api/status")));
assert.equal(s.status, 200);
assert.equal(s.body.dataState, "verified-canon");
assert.equal(s.body.llm.mode, "not-configured", "Workers AI must not be treated as the production model when MiniMax is absent");
assert.equal(s.body.data.facts, 773);
assert.equal(s.body.data.coreCharacters, 32);

const d = await json(await dossier(ctx("/api/dossier?q=Bond&limit=20")));
assert.equal(d.status, 200);
assert.ok(d.body.results.length > 0, "dossier search returns canon matches");

const b = await json(await dossier(ctx("/api/dossier?kind=books")));
assert.equal(b.body.books.length, 14);

const c = await json(await characters());
assert.equal(c.body.characters.length, 32);
assert.ok(c.body.characters.find(x => x.id === "bond")?.firstNovelId, "character API exposes first-appearance novel id");

const w = await json(await world());
assert.equal(w.body.locations.length, 170);

const m = await json(await mission(ctx("/api/mission?id=casino-royale")));
assert.equal(m.body.novel.id, "casino-royale");
assert.equal(m.body.missionMode, "interactive-adaptation");
assert.ok(m.body.facts.length > 0);
for (const novelId of ["dr-no", "goldfinger", "thunderball"]) {
  const missionBrief = await json(await mission(ctx("/api/mission?id=" + novelId)));
  assert.equal(missionBrief.status, 200, `mission brief exists for ${novelId}`);
  assert.ok(missionBrief.body.chapters.length > 0, `mission brief has chapters for ${novelId}`);
  assert.ok(missionBrief.body.facts.length > 0, `mission brief has canon facts for ${novelId}`);
}

const sceneOk = await json(await canon(ctx("/api/canon?action=scene&character=bond&novel=casino-royale")));
assert.equal(sceneOk.status, 200);
const sceneBlocked = await json(await canon(ctx("/api/canon?action=scene&character=m&novel=spy-who-loved-me")));
assert.equal(sceneBlocked.status, 409);

const chapters = await json(await canon(ctx("/api/canon?action=chapters&novel=casino-royale")));
assert.equal(chapters.status, 200);
assert.equal(chapters.body.chapters.length, 27, "chapter index is exposed from the knowledge base");
const mBeforeAppearance = await json(await canon(ctx("/api/canon?action=scene&character=m&novel=casino-royale&chapter=1")));
assert.equal(mBeforeAppearance.status, 409, "M cannot appear before chapter 2");
const mAtAppearance = await json(await canon(ctx("/api/canon?action=scene&character=m&novel=casino-royale&chapter=2")));
assert.equal(mAtAppearance.status, 200);
const leChiffreAfterExit = await json(await canon(ctx("/api/canon?action=scene&character=le-chiffre&novel=casino-royale&chapter=19")));
assert.equal(leChiffreAfterExit.status, 409, "Le Chiffre cannot appear after his last chapter");
const invalidSceneChapter = await json(await canon(ctx("/api/canon?action=scene&character=bond&novel=casino-royale&chapter=999")));
assert.equal(invalidSceneChapter.status, 400);
assert.equal(invalidSceneChapter.body.code, "UNKNOWN_CHAPTER");
const romanChapterScene = await json(await canon(ctx("/api/canon?action=scene&character=mr-big&novel=live-and-let-die&chapter=XXIII")));
assert.equal(romanChapterScene.status, 409, "Roman numeral chapter boundary must block characters after exit");

const reportWrongRecipient = await json(await chat(postCtx("/api/chat", {
  characterIds: ["bond"], mode: "report", novelId: "casino-royale",
  messages: [{ role: "user", content: "任务完成。" }]
})));
assert.equal(reportWrongRecipient.status, 400);
assert.equal(reportWrongRecipient.body.code, "REPORT_REQUIRES_M");

const chatWithoutTimeline = await json(await chat(postCtx("/api/chat", {
  characterIds: ["bond"],
  messages: [{ role: "user", content: "你是谁？" }]
})));
assert.equal(chatWithoutTimeline.status, 400);
assert.equal(chatWithoutTimeline.body.code, "SCENE_REQUIRED", "chat must require a selected canon timeline");

const chatValidButOffline = await json(await chat(postCtx("/api/chat", {
  characterIds: ["bond"],
  novelId: "casino-royale",
  chapterNo: 1,
  messages: [{ role: "user", content: "你是谁？" }]
})));
assert.equal(chatValidButOffline.status, 503);
assert.equal(chatValidButOffline.body.code, "MODEL_NOT_CONNECTED", "valid canon chat must stop cleanly when no model is configured");

const quartermasterSimulation = await json(await chat(postCtx("/api/chat", {
  characterIds: ["q"], mode: "quartermaster", novelId: "casino-royale",
  messages: [{ role: "user", content: "我即将前往皇家莱索赌场，需要哪些监听与通信装备？" }]
})));
assert.equal(quartermasterSimulation.status, 503, "Q quartermaster mode is an explicitly non-canon simulation and must reach model availability check");
assert.equal(quartermasterSimulation.body.code, "MODEL_NOT_CONNECTED");

const chatMBeforeAppearance = await json(await chat(postCtx("/api/chat", {
  characterIds: ["m"],
  novelId: "casino-royale",
  chapterNo: 1,
  messages: [{ role: "user", content: "你是谁？" }]
})));
assert.equal(chatMBeforeAppearance.status, 409, "M must be blocked before first appearance");
const chatLeChiffreAfterExit = await json(await chat(postCtx("/api/chat", {
  characterIds: ["le-chiffre"],
  novelId: "casino-royale",
  chapterNo: 19,
  messages: [{ role: "user", content: "你是谁？" }]
})));
assert.equal(chatLeChiffreAfterExit.status, 409, "Le Chiffre must be blocked after his last chapter");

const chatInvalidChapter = await json(await chat(postCtx("/api/chat", {
  characterIds: ["bond"],
  novelId: "casino-royale",
  chapterNo: 999,
  messages: [{ role: "user", content: "你是谁？" }]
})));
assert.equal(chatInvalidChapter.status, 400);
assert.equal(chatInvalidChapter.body.code, "UNKNOWN_CHAPTER");
const romanChapterChat = await json(await chat(postCtx("/api/chat", {
  characterIds: ["bond"],
  novelId: "live-and-let-die",
  chapterNo: "I",
  messages: [{ role: "user", content: "Mr Big是谁？" }]
})));
assert.equal(romanChapterChat.status, 503, "Roman numeral chapter IDs must pass validation before offline model check");
assert.equal(romanChapterChat.body.code, "MODEL_NOT_CONNECTED");

const chatFutureKnowledgeBlocked = await json(await chat(postCtx("/api/chat", {
  characterIds: ["vesper-lynd"],
  novelId: "live-and-let-die",
  messages: [{ role: "user", content: "你是谁？" }]
})));
assert.equal(chatFutureKnowledgeBlocked.status, 409, "dead character must not appear in later novel scenes");

const lit = await json(await literary(postCtx("/api/literary", { question: "邦德在皇家赌场的牌局如何推动人物塑造？" })));
assert.equal(lit.status, 503, "literary analysis reports missing MiniMax configuration instead of silent fallback");
assert.equal(lit.body.code, "MODEL_NOT_CONNECTED");
assert.ok(Array.isArray(lit.body.evidence));
assert.ok(lit.body.evidence.length > 0, "literary natural-language question retrieves supporting canon evidence");

const ambiguous = await json(await canon(ctx("/api/canon?action=resolve&q=Molony&kind=characters")));
assert.equal(ambiguous.body.result.ambiguous, true);

console.log("PASS: API handler integration", { facts: s.body.data.facts, characters: c.body.characters.length, locations: w.body.locations.length, books: b.body.books.length });
