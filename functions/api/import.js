// TXT导入校验接口。前端在本地解析txt并计算哈希后，把解析摘要POST到这里做
// 服务端校验：重复文件检测（按哈希）、小说识别、章节结构检查、错误报告。
// 本接口不接收、不存储原著全文；全文只留在用户本地解析，摘要入库后
// 再由D1/KV持久化（待扩展）。当前版本为无状态校验，返回导入报告。
import { BOOKS } from "../_lib/knowledge.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

const KNOWN_TITLES = BOOKS.map((b) => ({ zh: b.titleZh, en: b.titleEn.toLowerCase(), id: b.id }));

function guessBook(name, head) {
  const norm = (v) => (v || "").toLowerCase().replace(/[-_]+/g, " ");
  const hay = norm(name) + " " + norm(head);
  for (const t of KNOWN_TITLES) {
    if (hay.includes(t.zh) || hay.includes(t.en)) return { bookId: t.id, titleZh: t.zh, confident: true };
  }
  return { bookId: null, titleZh: null, confident: false };
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const files = Array.isArray(body.files) ? body.files : [];
    if (!files.length) return json({ error: "没有收到文件摘要" }, 400);
    if (files.length > 20) return json({ error: "一次最多20个文件" }, 400);
    const seen = new Map();
    const report = files.map((f, i) => {
      const name = typeof f.name === "string" ? f.name : "未命名-" + (i + 1);
      const hash = typeof f.hash === "string" ? f.hash : "";
      const size = Number(f.size) || 0;
      const charCount = Number(f.charCount) || 0;
      const lineCount = Number(f.lineCount) || 0;
      const chapters = Array.isArray(f.chapters) ? f.chapters : [];
      const errors = [];
      if (!hash) errors.push("缺少文件哈希，无法做重复检测");
      if (size <= 0 || charCount < 1000) errors.push("文件过小或内容为空，疑似不是小说全文");
      if (!chapters.length) errors.push("未识别到章节结构，请检查章节标题格式");
      if (seen.has(hash) && hash) errors.push("与本次批次中的文件重复（同一哈希）：" + (seen.get(hash) || ""));
      if (hash) seen.set(hash, name);
      const guess = guessBook(name, f.head || "");
      if (!guess.confident) errors.push("未能自动识别小说名，需人工确认");
      return {
        name, hash: hash ? hash.slice(0, 16) + "…" : "", size, charCount, lineCount,
        chapterCount: chapters.length, chapters: chapters.slice(0, 50),
        bookGuess: guess, status: errors.length ? "needs-review" : "ok", errors,
        schema: ["books", "chapters", "characters", "locations", "organizations", "events", "objects", "relationships", "timelines", "source_references"]
      };
    });
    const okCount = report.filter((r) => r.status === "ok").length;
    return json({
      received: files.length, ok: okCount, needsReview: report.length - okCount,
      report, persisted: false,
      note: "服务端只校验摘要、不接收全文；持久化到D1/KV为待扩展项。导入后每条记录须保留书名、章节、原文位置。"
    });
  } catch (e) {
    return json({ error: "请求有误，请再试一次" }, 400);
  }
}

export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return json({
    usage: "POST {files:[{name,hash,size,charCount,lineCount,chapters,head}]}",
    maxFiles: 20,
    pagesNote: ".pages文件需先经soffice批量转换：soffice --headless --convert-to txt，见工程source/import.sh；浏览器内无法直接解析.pages正文。",
    chapterFormats: ["CHAPTER 1 - 标题", "CHAPTER ONE", "Chapter One", "罗马数字独占一行+次行标题", "数字+«标题»"],
    chapterNote: "14本标题格式不统一；本版txt无统一标题行的书会判needs-review，章节索引待人工核对或换版，绝不编造章节数。",
    schema: ["books", "chapters", "characters", "locations", "organizations", "events", "objects", "relationships", "timelines", "source_references"],
    note: "服务端只校验摘要、不接收全文。"
  });
}
