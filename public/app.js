// 007 INTELLIGENCE LAB前端逻辑。示例数据与后端functions/_lib保持一致，
// 全部标注示例数据·待TXT导入核验。模型未接入时对话走本地脚本化演示并标注。
const SAMPLE = "核验知识库 · Ian Fleming 14部原著";
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let CHARACTERS = [];

const BOOKS = [
{ zh: "皇家赌场", en: "Casino Royale", year: 1953, kind: "长篇", setting: "法国皇家莱索", villain: "勒·希弗", summary: "邦德受命在皇家赌场牌桌上击败苏联情报机构出纳勒·希弗，阻止其翻本。牌桌、酷刑与薇丝朋·琳德之死，构成系列开篇。" },
{ zh: "生死关头", en: "Live and Let Die", year: 1954, kind: "长篇", setting: "美国、牙买加", villain: "Mr Big（大先生）", summary: "邦德追查与苏联方面勾结的犯罪头目，费利克斯·莱特首次登场并与邦德结盟。" },
{ zh: "月亮牌", en: "Moonraker", year: 1955, kind: "长篇", setting: "英国肯特郡", villain: "雨果·德拉克斯", summary: "邦德调查月亮牌导弹计划，揭开德拉克斯爵士的真实身份与阴谋。" },
{ zh: "金刚钻", en: "Diamonds Are Forever", year: 1956, kind: "长篇", setting: "非洲、美国、拉斯维加斯", villain: "钻石走私集团", summary: "邦德卧底追查钻石走私链，从非洲一路追到拉斯维加斯。" },
{ zh: "来自俄罗斯的爱情", en: "From Russia with Love", year: 1957, kind: "长篇", setting: "伊斯坦布尔、东方快车", villain: "克伦斯坦、罗莎·克莱布", summary: "苏联方面以密码机为诱饵设下诱杀局，塔蒂亚娜·罗曼诺娃在途中倒向邦德。" },
{ zh: "诺博士", en: "Dr No", year: 1958, kind: "长篇", setting: "牙买加、蟹礁岛", villain: "诺博士", summary: "邦德前往牙买加调查失踪事件，登上蟹礁岛，对付双手为钢钳的诺博士。" },
{ zh: "金手指", en: "Goldfinger", year: 1959, kind: "长篇", setting: "英国、美国诺克斯堡", villain: "奥里克·金手指", summary: "邦德从高尔夫球场一路追查黄金走私巨头金手指，挫败其诺克斯堡行动。" },
{ zh: "只为你的双眼", en: "For Your Eyes Only", year: 1960, kind: "短篇集", setting: "多地", villain: "多位", summary: "短篇集，含多个独立任务故事。" },
{ zh: "霹雳弹", en: "Thunderball", year: 1961, kind: "长篇", setting: "巴哈马、拿骚", villain: "布洛菲尔德、埃米利奥·拉戈", summary: "幽灵党首脑布洛菲尔德首次登场，策划核勒索，邦德在巴哈马海域追击。" },
{ zh: "爱我的间谍", en: "The Spy Who Loved Me", year: 1962, kind: "长篇", setting: "美国", villain: "黑帮打手", summary: "以女性视角讲述的特别篇章，邦德在旅馆夜战中救下女主人公。" },
{ zh: "女王密使", en: "On Her Majesty's Secret Service", year: 1963, kind: "长篇", setting: "瑞士阿尔卑斯山区", villain: "布洛菲尔德", summary: "邦德追查布洛菲尔德，与崔西相恋结婚，婚礼当日崔西遇害。" },
{ zh: "雷霆谷", en: "You Only Live Twice", year: 1964, kind: "长篇", setting: "日本", villain: "布洛菲尔德", summary: "失忆与复仇之作，邦德前往日本，在雷霆谷与化名博士的布洛菲尔德对决。" },
{ zh: "金枪人", en: "The Man with the Golden Gun", year: 1965, kind: "长篇", setting: "牙买加", villain: "弗朗西斯科·斯卡拉曼加", summary: "邦德追查以金枪闻名的杀手斯卡拉曼加，弗莱明去世后出版的遗作。" },
{ zh: "八爪女与黎明生死线", en: "Octopussy and The Living Daylights", year: 1966, kind: "短篇集", setting: "多地", villain: "多位", summary: "短篇集，弗莱明去世后出版，含八爪女等故事。" }
];

