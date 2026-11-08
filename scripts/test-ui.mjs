import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

const mainSections = [...html.matchAll(/<section[^>]*id="([^"]+)"/gi)].map(m => m[1]);
assert.deepEqual(mainSections, ["characters", "mission", "dossier", "atlas"], "main modules follow the requested navigation order");
assert.equal((html.match(/<section\b/g) || []).length, 4, "four opening main sections");
assert.equal((html.match(/<\/section>/g) || []).length, 4, "four closing main sections");

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
assert.deepEqual(duplicates, [], "static HTML ids must be unique");

assert.ok(html.includes('id="sceneNovel"') && html.includes('id="sceneChapter"'), "character theatre has novel and chapter selectors");
assert.ok(html.includes('id="trainingMode"') && html.includes('id="trainingScene"') && html.includes('id="trainingChoices"'), "mission control includes the AI field training UI");
assert.ok(!/\$\([^()\n]*\)\.forEach/.test(app), "all NodeList iteration uses the $ selector helper");
assert.ok(app.includes("async function startTraining") && app.includes("async function submitTrainingAction") && app.includes('fetch("/api/training"'), "field training is model-driven");
assert.ok(!html.includes("id=\"seriesGameIndex\"") && !html.includes("id=\"blackjackGame\"") && !html.includes("id=\"golfGame\""), "legacy local game index and modules are removed");
assert.ok(!html.includes('id="canonDataStatus"') && !html.includes('id="canonDataCard"'), "internal canon metadata is not exposed to site visitors");
assert.ok(!html.includes('id="import"'), "obsolete public TXT import UI is removed");
assert.ok(html.includes("leaflet@1.9.4/dist/leaflet.css") && html.includes("leaflet@1.9.4/dist/leaflet.js"), "Leaflet map assets are loaded");

for (const fn of [
  "async function initCharacters", "async function sendChat", "function initDossier",
  "function initExperience",
  "function initLiterary", "async function initAtlas", "function initFieldGames"
]) assert.ok(app.includes(fn), `required front-end module exists: ${fn}`);

assert.ok(app.includes('fetch("/api/world")'), "world explorer reads canonical location API");
assert.ok(app.includes('fetch("/api/canon?action=chapters&novel="'), "character theatre reads canonical chapter index");
assert.ok(app.includes('chapterNo: $("#sceneChapter").value || null'), "chat request includes selected chapter");
assert.ok(app.includes("firstNovelId"), "character selection automatically matches first-appearance novel");
assert.ok(app.includes('const modes = $$("#chatModes .chipbtn");'), "all chat mode buttons are selected as a collection before remote data loading");
assert.ok(app.includes('loadSceneChapters(scene.value);'), "chapter index loads without blocking initial character rendering");
assert.ok(!app.includes('await loadSceneChapters(scene.value);'), "slow chapter index cannot block character cards and chat controls");
assert.ok(app.indexOf('const modes = $$("#chatModes .chipbtn")') < app.indexOf('fetch("/api/characters")'), "chat mode handlers are registered before API requests");

assert.ok(app.includes("mode: chatMode"), "chat mode is sent to server");
assert.ok(app.includes('$$("#chatModes .chipbtn")'), "all four chat mode controls are bound inside their container");
assert.ok(!app.includes('$("#chatModes.chipbtn")'), "invalid chat mode selector is absent");
assert.ok(app.includes('addChatMsg("me", input);'), "user messages render without a speaker heading");
assert.ok(app.includes('m.role === "user" ? null'), "restored user messages render without a speaker heading");
assert.ok(app.includes('$$("[data-lab]").forEach'), "all literary experiment buttons are bound");
assert.ok(!app.includes('\n$("[data-lab]").forEach'), "single-element forEach initialization crash is fixed");
assert.ok(app.includes("/api/literary"), "literary lab calls model-backed analysis endpoint");
assert.ok(!app.includes("离线演示中"), "offline model status does not promise scripted demo replies");
assert.ok(app.includes("const MAP_COORDINATES = {"), "map coordinates are a separate verified registry");
for (const id of ["dr-no", "goldfinger", "thunderball"]) assert.ok(app.includes(`id: "${id}"`), `canon mission exists: ${id}`);
assert.ok(app.includes("loadMissionCanonBrief(missionDef.novelId || null)"), "mission evidence panel follows the selected mission");
assert.ok(!app.includes("const LOCATIONS = ["), "legacy duplicate location catalog is removed");

console.log("PASS: four-module UI structure, chapter controls, canon-backed world explorer, and browser script syntax");

assert.ok(!html.includes("id=\"missionList\"") && !html.includes("id=\"missionPanel\""), "legacy five-mission selector and console are removed");
assert.ok(!html.toLowerCase().includes("baccarat") && !html.includes("百家乐"), "baccarat is removed from the public UI");
assert.ok(!app.includes("function initBaccarat") && !app.includes("function initMissions") && !app.includes("let bacChips"), "legacy mission and baccarat gameplay code is removed");
assert.ok(app.includes("function resetTrainingLanguage"), "switching languages resets training to the selected language");
