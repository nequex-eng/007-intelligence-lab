import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const start = app.indexOf("let bacChips");
const end = app.indexOf("// ---- 文学研究室 ----", start);
assert.ok(start >= 0 && end > start, "baccarat module boundaries exist");

const elements = new Map();
function element(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      value: id === "bacAmount" ? "10" : id === "bacSide" ? "player" : "",
      textContent: "",
      innerHTML: "",
      handlers: {},
      addEventListener(type, handler) { this.handlers[type] = handler; }
    });
  }
  return elements.get(id);
}
const context = {
  $: (selector) => element(String(selector).replace(/^#/, "")),
  esc: (value) => String(value),
  console
};
const moduleSource = app.slice(start, end) + `
globalThis.__baccaratTest = {
  init: initBaccarat,
  state: () => ({ chips: bacChips, wins: bacWins, losses: bacLosses, pushes: bacPushes }),
  play: playBaccarat
};`;
vm.runInNewContext(moduleSource, context);
context.__baccaratTest.init();

const deal = element("bacDeal").handlers.click;
const reset = element("bacReset").handlers.click;
assert.equal(typeof deal, "function", "deal button is wired");
assert.equal(typeof reset, "function", "reset button is wired");

for (const side of ["player", "banker", "tie"]) {
  element("bacSide").value = side;
  element("bacAmount").value = "10";
  deal();
  const state = context.__baccaratTest.state();
  assert.equal(state.wins + state.losses + state.pushes, 1, `${side} bet settles exactly once`);
  assert.ok(state.chips >= 0 && state.chips <= 2000, "chip balance remains valid");
  assert.ok(element("bacTable").innerHTML.includes("<table>"), "deal renders both hands and totals");
  assert.ok(element("bacBet").textContent.includes("10"), "bet amount is displayed");
  assert.ok(element("bacRecord").textContent.includes("胜"), "record is displayed");
  reset();
  const restored = context.__baccaratTest.state();
  assert.deepEqual(
    { chips: restored.chips, wins: restored.wins, losses: restored.losses, pushes: restored.pushes },
    { chips: 1000, wins: 0, losses: 0, pushes: 0 },
    "reset restores chips and all records"
  );
}

element("bacAmount").value = "5";
deal();
assert.match(element("bacNote").textContent, /最低下注10/, "invalid low bet is rejected");
assert.equal(context.__baccaratTest.state().chips, 1000, "invalid bet does not change chips");

console.log("PASS baccarat runtime: deal button, player/banker/tie settlement, hand rendering, invalid bet, reset");