const LOCATIONS = [
{ id: "london", name: "伦敦", country: "英国", lat: 51.5074, lng: -0.1278, fictional: false, books: ["皇家赌场", "月亮牌", "金手指"], note: "秘密情报机构总部所在地，M办公室与Q部门所在地。", people: ["邦德", "M", "钱彭妮", "Q"] },
{ id: "royale", name: "皇家莱索", country: "法国", lat: null, lng: null, fictional: true, books: ["皇家赌场"], note: "虚构海滨赌城，皇家赌场所在地。小说虚构地点，不标注真实坐标。", people: ["邦德", "勒·希弗", "薇丝朋·琳德"] },
{ id: "paris", name: "巴黎", country: "法国", lat: 48.8566, lng: 2.3522, fictional: false, books: ["皇家赌场", "来自俄罗斯的爱情"], note: "邦德多次途经与停留的欧洲城市。", people: ["邦德"] },
{ id: "istanbul", name: "伊斯坦布尔", country: "土耳其", lat: 41.0082, lng: 28.9784, fictional: false, books: ["来自俄罗斯的爱情"], note: "诱杀计划的关键城市，东方快车起点。", people: ["邦德", "塔蒂亚娜·罗曼诺娃"] },
{ id: "venice", name: "威尼斯", country: "意大利", lat: 45.4408, lng: 12.3155, fictional: false, books: ["来自俄罗斯的爱情"], note: "东方快车沿线城市。", people: ["邦德", "塔蒂亚娜·罗曼诺娃"] },
{ id: "kingston", name: "金斯敦", country: "牙买加", lat: 17.9712, lng: -76.7936, fictional: false, books: ["生死关头", "诺博士", "金枪人"], note: "邦德多次行动的加勒比海基地。", people: ["邦德", "费利克斯·莱特"] },
{ id: "crabkey", name: "蟹礁岛", country: "牙买加", lat: null, lng: null, fictional: true, books: ["诺博士"], note: "虚构岛屿，诺博士基地所在地。小说虚构地点，不标注真实坐标。", people: ["邦德", "诺博士"] },
{ id: "newyork", name: "纽约", country: "美国", lat: 40.7128, lng: -74.006, fictional: false, books: ["生死关头", "金刚钻"], note: "邦德在美国行动的重要城市。", people: ["邦德", "费利克斯·莱特"] },
{ id: "lasvegas", name: "拉斯维加斯", country: "美国", lat: 36.1699, lng: -115.1398, fictional: false, books: ["金刚钻"], note: "钻石走私链终点，赌场城市。", people: ["邦德"] },
{ id: "florida", name: "佛罗里达", country: "美国", lat: 27.6648, lng: -81.5158, fictional: false, books: ["生死关头", "金手指"], note: "邦德多次前往的美国南部州。", people: ["邦德", "费利克斯·莱特"] },
{ id: "nassau", name: "拿骚", country: "巴哈马", lat: 25.0443, lng: -77.3504, fictional: false, books: ["霹雳弹"], note: "核勒索案的海域行动中心。", people: ["邦德", "布洛菲尔德"] },
{ id: "alps", name: "瑞士阿尔卑斯山区", country: "瑞士", lat: 46.559, lng: 9.787, fictional: false, books: ["女王密使"], note: "布洛菲尔德山顶诊所所在地一带，坐标为区域示意。", people: ["邦德", "崔西·邦德", "布洛菲尔德"] },
{ id: "tokyo", name: "东京", country: "日本", lat: 35.6762, lng: 139.6503, fictional: false, books: ["雷霆谷"], note: "邦德在日本行动的起点。", people: ["邦德"] },
{ id: "fortknox", name: "诺克斯堡", country: "美国", lat: 37.8937, lng: -85.9574, fictional: false, books: ["金手指"], note: "美国黄金储备库，金手指行动目标。", people: ["邦德", "金手指"] },
{ id: "kent", name: "肯特郡", country: "英国", lat: 51.2787, lng: 0.5217, fictional: false, books: ["月亮牌"], note: "月亮牌导弹基地所在地一带。", people: ["邦德"] }
];

