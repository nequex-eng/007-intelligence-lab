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
  BOOKS = (d.books || []).map(b => ({ id:b.id, zh:b.titleZh, en:b.titleEn, year:b.year, kind:b.kind }));
  canonBooksLoaded = true;
  return BOOKS;
}

// 只维护经核对的真实城市/设施坐标；地点名称、国家、虚构属性和作品出处全部来自核验知识库。
let leafletMap = null;
let leafletMarkers = null;
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

// Organization records are sourced from the canon API, never a second local catalog.

const WEAPONS = [
{ name: "贝雷塔手枪", en: "Beretta 418", kind: "手枪", note: "邦德早期配枪，诺博士起被换下。", books: "皇家赌场至来自俄罗斯的爱情" },
{ name: "瓦尔特PPK手枪", en: "Walther PPK", kind: "手枪", note: "诺博士起成为邦德标志性配枪。", books: "诺博士、金手指、霹雳弹、女王密使、雷霆谷、金枪人" },
{ name: "金枪", en: "Golden Gun", kind: "手枪", note: "斯卡拉曼加的标志性武器，金色手枪。", books: "金枪人" },
{ name: "搏击刀", en: "Fighting knife", kind: "冷兵器", note: "邦德近身格斗常用装备（示例，待TXT核验）。", books: "全系列" }
];

const TIMELINE = [
[1953, "皇家赌场", "邦德在皇家赌场牌桌击败勒·希弗，薇丝朋·琳德身亡"],
[1954, "生死关头", "邦德追查犯罪头目，费利克斯·莱特首次登场"],
[1955, "月亮牌", "邦德调查月亮牌导弹计划"],
[1956, "金刚钻", "邦德卧底追查钻石走私链"],
[1957, "来自俄罗斯的爱情", "伊斯坦布尔诱杀局，塔蒂亚娜倒向邦德"],
[1958, "诺博士", "邦德登上蟹礁岛，换装瓦尔特PPK手枪"],
[1959, "金手指", "邦德挫败金手指的诺克斯堡行动"],
[1960, "只为你的双眼", "短篇集出版"],
[1961, "霹雳弹", "布洛菲尔德首次登场，策划核勒索"],
[1962, "爱我的间谍", "女性视角特别篇章出版"],
[1963, "女王密使", "邦德与崔西结婚，婚礼当日崔西遇害"],
[1964, "雷霆谷", "邦德前往日本，在雷霆谷对决布洛菲尔德"],
[1965, "金枪人", "邦德追查金枪杀手斯卡拉曼加"],
[1966, "八爪女与黎明生死线", "短篇集出版"]
];

// ---- 人物档案与角色模拟 ----
let selectedChar = null;
let chatMode = "talk";
let chatHistory = [];
let modelAvailable = null;
function chatStorageKey() { return "007-intel-chat:" + selectedChar + ":" + (document.getElementById("sceneNovel")?.value || "casino-royale") + ":" + (document.getElementById("sceneChapter")?.value || "end"); }
function saveChatHistory() { try { if (selectedChar) localStorage.setItem(chatStorageKey(), JSON.stringify(chatHistory.slice(-80))); } catch(e) {} }
function restoreChatHistory() {
  try { const saved = JSON.parse(localStorage.getItem(chatStorageKey()) || "[]"); chatHistory = Array.isArray(saved) ? saved.filter(m => m && ["user","assistant"].includes(m.role) && typeof m.content === "string").slice(-80) : []; } catch(e) { chatHistory = []; }
  const box = document.getElementById("chatLog");
  if (box) { box.innerHTML = ""; chatHistory.forEach(m => addChatMsg(m.role === "user" ? "me" : "them", m.content, m.role === "user" ? "你" : (charById(selectedChar)?.zh || "角色"))); if (!chatHistory.length) addChatMsg("sys", "新建本地对话。消息会发送至模型服务；当前浏览器保存最近80条对话消息。"); }
}

function charById(id) { return CHARACTERS.find((c) => c.id === id);}

function renderCharGrid() {
const q = ($("#charSearch").value || "").trim();
const bf = $("#charBookFilter").value;
const list = CHARACTERS.filter((c) => (!q || (c.zh + c.name + c.role).includes(q)) && (!bf || c.firstBook === bf));
$("#charGrid").innerHTML = list.length? list.map((c) =>
`<div class="card clickable ${selectedChar === c.id? "active": ""}" data-char="${c.id}">
<h3>${esc(c.name)}</h3><p style="font-size:15px;margin:2px 0">${esc(c.zh)}</p>
<p class="meta">${esc(c.role)}</p>
<p class="meta">首次登场：${esc(c.firstBook)}（${c.firstYear}年）</p>
<span class="tag gold">知识截止：${esc(c.cutoff)}</span></div>`).join("")
: `<div class="empty">没有匹配人物，换个关键词试试。</div>`;
$$("#charGrid [data-char]").forEach((el) => el.addEventListener("click", () => selectChar(el.dataset.char)));
}

function selectChar(id) {
selectedChar = id;
restoreChatHistory();
const c = charById(id);
renderCharGrid();
$("#charDetail").innerHTML = `<h3>${esc(c.name)} · ${esc(c.zh)}</h3>
<p><span class="tag gold">${esc(c.role)}</span> <span class="tag">首次登场：${esc(c.firstBook)}（${c.firstYear}年）</span> <span class="tag red">知识截止：${esc(c.cutoff)}</span></p>
<p><b>身份背景：</b>${esc(c.intro)}</p>
<p><b>外貌与行为：</b>${esc(c.appearance)}</p>
<p><b>性格与价值观：</b>${esc(c.personality)}</p>
<p><b>语言习惯：</b>${esc(c.speech)}</p>
<p><b>人际关系：</b>${esc(c.rel)}</p>
<p><b>参与事件：</b>${esc(c.events)}</p>
<p><b>知识边界：</b>${esc(c.bounds)}</p>
<p><b>知识库出处索引：</b></p>
<ul style="font-size:14px;margin:4px 0;padding-left:20px">${c.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
<p class="meta">${SAMPLE}</p>
<button class="btn small" id="talkThis">和${esc(c.zh)}对话</button>`;
$("#talkThis").addEventListener("click", () => {
addChatMsg("sys", "已选择" + c.zh + "。当前对话按人物与小说时间点保存在本地浏览器。");
addChatMsg("them", c.opener, c.zh);
$("#chatInput").focus();
document.querySelector("#characters.card:last-child").scrollIntoView({ behavior: "smooth", block: "nearest"});
});
const gs = $("#groupSecond");
gs.innerHTML = CHARACTERS.filter((x) => x.id!== id).map((x) => `<option value="${x.id}">${esc(x.zh)}（${esc(x.name)}）</option>`).join("");
}

function addChatMsg(kind, text, who) {
const box = $("#chatLog");
const div = document.createElement("div");
div.className = "msg " + kind;
div.innerHTML = (who? `<span class="who">${esc(who)}</span>`: "") + esc(text);
box.appendChild(div);
box.scrollTop = box.scrollHeight;
}

function clearThinking() {
const t = document.getElementById("chatThinking");
if (t) t.remove();
$("#chatSend").disabled = false;
$("#chatInput").disabled = false;
}

