import assert from "node:assert/strict";
import { onRequest as status } from "../functions/api/status.js";
import { onRequest as dossier } from "../functions/api/dossier.js";
import { onRequest as characters } from "../functions/api/characters.js";
import { onRequest as world } from "../functions/api/world.js";
import { onRequest as mission } from "../functions/api/mission.js";
import { onRequest as canon } from "../functions/api/canon.js";
import { onRequestPost as chat } from "../functions/api/chat.js";

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

const s = await json(await status(ctx("/api/status")));
assert.equal(s.status, 200);
assert.equal(s.body.dataState, "verified-canon");
assert.equal(s.body.data.facts, 773);
assert.equal(s.body.data.coreCharacters, 32);

const d = await json(await dossier(ctx("/api/dossier?q=Bond&limit=20")));
assert.equal(d.status, 200);
assert.ok(d.body.results.length > 0, "dossier search returns canon matches");

const b = await json(await dossier(ctx("/api/dossier?kind=books")));
assert.equal(b.body.books.length, 14);

const c = await json(await characters());
assert.equal(c.body.characters.length, 32);

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

const ambiguous = await json(await canon(ctx("/api/canon?action=resolve&q=Molony&kind=characters")));
assert.equal(ambiguous.body.result.ambiguous, true);

console.log("PASS: API handler integration", { facts: s.body.data.facts, characters: c.body.characters.length, locations: w.body.locations.length, books: b.body.books.length });