const ORGS = [
{ name: "英国秘密情报机构", en: "Secret Intelligence Service", kind: "情报机构", note: "邦德所属机构，首长为M，总部在伦敦。", books: "全系列" },
{ name: "美国中央情报局", en: "Central Intelligence Agency", kind: "情报机构", note: "费利克斯·莱特所属机构，邦德的盟友。", books: "皇家赌场、生死关头、金刚钻、金手指、霹雳弹、金枪人" },
{ name: "苏联反间谍机构", en: "SMERSH", kind: "情报机构", note: "早期小说中的苏联方面机构，勒·希弗为其出纳。", books: "皇家赌场、生死关头、来自俄罗斯的爱情" },
{ name: "幽灵党", en: "SPECTRE", kind: "犯罪组织", note: "布洛菲尔德领导的跨国犯罪组织，霹雳弹起成为主要对手。", books: "霹雳弹、女王密使、雷霆谷" },
{ name: "Q部门", en: "Q Branch", kind: "技术部门", note: "负责军械与特种装备，负责人为Q。", books: "全系列" }
];

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
function chatStorageKey() { return "007-intel-chat:" + selectedChar + ":" + (document.getElementById("sceneNovel")?.value || "casino-royale"); }
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
<p><b>原著事实（可检索）：</b></p>
<ul style="font-size:14px;margin:4px 0;padding-left:20px">${c.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
<p class="meta">${SAMPLE}</p>
<button class="btn small" id="talkThis">和${esc(c.zh)}对话</button>`;
$("#talkThis").addEventListener("click", () => {
restoreChatHistory();
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

function scriptedReply(c, input) {
const t = (input || "").toLowerCase();
if (/(你是谁|身份|介绍)/.test(input)) return c.intro + "我的知识截止于" + c.cutoff + "，之后的事我不知道。";
if (/武器|枪|装备/.test(input)) {
if (c.id === "q") return "装备清单按Q部门口径：瓦尔特PPK手枪是标准配枪，诺博士起换装。别的装备得看任务单，我不能凭空给你。";
if (c.id === "bond") return "我的枪是瓦尔特PPK，诺博士那次换的。早期的贝雷塔已经不用了。";
return "武器装备的事得问Q，我只知道自己职责范围内的部分。";
}
if (/任务|汇报|M/.test(input) && c.id === "m") return "汇报。只讲事实，别加你的看法。任务简报在任务模拟器里，M办公室只听汇报，不发新任务。";
if (/赌场|牌|百家乐/.test(input)) {
if (c.id === "lechiffre") return "牌桌上没有朋友，只有筹码。你想坐下来，先证明你有筹码。";
if (c.id === "bond") return "牌桌上我只信两样东西：牌，和对手的眼睛。皇家赌场那一晚就是这么赢的。";
return "赌场的事我知道的不多，牌桌细节得问当时在场的人。";
}
if (/电影/.test(input)) return "电影版剧情不算原著，我不能拿电影里的事当小说事实回答你。";
if (/(死|杀|结局)/.test(input) && c.facts.some((f) => /身亡|处决|杀害|自杀/.test(f))) {
const f = c.facts.find((f2) => /身亡|处决|杀害|自杀/.test(f2));
return "按原著事实：" + f + "超出这个范围的事，我不知道。";
}
const fact = c.facts.find((f) => input.split("").some((ch) => ch && f.includes(ch) && ch.length > 0)) || null;
if (fact && input.length > 3) return "按我知道的原著事实：" + fact;
return c.scripted[Math.floor(Math.random() * c.scripted.length)] + "（这句是离线脚本化演示回复，模型接入后会按三层约束实时生成。）";
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
body: JSON.stringify({ characterIds: ids, novelId: $("#sceneNovel").value, messages: chatHistory.slice(-12)})});
if (r.ok) {
const d = await r.json();
clearThinking();
addChatMsg("them", d.reply, c.zh);
chatHistory.push({ role: "assistant", content: d.reply});
saveChatHistory();
$("#modelLine").textContent = "模型已接入：" + (d.model || "") + (d.canonMode ? " · 正典时间线约束已启用" : "");
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
bd.books.forEach(b => { const o=document.createElement("option");o.value=b.titleZh;o.textContent=b.titleZh+"（"+b.year+"）";bf.appendChild(o);const so=document.createElement("option");so.value=b.id;so.textContent=b.titleZh+" · "+b.year;scene.appendChild(so); });
scene.value="casino-royale";
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
$("#sceneNovel").addEventListener("change", restoreChatHistory);
$("#chatInput").addEventListener("keydown", (e) => { if (e.key === "Enter") sendChat();});
renderCharGrid();
}

// ---- 情报档案馆 ----
function dossierSearchLocal(q) {
  const query = (q || "").trim();
  if (!query) return [];
  const hits = [];
  const push = (type, title, source, detail) => hits.push({ type, title, source, detail });
  if (/日本/.test(query)) push("小说", "雷霆谷", "雷霆谷（1964年）", "邦德前往日本，在雷霆谷对决布洛菲尔德。");
  if (/苏联|苏俄|SMERSH/i.test(query)) {
    push("反派", "勒·希弗", "皇家赌场（1953年）", "苏联情报机构出纳，挪用公款后企图在赌场翻本。");
    push("组织", "苏联反间谍机构", "皇家赌场、来自俄罗斯的爱情", "早期小说中的苏联方面机构。");
    push("人物", "塔蒂亚娜·罗曼诺娃", "来自俄罗斯的爱情（1957年）", "苏联密码员，被卷入针对邦德的诱杀计划。");
  }
  if (/莱特|费利克斯/.test(query)) push("人物", "费利克斯·莱特", "生死关头（1954年）首次登场", "美国中央情报局人员，邦德的盟友。底本核验出现作品：皇家赌场、生死关头、金刚钻、金手指、霹雳弹、金枪人（共6本）。");
  if (/武器|手枪|PPK|贝雷塔|金枪/.test(query)) {
    push("武器", "贝雷塔手枪", "皇家赌场至来自俄罗斯的爱情", "邦德早期配枪。");
    push("武器", "瓦尔特PPK手枪", "诺博士（1958年）起", "诺博士起成为邦德标志性配枪。");
    push("武器", "金枪", "金枪人（1965年）", "斯卡拉曼加的标志性武器。");
  }
  if (/赌场|百家乐|牌桌/.test(query)) {
    push("小说", "皇家赌场", "皇家赌场（1953年）", "全书核心为赌场牌桌对决。");
    push("小说", "金刚钻", "金刚钻（1956年）", "涉及拉斯维加斯赌场。示例，待TXT核验。");
  }
  if (/邦德|007/.test(query)) BOOKS.forEach((b) => push("小说", b.zh, b.en + "（" + b.year + "年）", b.summary));
  if (/布洛菲尔德|幽灵党|SPECTRE/i.test(query)) {
    push("反派", "布洛菲尔德", "霹雳弹（1961年）首次登场", "幽灵党首脑，全系列最大反派。");
    push("组织", "幽灵党", "霹雳弹、女王密使、雷霆谷", "布洛菲尔德领导的跨国犯罪组织。");
  }
  if (/崔西|薇丝朋|塔蒂亚娜|女性/.test(query)) {
    push("人物", "薇丝朋·琳德", "皇家赌场（1953年）", "英国财政部联络人，双面间谍。");
    push("人物", "塔蒂亚娜·罗曼诺娃", "来自俄罗斯的爱情（1957年）", "苏联密码员。");
    push("人物", "崔西·邦德", "女王密使（1963年）", "邦德唯一正式迎娶的妻子。");
  }
  if (/伦敦/.test(query)) push("地点", "伦敦", "全系列", "秘密情报机构总部所在地。");
  if (/牙买加|蟹礁岛/.test(query)) {
    push("地点", "金斯敦", "生死关头、诺博士、金枪人", "邦德多次行动的加勒比海基地。");
    push("地点", "蟹礁岛", "诺博士（1958年）", "虚构岛屿，诺博士基地所在地。");
  }
  if (/M|钱彭妮|Q/.test(query) && !/邦德/.test(query)) {
    CHARACTERS.filter((c) => ["m", "moneypenny", "q"].includes(c.id)).forEach((c) => push("人物", c.zh, c.firstBook + "（" + c.firstYear + "年）首次登场", c.intro));
  }
  return hits;
}

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
        const title = h.title_zh || h.name_zh || h.name || h.name_en || h.entity || h.id || "未命名记录";
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
{ id: "casino", title: "皇家赌场", kind: "原著任务", kindTag: "原著", desc: "严格依据原著设定：1953年，皇家莱索。你的任务是在牌桌上击败勒·希弗，阻止苏联情报机构出纳翻本。", start: { funds: 10000, risk: 20, cred: 70, day: 1},
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

function renderMissionList() {
$("#missionList").innerHTML = MISSIONS.map((m) =>
`<div class="card clickable" data-mission="${m.id}">
<h3>${esc(m.title)} <span class="tag ${m.kindTag === "原著"? "gold": "red"}">${esc(m.kind)}</span></h3>
<p>${esc(m.desc)}</p>
<p class="meta">起始资金${m.start.funds} · 风险${m.start.risk} · 情报可信度${m.start.cred}</p>
<button class="btn small">开始任务</button></div>`).join("");
$$("#missionList [data-mission]").forEach((el) => el.addEventListener("click", () => startMission(el.dataset.mission)));
}

function startMission(id) {
missionDef = missionById(id);
missionState = { funds: missionDef.start.funds, risk: missionDef.start.risk, cred: missionDef.start.cred, day: missionDef.start.day, clues: [], rels: {}, equip: [], stage: missionDef.stages[0].id, log: []};
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
$("#missionQuit").addEventListener("click", () => { missionState = null; missionDef = null; $("#missionPanel").innerHTML = `<h3>任务控制台</h3><p class="meta">任务已放弃。选一个任务重新开始。</p><div class="empty">尚未开始任务</div>`;});
}

function chooseMission(i) {
const stage = missionDef.stages.find((s) => s.id === missionState.stage);
const ch = stage.choices[i];
missionState.log.push(stage.title + "：" + ch.text);
applyFx(ch.fx || {});
if (ch.next === "end") {
const end = missionDef.ending(missionState);
const s = missionState;
$("#missionPanel").innerHTML = `<h3>${esc(missionDef.title)} · 任务结果</h3>${stateBarHTML()}
<div class="card" style="margin-top:6px"><h3>行动报告·${esc(end.grade)}</h3><p>${esc(end.text)}</p>
<p><b>行动记录：</b></p><ul style="font-size:14px">${s.log.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
<p><b>线索汇总（${s.clues.length}条）：</b></p>${s.clues.length? s.clues.map((c) => `<div class="log">${esc(c)}</div>`).join(""): "<p class='meta'>无线索发现。</p>"}
<p class="meta">${missionDef.kind === "原著任务"? "原著任务：结局按原著走向评定，超出原著的部分已标注。": "【非原著·原创】本任务为原创设计，结局为模拟结果，不是原著剧情。"}</p>
<button class="btn small" id="missionAgain">再玩一次</button></div>`;
$("#missionAgain").addEventListener("click", () => startMission(missionDef.id));
return;
}
missionState.stage = ch.next;
renderMissionStage();
}

function initMissions() { renderMissionList();}

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
{ id: "travel", title: "旅行与城市探索", text: "从伦敦到皇家莱索，从伊斯坦布尔到牙买加，邦德的世界是一张不断展开的地图。每一座城市都有它的赌场、它的线人与它的危险。去世界地图看看14本书走过的地方。", choices: ["打开世界地图", "回顾皇家赌场之行", "计划下一站"], replies: ["地图在下方世界地图模块，15处地点，点任意地点进入相关档案。", "皇家莱索：牌桌、薇丝朋、勒·希弗。一切从那里开始。", "下一站由你决定——任务模拟器里还有一场威尼斯原创任务等着你。"] }
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

function litAnswer(q) {
if (/悬念/.test(q)) return "弗莱明写悬念靠信息差：读者和邦德同时只知道一半，另一半由对手慢慢揭开。牌桌、密室、追踪三种场景轮换，悬念从不掉线。皇家赌场全书以牌桌为悬念核心。";
if (/反派/.test(q)) return "弗莱明式反派有三件套：肉体特征、痴迷之物、缜密计划。勒·希弗精于算计，诺博士迷信科学，金手指痴迷黄金，布洛菲尔德把犯罪当生意。反派越具体，邦德的胜利越有分量。";
if (/邦德.*塑造|人物塑造/.test(q)) return "邦德的可信来自细节与弱点：他讲究衣着饮食，会输牌、会受伤、会动情。配枪从贝雷塔换成瓦尔特PPK（诺博士，1958年），马提尼摇匀不搅拌（皇家赌场，1953年），都是人物标签。";
if (/电影|改编/.test(q)) return "电影强化了装备与场面，弱化了小说的心理与生活细节。电影独有的装备、情节与人物关系，一律不得当成小说原著。本站只认小说口径，细节待TXT核验。";
if (/女性/.test(q)) return "薇丝朋、塔蒂亚娜、崔西各有立场与秘密，不是花瓶。她们的背叛与牺牲推动剧情，也定义了邦德的感情线。评价以原著为准，不以后世眼光简单否定。";
if (/冷战|时代|背景/.test(q)) return "系列诞生于冷战高峰：苏联情报机构、核勒索、密码机，都是时代的直接投影。读邦德要读出1950年代英国人的焦虑：帝国落日，间谍仍在。";
if (/节奏|叙事/.test(q)) return "弗莱明的节奏是慢开场、快收尾：前半部铺陈生活细节与人物关系，后半部把冲突压缩进几天甚至几小时。动作场景写得短、准、狠，不写招式，写结果。";
return "示例知识库中没有这个问题的现成答案。按本站规则，超出示例范围的一律说不知道，不编造。待TXT导入核验后，文学研究室可按原著逐条作答。";
}

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
if (b.zh === a.zh) b = BOOKS[(BOOKS.indexOf(a) + 3) % BOOKS.length];
return "" + a.zh + "（" + a.year + "年）与" + b.zh + "（" + b.year + "年）：前者以“" + a.setting + "”为舞台，反派是" + a.villain + "；后者舞台在“" + b.setting + "”，反派是" + b.villain + "。比较角度：开场节奏、信息揭示速度、邦德的弱点暴露方式。结论须以原著细读为准，待TXT核验后可逐条对照。";
}
};

function initLiterary() {
$("#litTopics").innerHTML = LIT_TOPICS.map((x) => `<details><summary>${esc(x.t)}</summary><p style="font-size:14px">${esc(x.d)}</p><p class="meta">${SAMPLE}</p></details>`).join("");
$("#litAsk").addEventListener("click", () => {
const q = $("#litQ").value.trim();
if (!q) { $("#litAnswer").innerHTML = `<div class="empty">请先输入问题。</div>`; return;}
$("#litAnswer").innerHTML = `<p style="font-size:15px">${esc(litAnswer(q))}</p><p class="meta">${SAMPLE}</p>`;
});
$$("[data-lab]").forEach((b) => b.addEventListener("click", () => {
$("#labOut").innerHTML = `<p style="font-size:15px">${esc(LAB_GEN[b.dataset.lab]())}</p>`;
}));
}

// ---- 世界地图 ----
function renderAtlas() {
const person = $("#atlasPerson").value;
const country = $("#atlasCountry").value;
const book = $("#atlasBook").value;
const era = $("#atlasEra").value;
const list = LOCATIONS.filter((l) =>
(!person || l.people.includes(person)) &&
(!country || l.country === country) &&
(!book || l.books.includes(book)) &&
(!era || l.books.some((b) => { const y = (BOOKS.find((x) => x.zh === b) || {}).year || 0; return era === "1950s"? y < 1960: y >= 1960;})));
const wrap = $("#mapWrap");
const mapW = wrap.clientWidth || 900;
const mapH = wrap.clientHeight || 300;
const compact = mapW < 560;
wrap.classList.toggle("compact", compact);
// 标签防重叠：按纵向排序，贪心分配四档（下/上/远下/远上），同档标签不相交；窄屏只留圆点，点一下才显示名字
const dots = list.filter((l) =>!l.fictional).map((l) => {
const xPct = (l.lng + 180) / 360 * 100;
const yPct = (90 - l.lat) / 180 * 100;
return { l, xPct, yPct, xPx: xPct / 100 * mapW, yPx: yPct / 100 * mapH };
});
const placedBoxes = [];
dots.slice().sort((a, b) => a.yPx - b.yPx || a.xPx - b.xPx).forEach((d) => {
const w = d.l.name.length * 11 + 4, h = 14;
let box = null;
for (const lane of [0, 1, 2, 3, 4, 5, 6, 7]) {
const top = lane === 0 ? d.yPx + 10 : lane === 1 ? d.yPx - 10 - h : lane === 2 ? d.yPx + 26 : lane === 3 ? d.yPx - 26 - h : lane === 4 ? d.yPx + 42 : lane === 5 ? d.yPx - 42 - h : lane === 6 ? d.yPx + 58 : d.yPx - 58 - h;
const left = Math.max(0, Math.min(mapW - w, d.xPx - w / 2));
const cand = { left, top: Math.max(0, Math.min(mapH - h, top)), w, h };
const hit = placedBoxes.some((p) => cand.left < p.left + p.w + 2 && p.left < cand.left + cand.w + 2 && cand.top < p.top + p.h + 2 && p.top < cand.top + cand.h + 2);
if (!hit) { box = cand; break; }
}
d.lbl = box || { left: Math.max(0, Math.min(mapW - w, d.xPx - w / 2)), top: Math.max(0, Math.min(mapH - h, d.yPx + 10)), w, h };
placedBoxes.push(d.lbl);
});
wrap.innerHTML = dots.map((d) =>
`<div class="mapdot" style="left:${d.xPct.toFixed(1)}%;top:${d.yPct.toFixed(1)}%" data-loc="${d.l.id}" title="${esc(d.l.name)}"></div><div class="maplbl" data-loc="${d.l.id}" style="left:${d.lbl.left.toFixed(0)}px;top:${d.lbl.top.toFixed(0)}px;transform:none">${esc(d.l.name)}</div>`).join("") + (list.some((l) => l.fictional)? `<div style="position:absolute;left:10px;bottom:8px;font-size:12px;color:var(--muted)">虚构地点（皇家莱索、蟹礁岛）不标注坐标，见下方卡片。</div>`: "");
$$("#mapWrap .mapdot").forEach((d) => d.addEventListener("click", () => {
if (wrap.classList.contains("compact")) {
$$("#mapWrap .maplbl").forEach((x) => x.classList.remove("show"));
const lbl = document.querySelector(`#mapWrap .maplbl[data-loc="${d.dataset.loc}"]`);
if (lbl) lbl.classList.add("show");
}
showLocation(d.dataset.loc);
}));
$("#atlasGrid").innerHTML = list.length? list.map((l) =>
`<div class="card clickable" data-loc="${l.id}">
<h3>${esc(l.name)} ${l.fictional? '<span class="tag red">小说虚构地点</span>': '<span class="tag green">真实地点</span>'}</h3>
<p class="meta">${esc(l.country)}${l.lat!== null? " · 坐标" + l.lat + "，" + l.lng: " · 无真实坐标"}</p>
<p>${esc(l.note)}</p><p class="meta">出现：${l.books.map(esc).join("、")}</p><p class="meta">人物：${l.people.map(esc).join("、")}</p></div>`).join("")
: `<div class="empty">没有符合筛选的地点，换个筛选条件试试。</div>`;
$$("#atlasGrid [data-loc]").forEach((el) => el.addEventListener("click", () => showLocation(el.dataset.loc)));
}