async function sendChat() {
const input = $("#chatInput").value.trim();
if (!input) return;
if (!selectedChar) { addChatMsg("sys", "请先在上方选一个人，再开始对话。"); return;}
const c = charById(selectedChar);
$("#chatInput").value = "";
addChatMsg("me", input, "你");
$("#chatSend").disabled = true;
$("#chatInput").disabled = true;
const thinking = document.createElement("div");
thinking.className = "msg them";
thinking.id = "chatThinking";
thinking.innerHTML = `<span class="who">${esc(c.zh)}</span>对方正在想……`;
const chatBox = $("#chatLog");
chatBox.appendChild(thinking);
chatBox.scrollTop = chatBox.scrollHeight;
chatHistory.push({ role: "user", content: input});
saveChatHistory();
const ids = chatMode === "group"? [selectedChar, $("#groupSecond").value]: [selectedChar];
const sysNote = chatMode === "report"? "你正在向M汇报，M只听事实。": chatMode === "quartermaster"? "对方是Q，只谈装备。": "";
if (sysNote) addChatMsg("sys", sysNote);
try {
const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json"},
body: JSON.stringify({ characterIds: ids, novelId: $("#sceneNovel").value, chapterNo: $("#sceneChapter").value || null, messages: chatHistory.slice(-12)})});
if (r.ok) {
const d = await r.json();
clearThinking();
addChatMsg("them", d.reply, c.zh);
chatHistory.push({ role: "assistant", content: d.reply});
saveChatHistory();
$("#modelLine").textContent = "模型已接入：" + (d.model || "") + (d.canonMode ? " · " + (d.chapterNo ? "第" + d.chapterNo + "章" : "全书结束") + "章级正典约束已启用" : "");
return;
}
if (r.status === 503) {
const d = await r.json().catch(() => ({}));
clearThinking();
addChatMsg("sys", "模型尚未接入（" + (d.code || "MODEL_NOT_CONNECTED") + "）。正典角色模式不会使用无时间线约束的脚本回复，请配置模型后再试。");
$("#modelLine").textContent = "模型状态：未接入；正典模式已停止生成，避免越界回答。";
return;
}
if (r.status === 409 || r.status === 400 || r.status === 404) {
const d = await r.json().catch(() => ({})); clearThinking(); addChatMsg("sys", d.error || "所选人物与小说时间点不匹配。"); return;
}
throw new Error("chat failed " + r.status);
} catch (e) {
clearThinking();
addChatMsg("sys", "对话接口暂时不可用。正典角色模式不会回退到无时间线约束的脚本回复，请稍后重试。");
$("#modelLine").textContent = "模型状态：接口不可用；已阻止无约束回退。";
}
}

async function loadSceneChapters(novelId) {
  const select = $("#sceneChapter");
  select.innerHTML = '<option value="">全书结束（默认）</option>';
  try {
    const r = await fetch("/api/canon?action=chapters&novel=" + encodeURIComponent(novelId));
    if (!r.ok) throw new Error("章节索引返回 " + r.status);
    const d = await r.json();
    (d.chapters || []).forEach(c => {
      const option = document.createElement("option");
      option.value = String(c.no);
      option.textContent = "第" + c.no + "章 · " + c.title;
      select.appendChild(option);
    });
  } catch(e) { console.error("chapter index unavailable", e); }
}

async function initCharacters() {
const bf = $("#charBookFilter");
const scene = $("#sceneNovel");
try {
const [cr, br] = await Promise.all([fetch("/api/characters"), fetch("/api/canon?action=books")]);
if (!cr.ok || !br.ok) throw new Error("canonical data unavailable");
const cd = await cr.json(), bd = await br.json();
scene.innerHTML = "";
CHARACTERS = cd.characters.map(c => ({
id:c.id, name:c.name, zh:c.nameZh, role:c.role, firstBook:c.firstBook || "未标注",
firstYear:c.firstYear || "", cutoff:c.timelineCutoff || "按知识库边界",
intro:c.intro || "原文未提供完整背景资料。", appearance:c.appearance || "原文未提供。",
personality:c.personality || "原文未提供。", speech:c.speech?.tone || "按原著对话与行为边界生成。",
rel:Array.isArray(c.relationships)?c.relationships.map(r=>r.type+"："+r.with+"（"+r.change+"）").join("；"):"关系资料待核验。",
events:Array.isArray(c.knowledgeScope)?c.knowledgeScope.filter(x=>x.status==="present").map(x=>x.title_zh).join("、"):"按知识库出场记录。",
bounds:[...(c.knowledgeBoundaries||[]),...(c.behavioralBoundaries||[])].join("；"),
facts:[...(c.sources||[])].map(x=>"出处索引："+x), opener:"请按当前小说时间点与原著事实提问。", scripted:["原著没有明确写到的部分，我不会替作者补写。"]
}));
 [...new Set(CHARACTERS.map(c=>c.firstBook))].forEach(b=>{const o=document.createElement("option");o.value=b;o.textContent=b;bf.appendChild(o);});
 bd.books.forEach(b => { const so=document.createElement("option");so.value=b.id;so.textContent=b.titleZh+" · "+b.year;scene.appendChild(so); });
scene.value="casino-royale";
await loadSceneChapters(scene.value);
} catch(e) {
$("#charGrid").innerHTML='<div class="empty">核验知识库加载失败：'+esc(e.message)+'。请检查本地同步与API。</div>';
}

$("#charSearch").addEventListener("input", renderCharGrid);
bf.addEventListener("change", renderCharGrid);
$$("#chatModes.chipbtn").forEach((b) => b.addEventListener("click", () => {
$$("#chatModes.chipbtn").forEach((x) => x.classList.remove("active"));
b.classList.add("active");
chatMode = b.dataset.mode;
$("#groupPick").style.display = chatMode === "group"? "block": "none";
const hints = { talk: "先选一个人，再开始对话。当前模式：自由对话。", report: "向M汇报：先选M，再汇报事实。M只听事实，不听看法。", quartermaster: "找Q领装备：先选Q，再说你要领什么装备。Q只谈装备。", group: "多角色同场：先选主谈人，再选同场第二人，最多同场对话由两人轮流回应。"};
$("#chatHint").textContent = hints[chatMode];
if (chatMode === "report") selectChar("m");
if (chatMode === "quartermaster") selectChar("q");
}));
$("#chatSend").addEventListener("click", sendChat);
$("#sceneNovel").addEventListener("change", async () => {
await loadSceneChapters($("#sceneNovel").value);
restoreChatHistory();
});
$("#sceneChapter").addEventListener("change", restoreChatHistory);
$("#chatInput").addEventListener("keydown", (e) => { if (e.key === "Enter") sendChat();});
renderCharGrid();
}

// ---- 情报档案馆 ----
async function runDossier(q) {
  const box = $("#dossierResults");
  box.innerHTML = '<div class="empty">正在检索14部核验原著……</div>';
  try {
    const r = await fetch("/api/dossier?q=" + encodeURIComponent(q) + "&limit=60");
    if (!r.ok) throw new Error("检索接口返回 " + r.status);
    const d = await r.json(), results = d.results || [];
    if (!results.length) {
      box.innerHTML = `<div class="empty">核验知识库中没有找到“${esc(q)}”的匹配记录。未命中不代表原著绝对没有，只表示当前索引没有可确认结果。</div>`;
      return;
    }
    box.innerHTML = `<p class="meta">共${results.length}条 · 来源：核验知识库 · 原著事实与推测分别标记。</p>` +
      results.map(h => {
        const title = h.kind === "facts" ? (h.entity || h.title_zh || "原著事实") : (h.title_zh || h.name_zh || h.name || h.name_en || h.title || h.entity || h.id || "未命名记录");
        const kind = h.kind || "档案";
        const source = [h.title_zh && h.novel_id ? h.title_zh : null, h.chapter ? "第"+h.chapter+"章" : null, h.source_novel || h.novel_id || null].filter(Boolean).join(" · ") || (h.sources || []).join("；") || "索引记录";
        const detail = h.fact || h.summary || h.description || h.story_timeline || h.role || h.note || h.change || h.quote || "该条目没有提供摘要字段。";
        const status = h.canon_or_inference === "inference" ? "推测" : h.canon_or_inference === "canon" ? "正典事实" : kind;
        return `<div class="card" style="margin:8px 0"><h3>${esc(title)} <span class="tag gold">${esc(status)}</span></h3><p class="meta">出处：${esc(source)}</p><p>${esc(detail)}</p>${h.quote ? `<blockquote>${esc(h.quote)}</blockquote>` : ""}</div>`;
      }).join("");
  } catch (e) {
    box.innerHTML = `<div class="empty">核验检索暂时不可用：${esc(e.message)}。已禁用旧示例数据回退，避免把未核验内容冒充正典。</div>`;
  }
}

