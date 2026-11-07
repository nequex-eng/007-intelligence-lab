// 007 INTELLIGENCE LAB前端逻辑。
// 正典内容统一来自核验知识库API；静态场景仅用于明确标注的互动体验。
const SAMPLE = "核验知识库 · Ian Fleming 14部原著";
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let CHARACTERS = [];

let BOOKS = [];
let canonBooksLoaded = false;
async function ensureCanonBooks() {
  if (canonBooksLoaded) return BOOKS;
  const r = await fetch("/api/canon?action=books");
  if (!r.ok) throw new Error("原著目录接口返回 " + r.status);
  const d = await r.json();
  BOOKS = (d.books || []).map(b => ({
    id: b.id, zh: b.titleZh, en: b.titleEn, year: b.year, kind: b.kind
  }));
  canonBooksLoaded = true;
  return BOOKS;
}

// 只维护经核对的真实城市/设施坐标；地点名称、国家、虚构属性和作品出处全部来自核验知识库。
const MAP_COORDINATES = {
  london: [51.5074, -0.1278],
  paris: [48.8566, 2.3522],
  istanbul: [41.0082, 28.9784],
  venice: [45.4408, 12.3155],
  kingston: [17.9712, -76.7936],
  "new-york": [40.7128, -74.0060],
  "las-vegas": [36.1699, -115.1398],
  nassau: [25.0443, -77.3504],
  tokyo: [35.6762, 139.6503],
  "fort-knox": [37.8937, -85.9574]
};

const LIT_TOPICS = [
{ t: "邦德人物塑造", d: "弗莱明用细节堆出邦德：衣着、饮食、牌技、配枪，每一处都服务于“专业人士”形象。邦德不是超人，他会受伤、会输牌、会动情，这正是他可信的原因。"},
{ t: "反派人物设计", d: "弗莱明式反派都有三件套：肉体特征（钢钳、金色皮肤）、痴迷之物（黄金、科学、权力）、缜密计划。反派越具体，邦德的胜利越有分量。"},
{ t: "悬念构建", d: "弗莱明常用“信息差”制造悬念：读者和邦德同时只知道一半，另一半由对手慢慢揭开。牌桌、密室、追踪，三种场景轮换，悬念从不掉线。"},
{ t: "信息控制", d: "谁知道什么，弗莱明算得很清楚。邦德不知道的事，读者也不知道；反派知道的事，读者只能猜。这种控制让反转成立，也让人物可信。"},
{ t: "叙事节奏", d: "慢开场、快收尾是弗莱明的节奏：前半部铺陈生活细节与人物关系，后半部把冲突压缩进几天甚至几小时，读起来像上膛的手枪。"},
{ t: "动作场景", d: "弗莱明的动作写得短、准、狠：不写招式，写结果；不写心理，写动作。追车、格斗、牌桌对决，全部用事实推进，不用形容词撑场。"},
{ t: "环境与气氛描写", d: "赌场、加勒比海、阿尔卑斯山，弗莱明写环境必带气味与温度：雪茄味、海风、冷空气。环境不是背景，是邦德的另一个对手。"},
{ t: "女性角色塑造", d: "薇丝朋、塔蒂亚娜、崔西各有立场与秘密，不是花瓶。她们的背叛与牺牲推动剧情，也定义了邦德的感情线。评价时应以原著为准，不以后世眼光简单否定。"},
{ t: "冷战背景", d: "系列诞生于冷战高峰：苏联情报机构、核勒索、密码机，都是时代的直接投影。读邦德要读出1950年代英国人的焦虑：帝国落日，间谍仍在。"},
{ t: "小说与电影改编差异", d: "电影强化了装备与场面，弱化了小说的心理与生活细节。凡是电影独有的装备、情节与人物关系，一律不得当成小说原著引用。本站人物知识边界只认小说。"}
];

