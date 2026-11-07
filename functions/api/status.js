import { llmStatus } from "../_lib/llm.js";
import { manifest, novels, characterCore, indexes } from "../_lib/canon.js";
const json = (data) => new Response(JSON.stringify(data), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
export async function onRequest(context) {
  const env = context.env || {};
  return json({
    ok: true,
    project: "007-intelligence-lab",
    llm: llmStatus(env),
    modules: ["intelligence-archive", "character-theatre", "mission-control", "world-explorer"],
    dataState: "verified-canon",
    dataSource: "nequex-eng/007-intelligence-lab-knowledge",
    dataGenerated: manifest.generated,
    data: {
      novels: manifest.novel_count,
      chapters: manifest.novels.reduce((n, b) => n + (b.chapters || 0), 0),
      facts: novels.reduce((n, b) => n + (b.facts || []).length, 0),
      canonFacts: novels.reduce((n, b) => n + (b.facts || []).filter(f => f.canon_or_inference === "canon").length, 0),
      inferenceFacts: novels.reduce((n, b) => n + (b.facts || []).filter(f => f.canon_or_inference === "inference").length, 0),
      coreCharacters: characterCore.length,
      characters: indexes.characters.total_unique,
      organizations: indexes.organizations.total_unique,
      locations: indexes.locations.total_unique,
      equipment: indexes.equipment.total_unique
    },
    knownGaps: manifest.known_gaps || [],
    time: new Date().toISOString()
  });
}