function showLocation(id) {
const l = LOCATIONS.find((x) => x.id === id);
if (!l) return;
$("#atlasGrid").innerHTML = `<div class="card" style="grid-column:1/-1"><h3>${esc(l.name)} ${l.fictional? '<span class="tag red">小说虚构地点</span>': '<span class="tag green">真实地点</span>'}</h3>
<p class="meta">${esc(l.country)}${l.lat!== null? " · 坐标" + l.lat + "，" + l.lng: " · 无真实坐标，不伪造位置"}</p>
<p>${esc(l.note)}</p><p><b>出现作品：</b>${l.books.map(esc).join("、")}</p><p><b>相关人物：</b>${l.people.map(esc).join("、")}</p>
<p class="meta">${SAMPLE}</p>
<div class="row"><button class="btn small" id="locBack">返回全部地点</button><button class="btn ghost small" id="locDossier">去情报馆查相关作品</button></div></div>`;
$("#locBack").addEventListener("click", renderAtlas);
$("#locDossier").addEventListener("click", () => {
$("#dossierQ").value = l.books[0];
document.getElementById("dossier").scrollIntoView({ behavior: "smooth"});
runDossier(l.books[0]);
});
}

let canonWorldLocations = [];
function renderCanonWorldDirectory() {
  const q = ($("#canonWorldSearch")?.value || "").trim().toLowerCase();
  const list = canonWorldLocations.filter(p => [p.name,p.nameEn,p.country,...p.appearances.map(a=>a.title)].join(" ").toLowerCase().includes(q));
  const box = $("#canonWorldDirectory");
  if (!box) return;
  box.innerHTML = list.slice(0,170).map(p => `<div class="card"><h3>${esc(p.name)} <span class="tag ${p.fictional?"red":"gold"}">${p.fictional?"小说虚构地点":"真实地点"}</span></h3><p class="meta">${esc(p.nameEn || "")} · ${esc(p.country || "国家未标注")} · ${p.appearances.length}部作品</p><p>${esc(p.appearances.map(a=>a.title+"："+a.role).join("；"))}</p></div>`).join("") || '<div class="empty">没有匹配地点。</div>';
}
async function loadCanonWorldDirectory() {
  const box = $("#canonWorldDirectory");
  try {
    const r = await fetch("/api/world");
    if (!r.ok) throw new Error("地点接口返回 "+r.status);
    const d = await r.json();
    canonWorldLocations = d.locations || [];
    renderCanonWorldDirectory();
    $("#canonWorldSearch").addEventListener("input", renderCanonWorldDirectory);
  } catch(e) {
    box.innerHTML = '<div class="empty">核验地点索引加载失败：'+esc(e.message)+'</div>';
  }
}