async function renderDossierTab(tab) {
  const body = $("#dossierTabBody");
  body.innerHTML = '<div class="empty">正在读取核验档案……</div>';
  const kinds = { books:"books", timeline:"timeline", orgs:"organizations", weapons:"equipment" };
  try {
    const r = await fetch("/api/dossier?kind=" + kinds[tab]);
    if (!r.ok) throw new Error("档案接口返回 " + r.status);
    const d = await r.json();
    if (tab === "books") {
      body.innerHTML = `<p class="meta">14部原著 · 章节摘要来自逐部核验知识库</p><table><tr><th>书名</th><th>英文原名</th><th>出版年</th><th>类型</th><th>章节</th><th>故事时间线</th></tr>` +
        d.books.map(b => `<tr><td><b>${esc(b.titleZh)}</b></td><td>${esc(b.titleEn)}</td><td>${b.year}</td><td>${esc(b.kind)}</td><td>${b.chapters}</td><td>${esc(b.summary)}</td></tr>`).join("") + `</table>`;
    } else if (tab === "timeline") {
      body.innerHTML = `<p class="meta">按出版顺序排列；故事内部年份与出版年份不混为一谈。</p>` +
        (d.timeline || []).map(t => `<div class="log"><b style="color:var(--gold2)">${esc(t.title_zh || t.novel)}</b>：${esc(t.story_timeline || "")}</div>`).join("");
    } else {
      const items = tab === "orgs" ? d.organizations : d.equipment;
      const title = tab === "orgs" ? "组织档案" : "装备档案";
      body.innerHTML = `<p class="meta">${title} · ${items.length}条核验索引</p><div class="grid g2">` +
        items.map(o => `<div class="card"><h3>${esc(o.name_zh || o.name || o.id)}</h3><p class="meta">${esc(o.name_en || "")} · ${esc(o.id)}</p><p>${esc(o.description || o.role || o.note || "原著索引条目")}</p><p class="meta">出场：${esc((o.appearances || []).map(a => a.novel || a).join("、"))}</p></div>`).join("") + `</div>`;
    }
  } catch (e) {
    body.innerHTML = `<div class="empty">核验档案加载失败：${esc(e.message)}。不会回退到旧示例数据。</div>`;
  }
}

function initDossier() {
  $("#dossierGo").addEventListener("click", () => runDossier($("#dossierQ").value));
  $("#dossierQ").addEventListener("keydown", (e) => { if (e.key === "Enter") runDossier($("#dossierQ").value); });
  $$("#dossier .chipbtn[data-q]").forEach((b) => b.addEventListener("click", () => { $("#dossierQ").value = b.dataset.q; runDossier(b.dataset.q); }));
  $$("#dossierTabs .chipbtn").forEach((b) => b.addEventListener("click", () => {
    $$("#dossierTabs .chipbtn").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    renderDossierTab(b.dataset.tab);
  }));
  renderDossierTab("books");
}

