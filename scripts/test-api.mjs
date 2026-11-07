import assert from "node:assert/strict";
import { onRequest as status } from "../functions/api/status.js";
import { onRequest as dossier } from "../functions/api/dossier.js";
import { onRequest as characters } from "../functions/api/characters.js";
import { onRequest as world } from "../functions/api/world.js";
import { onRequest as mission } from "../functions/api/mission.js";
import { onRequest as canon } from "../functions/api/canon.js";

const ctx = (path) => ({ request: new Request("http://localhost" + path), env: {} });
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

const sceneOk = await json(await canon(ctx("/api/canon?action=scene&character=bond&novel=casino-royale")));
assert.equal(sceneOk.status, 200);
const sceneBlocked = await json(await canon(ctx("/api/canon?action=scene&character=m&novel=spy-who-loved-me")));
assert.equal(sceneBlocked.status, 409);

const ambiguous = await json(await canon(ctx("/api/canon?action=resolve&q=Molony&kind=characters")));
assert.equal(ambiguous.body.result.ambiguous, true);

console.log("PASS: API handler integration", { facts: s.body.data.facts, characters: c.body.characters.length, locations: w.body.locations.length, books: b.body.books.length });