const LAB_GEN = {
villain: () => {
const marks = ["左手缺了两根手指", "皮肤在阳光下泛着不自然的青色", "说话时总带着一股樟脑味", "右眼是玻璃义眼，转动时有轻微声响"];
const obs = ["古董钟表", "深海沉船", "稀有兰花", "过期护照"];
const plans = ["让三家银行在同一天挤兑", "在拍卖会上调包一批赝品", "切断一条海底电缆，嫁祸给对手", "用一场慈善晚宴洗白一船赃物"];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
return "新反派草稿：特征——" + pick(marks) + "；痴迷之物——" + pick(obs) + "；计划——" + pick(plans) + "。弗莱明式检验：特征要一眼能记住，痴迷要贯穿全书，计划要缜密到邦德也得花半本书拆解。";
},
suspense: () => "悬念结构（三幕）：第一幕给邦德一个看似简单的任务，只露一半真相；第二幕让邦德发现任务目标本身就是诱饵，信息每揭开一层就推翻上一层；第三幕把冲突压缩进24小时，地点只剩一个密闭空间，悬念靠倒计时收紧。",
mission: () => {
const cities = ["里斯本", "亚历山大港", "蒙特卡洛", "伊斯坦布尔"];
const targets = ["一份伪造的领事名单", "一台失窃的密码机", "一批走私黄金", "一个叛逃的密码员"];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
return "秘密行动草稿：地点——" + pick(cities) + "；目标——" + pick(targets) + "；结构：M简报（只给一半真相）→抵达侦察（发现线人不可靠）→牌桌或舞会接近目标（第一次交锋）→撤离（有人跟踪，身份暴露）→报告（M只问结果）。";
},
compare: () => {
const a = BOOKS[Math.floor(Math.random() * BOOKS.length)];
let b = BOOKS[Math.floor(Math.random() * BOOKS.length)];
if (b.id === a.id) b = BOOKS[(BOOKS.indexOf(a) + 3) % BOOKS.length];
return `${a.zh}（${a.year}年）与${b.zh}（${b.year}年）：可从叙事视角、人物知识边界、悬念铺设、行动节奏与结局结构进行比较。此处仅生成研究提纲，具体结论需回到章节证据。`;

}
};

function initLiterary() {
$("#litTopics").innerHTML = LIT_TOPICS.map((x) => `<details><summary>${esc(x.t)}</summary><p style="font-size:14px">${esc(x.d)}</p><p class="meta">主题卡片为研究导读；事实核验请使用下方检索。</p></details>`).join("");
$("#litAsk").addEventListener("click", async () => {
const q = $("#litQ").value.trim();
const box = $("#litAnswer");
if (!q) { box.innerHTML = `<div class="empty">请先输入问题。</div>`; return; }
box.innerHTML = `<div class="empty">正在核验14部原著索引……</div>`;
try {
const r = await fetch("/api/dossier?q=" + encodeURIComponent(q) + "&limit=12");
if (!r.ok) throw new Error("正典检索接口返回 " + r.status);
const d = await r.json();
const results = d.results || [];
if (!results.length) {
box.innerHTML = `<div class="empty">核验知识库没有找到与“${esc(q)}”直接匹配的事实或人物记录。当前不做无出处推断。</div>`;
return;
}
box.innerHTML = `<p class="meta">检索到${results.length}条核验记录；以下为资料依据，不等同于模型生成的文学评论。</p>` + results.map(x => {
const title = x.title_zh || x.name_zh || x.name || x.entity || x.id || "原著记录";
const source = [x.title_zh && x.novel_id ? x.title_zh : null, x.chapter ? "第"+x.chapter+"章" : null].filter(Boolean).join(" · ") || x.novel_id || (x.sources || []).join("；") || "索引记录";
const detail = x.fact || x.description || x.summary || x.role || x.quote || "该条目没有提供摘要。";
const kind = x.canon_or_inference === "inference" ? "推测" : x.canon_or_inference === "canon" ? "正典事实" : x.kind || "档案";
return `<div class="card" style="margin:8px 0"><h3>${esc(title)} <span class="tag gold">${esc(kind)}</span></h3><p class="meta">出处：${esc(source)}</p><p>${esc(detail)}</p>${x.quote ? `<blockquote>${esc(x.quote)}</blockquote>` : ""}</div>`;
}).join("");
} catch (e) {
box.innerHTML = `<div class="empty">正典检索失败：${esc(e.message)}。</div>`;
}
});
$("[data-lab]").forEach((b) => b.addEventListener("click", async () => {
try {
if (b.dataset.lab === "compare") await ensureCanonBooks();
$("#labOut").innerHTML = `<p style="font-size:15px">${esc(LAB_GEN[b.dataset.lab]())}</p><p class="meta">研究提纲/原创实验内容，不替代原著章节证据。</p>`;
} catch(e) {
$("#labOut").innerHTML = `<p class="meta">无法读取核验原著目录：${esc(e.message)}</p>`;
}
}));
}