// ---- 任务模拟器：真实状态机 ----
const MISSIONS = [
{ id: "casino", novelId: "casino-royale", title: "皇家赌场", kind: "原著改编互动", kindTag: "改编", desc: "以1953年《皇家赌场》为正典背景的互动改编。任务选择与分支为玩家体验设计，不等同于弗莱明原著实际发生的事件。", start: { funds: 10000, risk: 20, cred: 70, day: 1},
stages: [
{ id: "brief", title: "第1阶段·M的简报", text: "M在伦敦办公室交给你任务简报：勒·希弗挪用苏联情报机构公款炒作失败，今晚将在皇家赌场牌桌上翻本。你的资金由财政部提供，薇丝朋·琳德担任联络人。记住：输光他，就等于切断他的退路。", choices: [
{ text: "仔细研读简报与勒·希弗的牌风记录", hint: "情报可信度+15，时间+半天", fx: { cred: 15, day: 0.5}, next: "arrive"},
{ text: "只记关键数字，立刻出发", hint: "风险+10，节省时间", fx: { risk: 10}, next: "arrive"},
{ text: "先找Q领装备再出发", hint: "获得装备：暗藏式手枪，风险-5", fx: { risk: -5, equip: "暗藏式手枪"}, next: "arrive"}]},
{ id: "arrive", title: "第2阶段·抵达皇家莱索", text: "你抵达法国海滨赌城皇家莱索。赌场灯火通明，勒·希弗已经坐在牌桌旁。薇丝朋在吧台等你，她带来一个消息：勒·希弗今晚的资金来源不明，有人说他身后站着苏联方面的人。", choices: [
{ text: "先侦察赌场，摸清勒·希弗的同伙", hint: "线索+1，风险-5，时间+半天", fx: { risk: -5, day: 0.5, clue: "勒·希弗的保镖共有2人，分守赌场前后门"}, next: "table"},
{ text: "先和薇丝朋单独谈谈，核实情报", hint: "情报可信度+10，与薇丝朋关系+1", fx: { cred: 10, rel: ["薇丝朋·琳德", 1]}, next: "table"},
{ text: "不侦察，直接上牌桌", hint: "风险+15，时间节省", fx: { risk: 15}, next: "table"}]},
{ id: "table", title: "第3阶段·牌桌对决", text: "百家乐牌桌。勒·希弗推上一大叠筹码，眼睛盯着你。你手里的资金有限，每一把都可能决定任务成败。", choices: [
{ text: "保守下注，观察他的牌风", hint: "资金-1000，情报可信度+10，风险-5", fx: { funds: -1000, cred: 10, risk: -5, clue: "勒·希弗拿到好牌时会不自觉地摸手帕"}, next: "showdown"},
{ text: "全力进攻，大额下注逼他亮底牌", hint: "资金-4000，风险+20，胜则线索+1", fx: { funds: -4000, risk: 20, clue: "勒·希弗的资金链已到极限，再输一把就翻不了身"}, next: "showdown"},
{ text: "故意示弱，引他加注", hint: "资金-2000，风险+10，情报可信度+5", fx: { funds: -2000, risk: 10, cred: 5}, next: "showdown"}]},
{ id: "showdown", title: "第4阶段·决胜与伏击", text: "最后一把牌结束，勒·希弗输光了筹码。他离场时脸色惨白。回酒店的路上，你注意到有人跟上了你——任务还没有结束。", choices: [
{ text: "按计划撤回酒店，等待接应", hint: "风险-10，任务按原著走向推进", fx: { risk: -10, day: 0.5}, next: "end"},
{ text: "主动迎上去，查清跟踪者身份", hint: "线索+1，风险+15", fx: { risk: 15, clue: "跟踪者受雇于苏联方面，与勒·希弗的处决有关"}, next: "end"},
{ text: "通知薇丝朋改变会合地点", hint: "与薇丝朋关系+1，风险-5", fx: { risk: -5, rel: ["薇丝朋·琳德", 1]}, next: "end"}]}
],
ending(state) {
if (state.risk >= 80) return { grade: "任务失败", text: "风险失控：你在撤离途中暴露，任务被迫中止。M的评语只有一句：下次先读简报。资金剩余" + state.funds + "，情报可信度" + state.cred + "。按原著，勒·希弗最终被苏联方面处决，但这一次与你无关。"};
if (state.funds <= 0) return { grade: "惨胜", text: "你赢了牌桌，输光了资金。勒·希弗翻不了身，但你回伦敦要写一份很长的资金说明。情报可信度" + state.cred + "，发现线索" + state.clues.length + "条。"};
return { grade: "任务成功", text: "勒·希弗在牌桌上输光翻本的本钱，退路断绝。按原著走向，他随后被苏联方面处决。你的资金剩余" + state.funds + "，情报可信度" + state.cred + "，发现线索" + state.clues.length + "条，M在报告上只写了两个字：很好。"};
}},
{ id: "dr-no", novelId: "dr-no", title: "蟹礁岛行动", kind: "原著改编互动", kindTag: "原著", desc: "依据《诺博士》核验章节设计：调查斯特兰威斯与特鲁布拉德失踪案，追查蟹礁岛。玩家选择与分支为互动改编，不等同于原著实际过程。", start: { funds: 9000, risk: 25, cred: 65, day: 1 },
stages: [
{ id: "brief", title: "第1阶段·M的简报", text: "加勒比地区负责人斯特兰威斯与助手玛丽·特鲁布拉德失踪三周。官方称两人私奔，但每日18时30分与伦敦的无线电联络突然中断，档案也被取空。M派你前往牙买加调查，唯一线索指向蟹礁岛与岛主诺博士。", choices: [
{ text: "先核对无线电记录与最后一次联络", hint: "可信度+15，线索+1", fx: { cred: 15, clue: "斯特兰威斯最后一次定时联络中断，与私奔说法矛盾" }, next: "kingston" },
{ text: "直接追查蟹礁岛档案", hint: "节省时间，风险+10", fx: { risk: 10, clue: "蟹礁岛档案封皮仍在，内文已被取空" }, next: "kingston" },
{ text: "请求夸雷尔协助并核实当地传闻", hint: "获得当地协助，可信度+10", fx: { cred: 10, rel: ["夸雷尔", 1] }, next: "kingston" }
]},
{ id: "kingston", title: "第2阶段·金斯顿调查", text: "金斯顿的线索逐渐指向诺博士：斯特兰威斯的太阳光汽车被人使用，总督府档案可能遭到渗透，一名自称报社摄影记者的安娜贝尔·钟反复拍摄你的行踪。", choices: [
{ text: "核查斯特兰威斯的汽车与行踪", hint: "线索+1，风险-5", fx: { risk: -5, clue: "斯特兰威斯的太阳光汽车被用来确认邦德的行踪" }, next: "crab-key" },
{ text: "查问殖民地秘书处的档案经手人", hint: "可信度+10，风险+5", fx: { cred: 10, risk: 5, clue: "诺博士在总督府内有眼线，档案最后经手人为斯特兰威斯" }, next: "crab-key" },
{ text: "反跟踪安娜贝尔·钟", hint: "线索+1，风险+10", fx: { risk: 10, clue: "安娜贝尔·钟是诺博士的眼线，负责确认邦德身份与住处" }, next: "crab-key" }
]},
{ id: "crab-key", title: "第3阶段·夜渡蟹礁岛", text: "你与夸雷尔准备乘独木舟夜渡蟹礁岛。岛上传闻有一条会喷火的巨龙，奥杜邦协会的调查人员也曾在岛上失踪。雷达与海岸巡逻让登陆风险极高。", choices: [
{ text: "沿黑沙滩登陆，避开灯火与雷达", hint: "风险-10，线索+1", fx: { risk: -10, clue: "蟹礁岛雷达会搜索海面目标，夜间隐蔽登陆更安全" }, next: "facility" },
{ text: "先在海岸外观察巨龙巡逻路线", hint: "可信度+10，时间+1天", fx: { cred: 10, day: 1, clue: "所谓巨龙是装甲沼泽车，配有火焰喷射器" }, next: "facility" },
{ text: "快速登陆，抢在守卫换班前进入岛内", hint: "风险+15，节省时间", fx: { risk: 15 }, next: "facility" }
]},
{ id: "facility", title: "第4阶段·诺博士的设施", text: "你已进入岛内设施。诺博士承认斯特兰威斯夫妇遭到谋杀，并透露自己干扰美国导弹试验的计划。哈妮被囚禁，岛上守卫正在收紧搜索。", choices: [
{ text: "优先救出哈妮并寻找撤离路线", hint: "线索+1，风险-5", fx: { risk: -5, clue: "哈妮知道岛上地形，是重要的逃生向导" }, next: "end" },
{ text: "破坏导弹干扰设备，切断诺博士计划", hint: "风险+10，可信度+15", fx: { risk: 10, cred: 15, clue: "诺博士的目标是干扰美军导弹制导并捕获导弹样机" }, next: "end" },
{ text: "寻找传送带与鸟粪装卸区，伺机反击", hint: "线索+1，风险+5", fx: { risk: 5, clue: "诺博士最终在码头装船时被鸟粪传送带活埋" }, next: "end" }
]}
],
ending(state) {
if (state.risk >= 80) return { grade: "行动失败", text: "你在蟹礁岛暴露行踪，撤离路线被封锁。此次模拟行动失败；原著中邦德最终逃出蟹礁岛，诺博士被鸟粪传送带活埋。" };
if (state.clues.length >= 3) return { grade: "行动成功", text: "你查明失踪案与诺博士的关系，并找到救出哈妮与逃离岛屿的关键路线。原著正典结局：诺博士被鸟粪活埋，邦德与哈妮乘独木舟返回牙买加。" };
return { grade: "部分成功", text: "你确认蟹礁岛与失踪案有关，但证据或撤离准备不足。模拟行动需要后续补充；原著结局仍以知识库记录为准。" };
}},
{ id: "goldfinger", novelId: "goldfinger", title: "大满贯行动", kind: "原著改编互动", kindTag: "原著", desc: "依据《金手指》核验章节设计：追查黄金外流、揭穿金手指的走私网络，并识别诺克斯堡大满贯计划。玩家分支属于互动改编。", start: { funds: 12000, risk: 25, cred: 70, day: 1 },
stages: [
{ id: "brief", title: "第1阶段·英格兰银行简报", text: "英格兰银行发现大量黄金异常外流。M要求你调查奥里克·金手指：他以旧金回收生意为掩护，拥有分布在多个国家的金条储备。", choices: [
{ text: "先研究金条刻痕与黄金流向", hint: "可信度+15，线索+1", fx: { cred: 15, clue: "部分金条带有微小Z刻痕，与SMERSH资金链有关" }, next: "miami" },
{ text: "从金手指的赌场与牌局关系入手", hint: "线索+1，风险+5", fx: { risk: 5, clue: "金手指在迈阿密与杜邦进行双人卡纳斯塔牌局" }, next: "miami" },
{ text: "直接接近金手指，建立信任", hint: "风险+15，时间节省", fx: { risk: 15 }, next: "miami" }
]},
{ id: "miami", title: "第2阶段·迈阿密牌局", text: "杜邦称自己一周内输给金手指25,000美元，怀疑对方作弊。邦德在弗洛里迪亚纳酒店调查，发现吉尔·马斯特顿在套房内用望远镜与麦克风向金手指报牌。", choices: [
{ text: "查清套房内的望远镜与无线电装置", hint: "线索+1，可信度+10", fx: { cred: 10, clue: "吉尔·马斯特顿通过望远镜观察牌面并向金手指报牌" }, next: "smuggling" },
{ text: "迫使金手指退还杜邦损失", hint: "资金-500，风险-5", fx: { funds: -500, risk: -5, clue: "金手指被迫开出50,000美元支票" }, next: "smuggling" },
{ text: "跟踪金手指，查他的黄金运输方式", hint: "风险+10，线索+1", fx: { risk: 10, clue: "金手指随身携带黄金，并利用行李箱夹层与金币腰带转移" }, next: "smuggling" }
]},
{ id: "smuggling", title: "第3阶段·黄金走私链", text: "调查发现，金手指的劳斯莱斯银色幽灵并非普通车身：车身含有约两吨18K白金，拆解后将被改制成航空座椅运往印度。线索还指向一项代号“大满贯”的大规模行动。", choices: [
{ text: "沿运输链追查白金车身去向", hint: "线索+1，可信度+10", fx: { cred: 10, clue: "白金车身在科佩工厂拆解，计划改制为Mecca航空座椅" }, next: "grand-slam" },
{ text: "查阅黑帮会议与资金记录", hint: "风险+10，线索+1", fx: { risk: 10, clue: "金手指召集黑帮首脑，承诺以黄金分成换取人手" }, next: "grand-slam" },
{ text: "向M提交阶段报告，请求增援", hint: "可信度+15，时间+1天", fx: { cred: 15, day: 1 }, next: "grand-slam" }
]},
{ id: "grand-slam", title: "第4阶段·诺克斯堡计划", text: "金手指的目标是诺克斯堡黄金储备。他计划使用原子弹头炸开金库，并在供水系统投放GB神经毒剂；黄金将由苏联巡洋舰运走。你必须设法破坏计划并保护平民。", choices: [
{ text: "优先向美方提交神经毒剂情报", hint: "可信度+15，风险-5", fx: { cred: 15, risk: -5, clue: "GB毒剂计划可能造成约6万人死亡或致残" }, next: "end" },
{ text: "追踪金手指的运输车队，寻找拦截机会", hint: "风险+15，线索+1", fx: { risk: 15, clue: "黄金运输计划与苏联巡洋舰接应有关" }, next: "end" },
{ text: "设法向外界发送求救密信", hint: "资金-1000，风险-10", fx: { funds: -1000, risk: -10, clue: "邦德曾把求救密信藏在飞机厕所座椅下，最终送达莱特" }, next: "end" }
]}
],
ending(state) {
if (state.risk >= 80) return { grade: "行动失败", text: "你未能及时破坏大满贯计划，风险失控。此结局为互动模拟分支；原著中诺克斯堡伏击挫败计划，金手指劫机逃亡，最终被邦德杀死。" };
if (state.clues.length >= 3 && state.cred >= 70) return { grade: "行动成功", text: "你识别了黄金走私链、诺克斯堡目标与GB毒剂威胁，及时向盟友发出警报。原著正典中，大满贯行动最终失败，金手指在劫持航班后被邦德杀死。" };
return { grade: "部分成功", text: "你掌握了部分黄金走私线索，但大满贯计划仍有风险。模拟行动需要补充情报；原著事件以核验知识库为准。" };
}},
{ id: "thunderball", novelId: "thunderball", title: "欧米茄行动", kind: "原著改编互动", kindTag: "原著", desc: "依据《霹雳弹》核验章节设计：追踪被劫持的Vindicator轰炸机与两枚核弹，调查SPECTRE勒索，并在巴哈马阻止核袭击。玩家分支属于互动改编。", start: { funds: 15000, risk: 30, cred: 65, day: 1 },
stages: [
{ id: "brief", title: "第1阶段·核勒索简报", text: "SPECTRE劫持一架Vindicator轰炸机，机上有两枚核弹，并向英国政府勒索价值一亿英镑的黄金。期限迫近，M派你前往巴哈马参与搜寻行动。", choices: [
{ text: "核对失踪飞机编号与核弹清单", hint: "可信度+15，线索+1", fx: { cred: 15, clue: "失踪飞机为Vindicator，载有两枚核弹" }, next: "shrubl..." },
{ text: "先查SPECTRE勒索信与期限", hint: "线索+1，风险-5", fx: { risk: -5, clue: "勒索期限与金条交付条件均有明确时限" }, next: "shrubl..." },
{ text: "调查疗养院中的可疑人物利普", hint: "风险+5，线索+1", fx: { risk: 5, clue: "利普腕下的红闪电纹身与澳门犯罪组织有关" }, next: "shrubl..." }
]},
{ id: "shrubl...", title: "第2阶段·灌木林线索", text: "邦德在灌木林疗养院发现利普腕下的红闪电帮会纹身。利普企图在治疗过程中杀死邦德，随后被SPECTRE灭口。M要求你不要被这条支线拖住，尽快前往巴哈马。", choices: [
{ text: "追查红闪电帮会与SPECTRE的关系", hint: "可信度+10，风险+5", fx: { cred: 10, risk: 5, clue: "利普与SPECTRE有关，曾企图杀死邦德" }, next: "nassau" },
{ text: "优先前往巴哈马，集中寻找飞机残骸", hint: "时间-1天，风险-5", fx: { day: -1, risk: -5 }, next: "nassau" },
{ text: "请求莱特协助检查海域与航线", hint: "关系+1，线索+1", fx: { rel: ["费利克斯·莱特", 1], clue: "失事飞机可能在比米尼附近海域" }, next: "nassau" }
]},
{ id: "nassau", title: "第3阶段·拿骚与飞碟号", text: "拿骚。你接触到拉戈的飞碟号与多米诺·佩塔基。拉戈声称自己是寻宝团负责人，但船上燃油、人员与航行安排存在疑点。多米诺与拉戈的关系也并不简单。", choices: [
{ text: "秘密接近多米诺，核实她与拉戈的关系", hint: "关系+1，线索+1", fx: { rel: ["多米诺", 1], clue: "多米诺本名多米内塔·佩塔基，兄长是被劫机的飞行员" }, next: "wreck" },
{ text: "监视飞碟号的燃油与出航时间", hint: "线索+1，风险-5", fx: { risk: -5, clue: "飞碟号实际燃油量与拉戈所称不符" }, next: "wreck" },
{ text: "与莱特协调海上监视和水下搜索", hint: "可信度+10，风险+5", fx: { cred: 10, risk: 5, clue: "飞碟号与比米尼附近失事飞机残骸存在关联" }, next: "wreck" }
]},
{ id: "wreck", title: "第4阶段·核弹回收", text: "你与莱特找到失事飞机残骸，确认两枚核弹与引信已被取走。拉戈准备将核弹运往大巴哈马岛导弹基地。必须在布放前拦截潜水队。", choices: [
{ text: "带队水下拦截核弹运输雪橇", hint: "风险+10，线索+1", fx: { risk: 10, clue: "拉戈的潜水队正把核弹运往大巴哈马岛导弹基地" }, next: "end" },
{ text: "让多米诺继续潜伏，寻找飞碟号内部机会", hint: "关系+1，风险-5", fx: { risk: -5, rel: ["多米诺", 1], clue: "多米诺同意携带盖革计数器作为内应信号" }, next: "end" },
{ text: "优先通知盟军拦截第二枚核弹的目标", hint: "可信度+15，资金-500", fx: { cred: 15, funds: -500, clue: "第二枚核弹原定目标为迈阿密" }, next: "end" }
]}
],
ending(state) {
if (state.risk >= 80) return { grade: "行动失败", text: "你未能在核弹布放前完成拦截。此结局为互动模拟分支；原著中多米诺杀死拉戈，两枚核弹最终被回收，布洛菲尔德逃脱。" };
if (state.clues.length >= 3) return { grade: "行动成功", text: "你识别了飞机残骸、飞碟号与核弹运输路线，成功组织拦截。原著正典中，两枚核弹被回收，多米诺杀死拉戈，布洛菲尔德逃脱。" };
return { grade: "部分成功", text: "你已定位部分线索，但仍需确认核弹位置与布放时间。模拟行动未完全成功；原著事件以核验知识库为准。" };
}},
{ id: "venice", title: "威尼斯密码", kind: "原创任务", kindTag: "非原著·原创", desc: "原创任务，明确标注非原著：使用弗莱明世界观与人物设定生成的独立任务，人物与组织关系为原创设计，不是原著剧情。", start: { funds: 8000, risk: 25, cred: 60, day: 1},
stages: [
{ id: "brief", title: "第1阶段·M的简报【非原著·原创】", text: "M交给你一份原创任务简报：一名化名“玻璃匠”的中间人将在威尼斯出售一份伪造的密码机图纸，买家不明。你的任务是查清买家身份，阻止图纸外流。本任务为原创设计，不是原著剧情。", choices: [
{ text: "核查情报来源可靠性", hint: "情报可信度+15", fx: { cred: 15}, next: "arrive"},
{ text: "直接飞威尼斯，先到先得", hint: "风险+10", fx: { risk: 10}, next: "arrive"},
{ text: "请莱特从美方侧面核实买家", hint: "与莱特关系+1，情报可信度+10", fx: { cred: 10, rel: ["费利克斯·莱特", 1]}, next: "arrive"}]},
{ id: "arrive", title: "第2阶段·抵达威尼斯【非原著·原创】", text: "威尼斯，雨夜。你在圣马可广场附近的咖啡馆与线人接头。线人说：“玻璃匠”今晚会出现在假面舞会，买家也会到场，但舞会宾客名单是假的。", choices: [
{ text: "跟踪线人，确认他是否可信", hint: "线索+1，风险+5", fx: { risk: 5, clue: "线人同时在给两个人报信，其中一个是买家的人"}, next: "ball"},
{ text: "先查舞会场地与退路", hint: "风险-10", fx: { risk: -10, clue: "舞会厅有2个出口，运河边可乘船撤离"}, next: "ball"},
{ text: "乔装进入舞会，直接接近目标", hint: "风险+15，时间节省", fx: { risk: 15}, next: "ball"}]},
{ id: "ball", title: "第3阶段·假面舞会【非原著·原创】", text: "舞会灯火辉煌，人人戴着面具。“玻璃匠”出现了，手里提着一个黑色皮箱。你必须在不惊动全场的情况下接近他。", choices: [
{ text: "以买家身份接近，套他的话", hint: "线索+1，风险+10", fx: { risk: 10, clue: "“玻璃匠”只认现金，不认人，图纸是伪造的，真正的买家另有其人"}, next: "end"},
{ text: "在吧台制造小混乱，趁乱调包皮箱", hint: "资金-1500，风险+20", fx: { funds: -1500, risk: 20}, next: "end"},
{ text: "不动声色，只记录在场所有人的面具特征", hint: "情报可信度+10，风险-5", fx: { cred: 10, risk: -5, clue: "戴银色面具的人全程没有跳舞，一直在看“玻璃匠”"}, next: "end"}]}
],
ending(state) {
if (state.risk >= 80) return { grade: "任务失败", text: "你在舞会上暴露身份，“玻璃匠”带着皮箱从运河撤走。M的评语：原创任务也一样，鲁莽没有借口。资金剩余" + state.funds + "，情报可信度" + state.cred + "。"};
if (state.clues.length >= 2) return { grade: "任务成功", text: "你识破了双重陷阱：图纸是伪造的，真正的买家是戴银色面具的人。皮箱被截获，买家身份已锁定。资金剩余" + state.funds + "，情报可信度" + state.cred + "，发现线索" + state.clues.length + "条。"};
return { grade: "部分成功", text: "你阻止了图纸交易，但买家身份仍未锁定。线索" + state.clues.length + "条，情报可信度" + state.cred + "，需要第二次行动。资金剩余" + state.funds + "。"};
}}
];

