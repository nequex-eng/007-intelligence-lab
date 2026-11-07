import { llmStatus } from "../_lib/llm.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

export async function onRequest(context) {
  const env = context.env || {};
  return json({
    ok: true,
    project: "007-intelligence-lab",
    llm: llmStatus(env),
    modules: ["characters", "dossier", "mission", "experience", "literary", "atlas", "import"],
    dataState: "sample",
    dataNotice: "示例数据·待TXT导入核验",
    time: new Date().toISOString()
  });
}
