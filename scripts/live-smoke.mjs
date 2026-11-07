import assert from "node:assert/strict";

const base = (process.env.LIVE_BASE_URL || "https://007-intelligence-lab.pages.dev").replace(/\/$/, "");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(path, timeout = 20000) {
  const response = await fetch(base + path, { headers: { "cache-control": "no-cache" }, signal: AbortSignal.timeout(timeout) });
  const body = await response.json();
  return { status: response.status, body };
}

async function postJson(path, payload, timeout = 90000) {
  const response = await fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json", "cache-control": "no-cache" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeout)
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

let status;
for (let attempt = 1; attempt <= 24; attempt++) {
  try {
    const result = await getJson("/api/status");
    if (result.status === 200 && result.body?.llm?.mode === "minimax" && result.body?.llm?.available === true) {
      status = result.body;
      break;
    }
  } catch {}
  await sleep(5000);
}
assert.ok(status, "production API status must report MiniMax as available after deployment");
console.log("PASS status", status.llm, status.data);

const world = await getJson("/api/world");
assert.equal(world.status, 200);
assert.ok(world.body.locations?.length >= 100, "world explorer must return canon locations");
console.log("PASS world explorer", world.body.locations.length, "locations");

const mission = await getJson("/api/mission?id=casino-royale");
assert.equal(mission.status, 200);
assert.equal(mission.body.missionMode, "interactive-adaptation");
assert.ok(mission.body.facts?.length > 0, "mission control must return canon evidence");
console.log("PASS mission control", mission.body.novel?.id, mission.body.facts.length, "facts");

const cases = [
  {
    name: "character talk",
    path: "/api/chat",
    payload: {
      characterId: "bond", novelId: "casino-royale", mode: "talk",
      messages: [{ role: "user", content: "请用两句话说明你在皇家赌场的任务。" }]
    },
    validate: (body) => typeof body.reply === "string" && body.reply.trim().length > 10 && body.model === "MiniMax-M3"
  },
  {
    name: "M reporting",
    path: "/api/chat",
    payload: {
      characterId: "m", novelId: "casino-royale", chapterNo: 2, mode: "report",
      messages: [{ role: "user", content: "我已抵达皇家莱索赌场。请确认任务目标，并指出我应优先核实的情报。" }]
    },
    validate: (body) => typeof body.reply === "string" && body.reply.trim().length > 10 && body.mode === "report"
  },
  {
    name: "Q quartermaster",
    path: "/api/chat",
    payload: {
      characterId: "q", novelId: "casino-royale", mode: "quartermaster",
      messages: [{ role: "user", content: "我即将前往皇家莱索赌场，需要哪些监听与通信装备？" }]
    },
    validate: (body) => typeof body.reply === "string" && body.reply.trim().length > 10 && body.mode === "quartermaster"
  },
  {
    name: "multi-character group",
    path: "/api/chat",
    payload: {
      characterIds: ["bond", "mathis"], novelId: "casino-royale", chapterNo: 4, mode: "group",
      messages: [{ role: "user", content: "请两位简短讨论如何协同监视勒·希弗。" }]
    },
    validate: (body) => typeof body.reply === "string" && body.reply.trim().length > 10 && body.mode === "group"
  },
  {
    name: "literary analysis",
    path: "/api/literary",
    payload: { question: "邦德在《皇家赌场》中如何面对薇丝朋的背叛？请简要分析。" },
    validate: (body) => typeof body.answer === "string" && body.answer.trim().length > 80 && Array.isArray(body.evidence) && body.evidence.length > 0
  }
];

for (const test of cases) {
  const result = await postJson(test.path, test.payload);
  assert.equal(result.status, 200, `${test.name} HTTP status; response: ${JSON.stringify(result.body).slice(0, 700)}`);
  assert.ok(test.validate(result.body), `${test.name} must return a non-empty model answer; response: ${JSON.stringify(result.body).slice(0, 700)}`);
  const answer = result.body.reply || result.body.answer;
  console.log("PASS", test.name, result.body.model || "MiniMax-M3", answer.length, "characters");
}

console.log("PASS live production smoke: status, world, mission, talk, M report, Q, group chat, literary analysis");