let missionState = null;
let missionDef = null;

function missionById(id) { return MISSIONS.find((m) => m.id === id);}

function hasSavedMission(id) {
  try {
    const saved = JSON.parse(localStorage.getItem("007-mission:" + id) || "null");
    return Boolean(saved?.state && saved.missionId === id && !saved.state.completed);
  } catch(e) { return false; }
}

function renderMissionList() {
$("#missionList").innerHTML = MISSIONS.map((m) => {
const saved = hasSavedMission(m.id);
let savedStage = "";
if (saved) {
try {
const state = JSON.parse(localStorage.getItem("007-mission:" + m.id)).state;
savedStage = m.stages.find(x => x.id === state.stage)?.title || "上次进度";
} catch(e) {}
}
return `<div class="card clickable" data-mission="${m.id}" data-resume="${saved}">
<h3>${esc(m.title)} <span class="tag ${m.kindTag === "原著"? "gold": "red"}">${esc(m.kind)}</span></h3>
<p>${esc(m.desc)}</p>
<p class="meta">起始资金${m.start.funds} · 风险${m.start.risk} · 情报可信度${m.start.cred}</p>
${saved ? `<p class="meta">已保存进度：${esc(savedStage)}</p>` : ""}
<button class="btn small">${saved ? "继续上次任务" : "开始任务"}</button></div>`;
}).join("");
$("#missionList [data-mission]").forEach((el) => el.addEventListener("click", () => {
if (el.dataset.resume === "true") restoreMissionState(el.dataset.mission);
else startMission(el.dataset.mission);
}));
}

