import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const owner = "nequex-eng";
const repo = "007-intelligence-lab-knowledge";
const ref = process.env.KNOWLEDGE_REF || "main";
const root = new URL("../", import.meta.url).pathname;
const paths = [
  "knowledge/manifest.json",
  ...Array.from({ length: 14 }, (_, i) => `knowledge/novels/novel-${String(i + 1).padStart(2, "0")}.json`),
  "knowledge/characters/index.json",
  "knowledge/organizations/index.json",
  "knowledge/locations/index.json",
  "knowledge/equipment/index.json",
  "knowledge/events/index.json",
  "knowledge/timeline/index.json",
  "knowledge/canon-rules/character-core.json",
  "knowledge/canon-rules/knowledge-control.json",
  "knowledge/canon-rules/adaptation-boundaries.json",
  "knowledge/resolution/aliases.json",
  "knowledge/resolution/relationships.json",
  "knowledge/resolution/timeline.json"
];

async function get(path) {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
  const response = await fetch(url, { headers: { "user-agent": "007-intelligence-lab-knowledge-sync" } });
  if (!response.ok) throw new Error(`Knowledge sync failed: ${path} (${response.status})`);
  const text = await response.text();
  const parsed = JSON.parse(text);
  return { text, parsed };
}

const data = {};
for (const path of paths) {
  const { text, parsed } = await get(path);
  data[path] = parsed;
  console.log(`✓ ${path} (${text.length} chars)`);
}
const manifest = data["knowledge/manifest.json"];
if (manifest.novel_count !== 14 || data["knowledge/novels/novel-14.json"].novel_no !== 14) {
  throw new Error("Knowledge manifest / novel set is incomplete; refusing to generate runtime data.");
}
const core = data["knowledge/canon-rules/character-core.json"];
if (!Array.isArray(core.characters) || core.characters.length < 30) {
  throw new Error("Core character constraints missing; refusing to generate runtime data.");
}
const target = join(root, "functions/_data/canon-data.js");
await mkdir(dirname(target), { recursive: true });
await writeFile(target, `// Generated from ${owner}/${repo}@${ref}. DO NOT EDIT BY HAND.\nexport const canonData = ${JSON.stringify(data)};\n`, "utf8");
console.log(`Knowledge sync complete: ${manifest.novel_count} novels, ${core.characters.length} core characters -> ${target}`);