// ---- 世界地图 ----
let canonWorldLocations = [];

function filteredCanonLocations() {
  const country = $("#atlasCountry").value;
  const book = $("#atlasBook").value;
  const era = $("#atlasEra").value;
  return canonWorldLocations.filter(p =>
    (!country || p.country === country) &&
    (!book || p.appearances.some(a => a.novel === book)) &&
    (!era || p.appearances.some(a => era === "1950s" ? Number(a.year) < 1960 : Number(a.year) >= 1960))
  );
}

function renderAtlas() {
  const list = filteredCanonLocations();
  const wrap = $("#mapWrap");
  const mapW = wrap.clientWidth || 900;
  const mapH = wrap.clientHeight || 300;
  const compact = mapW < 560;
  wrap.classList.toggle("compact", compact);
  const dots = list.filter(p => !p.fictional && MAP_COORDINATES[p.id]).map(p => {
    const [lat,lng] = MAP_COORDINATES[p.id];
    const xPct = (lng + 180) / 360 * 100;
    const yPct = (90 - lat) / 180 * 100;
    return { p, xPct, yPct, xPx: xPct / 100 * mapW, yPx: yPct / 100 * mapH };
  });
  const placedBoxes = [];
  dots.slice().sort((a,b) => a.yPx - b.yPx || a.xPx - b.xPx).forEach(d => {
    const w = d.p.name.length * 11 + 4, h = 14;
    let box = null;
    for (const lane of [0,1,2,3,4,5,6,7]) {
      const top = lane === 0 ? d.yPx + 10 : lane === 1 ? d.yPx - 10 - h : lane === 2 ? d.yPx + 26 : lane === 3 ? d.yPx - 26 - h : lane === 4 ? d.yPx + 42 : lane === 5 ? d.yPx - 42 - h : lane === 6 ? d.yPx + 58 : d.yPx - 58 - h;
      const left = Math.max(0, Math.min(mapW - w, d.xPx - w / 2));
      const cand = { left, top: Math.max(0, Math.min(mapH - h, top)), w, h };
      const hit = placedBoxes.some(p => cand.left < p.left+p.w+2 && p.left < cand.left+cand.w+2 && cand.top < p.top+p.h+2 && p.top < cand.top+cand.h+2);
      if (!hit) { box = cand; break; }
    }
    d.lbl = box || { left: Math.max(0, Math.min(mapW-w,d.xPx-w/2)), top: Math.max(0,Math.min(mapH-h,d.yPx+10)), w,h };
    placedBoxes.push(d.lbl);
  });
  wrap.innerHTML = dots.length ? dots.map(d =>
    `<div class="mapdot" style="left:${d.xPct.toFixed(1)}%;top:${d.yPct.toFixed(1)}%" data-loc="${d.p.id}" title="${esc(d.p.name)}"></div><div class="maplbl" data-loc="${d.p.id}" style="left:${d.lbl.left.toFixed(0)}px;top:${d.lbl.top.toFixed(0)}px;transform:none">${esc(d.p.name)}</div>`
  ).join("") : `<div style="position:absolute;left:10px;right:10px;top:45%;text-align:center;font-size:13px;color:var(--muted)">当前筛选没有可核验坐标的真实地点；请查看下方完整档案。</div>`;
  if (list.some(p => p.fictional || !MAP_COORDINATES[p.id])) {
    wrap.innerHTML += `<div style="position:absolute;left:10px;bottom:8px;font-size:12px;color:var(--muted)">虚构地点与未核验单点坐标只显示在档案，不伪造地图位置。</div>`;
  }
  $$("#mapWrap .mapdot").forEach(el => el.addEventListener("click", () => {
    if (wrap.classList.contains("compact")) {
      $$("#mapWrap .maplbl").forEach(x => x.classList.remove("show"));
      const lbl = document.querySelector(`#mapWrap .maplbl[data-loc="${el.dataset.loc}"]`);
      if (lbl) lbl.classList.add("show");
    }
    showLocation(el.dataset.loc);
  }));
  const mapped = list.filter(p => !p.fictional && MAP_COORDINATES[p.id]);
  const unlocated = list.length - mapped.length;
  $("#atlasGrid").innerHTML = mapped.map(p =>
    `<div class="card clickable" data-loc="${p.id}"><h3>${esc(p.name)} <span class="tag gold">真实地点</span></h3><p class="meta">${esc(p.country)} · 城市级地图点 · ${p.appearances.length}部作品</p><p>${esc(p.appearances.map(a=>a.title+"："+a.role).join("；"))}</p></div>`
  ).join("") + `<div class="card"><h3>档案中的其他地点</h3><p>${unlocated}处地点没有可核验的单点坐标，或属于小说虚构地点。它们仍完整保留在下方170处地点目录中。</p></div>`;
  $$("#atlasGrid [data-loc]").forEach(el => el.addEventListener("click", () => showLocation(el.dataset.loc)));
  renderCanonWorldDirectory();
}