function startMission(id) {
missionDef = missionById(id);
if (!missionDef) return;
missionState = { funds: missionDef.start.funds, risk: missionDef.start.risk, cred: missionDef.start.cred, day: missionDef.start.day, clues: [], rels: {}, equip: [], stage: missionDef.stages[0].id, log: []};
saveMissionState();
renderMissionList();
renderMissionStage();
}

function applyFx(fx) {
const s = missionState;
if (fx.funds) s.funds += fx.funds;
if (fx.risk) s.risk = Math.max(0, Math.min(100, s.risk + fx.risk));
if (fx.cred) s.cred = Math.max(0, Math.min(100, s.cred + fx.cred));
if (fx.day) s.day += fx.day;
if (fx.clue) s.clues.push(fx.clue);
if (fx.equip) s.equip.push(fx.equip);
if (fx.rel) s.rels[fx.rel[0]] = (s.rels[fx.rel[0]] || 0) + fx.rel[1];
}

function stateBarHTML() {
const s = missionState;
return `<div class="statebar">
<div class="state"><span class="lbl">当前任务</span><b style="font-size:14px">${esc(missionDef.title)}·${esc(missionDef.kind)}</b></div>
<div class="state"><span class="lbl">时间</span><b>第${s.day}天</b></div>
<div class="state"><span class="lbl">资金</span><b>${s.funds}</b></div>
<div class="state"><span class="lbl">装备</span><b style="font-size:14px">${s.equip.length? esc(s.equip.join("、")): "无"}</b></div>
<div class="state"><span class="lbl">情报可信度</span><b>${s.cred}</b><div class="bar"><i style="width:${s.cred}%"></i></div></div>
<div class="state"><span class="lbl">风险等级</span><b>${s.risk}</b><div class="bar"><i style="width:${s.risk}%;background:${s.risk >= 70? "var(--red)": "var(--gold)"}"></i></div></div>
<div class="state"><span class="lbl">已发现线索</span><b>${s.clues.length}条</b></div>
<div class="state"><span class="lbl">人物关系</span><b style="font-size:14px">${Object.keys(s.rels).length? Object.entries(s.rels).map(([k, v]) => esc(k) + "+" + v).join("、"): "无变化"}</b></div>
</div>`;
}

function renderMissionStage() {
const panel = $("#missionPanel");
const stage = missionDef.stages.find((s) => s.id === missionState.stage);
panel.innerHTML = `<h3>${esc(missionDef.title)} · ${esc(missionDef.kind)}</h3>${stateBarHTML()}
<h3 style="margin-top:6px">${esc(stage.title)}</h3><p>${esc(stage.text)}</p>
${stage.choices.map((ch, i) => `<button class="choice" data-choice="${i}">${esc(ch.text)}<small>${esc(ch.hint)}</small></button>`).join("")}
${missionState.clues.length? `<p class="meta"><b>已发现线索：</b></p>` + missionState.clues.map((c) => `<div class="log">${esc(c)}</div>`).join(""): ""}
<div class="row" style="margin-top:10px"><button class="btn ghost small" id="missionQuit">放弃任务</button></div>`;
$$("#missionPanel [data-choice]").forEach((el) => el.addEventListener("click", () => chooseMission(+el.dataset.choice)));
$("#missionQuit").addEventListener("click", () => {
if (missionDef) {
localStorage.removeItem("007-mission:" + missionDef.id);
if (localStorage.getItem("007-mission:last") === missionDef.id) localStorage.removeItem("007-mission:last");
}
missionState = null; missionDef = null;
$("#missionPanel").innerHTML = `<h3>任务控制台</h3><p class="meta">任务已放弃。选一个任务重新开始。</p><div class="empty">尚未开始任务</div>`;
renderMissionList();
});
}

function renderMissionResult(end) {
const current = missionState;
$("#missionPanel").innerHTML = `<h3>${esc(missionDef.title)} · 任务结果</h3>${stateBarHTML()}
<div class="card" style="margin-top:6px"><h3>行动报告·${esc(end.grade)}</h3><p>${esc(end.text)}</p>
<p><b>行动记录：</b></p><ul style="font-size:14px">${current.log.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
<p><b>线索汇总（${current.clues.length}条）：</b></p>${current.clues.length? current.clues.map((c) => `<div class="log">${esc(c)}</div>`).join(""): "<p class='meta'>无线索发现。</p>"}
<p class="meta">${missionDef.kind === "原著任务"? "原著任务：结局按原著走向评定，超出原著的部分已标注。": "【非原著·原创】本任务为原创设计，结局为模拟结果，不是原著剧情。"}</p>
<button class="btn small" id="missionAgain">再玩一次</button></div>`;
$("#missionAgain").addEventListener("click", () => startMission(missionDef.id));
}

function chooseMission(i) {
const stage = missionDef.stages.find((s) => s.id === missionState.stage);
const ch = stage.choices[i];
missionState.log.push(stage.title + "：" + ch.text);
applyFx(ch.fx || {});
if (ch.next === "end") {
const end = missionDef.ending(missionState);
missionState.stage = "end";
missionState.completed = true;
missionState.result = end;
saveMissionState();
renderMissionResult(end);
return;
}
missionState.stage = ch.next;
saveMissionState();
renderMissionStage();
}

async function loadMissionCanonBrief(novelId = "casino-royale") {
  const box = $("#missionCanonBrief");
  if (!novelId) {
    box.innerHTML = '<p class="meta">原创任务：没有原著正典依据。所有人物关系、地点和分支均为原创模拟内容。</p>';
    return;
  }
  try {
    const r = await fetch("/api/mission?id=" + encodeURIComponent(novelId));
    if (!r.ok) throw new Error("任务正典接口返回 " + r.status);
    const d = await r.json();
    const facts = (d.facts || []).slice(0, 8);
    const events = (d.events || []).slice(0, 4);
    box.innerHTML = '<h3>'+esc(d.novel.titleZh)+' · '+d.novel.year+'</h3><p class="meta">'+esc(d.missionMode)+'：玩家选择会产生互动分支，不能冒充原著剧情。</p><p>'+esc(d.novel.timeline)+'</p><p><b>章节目录：</b>'+esc(d.chapters.map(c=>c.no+" "+c.title).join(" · "))+'</p><p><b>核验事实摘录：</b></p><ul>'+facts.map(f=>'<li>'+esc("第"+f.chapter+"章："+f.fact)+'</li>').join("")+'</ul><p><b>关键事件：</b></p><ul>'+events.map(e=>'<li>'+esc("第"+e.chapter+"章："+e.title+" — "+e.effect)+'</li>').join("")+'</ul>';
  } catch(e) { box.innerHTML = '<p class="meta">原著任务资料加载失败：'+esc(e.message)+'。任务剧情暂不标为已完成正典核验。</p>'; }
}
function saveMissionState() {
  try {
    if (missionDef && missionState) {
      localStorage.setItem("007-mission:" + missionDef.id, JSON.stringify({ missionId: missionDef.id, state: missionState }));
      localStorage.setItem("007-mission:last", missionDef.id);
    }
  } catch(e) {}
}
function restoreMissionState(preferredId = null) {
  try {
    const id = preferredId || localStorage.getItem("007-mission:last") || "casino";
    const saved = JSON.parse(localStorage.getItem("007-mission:" + id) || "null");
    if (!saved || saved.missionId !== id || !saved.state) return false;
    const def = missionById(id);
    const state = saved.state;
    if (!def || !def.stages.some(x => x.id === state.stage) && !(state.completed && state.result)) return false;
    if (!Number.isFinite(state.funds) || !Number.isFinite(state.risk) || !Number.isFinite(state.cred) || !Array.isArray(state.clues) || !Array.isArray(state.log)) return false;
    missionDef = def;
    missionState = state;
    localStorage.setItem("007-mission:last", id);
    if (state.completed && state.result) renderMissionResult(state.result);
    else renderMissionStage();
    return true;
  } catch(e) { return false; }
}
function initMissions() { renderMissionList(); loadMissionCanonBrief("casino-royale"); restoreMissionState(); }