function initAtlas() {
loadCanonWorldDirectory();
const persons = [...new Set(LOCATIONS.flatMap((l) => l.people))];
const countries = [...new Set(LOCATIONS.map((l) => l.country))];
const books = [...new Set(LOCATIONS.flatMap((l) => l.books))];
persons.forEach((p) => { const o = document.createElement("option"); o.value = p; o.textContent = p; $("#atlasPerson").appendChild(o);});
countries.forEach((c) => { const o = document.createElement("option"); o.value = c; o.textContent = c; $("#atlasCountry").appendChild(o);});
books.forEach((b) => { const o = document.createElement("option"); o.value = b; o.textContent = b; $("#atlasBook").appendChild(o);});
["atlasPerson", "atlasCountry", "atlasBook", "atlasEra"].forEach((id) => document.getElementById(id).addEventListener("change", renderAtlas));
renderAtlas();
}

// ---- TXT导入 ----
async function sha256Hex(buf) {
const hash = await crypto.subtle.digest("SHA-256", buf);
return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function detectChapters(text) {
const lines = text.split(/\r?\n/);
const clean = (l) => l.replace(/^\uFEFF/, "").trim();
// 底本实测标题格式（14本不统一）：CHAPTER 1 - 标题 / CHAPTER ONE / 罗马数字独占一行+次行标题 / 数字加点标题（霹雳弹）
// 第二阶段补：裸数字独占一行+次行标题（金刚钻、金枪人、女王密使、雷霆谷）/ 词数+冒号标题 One: …（爱我的间谍）
// 按家族分别收集、只取章数最多的一个家族，避免正文内编号清单（如雷霆谷毒物清单1.-6.）混入。
const wordNums = ["ONE","TWO","THREE","FOUR","FIVE","SIX","SEVEN","EIGHT","NINE","TEN","ELEVEN","TWELVE","THIRTEEN","FOURTEEN","FIFTEEN","SIXTEEN","SEVENTEEN","EIGHTEEN","NINETEEN","TWENTY","TWENTY-ONE","TWENTY-TWO","TWENTY-THREE","TWENTY-FOUR","TWENTY-FIVE","TWENTY-SIX","TWENTY-SEVEN","TWENTY-EIGHT"];
const wordVal = {};
wordNums.forEach((w, i) => { wordVal[w] = i + 1; });
const nextTitle = (i) => {
let j = i + 1;
while (j < lines.length && !clean(lines[j])) j++;
return j < lines.length ? clean(lines[j]).slice(0, 80) : "";
};
const fams = { chapter: [], numdot: [], bare: [], roman: [], wordcolon: [] };
lines.forEach((line, i) => {
const t = clean(line);
if (!t) return;
if (/^CHAPTER\s+(?:ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY|\d+|[IVXL]+)\b/i.test(t)) {
fams.chapter.push({ n: fams.chapter.length + 1, title: t.slice(0, 80), line: i + 1 });
} else if (/^\d{1,2}\.\s+\S/.test(t)) {
const n = parseInt(t, 10);
fams.numdot.push({ n, title: t.slice(0, 80), line: i + 1 });
} else if (/^[IVXL]{1,6}$/.test(t)) {
const title = nextTitle(i);
if (title) fams.roman.push({ n: fams.roman.length + 1, title: t + " \u00b7 " + title, line: i + 1 });
} else if (/^(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN):\s+\S/i.test(t)) {
const w = t.split(":")[0].trim().toUpperCase();
fams.wordcolon.push({ n: wordVal[w] || 0, title: t.slice(0, 80), line: i + 1 });
} else if (/^\d{1,2}$/.test(t)) {
fams.bare.push({ n: parseInt(t, 10), line: i });
}
});
// 裸数字家族：必须从1开始连续递增，标题取次行
const bareSeq = fams.bare.length >= 2 && fams.bare[0].n === 1 && fams.bare.every((b, k) => b.n === k + 1);
const bareCh = bareSeq ? fams.bare.map((b, k) => ({ n: k + 1, title: b.n + " \u00b7 " + nextTitle(b.line), line: b.line + 1 })).filter((c) => c.title) : [];
// 数字加点家族：编号必须恰好是1..N连续
const nd = fams.numdot;
const ndOk = nd.length >= 2 && nd.every((c, k) => c.n === k + 1);
const wc = fams.wordcolon;
const wcOk = wc.length >= 2 && wc.every((c, k) => c.n === k + 1);
const cands = [
{ name: "chapter", list: fams.chapter },
{ name: "numdot", list: ndOk ? nd : [] },
{ name: "bare", list: bareCh },
{ name: "roman", list: fams.roman },
{ name: "wordcolon", list: wcOk ? wc : [] }
];
cands.sort((a, b) => b.list.length - a.list.length);
const best = cands[0].list;
return best.map((c, k) => ({ n: k + 1, title: c.title, line: c.line }));
}

function guessBookByName(name, head) {
const hay = (name + " " + head).toLowerCase().replace(/[-_]+/g, " ");
for (const b of BOOKS) {
if (hay.includes(b.zh) || hay.includes(b.en.toLowerCase())) return b.zh;
}
return null;
}

async function runImport() {
const files = Array.from($("#txtFiles").files || []);
const box = $("#importReport");
if (!files.length) { box.innerHTML = `<div class="empty">请先选择txt或.pages文件。</div>`; return;}
if (files.length > 20) { box.innerHTML = `<div class="empty">一次最多20个文件，本次选了${files.length}个。</div>`; return;}
box.innerHTML = `<div class="empty">本地解析中…全文不上传，只计算哈希与章节摘要。</div>`;
const summaries = [];
const notes = [];
for (const f of files) {
const buf = await f.arrayBuffer();
const hash = await sha256Hex(buf);
if (/\.pages$/i.test(f.name)) {
summaries.push({ name: f.name, hash, size: f.size, charCount: 0, lineCount: 0, chapters: [], head: ""});
notes.push(f.name + "：Pages格式需经soffice批量转换成本站txt后才能解析，浏览器内无法直接读取正文。工程内转换路线：soffice --headless --convert-to txt，14本已按此路线转换。");
continue;
}
const text = new TextDecoder("utf-8", { fatal: false}).decode(buf);
const chapters = detectChapters(text);
const head = text.slice(0, 500);
summaries.push({ name: f.name, hash, size: f.size, charCount: text.length, lineCount: text.split(/\r?\n/).length, chapters: chapters.map((c) => c.title), head});
}
let server = null;
try {
const r = await fetch("/api/import", { method: "POST", headers: { "content-type": "application/json"}, body: JSON.stringify({ files: summaries})});
server = await r.json();
} catch (e) { server = null;}
const rows = (server && server.report? server.report: summaries.map((s) => ({ name: s.name, hash: s.hash.slice(0, 16) + "…", size: s.size, charCount: s.charCount, lineCount: s.lineCount, chapterCount: s.chapters.length, bookGuess: { titleZh: guessBookByName(s.name, s.head)}, status: s.chapters.length? "ok": "needs-review", errors: s.chapters.length? []: ["未识别到章节结构"]})));
box.innerHTML = `<p class="meta">收到${files.length}个文件 · 服务端校验${server? "已完成": "不可用，以下为本地解析结果"} · 全文未上传</p>
${notes.map((n) => `<div class="log">${esc(n)}</div>`).join("")}
<table><tr><th>文件</th><th>哈希（前16位）</th><th>大小</th><th>字数</th><th>章节</th><th>识别书名</th><th>状态</th></tr>
${rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.hash)}</td><td>${r.size}</td><td>${r.charCount || "—"}</td><td>${r.chapterCount}</td><td>${esc((r.bookGuess && r.bookGuess.titleZh) || "未识别")}</td><td>${r.status === "ok"? "通过": "待复核：" + (r.errors || []).map(esc).join("；")}</td></tr>`).join("")}</table>
<p class="meta">导入报告：通过${rows.filter((r) => r.status === "ok").length}个，待复核${rows.filter((r) => r.status!== "ok").length}个。持久化到D1/KV为待扩展项；核验通过后，示例数据逐条替换为带书名、章节、原文位置的记录。</p>`;
}

function initImport() {
$("#txtParse").addEventListener("click", runImport);
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
initImport();
initStatus();
});