function showLocation(id) {
  const p = canonWorldLocations.find(x => x.id === id);
  if (!p) return;
  const coords = MAP_COORDINATES[p.id];
  $("#atlasGrid").innerHTML = `<div class="card" style="grid-column:1/-1"><h3>${esc(p.name)} <span class="tag ${p.fictional?"red":"gold"}">${p.fictional?"小说虚构地点":"真实地点"}</span></h3>
    <p class="meta">${esc(p.nameEn || "")} · ${esc(p.country || "国家未标注")} · ${coords ? "城市级地图坐标已核对" : "没有可核验的单点坐标"}</p>
    <p><b>出现作品与原著语境：</b></p>${p.appearances.map(a=>`<div class="log"><b>${esc(a.title)}</b>（${esc(a.year || "年代未标注")}）：${esc(a.role)}</div>`).join("")}
    <p class="meta">地点名称、虚构属性和作品出处来自核验知识库；地图坐标仅来自独立坐标登记。</p>
    <div class="row"><button class="btn small" id="locBack">返回地点探索</button><button class="btn ghost small" id="locDossier">去情报馆检索此地点</button></div></div>`;
  $("#locBack").addEventListener("click", renderAtlas);
  $("#locDossier").addEventListener("click", () => {
    $("#dossierQ").value = p.name;
    document.getElementById("dossier").scrollIntoView({ behavior: "smooth" });
    runDossier(p.name);
  });
}

function renderCanonWorldDirectory() {
  const q = ($("#canonWorldSearch")?.value || "").trim().toLowerCase();
  const list = filteredCanonLocations().filter(p =>
    [p.name,p.nameEn,p.country,...p.appearances.map(a=>a.title)].join(" ").toLowerCase().includes(q)
  );
  const box = $("#canonWorldDirectory");
  if (!box) return;
  box.innerHTML = list.map(p =>
    `<div class="card clickable" data-canon-loc="${p.id}"><h3>${esc(p.name)} <span class="tag ${p.fictional?"red":"gold"}">${p.fictional?"小说虚构地点":"真实地点"}</span></h3><p class="meta">${esc(p.nameEn || "")} · ${esc(p.country || "国家未标注")} · ${p.appearances.length}部作品</p><p>${esc(p.appearances.map(a=>a.title+"："+a.role).join("；"))}</p></div>`
  ).join("") || '<div class="empty">没有匹配地点。</div>';
  $$("#canonWorldDirectory [data-canon-loc]").forEach(el => el.addEventListener("click", () => showLocation(el.dataset.canonLoc)));
}