// ---- 成为邦德：场景体验 + 百家乐 ----
const EXP_SCENES = [
{ id: "m-office", title: "M办公室·领任务", text: "伦敦，秘密情报机构总部。M坐在办公桌后，钱彭妮在门外守着电话。你推门进去，M头也不抬：“坐下，007。”任务简报只有一页纸，剩下的全靠你自己。", choices: ["接下任务简报", "追问任务细节", "请M再给24小时准备"], replies: ["M把简报推过来：“签个字。出了这扇门，任务就是你的了。”", "M抬起头：“细节都在纸上。纸上没有的，问我也没用。”", "M冷笑一声：“敌人不会等你准备好。明天早上出发。”"] },
{ id: "q-lab", title: "Q部门·领装备", text: "地下实验室。Q站在工作台前，身后是一排拆开的器械。他把瓦尔特PPK手枪推到你面前，又递过一支改装过的钢笔：“讲解只说一遍。”", choices: ["领瓦尔特PPK手枪", "领改装钢笔", "问有没有新装备"], replies: ["Q：“扳机我调过。别再拿它当撬棍，007。”", "Q：“按一下出墨水，按两下——算了，你还是别知道了。用完还回来。”", "Q：“有。但以你弄坏装备的速度，我建议你先学会爱惜旧的。”"] },
{ id: "hotel", title: "豪华酒店·入住", text: "皇家莱索最好的酒店。你要了朝海的房间，行李只有一只小皮箱。前台递来钥匙，你顺手把一张钞票留在桌上——在这里，小费是最好的通行证。", choices: ["要朝海的房间", "让前台留意可疑访客", "先去酒吧坐坐"], replies: ["前台：“3楼朝海的房间，先生。祝您住得愉快。”", "前台压低声音：“明白，先生。有任何动静，我第一个通知您。”", "你走向酒吧。真正的情报，总是在酒吧里流传。"] },
{ id: "restaurant", title: "高级餐厅·晚餐", text: "餐厅里烛光摇曳。你点了牛排与红酒，对面的座位还空着——薇丝朋说她晚点到。侍者经过时，你注意到邻桌的男人也在看你。", choices: ["点牛排配红酒", "等薇丝朋到了再点菜", "留意邻桌的男人"], replies: ["侍者：“牛排五分熟，红酒是1953年的。先生好品味。”", "你点了杯水，慢慢等。等人，是这行最基本的耐心。", "邻桌的男人低头看报，报纸拿反了。你记下了他的脸。"] },
{ id: "bar", title: "鸡尾酒吧·马提尼", text: "吧台前，你对酒保说出那句标志性的话。酒保点头，开始摇酒。周围的人都在谈论今晚赌场的牌局，勒·希弗的名字被提起了三次。", choices: ["点一杯马提尼，摇匀不搅拌", "点一杯香槟", "请酒保讲讲今晚牌局"], replies: ["酒保把马提尼推过来，摇匀，不搅拌。你抿了一口，味道正好。", "香槟上桌，气泡升起来像小小的信号。你没有碰，只是看着。", "酒保擦着杯子：“勒·希弗今晚手气不好，先生。不过输急了的人最危险。”"] },
{ id: "casino", title: "赌场·牌桌", text: "赌场大厅。百家乐牌桌旁，勒·希弗已经就座，面前堆着筹码。空气里有雪茄味和紧张。你走过去，拉开椅子坐下——今晚的主角到齐了。", choices: ["坐下，直接开局", "先在旁边观战一轮", "去百家乐桌实战一把"], replies: ["你坐下，推上筹码。勒·希弗抬眼看你：“邦德先生，欢迎。”", "你站在人群后看了一轮：勒·希弗拿到好牌时会摸手帕。你记住了。", "直接去下方百家乐小游戏实战，筹码与输赢都是真的。"] },
{ id: "club", title: "私人俱乐部·社交", text: "布莱兹俱乐部。皮椅、雪茄、报纸。在这里，没人高声说话，所有的交易都在低声中完成。你要找的人坐在角落那张桌子旁。", choices: ["和角落那位打个招呼", "先读一会儿报纸", "点一支雪茄"], replies: ["那人抬头：“邦德先生。坐。有些话，只能在这里说。”", "报纸上的消息一半是真的，一半是放出来的。你分得清。", "雪茄点燃，烟雾升起来。你想起M说过的话：俱乐部里没有偶遇。"] },
{ id: "car", title: "豪华汽车·出行", text: "门口停着一辆深灰色轿车，线条利落。你坐进驾驶座，发动引擎。去机场的路上有三条，你选了最绕的那条——先确认有没有人跟踪。", choices: ["选最绕的路去机场", "直接走高速", "绕到码头换船"], replies: ["你绕了三条街，后视镜里那辆车还在。很好，鱼上钩了。", "高速上车流稀少，跟你的车无处可藏。你踩下油门。", "码头边，你弃车登船。跟踪者站在岸边，看着你远去。"] },
{ id: "travel", title: "旅行与城市探索", text: "从伦敦到皇家莱索，从伊斯坦布尔到牙买加，邦德的世界是一张不断展开的地图。每一座城市都有它的赌场、它的线人与它的危险。去世界地图看看14本书走过的地方。", choices: ["打开世界地图", "回顾皇家赌场之行", "计划下一站"], replies: ["地图在下方世界地图模块，170处核验地点，点任意地点进入相关档案。", "皇家莱索：牌桌、薇丝朋、勒·希弗。一切从那里开始。", "下一站由你决定——任务模拟器里还有一场威尼斯原创任务等着你。"] }
];

let expLog = [];
function initExperience() {
  $("#expScenes").innerHTML = EXP_SCENES.map((s) => `<button class="chipbtn" data-exp="${s.id}">${esc(s.title)}</button>`).join("");
  $$("#expScenes .chipbtn").forEach((b) => b.addEventListener("click", () => showExpScene(b.dataset.exp)));
  showExpScene("m-office");
}

function showExpScene(id) {
  const s = EXP_SCENES.find((x) => x.id === id);
  $$("#expScenes .chipbtn").forEach((x) => x.classList.toggle("active", x.dataset.exp === id));
  $("#expPanel").innerHTML = `<h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>
  ${s.choices.map((c, i) => `<button class="choice" data-expchoice="${i}">${esc(c)}</button>`).join("")}
  <div id="expOut">${expLog.length ? expLog.map((l) => `<div class="log">${esc(l)}</div>`).join("") : ""}</div>
  ${id === "casino" ? `<p class="meta">赌场实战在下方百家乐小游戏，筹码与输赢都是真的。</p>` : ""}`;
  $$("#expPanel [data-expchoice]").forEach((el) => el.addEventListener("click", () => {
    const reply = s.replies[+el.dataset.expchoice];
    expLog.push(s.title + "：" + reply);
    $("#expOut").innerHTML = expLog.map((l) => `<div class="log">${esc(l)}</div>`).join("");
    if (id === "casino" && +el.dataset.expchoice === 2) document.getElementById("baccaratCard").scrollIntoView({ behavior: "smooth" });
    if (id === "travel" && +el.dataset.expchoice === 0) document.getElementById("atlas").scrollIntoView({ behavior: "smooth" });
  }));
}

// 百家乐（简化规则，已在页面说明）
let bacChips = 1000, bacWins = 0, bacLosses = 0, bacStreak = 0;
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
function drawCard() {
  const r = RANKS[Math.floor(Math.random() * RANKS.length)];
  const s = SUITS[Math.floor(Math.random() * SUITS.length)];
  const v = r === "A" ? 1 : (["10", "J", "Q", "K"].includes(r) ? 0 : parseInt(r, 10));
  return { label: r + s, value: v };
}
function handTotal(cards) { return cards.reduce((a, c) => a + c.value, 0) % 10; }
function playBaccarat() {
  const amount = Math.max(10, Math.min(bacChips, parseInt($("#bacAmount").value, 10) || 100));
  if (bacChips < 10) { $("#bacNote").textContent = "筹码不足，请点“重新领筹码”。"; return; }
  const side = $("#bacSide").value;
  const player = [drawCard(), drawCard()];
  const banker = [drawCard(), drawCard()];
  let pTotal = handTotal(player);
  let bTotal = handTotal(banker);
  const pNatural = pTotal >= 8, bNatural = bTotal >= 8;
  let pThird = null;
  if (!pNatural && !bNatural) {
    if (pTotal <= 5) { pThird = drawCard(); player.push(pThird); pTotal = handTotal(player); }
    if (pThird === null) { if (bTotal <= 5) { banker.push(drawCard()); bTotal = handTotal(banker); } }
    else {
      const tv = pThird.value;
      if (bTotal <= 2) banker.push(drawCard());
      else if (bTotal === 3 && tv !== 8) banker.push(drawCard());
      else if (bTotal === 4 && tv >= 2 && tv <= 7) banker.push(drawCard());
      else if (bTotal === 5 && tv >= 4 && tv <= 7) banker.push(drawCard());
      else if (bTotal === 6 && (tv === 6 || tv === 7)) banker.push(drawCard());
      bTotal = handTotal(banker);
    }
  }
  let result, payout = 0;
  if (pTotal === bTotal) result = "tie";
  else if (pTotal > bTotal) result = "player";
  else result = "banker";
  let text = "";
  if (side === result) {
    if (result === "tie") payout = amount * 8;
    else if (result === "banker") payout = Math.floor(amount * 0.95);
    else payout = amount;
    bacChips += payout; bacWins++; bacStreak = bacStreak > 0 ? bacStreak + 1 : 1;
    text = result === "tie" ? "和局！你押中和局，赢" + payout + "筹码。" : "你赢了这把，赢" + payout + "筹码。";
  } else {
    bacChips -= amount; bacLosses++; bacStreak = bacStreak < 0 ? bacStreak - 1 : -1;
    text = "这把输了，输掉" + amount + "筹码。" + (result === "tie" ? "本局为和局。" : (result === "player" ? "闲家胜。" : "庄家胜。"));
  }
  const rival = bacStreak >= 3 ? "勒·希弗眯起眼睛：“你今晚手气不错，邦德先生。”" : bacStreak <= -3 ? "勒·希弗冷笑：“筹码会自己长脚走到我这边来。”" : bacStreak > 0 ? "勒·希弗：“继续，别停。”" : bacStreak < 0 ? "勒·希弗：“别急，牌桌还长着呢。”" : "勒·希弗观望中。";
  $("#bacChips").textContent = bacChips;
  $("#bacBet").textContent = amount + "·" + ({ player: "闲家", banker: "庄家", tie: "和局" }[side]);
  $("#bacRecord").textContent = bacWins + "胜" + bacLosses + "负";
  $("#bacRival").textContent = rival;
  $("#bacTable").innerHTML = `<table><tr><th>闲家</th><th>点数</th><th>庄家</th><th>点数</th></tr>
  <tr><td>${player.map((c) => esc(c.label)).join(" ")}</td><td><b>${pTotal}</b></td><td>${banker.map((c) => esc(c.label)).join(" ")}</td><td><b>${bTotal}</b></td></tr></table>
  <p style="margin-top:10px">${esc(text)}</p><p class="meta">${esc(rival)}</p>
  <p class="meta">简化规则说明：闲家0–5点补牌，6–7点停牌；庄家按简化补牌表执行。和局赔8倍，庄赢赔0.95倍，闲赢赔1倍。</p>`;
  $("#bacNote").textContent = bacChips <= 0 ? "筹码用完了，点“重新领筹码”恢复1000。" : "";
}

function initBaccarat() {
  $("#bacDeal").addEventListener("click", playBaccarat);
  $("#bacReset").addEventListener("click", () => {
    bacChips = 1000; bacWins = 0; bacLosses = 0; bacStreak = 0;
    $("#bacChips").textContent = bacChips;
    $("#bacRecord").textContent = "0胜0负";
    $("#bacRival").textContent = "观望中";
    $("#bacBet").textContent = "—";
    $("#bacTable").innerHTML = `<div class="empty">已重新领筹码1000。祝牌桌好运。</div>`;
    $("#bacNote").textContent = "";
  });
}

// ---- 文学研究室 ----
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
    (!era || p.appearances.some(a => { const year = Number(a.year); return Number.isFinite(year) && (era === "1950s" ? year < 1960 : year >= 1960); }))
  );
}

function renderAtlas() {
  const list = filteredCanonLocations();
  const wrap = $("#mapWrap");
  const mapW = wrap.clientWidth || 900;
  const mapH = wrap.clientHeight || 300;
  const compact = mapW < 560;
  const dots = list.filter(p => !p.fictional && MAP_COORDINATES[p.id]).map(p => ({ p, coords: MAP_COORDINATES[p.id] }));

  if (window.L && wrap) {
    if (!leafletMap) {
      leafletMap = window.L.map(wrap, { scrollWheelZoom: false }).setView([25, 10], 2);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'
      }).addTo(leafletMap);
      leafletMarkers = window.L.layerGroup().addTo(leafletMap);
    }
    leafletMarkers.clearLayers();
    dots.forEach(d => {
      const marker = window.L.circleMarker(d.coords, {
        radius: 6, color: "#80631c", weight: 2, fillColor: "#d2ad43", fillOpacity: 0.92
      });
      marker.bindPopup(`<strong>${esc(d.p.name)}</strong><br>${esc(d.p.country)}<br>${d.p.appearances.length}部作品`);
      marker.on("click", () => showLocation(d.p.id));
      marker.addTo(leafletMarkers);
    });
    if (dots.length === 1) leafletMap.setView(dots[0].coords, 4);
    else if (dots.length > 1) leafletMap.fitBounds(window.L.latLngBounds(dots.map(d => d.coords)).pad(0.2), { maxZoom: 4 });
    else leafletMap.setView([25, 10], 2);
    let empty = wrap.querySelector(".map-empty-overlay");
    if (!dots.length) {
      if (!empty) {
        empty = document.createElement("div");
        empty.className = "map-empty-overlay";
        empty.textContent = "当前筛选没有可核验坐标的真实地点；虚构或区域级地点请查看下方档案。";
        empty.style.cssText = "position:absolute;z-index:500;top:12px;left:12px;max-width:70%;padding:8px 10px;background:rgba(244,240,228,.94);color:#1b241d;border-radius:4px;font-size:12px";
        wrap.appendChild(empty);
      }
    } else if (empty) empty.remove();
    leafletMap.invalidateSize();
  } else {
    wrap.classList.toggle("compact", compact);
    const placedBoxes = [];
    dots.forEach(d => {
      const [lat,lng] = d.coords;
      d.xPct = (lng + 180) / 360 * 100;
      d.yPct = (90 - lat) / 180 * 100;
      d.xPx = d.xPct / 100 * mapW;
      d.yPx = d.yPct / 100 * mapH;
    });
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
    $$("#mapWrap .mapdot").forEach(el => el.addEventListener("click", () => showLocation(el.dataset.loc)));
  }
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
else { pill.textContent = "模型待接入·人物对话暂停"; pill.classList.add("red"); modelAvailable = false;}
$("#modelLine").textContent = d.llm && d.llm.available? "模型已接入：" + d.llm.provider: "模型未接入：正典人物对话已暂停；档案、任务与世界探索仍可使用。";
} catch (e) {
$("#statusPill").textContent = "状态接口不可用";
$("#statusPill").classList.add("red");
$("#modelLine").textContent = "状态接口不可用，无法确认模型状态；正典人物对话不会使用无约束回退。";
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