async function loadCanonWorldDirectory() {
  const box = $("#canonWorldDirectory");
  try {
    const r = await fetch("/api/world");
    if (!r.ok) throw new Error("地点接口返回 " + r.status);
    const d = await r.json();
    canonWorldLocations = d.locations || [];
    renderCanonWorldDirectory();
    $("#canonWorldSearch").addEventListener("input", renderCanonWorldDirectory);
    return canonWorldLocations;
  } catch(e) {
    box.innerHTML = '<div class="empty">核验地点索引加载失败：' + esc(e.message) + '</div>';
    return [];
  }
}

async function initAtlas() {
  await loadCanonWorldDirectory();
  const countries = [...new Set(canonWorldLocations.map(p => p.country).filter(Boolean))].sort();
  countries.forEach(c => {
    const o = document.createElement("option"); o.value = c; o.textContent = c;
    $("#atlasCountry").appendChild(o);
  });
  const books = await ensureCanonBooks().catch(() => []);
  books.forEach(b => {
    const o = document.createElement("option"); o.value = b.id; o.textContent = b.zh + " · " + b.year;
    $("#atlasBook").appendChild(o);
  });
  ["atlasCountry","atlasBook","atlasEra"].forEach(id => document.getElementById(id).addEventListener("change", renderAtlas));
  renderAtlas();
}

// ---- 正典知识库状态 ----
async function initCanonDataStatus() {
  const box = $("#canonDataStatus");
  if (!box) return;
  try {
    const r = await fetch("/api/status");
    if (!r.ok) throw new Error("知识库状态接口返回 " + r.status);
    const d = await r.json();
    const x = d.data || {};
    const stats = [
      ["原著", x.novels || 0], ["章节/故事单位", x.chapters || 0],
      ["正典事实", x.canonFacts || 0], ["推测事实", x.inferenceFacts || 0],
      ["核心人物", x.coreCharacters || 0], ["全部人物", x.characters || 0],
      ["组织", x.organizations || 0], ["地点", x.locations || 0],
      ["装备", x.equipment || 0]
    ];
    const gaps = Array.isArray(d.knownGaps) ? d.knownGaps : [];
    box.innerHTML = `<div class="grid g3">${stats.map(([label,value]) => `<div class="state"><span class="lbl">${esc(label)}</span><b>${Number(value).toLocaleString("en-US")}</b></div>`).join("")}</div>
      <p class="meta" style="margin-top:10px">数据状态：${esc(d.dataState || "unknown")} · 来源：${esc(d.dataSource || "未提供")} · 知识库版本：${esc(d.dataGenerated || "未提供")}</p>
      <p class="meta">已知缺口：${gaps.length ? gaps.map(g => esc(typeof g === "string" ? g : JSON.stringify(g))).join("；") : "知识库未列出缺口。"}</p>
      <p class="meta">同步方式：本地开发/构建时从知识库主分支拉取；生成文件不手工编辑、不向网站用户开放正典写入。</p>`;
  } catch (e) {
    box.innerHTML = `<div class="empty">知识库状态暂时不可用：${esc(e.message)}</div>`;
  }
}

// ---- 状态与启动 ----
async function initStatus() {
try {
const r = await fetch("/api/status");
if (!r.ok) throw new Error("status " + r.status);
const d = await r.json();
const pill = $("#statusPill");
if (d.llm && d.llm.available) { pill.textContent = "模型已接入：" + d.llm.provider; modelAvailable = true;}
else { pill.textContent = "模型待接入·离线演示中"; pill.classList.add("red"); modelAvailable = false;}
$("#modelLine").textContent = d.llm && d.llm.available? "模型已接入：" + d.llm.provider: "模型状态：未接入，当前为离线演示。接入MiniMax-M3后自动切换实时对话。";
} catch (e) {
$("#statusPill").textContent = "接口不可用·离线演示中";
$("#statusPill").classList.add("red");
$("#modelLine").textContent = "模型状态：接口不可用，当前为离线演示。";
}
}

document.addEventListener("DOMContentLoaded", () => {
initCharacters();
initDossier();
initMissions();
initExperience();
initBaccarat();
initLiterary();
initAtlas();
initCanonDataStatus();
initStatus();
});
