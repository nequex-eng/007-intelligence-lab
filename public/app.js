
// 手机端顶栏随滚动方向自动收敛：下滑隐藏副标题与导航，上滑恢复完整导航。
(() => {
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;
  const mobile = window.matchMedia("(max-width: 760px)");
  let lastY = Math.max(0, window.scrollY || 0);
  let directionTravel = 0;
  let compact = false;
  const setCompact = (next) => {
    if (!mobile.matches || (window.scrollY || 0) < 48) next = false;
    if (compact === next) return;
    compact = next;
    topbar.classList.toggle("is-compact", compact);
    topbar.setAttribute("data-compact", compact ? "true" : "false");
  };
  const onScroll = () => {
    if (!mobile.matches) {
      setCompact(false);
      lastY = Math.max(0, window.scrollY || 0);
      directionTravel = 0;
      return;
    }
    const y = Math.max(0, window.scrollY || 0);
    const delta = y - lastY;
    if (y < 48) {
      directionTravel = 0;
      setCompact(false);
    } else if (Math.abs(delta) > 1) {
      directionTravel += delta;
      if (directionTravel > 12) {
        setCompact(true);
        directionTravel = 0;
      } else if (directionTravel < -10) {
        setCompact(false);
        directionTravel = 0;
      }
    }
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  mobile.addEventListener?.("change", () => {
    directionTravel = 0;
    lastY = Math.max(0, window.scrollY || 0);
    setCompact(false);
  });
  topbar.addEventListener("click", (event) => {
    if (compact && mobile.matches && !event.target.closest("a")) {
      setCompact(false);
      directionTravel = 0;
    }
  });
})();

// 007 INTELLIGENCE LAB前端逻辑。
// 正典内容统一来自核验知识库API；静态场景仅用于明确标注的互动体验。
const SAMPLE = "核验知识库 · Ian Fleming 14部原著";
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const englishText = (...values) => values.find(v => typeof v === "string" && v.trim() && !/[\u3400-\u9fff]/.test(v)) || "";
let CHARACTERS = [];
let LANGUAGE = (() => { try { return localStorage.getItem("007-language")==="en" ? "en" : "zh"; } catch (_) { return "zh"; } })();
const EN_TEXT = new Map([
["情报档案馆","Intelligence Archive"],["人物剧场","Character Theatre"],["任务控制中心","Mission Control"],["世界探索","World Explorer"],
["接受第一个任务","Accept Your First Mission"],["见一见邦德","Meet Bond"],["打开情报馆","Open the Archive"],["状态检测中…","Checking system…"],
["搜索人物","Search characters"],["按首次登场筛选","Filter by first appearance"],["原著时间线","Canon timeline"],["同场第二人","Second character"],
["说点什么…","Write a message…"],["发送","Send"],["自由对话","Free conversation"],["向M汇报","Report to M"],["找Q领装备","Request equipment from Q"],["多角色同场","Group scene"],
["首次登场：","First appearance: "],["知识截止：","Knowledge cutoff: "],["身份背景：","Background: "],["外貌与行为：","Appearance: "],["性格与价值观：","Personality: "],["语言习惯：","Voice and speech: "],["人际关系：","Relationships: "],["参与事件：","Appearances: "],["知识边界：","Knowledge boundaries: "],["知识库出处索引：","Knowledge sources: "],
["人物档案","Character dossier"],["点上方任意人物卡片查看完整档案。","Select a character above to view the full dossier."],["尚未选择人物","No character selected"],
["全部作品","All novels"],["全部国家","All countries"],["全部小说","All novels"],["按国家筛选","Filter by country"],["按小说筛选","Filter by novel"],["按年代筛选","Filter by decade"],
["真实地点","Real location"],["小说虚构地点","Fictional location"],["返回地点探索","Back to World Explorer"],["去情报馆检索此地点","Search this location in the archive"],
["正在检索14部核验原著……","Searching the 14 verified original novels…"],["检索","Search"],["分析","Analyse"],["正典知识库 · 数据源与核验状态","Canon Knowledge Base · Sources and Verification"],
["这不是电子书站，也不是一个聊天框。进入伊恩·弗莱明笔下的007世界：查人物档案、翻情报档案、接M的任务、在赌场牌桌上读懂对手、研究弗莱明的写作方法，再沿着世界地图走完14本书的轨迹。","This is more than an ebook site or a chat window. Explore Ian Fleming’s 007 universe: investigate character files, search intelligence dossiers, take assignments from M, read your opponents at the baccarat table, study Fleming’s craft, and trace the world of all 14 books."],
["本站已接入14部原著的核验知识库；正典事实、推断与互动改编分别标注，资料缺口以状态卡为准。","The verified knowledge base covers all 14 novels. Canon facts, inferences and interactive adaptations are clearly distinguished; known gaps are listed in the status panel."],
["32位核心人物正典档案：身份、外貌、性格、习惯、语言风格、人际关系、时间线与知识边界。对话按小说时间点执行三层约束；电影设定与原著隔离。","32 core character dossiers covering identity, appearance, personality, habits, speech, relationships, timelines and knowledge boundaries. Role-play follows a three-layer canon constraint system; film continuity is kept separate."],
["跨全系列检索：小说、人物、地点、组织、武器装备、事件、反派计划、线索、关系、时间线。结果尽量给出书名与出处，原著事实与模型推断明确区分，推断必标。","Search across all novels, characters, locations, organisations, equipment, events, plots, clues, relationships and timelines. Results distinguish sourced canon from inference and identify their sources."],
["你扮演英国秘密情报机构行动人员。每个选择都会改变资金、风险、情报可信度、线索与人物关系，并决定后续分支。状态机是互动改编；原著事实另附章节出处，不把玩家选择伪装成弗莱明原著。","You are an operative of the British Secret Service. Your choices affect funds, risk, intelligence confidence, clues and relationships. Mission branches are interactive adaptations, never presented as Fleming canon; source facts retain chapter references."],
["世界探索以核验知识库中的170处地点为目录。地图只绘制有可靠真实坐标的城市；虚构地点与未核实坐标的地点只进入档案，不伪造坐标。","Explore 170 locations from the verified knowledge base. The map plots only real cities with reliable coordinates; fictional or unverified locations remain in the archive without fabricated pins."],
["核验知识库 · Ian Fleming 14部原著","Verified Canon Database · Ian Fleming’s 14 Original Novels"],
["原文未提供完整背景资料。","No detailed background is provided in the source material."],
["原文未提供。","Not specified in the source material."],
["按知识库边界","As defined by the knowledge base"],
["关系资料待核验。","Relationship details have not yet been verified."],
["按知识库出场记录。","Based on recorded appearances in the knowledge base."],
["出处索引：","Source index: "],
["请按当前小说时间点与原著事实提问。","Ask about the selected point in the novel and its established canon."],
["原著没有明确写到的部分，我不会替作者补写。","I will not invent details that the original novels leave unstated."],
["新建本地对话。消息会发送至模型服务；当前浏览器保存最近80条对话消息。","A new local conversation has started. Messages are sent to the model service; this browser stores the latest 80 messages."],
["没有匹配人物，换个关键词试试。","No characters match. Try another search term."],
["知识库中没有找到该人物，无法启动角色模式。","This character was not found in the knowledge base, so role-play cannot start."],
["已选择","Selected: "],
["当前对话按人物与小说时间点保存在本地浏览器。","This conversation is saved locally in this browser by character and novel timeline."],
["请先在上方选一个人，再开始对话。","Select a character above before starting a conversation."],
["多角色同场需要再选择一位人物。","Select a second character for a group scene."],
["对方正在想……","Thinking…"],
["你正在向M汇报，M只听事实。","You are reporting to M. Stick to the facts."],
["对方是Q，只谈装备。","You are speaking with Q. Discuss equipment only."],
["模型已接入：","Model connected: "],
["章级正典约束已启用","Chapter-level canon constraints enabled"],
["全书结束","End of novel"],
["模型尚未接入","Model not connected"],
["正典角色模式不会使用无时间线约束的脚本回复，请配置模型后再试。","Canon role-play will not fall back to an unconstrained scripted reply. Configure the model and try again."],
["模型状态：未接入；正典模式已停止生成，避免越界回答。","Model status: not connected. Canon role-play is paused to prevent out-of-scope responses."],
["所选人物与小说时间点不匹配。","The selected character is not available at this point in the novel."],
["对话接口暂时不可用。正典角色模式不会回退到无时间线约束的脚本回复，请稍后重试。","The chat service is temporarily unavailable. Canon role-play will not fall back to an unconstrained scripted reply. Please try again later."],
["模型状态：接口不可用；已阻止无约束回退。","Model status: service unavailable. Unconstrained fallback has been blocked."],
["全书结束（默认）","End of novel (default)"],
["选择人物后自动匹配其首次登场原著。","The character’s debut novel is selected automatically when you choose them."],
["向M汇报：系统自动切换为M接收汇报，输入行动经过与证据。","Report to M: the system switches to M as the receiving officer. Enter your actions and evidence."],
["Q部门：系统自动切换为Q，直接说明任务目的并领取装备。","Q Branch: the system switches to Q. Explain your mission requirements to request equipment."],
["多角色同场：先选择主谈人物，再选择第二位人物，发送后两人共同回应。","Group scene: choose the lead character and a second character. Both will respond."],
["原著目录接口返回","Novel index returned"],
["章节索引返回","Chapter index returned"],
["核验知识库加载失败：","Failed to load the verified canon database: "],
["请检查本地同步与API。","Check the knowledge sync and API."],
["正在读取核验档案……","Loading verified records…"],
["档案接口返回","Archive API returned"],
["正在检索14部核验原著……","Searching the 14 verified original novels…"],
["检索接口返回","Search API returned"],
["核验知识库中没有找到","No matching record was found in the verified canon database for "],
["的匹配记录。未命中不代表原著绝对没有，只表示当前索引没有可确认结果。"," . A missing result does not prove that the novels contain no such reference; it means the current index has no verified match."],
["条 · 来源：核验知识库 · 原著事实与推测分别标记。"," · Source: verified canon database · Canon facts and inferences are labelled separately."],
["原著事实","Canon fact"],
["未命名记录","Untitled record"],
["档案","Dossier"],
["出处：","Source: "],
["推测","Inference"],
["正典事实","Canon fact"],
["索引记录","Indexed record"],
["该条目没有提供摘要字段。","No summary is available for this entry."],
["核验检索暂时不可用：","Verified search is temporarily unavailable: "],
["已禁用旧示例数据回退，避免把未核验内容冒充正典。","Legacy sample-data fallback is disabled to prevent unverified content from being presented as canon."],
["14部原著 · 章节摘要来自逐部核验知识库","14 original novels · Chapter summaries are drawn from the individually verified knowledge base"],
["按出版顺序排列；故事内部年份与出版年份不混为一谈。","Listed by publication order. In-story dates are kept distinct from publication years."],
["书名","Title"],
["英文原名","Original title"],
["出版年","Publication year"],
["类型","Type"],
["章节","Chapters"],
["故事时间线","Story timeline"],
["组织档案","Organisation dossiers"],
["装备档案","Equipment dossiers"],
["条核验索引"," verified index entries"],
["原著索引条目","Canon index entry"],
["出场：","Appearances: "],
["核验档案加载失败：","Failed to load verified archive: "],
["不会回退到旧示例数据。","No legacy sample data will be used as a fallback."],
["正在核验14部原著索引……","Checking the index of all 14 original novels…"],
["请先输入问题。","Enter a question first."],
["MiniMax 文学分析","MiniMax Literary Analysis"],
["模型：","Model: "],
["结论仅在所列原著证据范围内成立。","Conclusions are limited to the cited evidence from the original novels."],
["模型暂不可用。以下先展示可检索到的原著证据；配置 MiniMax 后可生成完整文学分析。","The model is temporarily unavailable. Retrieved canon evidence is shown below; configure MiniMax to generate a full literary analysis."],
["核验知识库证据：","Verified canon evidence: "],
["知识库没有找到直接匹配的证据；分析会明确区分推断与原著事实。","No directly matching evidence was found. Any analysis will distinguish inference from established canon."],
["正典检索失败：","Canon search failed: "],
["研究提纲/原创实验内容，不替代原著章节证据。","Research outline / original experiment. This does not replace evidence from the novels."],
["世界探索初始化失败：","World Explorer failed to initialise: "],
["地图初始化失败，请刷新重试。","Map initialisation failed. Refresh and try again."],
["章节/故事单位","Chapters / story units"],
["正典事实","Canon facts"],
["推测事实","Inferred facts"],
["核心人物","Core characters"],
["全部人物","All characters"],
["组织","Organisations"],
["地点","Locations"],
["装备","Equipment"],
["知识库未列出缺口。","No known gaps are listed in the knowledge base."],
["知识库状态暂时不可用：","Knowledge-base status is temporarily unavailable: "],
["模型已接入：","Model connected: "],
["MiniMax未配置·人物对话暂停","MiniMax not configured · Character chat paused"],
["MiniMax未配置：正典人物对话与文学分析暂停；档案、任务与世界探索仍可使用。","MiniMax is not configured. Canon character chat and literary analysis are paused; dossiers, missions and world exploration remain available."],
["状态接口不可用","Status service unavailable"],
["状态接口不可用，无法确认模型状态；正典人物对话不会使用无约束回退。","The status service is unavailable, so model availability cannot be confirmed. Canon character chat will not use an unconstrained fallback."],
["模型状态检测失败","Model status check failed"],
["真实地点","Real location"],
["小说虚构地点","Fictional location"],
["国家未标注","Country not specified"],
["城市级地图点","City-level map marker"],
["部作品"," novels"],
["出现作品与原著语境：","Appearances and original-novel context:"],
["城市级地图坐标已核对","City-level coordinates verified"],
["没有可核验的单点坐标","No verifiable point coordinates"],
["当前筛选没有可核验坐标的真实地点；虚构或区域级地点请查看下方档案。","No real locations with verifiable coordinates match the current filters. See the dossiers below for fictional or regional locations."],
["当前筛选没有可核验坐标的真实地点；请查看下方完整档案。","No real locations with verifiable coordinates match the current filters. See the complete archive below."],
["档案中的其他地点","Other locations in the archive"],
["处地点没有可核验的单点坐标，或属于小说虚构地点。它们仍完整保留在下方170处地点目录中。"," locations have no verifiable point coordinates or are fictional. They remain in the complete directory of 170 locations below."],
["返回地点探索","Back to World Explorer"],
["去情报馆检索此地点","Search this location in the Intelligence Archive"],
["没有匹配地点。","No matching locations."],
["地点接口返回","Location API returned"],
["核验地点索引加载失败：","Failed to load verified location index: "],
["核验知识库 · 数据源与核验状态","Canon database · Sources and verification status"],
["原著改编互动","Interactive adaptation of the novel"],
["原创任务","Original mission"],
["任务结果","Mission result"],
["行动报告","Mission report"],
["行动记录：","Action log:"],
["线索汇总","Clue summary"],
["条："," entries:"],
["无线索发现。","No clues discovered."],
["再玩一次","Play again"],
["任务已放弃。选一个任务重新开始。","Mission abandoned. Choose a mission to start again."],
["尚未开始任务","No mission started yet"],
["任务正典接口返回","Mission canon API returned"],
["任务剧情暂不标为已完成正典核验。","The mission narrative will not be marked as canon-verified."],
["筹码不足，请点“重新领筹码”。","Not enough chips. Select “Reset chips” to replenish."],
["每局最低下注10筹码。","Minimum bet: 10 chips."],
["和局，庄闲投注退回本金，本局不输不赢。","Tie. Player and banker bets are returned; no chips are won or lost."],
["你赢了这把，净赢","You won this hand. Net profit: "],
["筹码。"," chips."],
["这把输了，输掉","You lost this hand: "],
["闲家胜。","Player wins."],
["庄家胜。","Banker wins."],
["本局和局。","This hand is a tie."],
["闲家","Player"],
["庄家","Banker"],
["和局","Tie"],
["观望中","Waiting"],
["筹码用完了，点“重新领筹码”恢复1000。","You are out of chips. Select “Reset chips” to restore 1,000."],
["已重新领筹码1000。祝牌桌好运。","Your 1,000 chips have been restored. Good luck at the table."],
["文学研究室","Literary Study"],
["邦德人物塑造","Building James Bond"],
["反派人物设计","Designing Villains"],
["悬念构建","Building Suspense"],
["信息控制","Control of Information"],
["叙事节奏","Narrative Pace"],
["动作场景","Action Scenes"],
["环境与气氛描写","Setting and Atmosphere"],
["女性角色塑造","Writing Female Characters"],
["冷战背景","The Cold War Context"],
["小说与电影改编差异","Differences Between the Novels and Film Adaptations"],
["人物剧场","Character Theatre"],
["情报档案馆","Intelligence Archive"],
["任务控制中心","Mission Control"],
["世界探索","World Explorer"],
["皇家赌场","Casino Royale"],
["生死关头","Live and Let Die"],
["月亮牌","Moonraker"],
["金刚钻","Diamonds Are Forever"],
["来自俄罗斯的爱情","From Russia with Love"],
["诺博士","Dr. No"],
["金手指","Goldfinger"],
["只为你的双眼","For Your Eyes Only"],
["霹雳弹","Thunderball"],
["爱我的间谍","The Spy Who Loved Me"],
["女王密使","On Her Majesty’s Secret Service"],
["雷霆谷","You Only Live Twice"],
["金枪人","The Man with the Golden Gun"],
["八爪女与黎明生死线","Octopussy and The Living Daylights"],
["数据状态：","Data status: "],
["14本","14 novels"],
["弗莱明邦德小说","Fleming Bond novels"],
["32人","32 characters"],
["核心人物约束档案","Core character dossiers"],
["170处","170 locations"],
["核验地点索引","Verified location records"],
["2个","2"],
["可玩任务·原著+原创","Playable missions · canon + original"],
["搜索人物","Search characters"],
["输入名字，如邦德、M、Q、布洛菲尔德…","Search by name, e.g. Bond, M, Q or Blofeld…"],
["按首次登场筛选","Filter by first appearance"],
["全部作品","All novels"],
["人物档案","Character dossier"],
["点上方任意人物卡片查看完整档案。","Select any character card above to view the full dossier."],
["角色模拟","Character simulation"],
["先选一个人，再开始对话。当前模式：自由对话。","Select a character to begin. Current mode: Free conversation."],
["原著时间线","Novel timeline"],
["选择人物后自动匹配原著","The character’s debut novel is selected automatically."],
["人物所处章节（可选，用于控制章内未来知识）","Character chapter (optional; controls future knowledge within the novel)"],
["同场第二人","Second character"],
["对话消息会发送至模型服务生成回复；最近80条对话仅保存在当前浏览器。选择原著与章节后，人物按出场顺序和章级知识边界回答；默认时间点为全书结束。","Messages are sent to the model service to generate replies. The latest 80 messages are stored in this browser only. Characters follow their appearance order and chapter-level knowledge boundaries; the default timeline is the end of the novel."],
["模型状态检测中…","Checking model status…"],
["输入关键词或点上方示例问题开始检索。","Enter a keyword or select a suggested query above to search."],
["小说目录","Novel index"],
["事件时间线","Event timeline"],
["组织与机构","Organisations"],
["武器与装备","Weapons and equipment"],
["文学研究与创作实验","Literary study and writing lab"],
["研究伊恩·弗莱明的写作方式：","Explore Ian Fleming’s writing techniques: "],
["提问分析","Ask and analyse"],
["输入关键词，检索核验知识库中的人物、事件、事实与出处。文学评论导读与原创实验会明确区分，不把推断冒充原著事实。","Search the verified knowledge base for characters, events, facts and sources. Literary commentary and original experiments are clearly distinguished; inferences are never presented as canon."],
["原创写作实验","Original writing experiments"],
["以下生成均为原创实验，灵感来自弗莱明式结构，不是原著内容。","Everything generated here is an original experiment inspired by Fleming’s narrative structures, not material from the novels."],
["点上方任一实验开始。","Select an experiment above to begin."],
["唯一数据源：","Single source of truth: "],
["网站不会把互动改编、模型推断或未核验内容写回正典。","Interactive adaptations, model inferences and unverified material are never written back into canon."],
["正在读取知识库状态…","Loading knowledge-base status…"],
["任务控制台","Mission control console"],
["先在上方选一个任务开始。","Choose a mission above to begin."],
["实战体验 · 成为邦德","Field experience · Become Bond"],
["赌场·百家乐","Casino · Baccarat"],
["可玩","Playable"],
["规则简化版","Simplified rules"],
["你的筹码","Your chips"],
["本局下注","Current bet"],
["战绩","Record"],
["勒·希弗的评价","Le Chiffre’s read"],
["下注金额","Bet amount"],
["押注方向","Bet on"],
["发牌","Deal"],
["尚未开局。筹码","The game has not started. Chips: "],
["场景","Scene"],
["点上方场景进入体验。","Select a scene above to enter."],
["尚未选择场景","No scene selected"],
["原著改编互动：玩家分支不等同于原著事件；原著结局与本次模拟结果分开呈现。","Interactive adaptation: player choices are not events from the original novel. The novel’s ending is kept separate from this simulation."],
["【非原著·原创】本任务为原创设计，结局为模拟结果，不是原著剧情。","[Non-canon · Original] This mission is an original design. Its outcome is simulated, not part of the novels."],
["任务已放弃。选一个任务重新开始。","Mission abandoned. Choose a mission to start again."],
["尚未开始任务","No mission started yet"],
["研究提纲/原创实验内容，不替代原著章节证据。","Research outline / original experiment; not a substitute for evidence from the novels."],
["未配置","Not configured"],
["尚未提问","No question asked yet"],
["知识库状态","Knowledge-base status"],
["模型状态","Model status"],
["007 INTELLIGENCE LAB·伊恩·弗莱明世界实验室","007 INTELLIGENCE LAB · THE WORLD OF IAN FLEMING"],
["任务控制","Mission Control"],
["邦德去过日本的小说","Novels featuring Bond in Japan"],
["与苏联有关的反派","Villains connected to the Soviet Union"],
["莱特出现作品","Novels featuring Felix Leiter"],
["邦德用过武器","Weapons used by Bond"],
["涉及赌场的小说","Novels involving casinos"],
["布洛菲尔德","Blofeld"],["与苏联情报机构有关的反派","Villains linked to Soviet intelligence"],["莱特","Felix Leiter"],["武器","Bond’s weapons"],["赌场","Casino novels"],
["非原著","Non-canon"],
["创建一个新反派","Create a new villain"],
["设计悬念结构","Design a suspense structure"],
["设计一场秘密行动","Design a covert operation"],
["比较两部小说叙事","Compare the narratives of two novels"],
["0胜0负","0 wins · 0 losses"],
["重新领筹码","Reset chips"],
["全部年代","All decades"],
["1950年代","1950s"],
["1960年代","1960s"],
["同场第二人","Second character"],
["对方正在想……","Thinking…"],
["多角色同场需要再选择一位人物。","Select a second character for the group scene."],
["你与两位人物共同对话；每次发送后，两位人物分别回应。","You are in a three-way conversation with two characters. Both characters reply separately after each message."],
["开始任务","Start mission"],
["继续上次任务","Resume mission"],
["上次进度","Last saved progress"],
["起始资金","Starting funds"],
["风险","Risk"],
["情报可信度","Intelligence confidence"],
["当前任务","Current mission"],
["时间","Time"],
["资金","Funds"],
["装备","Equipment"],
["风险等级","Risk level"],
["已发现线索","Clues found"],
["人物关系","Relationships"],
["无变化","No change"],
["行动报告","Mission report"],
["行动记录：","Action log:"],
["线索汇总","Clue summary"],
["放弃任务","Abandon mission"],
["任务控制台","Mission Control Console"],
["任务结果","Mission result"],
["第1阶段","Stage 1"],
["第2阶段","Stage 2"],
["第3阶段","Stage 3"],
["第4阶段","Stage 4"],
["任务失败","Mission failed"],
["任务成功","Mission successful"],
["行动失败","Operation failed"],
["行动成功","Operation successful"],
["部分成功","Partial success"],
["惨胜","Pyrrhic victory"],
["已保存进度：","Saved progress: "],
["条核验索引"," verified index entries"],
["选择人物后自动匹配原著","The original novel is matched automatically when you select a character"],
  ["例如：弗莱明怎么写悬念？邦德和反派有什么共同点？","For example: How does Fleming build suspense? What do Bond and his adversaries have in common?"],
  ["弗莱明用细节堆出邦德：衣着、饮食、牌技、配枪，每一处都服务于“专业人士”形象。邦德不是超人，他会受伤、会输牌、会动情，这正是他可信的原因。","Fleming builds Bond through precise details: clothes, food, card skills and weapons all reinforce the image of a professional. Bond is no superhero. He gets hurt, loses at cards and falls in love; those vulnerabilities make him believable."],
  ["弗莱明式反派都有三件套：肉体特征（钢钳、金色皮肤）、痴迷之物（黄金、科学、权力）、缜密计划。反派越具体，邦德的胜利越有分量。","Fleming’s villains tend to have three defining elements: a striking physical trait, an obsession such as gold, science or power, and an intricate plan. The more distinctive the villain, the more meaningful Bond’s victory."],
  ["弗莱明常用“信息差”制造悬念：读者和邦德同时只知道一半，另一半由对手慢慢揭开。牌桌、密室、追踪，三种场景轮换，悬念从不掉线。","Fleming often creates suspense through an information gap: the reader and Bond know only half the story, while the opponent gradually reveals the rest. Card tables, locked rooms and surveillance alternate to keep tension alive."],
  ["谁知道什么，弗莱明算得很清楚。邦德不知道的事，读者也不知道；反派知道的事，读者只能猜。这种控制让反转成立，也让人物可信。","Fleming carefully controls who knows what. If Bond does not know something, the reader usually does not either; what the villain knows is left for the reader to infer. This makes twists credible and characters convincing."],
  ["慢开场、快收尾是弗莱明的节奏：前半部铺陈生活细节与人物关系，后半部把冲突压缩进几天甚至几小时，读起来像上膛的手枪。","Fleming’s rhythm often moves from a slow opening to a fast finish. The first half establishes daily routines and relationships; the second compresses the conflict into days or even hours, like a loaded gun."],
  ["弗莱明的动作写得短、准、狠：不写招式，写结果；不写心理，写动作。追车、格斗、牌桌对决，全部用事实推进，不用形容词撑场。","Fleming writes action with economy and precision: show the result rather than the technique, and the action rather than lengthy introspection. Car chases, fights and card-table duels advance through concrete events, not decorative adjectives."],
  ["赌场、加勒比海、阿尔卑斯山，弗莱明写环境必带气味与温度：雪茄味、海风、冷空气。环境不是背景，是邦德的另一个对手。","From casinos to the Caribbean and the Alps, Fleming gives settings a smell and a temperature: cigar smoke, sea air and cold mountain air. The environment is not just a backdrop; it becomes another opponent for Bond."],
  ["薇丝朋、塔蒂亚娜、崔西各有立场与秘密，不是花瓶。她们的背叛与牺牲推动剧情，也定义了邦德的感情线。评价时应以原著为准，不以后世眼光简单否定。","Vesper, Tatiana and Tracy each have their own motives and secrets. They are not decorative figures: their betrayals and sacrifices shape the plot and Bond’s emotional life. Assess them in the context of the novels rather than dismissing them through a purely modern lens."],
  ["系列诞生于冷战高峰：苏联情报机构、核勒索、密码机，都是时代的直接投影。读邦德要读出1950年代英国人的焦虑：帝国落日，间谍仍在。","The series emerged at the height of the Cold War. Soviet intelligence, nuclear blackmail and cipher machines reflect the anxieties of the era. Reading Bond also means recognising 1950s British concerns: an empire in decline, with espionage still in the shadows."],
  ["电影强化了装备与场面，弱化了小说的心理与生活细节。凡是电影独有的装备、情节与人物关系，一律不得当成小说原著引用。本站人物知识边界只认小说。","The films amplify gadgets and spectacle while often reducing the novels’ psychological and everyday detail. Film-only gadgets, plot points and relationships must never be cited as novel canon. This archive treats the original novels as the authority."],
  ["以1953年《皇家赌场》为正典背景的互动改编。任务选择与分支为玩家体验设计，不等同于弗莱明原著实际发生的事件。","An interactive adaptation set against the canon of the 1953 novel Casino Royale. Mission choices and branches are designed for gameplay; they are not events that occur in Fleming’s original text."],
  ["依据《诺博士》核验章节设计：调查斯特兰威斯与特鲁布拉德失踪案，追查蟹礁岛。玩家选择与分支为互动改编，不等同于原著实际过程。","Built around verified chapters of Dr. No: investigate the disappearance of Strangways and Trueblood, then follow the trail to Crab Key. Player choices and branches are an interactive adaptation, not a reproduction of the novel’s events."],
  ["依据《金手指》核验章节设计：追查黄金外流、揭穿金手指的走私网络，并识别诺克斯堡大满贯计划。玩家分支属于互动改编。","Built around verified chapters of Goldfinger: trace the gold movements, expose Goldfinger’s smuggling network and uncover the Fort Knox Operation Grand Slam. Player branches are interactive adaptations."],
  ["依据《霹雳弹》核验章节设计：追踪被劫持的Vindicator轰炸机与两枚核弹，调查SPECTRE勒索，并在巴哈马阻止核袭击。玩家分支属于互动改编。","Built around verified chapters of Thunderball: track the hijacked Vindicator bomber and its two nuclear weapons, investigate SPECTRE’s blackmail and prevent a nuclear attack in the Bahamas. Player branches are interactive adaptations."],
  ["原创任务，明确标注非原著：使用弗莱明世界观与人物设定生成的独立任务，人物与组织关系为原创设计，不是原著剧情。","An original mission, explicitly marked as non-canon. It uses Fleming’s world and character framework, but its plot, character relationships and organisations are newly created."],
  ["第1阶段·M的简报","Stage 1 · M’s Briefing"],
  ["第2阶段·抵达皇家莱索","Stage 2 · Arrival in Royale-les-Eaux"],
  ["第3阶段·牌桌对决","Stage 3 · The Baccarat Table"],
  ["第4阶段·决胜与伏击","Stage 4 · The Showdown and Ambush"],
  ["第1阶段·M的简报","Stage 1 · M’s Briefing"],
  ["第2阶段·金斯顿调查","Stage 2 · Kingston Investigation"],
  ["第3阶段·夜渡蟹礁岛","Stage 3 · Crossing to Crab Key at Night"],
  ["第4阶段·诺博士的设施","Stage 4 · Dr. No’s Facility"],
  ["第1阶段·英格兰银行简报","Stage 1 · Bank of England Briefing"],
  ["第2阶段·迈阿密牌局","Stage 2 · The Miami Card Game"],
  ["第3阶段·黄金走私链","Stage 3 · The Gold Smuggling Network"],
  ["第4阶段·诺克斯堡计划","Stage 4 · The Fort Knox Plan"],
  ["第1阶段·核勒索简报","Stage 1 · Nuclear Blackmail Briefing"],
  ["第2阶段·灌木林线索","Stage 2 · The Shrublands Lead"],
  ["第3阶段·拿骚与飞碟号","Stage 3 · Nassau and the Disco Volante"],
  ["第4阶段·核弹回收","Stage 4 · Recovering the Nuclear Weapons"],
  ["第1阶段·M的简报【非原著·原创】","Stage 1 · M’s Briefing [Original, Non-Canon]"],
  ["第2阶段·抵达威尼斯【非原著·原创】","Stage 2 · Arrival in Venice [Original, Non-Canon]"],
  ["第3阶段·假面舞会【非原著·原创】","Stage 3 · The Masked Ball [Original, Non-Canon]"],
  ["M在伦敦办公室交给你任务简报：勒·希弗挪用苏联情报机构公款炒作失败，今晚将在皇家赌场牌桌上翻本。你的资金由财政部提供，薇丝朋·琳德担任联络人。记住：输光他，就等于切断他的退路。","M briefs you at his London office. Le Chiffre has lost money embezzled from Soviet intelligence and plans to win it back at the Casino Royale table tonight. Your funds come from the Treasury, and Vesper Lynd is your liaison. Remember: bankrupt him, and you cut off his escape route."],
  ["你抵达法国海滨赌城皇家莱索。赌场灯火通明，勒·希弗已经坐在牌桌旁。薇丝朋在吧台等你，她带来一个消息：勒·希弗今晚的资金来源不明，有人说他身后站着苏联方面的人。","You arrive in the French seaside resort of Royale-les-Eaux. The casino is ablaze with light, and Le Chiffre is already at the table. Vesper is waiting at the bar with a warning: the source of his funds tonight is unknown, and some believe Soviet interests are backing him."],
  ["百家乐牌桌。勒·希弗推上一大叠筹码，眼睛盯着你。你手里的资金有限，每一把都可能决定任务成败。","At the baccarat table, Le Chiffre pushes forward a towering stack of chips and fixes his eyes on you. Your funds are limited; every hand could decide the mission."],
  ["最后一把牌结束，勒·希弗输光了筹码。他离场时脸色惨白。回酒店的路上，你注意到有人跟上了你——任务还没有结束。","The final hand is over. Le Chiffre has lost his entire stake and leaves looking ashen. On your way back to the hotel, you notice someone following you. The mission is not over."],
  ["加勒比地区负责人斯特兰威斯与助手玛丽·特鲁布拉德失踪三周。官方称两人私奔，但每日18时30分与伦敦的无线电联络突然中断，档案也被取空。M派你前往牙买加调查，唯一线索指向蟹礁岛与岛主诺博士。","Strangways, the Secret Service chief in the Caribbean, and his assistant Mary Trueblood have been missing for three weeks. The official story is that they eloped, but their daily 6:30 p.m. radio check-ins with London abruptly stopped and their files were emptied. M sends you to Jamaica. The only lead points to Crab Key and its owner, Dr. No."],
  ["金斯顿的线索逐渐指向诺博士：斯特兰威斯的太阳光汽车被人使用，总督府档案可能遭到渗透，一名自称报社摄影记者的安娜贝尔·钟反复拍摄你的行踪。","The trail in Kingston increasingly points to Dr. No. Strangways’s Sunbeam has been used by someone else, Government House records may have been compromised, and Annabel Chung, claiming to be a newspaper photographer, keeps taking pictures of your movements."],
  ["你与夸雷尔准备乘独木舟夜渡蟹礁岛。岛上传闻有一条会喷火的巨龙，奥杜邦协会的调查人员也曾在岛上失踪。雷达与海岸巡逻让登陆风险极高。","Quarrel and you prepare to cross to Crab Key by canoe under cover of darkness. Locals speak of a fire-breathing dragon, and Audubon Society investigators have also disappeared there. Radar and coastal patrols make a landing extremely dangerous."],
  ["你已进入岛内设施。诺博士承认斯特兰威斯夫妇遭到谋杀，并透露自己干扰美国导弹试验的计划。哈妮被囚禁，岛上守卫正在收紧搜索。","You have entered the island facility. Dr. No admits that the Strangways couple were murdered and reveals his plan to interfere with American missile tests. Honey is being held captive, and the guards are tightening their search."],
  ["英格兰银行发现大量黄金异常外流。M要求你调查奥里克·金手指：他以旧金回收生意为掩护，拥有分布在多个国家的金条储备。","The Bank of England has detected an unusual outflow of gold. M orders you to investigate Auric Goldfinger, who uses a scrap-gold business as cover and maintains bullion reserves across several countries."],
  ["杜邦称自己一周内输给金手指25,000美元，怀疑对方作弊。邦德在弗洛里迪亚纳酒店调查，发现吉尔·马斯特顿在套房内用望远镜与麦克风向金手指报牌。","Du Pont says he lost $25,000 to Goldfinger in a week and suspects cheating. At the Floridiana Hotel, Bond discovers that Jill Masterton is using a telescope and microphone from a suite to signal the cards to Goldfinger."],
  ["调查发现，金手指的劳斯莱斯银色幽灵并非普通车身：车身含有约两吨18K白金，拆解后将被改制成航空座椅运往印度。线索还指向一项代号“大满贯”的大规模行动。","The investigation reveals that Goldfinger’s Rolls-Royce Silver Ghost has an extraordinary body: roughly two tons of 18-carat white gold, to be dismantled and converted into aircraft seats for shipment to India. The trail also points to a major operation codenamed Grand Slam."],
  ["金手指的目标是诺克斯堡黄金储备。他计划使用原子弹头炸开金库，并在供水系统投放GB神经毒剂；黄金将由苏联巡洋舰运走。你必须设法破坏计划并保护平民。","Goldfinger’s target is the Fort Knox gold reserve. He plans to breach the vault with an atomic device and release GB nerve agent into the water supply; a Soviet cruiser will carry away the gold. You must stop the plan and protect civilians."],
  ["SPECTRE劫持一架Vindicator轰炸机，机上有两枚核弹，并向英国政府勒索价值一亿英镑的黄金。期限迫近，M派你前往巴哈马参与搜寻行动。","SPECTRE has hijacked a Vindicator bomber carrying two nuclear weapons and is demanding £100 million in gold from the British government. The deadline is approaching, and M sends you to the Bahamas to join the search."],
  ["邦德在灌木林疗养院发现利普腕下的红闪电帮会纹身。利普企图在治疗过程中杀死邦德，随后被SPECTRE灭口。M要求你不要被这条支线拖住，尽快前往巴哈马。","At the Shrublands health clinic, Bond spots the Red Lightning gang tattoo beneath Lippe’s wrist. Lippe tries to kill him during treatment and is later silenced by SPECTRE. M orders you not to get sidetracked and to proceed to the Bahamas."],
  ["拿骚。你接触到拉戈的飞碟号与多米诺·佩塔基。拉戈声称自己是寻宝团负责人，但船上燃油、人员与航行安排存在疑点。多米诺与拉戈的关系也并不简单。","Nassau. You make contact with Largo’s yacht, the Disco Volante, and Domino Vitali. Largo claims to lead a treasure-hunting expedition, but the vessel’s fuel, crew and sailing schedule raise questions. Domino’s relationship with Largo is more complicated than it appears."],
  ["你与莱特找到失事飞机残骸，确认两枚核弹与引信已被取走。拉戈准备将核弹运往大巴哈马岛导弹基地。必须在布放前拦截潜水队。","You and Leiter locate the wreck and confirm that both nuclear weapons and their triggers have been removed. Largo plans to move them to a missile base on Grand Bahama. The divers must be intercepted before deployment."],
  ["M交给你一份原创任务简报：一名化名“玻璃匠”的中间人将在威尼斯出售一份伪造的密码机图纸，买家不明。你的任务是查清买家身份，阻止图纸外流。本任务为原创设计，不是原著剧情。","M gives you an original assignment: an intermediary known as “the Glassmaker” will sell forged cipher-machine blueprints in Venice. The buyer is unknown. Identify the buyer and stop the plans from leaving the country. This mission is original and is not part of the novels."],
  ["威尼斯，雨夜。你在圣马可广场附近的咖啡馆与线人接头。线人说：“玻璃匠”今晚会出现在假面舞会，买家也会到场，但舞会宾客名单是假的。","Venice, a rainy night. You meet your contact at a café near St Mark’s Square. The contact says the Glassmaker will attend a masked ball tonight, along with the buyer, but the guest list is fake."],
  ["舞会灯火辉煌，人人戴着面具。“玻璃匠”出现了，手里提着一个黑色皮箱。你必须在不惊动全场的情况下接近他。","The ballroom glitters, and every guest wears a mask. The Glassmaker arrives carrying a black case. You must get close without alerting the room."],
  ["M办公室·领任务","M’s Office · Mission Briefing"],
  ["Q部门·领装备","Q Branch · Collect Equipment"],
  ["豪华酒店·入住","Luxury Hotel · Check-in"],
  ["高级餐厅·晚餐","Fine Dining · Dinner"],
  ["鸡尾酒吧·马提尼","Cocktail Bar · Martini"],
  ["赌场·牌桌","Casino · The Table"],
  ["私人俱乐部·社交","Private Club · Social Call"],
  ["旅行与城市探索","Travel · Explore the World"],
  ["伦敦，秘密情报机构总部。M坐在办公桌后，钱彭妮在门外守着电话。你推门进去，M头也不抬：“坐下，007。”任务简报只有一页纸，剩下的全靠你自己。","London, headquarters of the Secret Service. M sits behind his desk while Miss Moneypenny handles the telephone outside. You enter. Without looking up, M says: “Sit down, 007.” The briefing is one page long. The rest is up to you."],
  ["地下实验室。Q站在工作台前，身后是一排拆开的器械。他把瓦尔特PPK手枪推到你面前，又递过一支改装过的钢笔：“讲解只说一遍。”","In the underground laboratory, Q stands at a workbench surrounded by dismantled gadgets. He slides a Walther PPK towards you, then hands you a modified fountain pen. “I’ll explain this once.”"],
  ["皇家莱索最好的酒店。你要了朝海的房间，行李只有一只小皮箱。前台递来钥匙，你顺手把一张钞票留在桌上——在这里，小费是最好的通行证。","The finest hotel in Royale-les-Eaux. You request a room overlooking the sea; your luggage is a single small case. The receptionist hands you a key. You leave a banknote on the desk. Here, a tip is the best introduction."],
  ["餐厅里烛光摇曳。你点了牛排与红酒，对面的座位还空着——薇丝朋说她晚点到。侍者经过时，你注意到邻桌的男人也在看你。","Candlelight flickers across the dining room. You order steak and red wine. The seat opposite is still empty; Vesper said she would arrive later. As the waiter passes, you notice a man at the next table watching you."],
  ["吧台前，你对酒保说出那句标志性的话。酒保点头，开始摇酒。周围的人都在谈论今晚赌场的牌局，勒·希弗的名字被提起了三次。","At the bar, you give the bartender your famous instruction. He nods and begins to shake the drink. Around you, everyone is discussing tonight’s casino game. Le Chiffre’s name has come up three times."],
  ["赌场大厅。百家乐牌桌旁，勒·希弗已经就座，面前堆着筹码。空气里有雪茄味和紧张。你走过去，拉开椅子坐下——今晚的主角到齐了。","The casino floor. Le Chiffre is already seated at the baccarat table, stacks of chips before him. The air carries cigar smoke and tension. You approach, pull out a chair and sit down. The evening’s principal players are in place."],
  ["布莱兹俱乐部。皮椅、雪茄、报纸。在这里，没人高声说话，所有的交易都在低声中完成。你要找的人坐在角落那张桌子旁。","Blades Club. Leather chairs, cigars and newspapers. Nobody raises their voice here; every deal is done quietly. The person you are looking for sits at the table in the corner."],
  ["从伦敦到皇家莱索，从伊斯坦布尔到牙买加，邦德的世界是一张不断展开的地图。每一座城市都有它的赌场、它的线人与它的危险。去世界地图看看14本书走过的地方。","From London to Royale-les-Eaux, from Istanbul to Jamaica, Bond’s world unfolds like a map. Every city has its casino, its contacts and its dangers. Open the world map to explore the locations featured across all 14 novels."],
  ["接下任务简报","Accept the briefing"],
  ["追问任务细节","Ask for more details"],
  ["请M再给24小时准备","Ask M for another 24 hours to prepare"],
  ["领瓦尔特PPK手枪","Take the Walther PPK"],
  ["领改装钢笔","Take the modified pen"],
  ["问有没有新装备","Ask about new equipment"],
  ["要朝海的房间","Request a sea-view room"],
  ["让前台留意可疑访客","Ask the reception to watch for suspicious visitors"],
  ["先去酒吧坐坐","Go to the bar first"],
  ["点牛排配红酒","Order steak and red wine"],
  ["等薇丝朋到了再点菜","Wait for Vesper before ordering"],
  ["留意邻桌的男人","Keep an eye on the man at the next table"],
  ["点一杯马提尼，摇匀不搅拌","Order a martini, shaken, not stirred"],
  ["点一杯香槟","Order a glass of champagne"],
  ["请酒保讲讲今晚牌局","Ask the bartender about tonight’s game"],
  ["坐下，直接开局","Sit down and play"],
  ["先在旁边观战一轮","Watch one round first"],
  ["去百家乐桌实战一把","Play a hand of baccarat"],
  ["和角落那位打个招呼","Greet the man in the corner"],
  ["先读一会儿报纸","Read the newspaper for a while"],
  ["点一支雪茄","Order a cigar"],
  ["选最绕的路去机场","Take the longest route to the airport"],
  ["直接走高速","Take the motorway"],
  ["绕到码头换船","Head to the docks and change boats"],
  ["打开世界地图","Open the world map"],
  ["回顾皇家赌场之行","Review the Casino Royale operation"],
  ["计划下一站","Plan the next stop"],
  ["仔细研读简报与勒·希弗的牌风记录","Study the briefing and Le Chiffre’s playing patterns carefully"],
  ["只记关键数字，立刻出发","Note the key figures and leave immediately"],
  ["先找Q领装备再出发","Collect equipment from Q before departing"],
  ["先侦察赌场，摸清勒·希弗的同伙","Reconnoitre the casino and identify Le Chiffre’s associates"],
  ["先和薇丝朋单独谈谈，核实情报","Speak privately with Vesper to verify the intelligence"],
  ["不侦察，直接上牌桌","Skip reconnaissance and go straight to the table"],
  ["保守下注，观察他的牌风","Bet conservatively and study his play"],
  ["全力进攻，大额下注逼他亮底牌","Go on the offensive with a large bet and force his hand"],
  ["故意示弱，引他加注","Appear weak and tempt him to raise"],
  ["按计划撤回酒店，等待接应","Return to the hotel as planned and wait for extraction"],
  ["主动迎上去，查清跟踪者身份","Confront the tail and identify them"],
  ["通知薇丝朋改变会合地点","Tell Vesper to change the meeting point"],
  ["先核对无线电记录与最后一次联络","Check the radio logs and the final scheduled contact"],
  ["直接追查蟹礁岛档案","Go straight to the Crab Key files"],
  ["请求夸雷尔协助并核实当地传闻","Ask Quarrel for help and verify local reports"],
  ["核查斯特兰威斯的汽车与行踪","Check Strangways’s car and movements"],
  ["查问殖民地秘书处的档案经手人","Question the clerk who handled the Colonial Secretary’s files"],
  ["反跟踪安娜贝尔·钟","Turn the tables on Annabel Chung and follow her"],
  ["沿黑沙滩登陆，避开灯火与雷达","Land along the black-sand beach, avoiding lights and radar"],
  ["先在海岸外观察巨龙巡逻路线","Observe the dragon’s patrol route from offshore"],
  ["快速登陆，抢在守卫换班前进入岛内","Make a fast landing before the guards change shifts"],
  ["优先救出哈妮并寻找撤离路线","Rescue Honey first and find an escape route"],
  ["破坏导弹干扰设备，切断诺博士计划","Sabotage the missile-interference equipment and stop Dr. No’s plan"],
  ["寻找传送带与鸟粪装卸区，伺机反击","Find the conveyor and guano-loading area, then look for a chance to strike"],
  ["先研究金条刻痕与黄金流向","Study the bullion markings and trace the gold"],
  ["从金手指的赌场与牌局关系入手","Start with Goldfinger’s casino and card-game connections"],
  ["直接接近金手指，建立信任","Approach Goldfinger directly and earn his trust"],
  ["查清套房内的望远镜与无线电装置","Identify the telescope and radio equipment in the suite"],
  ["迫使金手指退还杜邦损失","Force Goldfinger to repay Du Pont’s losses"],
  ["跟踪金手指，查他的黄金运输方式","Follow Goldfinger and investigate how he moves his gold"],
  ["沿运输链追查白金车身去向","Trace the platinum body along the transport route"],
  ["查阅黑帮会议与资金记录","Review the gangland meeting and financial records"],
  ["向M提交阶段报告，请求增援","Send M an interim report and request reinforcements"],
  ["优先向美方提交神经毒剂情报","Give the nerve-agent intelligence to the Americans first"],
  ["追踪金手指的运输车队，寻找拦截机会","Track Goldfinger’s convoy and look for an interception point"],
  ["设法向外界发送求救密信","Find a way to send a coded distress message"],
  ["核对失踪飞机编号与核弹清单","Verify the missing aircraft number and nuclear inventory"],
  ["先查SPECTRE勒索信与期限","Examine SPECTRE’s ransom note and deadline first"],
  ["调查疗养院中的可疑人物利普","Investigate Lippe, the suspicious man at the clinic"],
  ["追查红闪电帮会与SPECTRE的关系","Investigate the connection between the Red Lightning gang and SPECTRE"],
  ["优先前往巴哈马，集中寻找飞机残骸","Proceed to the Bahamas and focus on locating the wreck"],
  ["请求莱特协助检查海域与航线","Ask Leiter to check the sea area and shipping routes"],
  ["秘密接近多米诺，核实她与拉戈的关系","Approach Domino discreetly and verify her relationship with Largo"],
  ["监视飞碟号的燃油与出航时间","Monitor the Disco Volante’s fuel and departure schedule"],
  ["与莱特协调海上监视和水下搜索","Coordinate maritime surveillance and an underwater search with Leiter"],
  ["带队水下拦截核弹运输雪橇","Lead an underwater team to intercept the nuclear sled"],
  ["让多米诺继续潜伏，寻找飞碟号内部机会","Keep Domino undercover and look for an opportunity aboard the Disco Volante"],
  ["优先通知盟军拦截第二枚核弹的目标","Alert the Allies to the target of the second nuclear weapon"],
  ["核查情报来源可靠性","Verify the reliability of the intelligence source"],
  ["直接飞威尼斯，先到先得","Fly straight to Venice and get there first"],
  ["请莱特从美方侧面核实买家","Ask Leiter to verify the buyer through American channels"],
  ["跟踪线人，确认他是否可信","Follow the contact and test his reliability"],
  ["先查舞会场地与退路","Inspect the ballroom and identify escape routes"],
  ["乔装进入舞会，直接接近目标","Enter the ball in disguise and approach the target"],
  ["以买家身份接近，套他的话","Approach as the buyer and draw him out"],
  ["在吧台制造小混乱，趁乱调包皮箱","Create a distraction at the bar and switch the case"],
  ["不动声色，只记录在场所有人的面具特征","Stay unnoticed and record the masks worn by everyone present"],
  ["情报可信度+15，时间+半天","Intelligence confidence +15 · Time +½ day"],
  ["风险+10，节省时间","Risk +10 · Saves time"],
  ["获得装备：暗藏式手枪，风险-5","Equipment acquired: concealed pistol · Risk −5"],
  ["线索+1，风险-5，时间+半天","Clue +1 · Risk −5 · Time +½ day"],
  ["情报可信度+10，与薇丝朋关系+1","Intelligence confidence +10 · Relationship with Vesper +1"],
  ["风险+15，时间节省","Risk +15 · Saves time"],
  ["资金-1000，情报可信度+10，风险-5","Funds −1,000 · Intelligence confidence +10 · Risk −5"],
  ["资金-4000，风险+20，胜则线索+1","Funds −4,000 · Risk +20 · Win: clue +1"],
  ["资金-2000，风险+10，情报可信度+5","Funds −2,000 · Risk +10 · Intelligence confidence +5"],
  ["风险-10，任务按原著走向推进","Risk −10 · Mission advances along the novel’s established direction"],
  ["线索+1，风险+15","Clue +1 · Risk +15"],
  ["与薇丝朋关系+1，风险-5","Relationship with Vesper +1 · Risk −5"],
  ["可信度+15，线索+1","Confidence +15 · Clue +1"],
  ["节省时间，风险+10","Saves time · Risk +10"],
  ["获得当地协助，可信度+10","Local assistance gained · Confidence +10"],
  ["线索+1，风险-5","Clue +1 · Risk −5"],
  ["可信度+10，风险+5","Confidence +10 · Risk +5"],
  ["线索+1，风险+10","Clue +1 · Risk +10"],
  ["风险-10，线索+1","Risk −10 · Clue +1"],
  ["可信度+10，时间+1天","Confidence +10 · Time +1 day"],
  ["风险+15，节省时间","Risk +15 · Saves time"],
  ["风险+10，可信度+15","Risk +10 · Confidence +15"],
  ["线索+1，风险+5","Clue +1 · Risk +5"],
  ["可信度+15，风险-5","Confidence +15 · Risk −5"],
  ["风险+15，线索+1","Risk +15 · Clue +1"],
  ["资金-500，风险-5","Funds −500 · Risk −5"],
  ["可信度+15，时间+1天","Confidence +15 · Time +1 day"],
  ["可信度+15，风险-5","Confidence +15 · Risk −5"],
  ["时间-1天，风险-5","Time −1 day · Risk −5"],
  ["关系+1，线索+1","Relationship +1 · Clue +1"],
  ["风险+10，线索+1","Risk +10 · Clue +1"],
  ["关系+1，风险-5","Relationship +1 · Risk −5"],
  ["可信度+15，资金-500","Confidence +15 · Funds −500"],
  ["情报可信度+15","Intelligence confidence +15"],
  ["与莱特关系+1，情报可信度+10","Relationship with Leiter +1 · Intelligence confidence +10"],
  ["线索+1，风险+5","Clue +1 · Risk +5"],
  ["风险-10","Risk −10"],
  ["资金-1500，风险+20","Funds −1,500 · Risk +20"],
  ["情报可信度+10，风险-5","Intelligence confidence +10 · Risk −5"],
  ["威尼斯密码","The Venice Cipher"],
  ["非原著·原创","Original · Non-Canon"],
  ["风险+10","Risk +10"],
  ["费利克斯·莱特","Felix Leiter"],
  ["线人同时在给两个人报信，其中一个是买家的人","The contact is feeding information to two people; one works for the buyer."],
  ["舞会厅有2个出口，运河边可乘船撤离","The ballroom has two exits, and a boat can be taken from the canal."],
  ["按原著对话与行为边界生成。","Generated within the boundaries of the original dialogue and behaviour."],
  ["首次登场未标注","First appearance not specified"],
  ["（选择人物后自动匹配）","(Matched automatically when a character is selected)"],
  ["选择人物后自动匹配","Matched automatically when a character is selected"],
  ["多角色同场：你与两位人物共同对话；每次发送后，两位人物分别回应。","Group scene: you speak with two characters, and each responds separately after every message."],
  ["输入关键词，如日本、苏联、莱特、武器、赌场、布洛菲尔德…","Search the archive, e.g. Japan, the Soviet Union, Leiter, weapons, casinos or Blofeld…"],
  ["搜索地点、国家或小说…","Search locations, countries or novels…"],
  ["输入名字，如邦德、M、Q、布洛菲尔德…","Search by name, e.g. Bond, M, Q or Blofeld…"],
  ["暗藏式手枪","Concealed pistol"],
  ["勒·希弗的保镖共有2人，分守赌场前后门","Le Chiffre has two bodyguards, stationed at the casino’s front and rear entrances."],
  ["薇丝朋·琳德","Vesper Lynd"],
  ["勒·希弗拿到好牌时会不自觉地摸手帕","Le Chiffre unconsciously touches his handkerchief when he has a strong hand."],
  ["勒·希弗的资金链已到极限，再输一把就翻不了身","Le Chiffre’s funding is at its limit. One more loss will finish him."],
  ["跟踪者受雇于苏联方面，与勒·希弗的处决有关","The tail is working for Soviet interests and is connected to the order to execute Le Chiffre."],
  ["风险失控：你在撤离途中暴露，任务被迫中止。M的评语只有一句：下次先读简报。资金剩余","Risk spirals out of control. Your cover is blown during extraction and the mission is aborted. M has one comment: “Read the briefing next time.” Remaining funds: "],
  ["，情报可信度"," · Intelligence confidence: "],
  ["。按原著，勒·希弗最终被苏联方面处决，但这一次与你无关。","%. In the novel, Le Chiffre is ultimately executed by Soviet agents, but this outcome is unrelated to your simulation."],
  ["你赢了牌桌，输光了资金。勒·希弗翻不了身，但你回伦敦要写一份很长的资金说明。情报可信度","You won at the table but exhausted your funds. Le Chiffre is ruined, but you will have a lengthy accounting to explain in London. Intelligence confidence: "],
  ["，发现线索"," · Clues found: "],
  ["勒·希弗在牌桌上输光翻本的本钱，退路断绝。按原著走向，他随后被苏联方面处决。你的资金剩余","Le Chiffre has lost the money he needed to recover at the table, leaving him with no way out. In the novel’s continuity, he is later executed by Soviet agents. Remaining funds: "],
  ["条，M在报告上只写了两个字：很好。"," clues. M writes just one word in the report: “Excellent.”"],
  ["蟹礁岛行动","Operation Crab Key"],
  ["斯特兰威斯最后一次定时联络中断，与私奔说法矛盾","The interruption of Strangways’s final scheduled radio check contradicts the elopement story."],
  ["蟹礁岛档案封皮仍在，内文已被取空","The Crab Key file cover remains, but its contents have been removed."],
  ["夸雷尔","Quarrel"],
  ["斯特兰威斯的太阳光汽车被用来确认邦德的行踪","Strangways’s Sunbeam was used to confirm Bond’s movements."],
  ["诺博士在总督府内有眼线，档案最后经手人为斯特兰威斯","Dr. No has an informant inside Government House. Strangways was the last person to handle the file."],
  ["安娜贝尔·钟是诺博士的眼线，负责确认邦德身份与住处","Annabel Chung is one of Dr. No’s agents, tasked with confirming Bond’s identity and accommodation."],
  ["蟹礁岛雷达会搜索海面目标，夜间隐蔽登陆更安全","Crab Key radar scans for surface targets; a concealed night landing is safer."],
  ["所谓巨龙是装甲沼泽车，配有火焰喷射器","The so-called dragon is an armoured swamp vehicle equipped with a flamethrower."],
  ["哈妮知道岛上地形，是重要的逃生向导","Honey knows the island’s terrain and can guide an escape."],
  ["诺博士的目标是干扰美军导弹制导并捕获导弹样机","Dr. No intends to disrupt US missile guidance and capture a missile prototype."],
  ["诺博士最终在码头装船时被鸟粪传送带活埋","Dr. No is ultimately buried alive by the guano conveyor while loading a ship at the pier."],
  ["你在蟹礁岛暴露行踪，撤离路线被封锁。此次模拟行动失败；原著中邦德最终逃出蟹礁岛，诺博士被鸟粪传送带活埋。","Your presence on Crab Key is exposed and the escape route is sealed. This simulated operation has failed. In the novel, Bond eventually escapes Crab Key and Dr. No is buried by the guano conveyor."],
  ["你查明失踪案与诺博士的关系，并找到救出哈妮与逃离岛屿的关键路线。原著正典结局：诺博士被鸟粪活埋，邦德与哈妮乘独木舟返回牙买加。","You uncover Dr. No’s connection to the disappearances and find the route to rescue Honey and escape. Canon ending: Dr. No is buried in guano, and Bond and Honey return to Jamaica by canoe."],
  ["你确认蟹礁岛与失踪案有关，但证据或撤离准备不足。模拟行动需要后续补充；原著结局仍以知识库记录为准。","You confirm that Crab Key is connected to the disappearances, but the evidence or extraction plan is incomplete. The simulated operation needs further work; the novel’s ending remains as recorded in the canon database."],
  ["大满贯行动","Operation Grand Slam"],
  ["部分金条带有微小Z刻痕，与SMERSH资金链有关","Some gold bars bear a tiny Z mark linked to SMERSH’s funding network."],
  ["金手指在迈阿密与杜邦进行双人卡纳斯塔牌局","Goldfinger plays two-handed Canasta with Du Pont in Miami."],
  ["线索+1，可信度+10","Clue +1 · Confidence +10"],
  ["吉尔·马斯特顿通过望远镜观察牌面并向金手指报牌","Jill Masterton watches the cards through a telescope and signals them to Goldfinger."],
  ["金手指被迫开出50,000美元支票","Goldfinger is forced to write a cheque for $50,000."],
  ["金手指随身携带黄金，并利用行李箱夹层与金币腰带转移","Goldfinger carries gold on his person, moving it in suitcase compartments and a belt of coins."],
  ["白金车身在科佩工厂拆解，计划改制为Mecca航空座椅","The platinum body is dismantled at the Koppel works and is to be converted into Mecca aircraft seats."],
  ["金手指召集黑帮首脑，承诺以黄金分成换取人手","Goldfinger summons crime bosses and offers a share of the gold in exchange for manpower."],
  ["GB毒剂计划可能造成约6万人死亡或致残","The GB nerve-agent plan could kill or disable approximately 60,000 people."],
  ["黄金运输计划与苏联巡洋舰接应有关","The gold transport plan involves a rendezvous with a Soviet cruiser."],
  ["资金-1000，风险-10","Funds −1,000 · Risk −10"],
  ["邦德曾把求救密信藏在飞机厕所座椅下，最终送达莱特","Bond once hid a coded distress message beneath an aircraft lavatory seat; it eventually reached Leiter."],
  ["你未能及时破坏大满贯计划，风险失控。此结局为互动模拟分支；原著中诺克斯堡伏击挫败计划，金手指劫机逃亡，最终被邦德杀死。","You fail to disrupt Operation Grand Slam in time, and the risk becomes uncontrollable. This is an interactive branch. In the novel, the Fort Knox raid defeats the plan; Goldfinger hijacks an aircraft and is ultimately killed by Bond."],
  ["你识别了黄金走私链、诺克斯堡目标与GB毒剂威胁，及时向盟友发出警报。原著正典中，大满贯行动最终失败，金手指在劫持航班后被邦德杀死。","You identify the gold-smuggling network, the Fort Knox target and the GB nerve-agent threat, then alert the Allies in time. In canon, Operation Grand Slam ultimately fails, and Goldfinger is killed by Bond after hijacking a flight."],
  ["你掌握了部分黄金走私线索，但大满贯计划仍有风险。模拟行动需要补充情报；原著事件以核验知识库为准。","You uncover part of the gold-smuggling trail, but Operation Grand Slam remains a threat. The simulated operation needs more intelligence; the novel’s events are governed by the verified canon database."],
  ["欧米茄行动","Operation Omega"],
  ["失踪飞机为Vindicator，载有两枚核弹","The missing aircraft is a Vindicator carrying two nuclear weapons."],
  ["勒索期限与金条交付条件均有明确时限","The ransom deadline and gold-delivery conditions are both time-critical."],
  ["风险+5，线索+1","Risk +5 · Clue +1"],
  ["利普腕下的红闪电纹身与澳门犯罪组织有关","The Red Lightning tattoo beneath Lippe’s wrist is linked to a Macau criminal organisation."],
  ["利普与SPECTRE有关，曾企图杀死邦德","Lippe is connected to SPECTRE and has attempted to kill Bond."],
  ["失事飞机可能在比米尼附近海域","The wreck may lie in waters near Bimini."],
  ["多米诺","Domino"],
  ["多米诺本名多米内塔·佩塔基，兄长是被劫机的飞行员","Domino’s full name is Dominetta Petacchi; her brother is the pilot of the hijacked aircraft."],
  ["飞碟号实际燃油量与拉戈所称不符","The Disco Volante’s actual fuel capacity does not match Largo’s claims."],
  ["飞碟号与比米尼附近失事飞机残骸存在关联","The Disco Volante is connected to the aircraft wreck near Bimini."],
  ["拉戈的潜水队正把核弹运往大巴哈马岛导弹基地","Largo’s diving team is moving the nuclear weapons to the missile base on Grand Bahama."],
  ["多米诺同意携带盖革计数器作为内应信号","Domino agrees to carry a Geiger counter as a signal from inside the operation."],
  ["第二枚核弹原定目标为迈阿密","Miami is the intended target of the second nuclear weapon."],
  ["你未能在核弹布放前完成拦截。此结局为互动模拟分支；原著中多米诺杀死拉戈，两枚核弹最终被回收，布洛菲尔德逃脱。","You fail to intercept the weapons before deployment. This is an interactive branch. In the novel, Domino kills Largo, both nuclear weapons are recovered, and Blofeld escapes."],
  ["你识别了飞机残骸、飞碟号与核弹运输路线，成功组织拦截。原著正典中，两枚核弹被回收，多米诺杀死拉戈，布洛菲尔德逃脱。","You identify the wreck, the Disco Volante and the nuclear transport route, then organise a successful interception. In canon, both weapons are recovered, Domino kills Largo and Blofeld escapes."],
  ["你已定位部分线索，但仍需确认核弹位置与布放时间。模拟行动未完全成功；原著事件以核验知识库为准。","You have located some leads, but the weapons’ location and deployment time remain unconfirmed. The simulated operation is incomplete; consult the verified canon database for the novel’s events."],
  ["“玻璃匠”只认现金，不认人，图纸是伪造的，真正的买家另有其人","The Glassmaker deals only in cash, not identities. The blueprints are fake, and the real buyer is someone else."],
  ["戴银色面具的人全程没有跳舞，一直在看“玻璃匠”","The person in the silver mask never dances and watches the Glassmaker throughout the evening."],
  ["你在舞会上暴露身份，“玻璃匠”带着皮箱从运河撤走。M的评语：原创任务也一样，鲁莽没有借口。资金剩余","Your identity is exposed at the ball, and the Glassmaker escapes by canal with the case. M’s verdict: “Even an original assignment is no excuse for recklessness.” Remaining funds: "],
  ["你识破了双重陷阱：图纸是伪造的，真正的买家是戴银色面具的人。皮箱被截获，买家身份已锁定。资金剩余","You expose the double bluff: the blueprints are fake, and the real buyer is the person in the silver mask. The case is seized and the buyer identified. Remaining funds: "],
  ["你阻止了图纸交易，但买家身份仍未锁定。线索","You stop the sale, but the buyer’s identity remains unknown. Clues: "],
  ["条，情报可信度"," · Intelligence confidence: "],
  ["，需要第二次行动。资金剩余","; a second operation is required. Remaining funds: "],
  ["M把简报推过来：“签个字。出了这扇门，任务就是你的了。”","M slides the briefing across the desk. “Sign it. Once you walk out that door, the assignment is yours.”"],
  ["M抬起头：“细节都在纸上。纸上没有的，问我也没用。”","M looks up. “The details are on the paper. If they aren’t there, asking me won’t help.”"],
  ["M冷笑一声：“敌人不会等你准备好。明天早上出发。”","M gives a dry smile. “The enemy won’t wait until you’re ready. You leave tomorrow morning.”"],
  ["Q：“扳机我调过。别再拿它当撬棍，007。”","Q: “I’ve adjusted the trigger. Stop using it as a crowbar, 007.”"],
  ["Q：“按一下出墨水，按两下——算了，你还是别知道了。用完还回来。”","Q: “Press once for ink; twice and—never mind, you’re better off not knowing. Bring it back when you’re done.”"],
  ["Q：“有。但以你弄坏装备的速度，我建议你先学会爱惜旧的。”","Q: “There is. But given how quickly you break equipment, I suggest you learn to look after the old stuff first.”"],
  ["前台：“3楼朝海的房间，先生。祝您住得愉快。”","Reception: “Third floor, sea view, sir. Enjoy your stay.”"],
  ["前台压低声音：“明白，先生。有任何动静，我第一个通知您。”","The receptionist lowers his voice. “Understood, sir. I’ll be the first to let you know if anything happens.”"],
  ["你走向酒吧。真正的情报，总是在酒吧里流传。","You head for the bar. Real intelligence is always circulating there."],
  ["侍者：“牛排五分熟，红酒是1953年的。先生好品味。”","Waiter: “Your steak, medium rare, and the 1953 red. Excellent taste, sir.”"],
  ["你点了杯水，慢慢等。等人，是这行最基本的耐心。","You order water and wait. Patience is the first requirement of this profession."],
  ["邻桌的男人低头看报，报纸拿反了。你记下了他的脸。","The man at the next table studies his newspaper upside down. You memorise his face."],
  ["酒保把马提尼推过来，摇匀，不搅拌。你抿了一口，味道正好。","The bartender slides over the martini, shaken, not stirred. You take a sip. Perfect."],
  ["香槟上桌，气泡升起来像小小的信号。你没有碰，只是看着。","The champagne arrives, its rising bubbles like tiny signals. You leave it untouched."],
  ["酒保擦着杯子：“勒·希弗今晚手气不好，先生。不过输急了的人最危险。”","The bartender polishes a glass. “Le Chiffre isn’t having a good night, sir. But a desperate loser is the most dangerous kind.”"],
  ["你坐下，推上筹码。勒·希弗抬眼看你：“邦德先生，欢迎。”","You sit and push forward your chips. Le Chiffre looks up. “Mr Bond. Welcome.”"],
  ["你站在人群后看了一轮：勒·希弗拿到好牌时会摸手帕。你记住了。","You watch a round from the crowd. Le Chiffre touches his handkerchief when he has a strong hand. You make a note of it."],
  ["直接去下方百家乐小游戏实战，筹码与输赢都是真的。","Go to the baccarat table below and play for real chips and results."],
  ["那人抬头：“邦德先生。坐。有些话，只能在这里说。”","The man looks up. “Mr Bond. Sit down. Some things can only be said here.”"],
  ["报纸上的消息一半是真的，一半是放出来的。你分得清。","Half the news in the papers is true; the rest has been planted. You know how to tell the difference."],
  ["雪茄点燃，烟雾升起来。你想起M说过的话：俱乐部里没有偶遇。","The cigar is lit, and smoke curls upward. You remember M’s words: there are no chance encounters at the club."],
  ["豪华汽车·出行","Luxury Car · On the Move"],
  ["门口停着一辆深灰色轿车，线条利落。你坐进驾驶座，发动引擎。去机场的路上有三条，你选了最绕的那条——先确认有没有人跟踪。","A dark grey saloon waits outside, its lines clean and understated. You take the wheel and start the engine. There are three routes to the airport; you choose the longest to check whether anyone is following."],
  ["你绕了三条街，后视镜里那辆车还在。很好，鱼上钩了。","You circle three blocks. The same car is still in your mirror. Good. The bait has been taken."],
  ["高速上车流稀少，跟你的车无处可藏。你踩下油门。","Traffic is light on the motorway, leaving a tail nowhere to hide. You press the accelerator."],
  ["码头边，你弃车登船。跟踪者站在岸边，看着你远去。","At the docks, you abandon the car and board a boat. Your pursuer watches from the shore as you disappear."],
  ["地图在下方世界地图模块，170处核验地点，点任意地点进入相关档案。","The map is in the World Explorer below, with 170 verified locations. Select any location to open its dossier."],
  ["皇家莱索：牌桌、薇丝朋、勒·希弗。一切从那里开始。","Royale-les-Eaux: the table, Vesper and Le Chiffre. It all began there."],
  ["下一站由你决定——任务模拟器里还有一场威尼斯原创任务等着你。","You choose the next destination. An original Venice mission is waiting in Mission Control."]
,
  ["原著","Novels"],
  ["和局！你押中和局，净赢","Tie! You called it correctly. Net win: "],
  ["勒·希弗眯起眼睛：“你今晚手气不错，邦德先生。”","Le Chiffre narrows his eyes. “You are having a good evening, Mr Bond.”"],
  ["勒·希弗冷笑：“筹码会自己长脚走到我这边来。”","Le Chiffre smiles coldly. “The chips have a way of walking over to my side.”"],
  ["勒·希弗：“继续，别停。”","Le Chiffre: “Carry on. Don’t stop.”"],
  ["勒·希弗：“别急，牌桌还长着呢。”","Le Chiffre: “No hurry. The night is still young.”"],
  ["勒·希弗观望中。","Le Chiffre is watching."],
  ["0胜0负0和","0 wins · 0 losses · 0 ties"]
]); 
const originalText = new WeakMap();
const originalAttributes = new WeakMap();
function translateElementAttributes(root = document) {
  const selector = "[placeholder],[title],[aria-label],[alt],[value],[data-q]";
  const nodes = root === document ? document.querySelectorAll(selector) : [...(root.matches?.(selector) ? [root] : []), ...(root.querySelectorAll?.(selector) || [])];
  nodes.forEach(el => {
    let saved = originalAttributes.get(el);
    if (!saved) { saved = {}; originalAttributes.set(el, saved); }
    ["placeholder","title","aria-label","alt","value","data-q"].forEach(name => {
      if (!el.hasAttribute(name)) return;
      if (!(name in saved)) saved[name] = el.getAttribute(name);
      let value = saved[name];
      if (LANGUAGE === "en") for (const pair of [...EN_TEXT].sort((a,b)=>b[0].length-a[0].length)) value = value.split(pair[0]).join(pair[1]);
      if (el.getAttribute(name) !== value) el.setAttribute(name, value);
    });
  });
}
function translateTextNode(n) {
  if (!n || n.nodeType!==3) return;
  if (!originalText.has(n)) originalText.set(n,n.nodeValue);
  const src=originalText.get(n);
  let out=src;
  if (LANGUAGE==="en") for (const [zh,en] of [...EN_TEXT].sort((a,b)=>b[0].length-a[0].length)) out=out.split(zh).join(en);
  if (n.nodeValue!==out) n.nodeValue=out;
}
function applyLanguage() {
  document.documentElement.lang=LANGUAGE==="en"?"en":"zh-CN";
  document.documentElement.dataset.language=LANGUAGE;
  document.body.dataset.language=LANGUAGE;
  document.title=LANGUAGE==="en" ? "007 Intelligence Lab | James Bond & Ian Fleming Canon Archive" : "007 INTELLIGENCE LAB·伊恩·弗莱明世界实验室";
  const description=document.querySelector('meta[name="description"]');
  if(description) description.content=LANGUAGE==="en" ? "Explore Ian Fleming’s 14 original James Bond novels through verified character dossiers, intelligence archives, interactive missions and a canon-aware character simulator." : "进入伊恩·弗莱明笔下的007世界：人物档案、情报档案馆、任务模拟器、邦德体验、文学研究室与世界地图。";
  const b=document.getElementById("languageToggle");
  if(b){b.textContent=LANGUAGE==="en"?"中文":"EN";b.setAttribute("aria-label",LANGUAGE==="en"?"Switch to Chinese":"Switch to English");}
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))translateTextNode(n);
  translateElementAttributes();
  const placeholders={charSearch:["输入名字，如邦德、M、Q、布洛菲尔德…","Search by name, e.g. Bond, M, Q or Blofeld…"],chatInput:["说点什么…","Write a message…"],dossierQ:["输入关键词，如日本、苏联、莱特、武器、赌场、布洛菲尔德…","Search the archive…"],canonWorldSearch:["搜索地点、国家或小说…","Search locations, countries or novels…"]};
  for(const [id,v] of Object.entries(placeholders)){const e=document.getElementById(id);if(e)e.placeholder=v[LANGUAGE==="en"?1:0];}
  document.querySelectorAll("#charBookFilter option[data-label-zh]").forEach(o => { o.textContent = LANGUAGE === "en" ? (o.dataset.labelEn || "Novel not specified") : o.dataset.labelZh; });
  document.querySelectorAll("#sceneChapter option[data-title-zh]").forEach(o => {
    o.textContent = LANGUAGE === "en" ? (o.dataset.titleEn || "Chapter " + o.value) : "第" + o.value + "章 · " + o.dataset.titleZh;
  });
  const activeDossierTab = document.querySelector("#dossierTabs .chipbtn.active")?.dataset.tab;
  if (activeDossierTab) renderDossierTab(activeDossierTab);
  const activeDossierQuery = document.getElementById("dossierQ")?.value?.trim();
  if (activeDossierQuery) runDossier(activeDossierQuery);
  const labOutput = document.getElementById("labOut");
  if (labOutput && labOutput.textContent.trim()) labOutput.innerHTML = LANGUAGE === "en" ? '<div class="empty">Choose a writing experiment above to generate an English draft.</div>' : '<div class="empty">点上方任一实验开始。</div>';
  if (Array.isArray(canonWorldLocations) && canonWorldLocations.length) {
    const countrySelect = document.getElementById("atlasCountry");
    if (countrySelect) [...countrySelect.options].slice(1).forEach(o => {
      const place = canonWorldLocations.find(p => p.country === o.value);
      o.textContent = LANGUAGE === "en" ? (place?.countryEn || "Country not specified") : o.value;
    });
    const bookSelect = document.getElementById("atlasBook");
    if (bookSelect) [...bookSelect.options].slice(1).forEach(o => {
      const book = BOOKS.find(b => b.id === o.value);
      if (book) o.textContent = (LANGUAGE === "en" ? book.en : book.zh) + " · " + book.year;
    });
    renderAtlas();
  }
}
function initLanguage(){
  const b=document.getElementById("languageToggle");
  if(b)b.addEventListener("click",()=>{LANGUAGE=LANGUAGE==="en"?"zh":"en";try{localStorage.setItem("007-language",LANGUAGE);}catch(_){}applyLanguage();if(CHARACTERS.length){renderCharGrid();if(selectedChar)selectChar(selectedChar);}});
  const observer=new MutationObserver(records=>records.forEach(r=>{if(r.type==="characterData")translateTextNode(r.target);else r.addedNodes.forEach(n=>{if(n.nodeType===3)translateTextNode(n);else if(n.nodeType===1){const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);let t;while((t=w.nextNode()))translateTextNode(t);translateElementAttributes(n);}});}));
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  applyLanguage();
}


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
  if (box) { box.innerHTML = ""; chatHistory.forEach(m => { const c = m.characterId ? charById(m.characterId) : null; const speaker = c ? (LANGUAGE === "en" ? c.name : c.zh) : null; addChatMsg(m.role === "user" ? "me" : "them", m.content, chatMode === "group" ? speaker : null, m.characterId && m.characterId !== selectedChar); }); if (!chatHistory.length) addChatMsg("sys", LANGUAGE === "en" ? "New local conversation. Messages are sent to the model; the latest 80 messages are stored in this browser." : "新建本地对话。消息会发送至模型服务；当前浏览器保存最近80条对话消息。"); }
}

function charById(id) { return CHARACTERS.find((c) => c.id === id);}

function renderCharGrid() {
const q = ($("#charSearch").value || "").trim().toLocaleLowerCase();
const bf = $("#charBookFilter").value;
const list = CHARACTERS.filter((c) => {
  const searchable = [c.zh, c.name, c.role, c.roleEn, ...(c.aliases || [])].filter(Boolean).join(" ").toLocaleLowerCase();
  return (!q || searchable.includes(q)) && (!bf || c.firstNovelId === bf || c.firstBook === bf);
});
$("#charGrid").innerHTML = list.length? list.map((c) =>
`<div class="card clickable ${selectedChar === c.id? "active": ""}" data-char="${c.id}">
<h3>${esc(LANGUAGE==="en"?c.name:c.zh)}</h3><p style="font-size:15px;margin:2px 0">${esc(LANGUAGE==="en"?c.roleEn:c.name)}</p>
<p class="meta">${LANGUAGE==="en"?"First appearance: ":"首次登场："}${esc(LANGUAGE==="en"?c.firstBookEn:c.firstBook)} (${c.firstYear})</p>
<span class="tag gold">${LANGUAGE==="en"?"Knowledge cutoff: ":"知识截止："}${esc(LANGUAGE==="en"?c.cutoffEn:c.cutoff)}</span></div>`).join("")
: `<div class="empty">没有匹配人物，换个关键词试试。</div>`;
$$("#charGrid [data-char]").forEach((el) => el.addEventListener("click", () => selectChar(el.dataset.char)));
}

async function selectChar(id) {
const c = charById(id);
if (!c) { addChatMsg("sys", "知识库中没有找到该人物，无法启动角色模式。"); return; }
const previousChar = selectedChar;
selectedChar = id;
if (previousChar !== id && $("#sceneChapter")) $("#sceneChapter").value = "";
const scene = $("#sceneNovel");
const qSimulation = c.id === "q";
const availableBooks = qSimulation
  ? [{ id:"casino-royale", zh:"Q部门模拟（非正典）", en:"Q Branch simulation (non-canon)", year:"" }]
  : (c.knowledgeScope || []).filter(x => x.status === "present").map(x => BOOKS.find(b => b.id === x.novel)).filter(Boolean);
if (scene) {
  const previousNovel = scene.value;
  scene.innerHTML = "";
  availableBooks.forEach(book => {
    const option = document.createElement("option");
    option.value = book.id;
    option.textContent = qSimulation ? (LANGUAGE === "en" ? book.en : book.zh) : (LANGUAGE === "en" ? book.en : book.zh) + " · " + book.year;
    scene.appendChild(option);
  });
  const preferred = availableBooks.find(b => b.id === c.firstNovelId)?.id || availableBooks[0]?.id || "casino-royale";
  scene.value = previousChar === id && availableBooks.some(b => b.id === previousNovel) ? previousNovel : preferred;
}
const matchedNovel = scene?.value || "casino-royale";
const matchedBook = availableBooks.find(b => b.id === matchedNovel) || BOOKS.find(b => b.id === matchedNovel);
const sceneLabel = $("#sceneNovelLabel");
if (sceneLabel) sceneLabel.textContent = matchedBook
  ? (LANGUAGE==="en"?matchedBook.en:matchedBook.zh) + (qSimulation ? "" : " · " + matchedBook.year) + (qSimulation ? "" : (LANGUAGE==="en"?" (select any novel in which this character appears)":"（可选择该人物出现过的任一作品）"))
  : (LANGUAGE==="en"?"No verified appearance timeline":"暂无核验的出场作品");
await loadSceneChapters(matchedNovel);
$("#sceneChapter").value = "";
restoreChatHistory();
renderCharGrid();
$("#charDetail").innerHTML = `<h3>${esc(LANGUAGE==="en"?c.name:c.zh)}</h3>
<p><span class="tag gold">${esc(LANGUAGE==="en"?c.roleEn:c.role)}</span> <span class="tag">${LANGUAGE==="en"?"First appearance: ":"首次登场："}${esc(LANGUAGE==="en"?c.firstBookEn:c.firstBook)} (${c.firstYear})</span> <span class="tag red">${LANGUAGE==="en"?"Knowledge cutoff: ":"知识截止："}${esc(LANGUAGE==="en"?c.cutoffEn:c.cutoff)}</span></p>
<p><b>${LANGUAGE==="en"?"Background: ":"身份背景："}</b>${esc(LANGUAGE==="en"?c.introEn:c.intro)}</p>
<p><b>${LANGUAGE==="en"?"Appearance: ":"外貌与行为："}</b>${esc(LANGUAGE==="en"?c.appearanceEn:c.appearance)}</p>
<p><b>${LANGUAGE==="en"?"Personality: ":"性格与价值观："}</b>${esc(LANGUAGE==="en"?c.personalityEn:c.personality)}</p>
<p><b>${LANGUAGE==="en"?"Voice and speech: ":"语言习惯："}</b>${esc(LANGUAGE==="en"?(c.speechEn?.tone||"See the English profile."):c.speech)}</p>
<p><b>${LANGUAGE==="en"?"Relationships: ":"人际关系："}</b>${esc(LANGUAGE==="en"?(c.relationships||[]).map(r=>charById(r.with)?.name||englishText(r.with)||"Another character").join(", "):c.rel)}</p>
<p><b>${LANGUAGE==="en"?"Appearances: ":"参与事件："}</b>${esc(LANGUAGE==="en"?c.eventsEn:c.events)}</p>
<p><b>${LANGUAGE==="en"?"Knowledge boundaries: ":"知识边界："}</b>${esc(LANGUAGE==="en"?(c.knowledgeBoundariesEn||"The shared timeline and knowledge-scope constraints apply."):c.bounds)}</p>
<p><b>${LANGUAGE==="en"?"Knowledge sources: ":"知识库出处索引："}</b></p>
<ul style="font-size:14px;margin:4px 0;padding-left:20px">${(LANGUAGE==="en"?c.factsEn:c.facts).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
<p class="meta">${SAMPLE}</p>
<button class="btn small" id="talkThis">${LANGUAGE==="en"?"Talk to "+esc(c.name):"和"+esc(c.zh)+"对话"}</button>`;
$("#talkThis").addEventListener("click", () => {
addChatMsg("sys", (LANGUAGE === "en" ? "Selected: " + c.name + ". This conversation is saved locally in this browser by character and novel timeline." : "已选择" + c.zh + "。当前对话按人物与小说时间点保存在本地浏览器。"));
addChatMsg("them", LANGUAGE === "en" ? c.openerEn : c.opener, LANGUAGE === "en" ? c.name : c.zh);
$("#chatInput").focus();
document.querySelector("#characters.card:last-child").scrollIntoView({ behavior: "smooth", block: "nearest"});
});
const gs = $("#groupSecond");
gs.innerHTML = CHARACTERS.filter((x) => x.id!== id).map((x) => `<option value="${x.id}">${esc(LANGUAGE==="en"?x.name:x.zh)}</option>`).join("");
}

function addChatMsg(kind, text, who, alternateSpeaker = false) {
const box = $("#chatLog");
const div = document.createElement("div");
div.className = "msg " + kind + (kind === "them" && alternateSpeaker ? " speaker-2" : "");
if (kind === "them" && chatMode === "group" && who) {
  const heading = document.createElement("span");
  heading.className = "speaker-name";
  heading.textContent = who;
  const content = document.createElement("div");
  content.className = "msg-content";
  content.textContent = text;
  div.append(heading, content);
} else { div.textContent = text; }
box.appendChild(div);
box.scrollTop = box.scrollHeight;
}

function clearChat() {
  if (!selectedChar) { addChatMsg("sys", LANGUAGE === "en" ? "Select a character before clearing a conversation." : "请先选择人物，再清空对话。"); return; }
  chatHistory = [];
  try { localStorage.removeItem(chatStorageKey()); } catch (e) {}
  const box = $("#chatLog");
  if (box) { box.innerHTML = ""; addChatMsg("sys", LANGUAGE === "en" ? "Conversation cleared. Start a new exchange." : "对话已清空，可以开始新的交流。"); }
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
if (chatMode === "group" && !$("#groupSecond").value) { addChatMsg("sys", "多角色同场需要再选择一位人物。"); return; }
const c = charById(selectedChar);
$("#chatInput").value = "";
addChatMsg("me", input);
$("#chatSend").disabled = true;
$("#chatInput").disabled = true;
const thinking = document.createElement("div");
thinking.className = "msg them";
thinking.id = "chatThinking";
thinking.textContent = LANGUAGE==="en" ? "Thinking…" : "对方正在想……";
const chatBox = $("#chatLog");
chatBox.appendChild(thinking);
chatBox.scrollTop = chatBox.scrollHeight;
chatHistory.push({ role: "user", content: input});
saveChatHistory();
const ids = chatMode === "group" ? [selectedChar, $("#groupSecond").value] : [selectedChar];
const sysNote = chatMode === "report"? "你正在向M汇报，M只听事实。": chatMode === "quartermaster"? "对方是Q，只谈装备。": "";
if (sysNote) addChatMsg("sys", sysNote);
try {
const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json"},
body: JSON.stringify({ characterIds: ids, novelId: $("#sceneNovel").value, chapterNo: $("#sceneChapter").value || null, mode: chatMode, language: LANGUAGE, messages: chatHistory.slice(-12)})});
if (r.ok) {
const d = await r.json();
clearThinking();
if (chatMode === "group" && Array.isArray(d.replies)) {
  d.replies.forEach((item, index) => {
    const speaker = charById(item.characterId);
     addChatMsg("them", item.content, speaker ? (LANGUAGE === "en" ? speaker.name : speaker.zh) : item.characterId, index === 1);
    chatHistory.push({ role: "assistant", content: item.content, characterId: item.characterId });
  });
} else {
  addChatMsg("them", d.reply);
  chatHistory.push({ role: "assistant", content: d.reply, characterId: selectedChar });
}
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
      option.dataset.titleZh = c.title || "";
      option.dataset.titleEn = c.titleEn || "";
      option.textContent = LANGUAGE === "en" ? (c.titleEn ? "Chapter " + c.no + " · " + c.titleEn : "Chapter " + c.no) : "第" + c.no + "章 · " + c.title;
      select.appendChild(option);
    });
  } catch(e) { console.error("chapter index unavailable", e); }
}

async function initCharacters() {
const bf = $("#charBookFilter");
const scene = $("#sceneNovel");

// Bind controls before remote chapter loading: a slow chapter index must not disable the theatre.
const modes = $$("#chatModes .chipbtn");
modes.forEach((b) => b.addEventListener("click", async () => {
  modes.forEach((x) => x.classList.remove("active"));
  b.classList.add("active");
  chatMode = b.dataset.mode || "talk";
  saveChatHistory();
  restoreChatHistory();
  $("#groupPick").style.display = chatMode === "group" ? "block" : "none";
  const hints = { talk: "选择人物后，可在其正典出场作品中切换故事时间线。", report: "向M汇报：M可在其全部正典出场作品中接收汇报。", quartermaster: "Q部门：非正典装备职能模拟；原著中的Q仅被提及，未实际出场。", group: "多角色同场：你与两位人物共同对话；两位人物分别回应，时间线需同时符合双方出场记录。" };
  $("#chatHint").textContent = hints[chatMode] || hints.talk;
  if (chatMode === "report" || chatMode === "quartermaster") {
    $("#sceneChapter").value = "";
    await selectChar(chatMode === "report" ? "m" : "q");
  }
}));
$("#charSearch").addEventListener("input", renderCharGrid);
bf.addEventListener("change", renderCharGrid);
$("#chatSend").addEventListener("click", (event) => { event.preventDefault(); sendChat(); });
$("#chatClear").addEventListener("click", (event) => { event.preventDefault(); clearChat(); });
$("#sceneNovel").addEventListener("change", () => {
  const id = $("#sceneNovel").value;
  const book = BOOKS.find(b => b.id === id);
  const c = charById(selectedChar);
  $("#sceneNovelLabel").textContent = c?.id === "q"
    ? (LANGUAGE === "en" ? "Q Branch simulation (non-canon)" : "Q部门模拟（非正典）")
    : book ? (LANGUAGE === "en" ? book.en : book.zh) + " · " + book.year : id;
  $("#sceneChapter").value = "";
  loadSceneChapters(id);
  restoreChatHistory();
});
$("#sceneChapter").addEventListener("change", restoreChatHistory);
$("#chatInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendChat(); }
});

try {
const [cr, br] = await Promise.all([fetch("/api/characters"), fetch("/api/canon?action=books")]);
if (!cr.ok || !br.ok) throw new Error("canonical data unavailable");
const cd = await cr.json(), bd = await br.json();
BOOKS = (bd.books || []).map(b => ({ id:b.id, zh:b.titleZh, en:b.titleEn, year:b.year, kind:b.kind }));
canonBooksLoaded = true;
scene.innerHTML = "";
CHARACTERS = cd.characters.map(c => ({
id:c.id, name:c.name, zh:c.nameZh, role:c.role, roleEn:c.roleEn || "Core character", firstBook:c.firstBook || "未标注", firstBookEn:c.firstBookEn || "First appearance not specified", firstNovelId:c.firstNovelId || null, knowledgeScope:c.knowledgeScope || [],
firstYear:c.firstYear || "", cutoff:c.timelineCutoff || "按知识库边界", cutoffEn:c.timelineCutoffEn || "As defined by the verified canon timeline.",
intro:c.intro || "原文未提供完整背景资料。", introEn:c.introEn || "No detailed background is available in the verified English profile.", appearance:c.appearance || "原文未提供。", appearanceEn:c.appearanceEn || "Not specified in the verified English profile.",
personality:c.personality || "原文未提供。", personalityEn:c.personalityEn || "Not specified in the verified English profile.", speech:c.speech?.tone || "按原著对话与行为边界生成。", speechEn:c.speechEn || "", relationships:c.relationships || [], knowledgeBoundariesEn:(c.knowledgeBoundariesEn||[]).join("; "),
rel:Array.isArray(c.relationships)?c.relationships.map(r=>r.type+"："+r.with+"（"+r.change+"）").join("；"):"关系资料待核验。",
events:Array.isArray(c.knowledgeScope)?c.knowledgeScope.filter(x=>x.status==="present").map(x=>x.title_zh).join("、"):"按知识库出场记录。", eventsEn:Array.isArray(c.knowledgeScope)?c.knowledgeScope.filter(x=>x.status==="present").map(x=>BOOKS.find(b=>b.id===x.novel)?.en || x.novel).join(", "):"",
bounds:[...(c.knowledgeBoundaries||[]),...(c.behavioralBoundaries||[])].join("；"),
facts:[...(c.sources||[])].map(x=>"出处索引："+x), factsEn:[...(c.sources||[])].map(x=>"Source index: "+(typeof x==="string" ? (englishText(x)||"Verified source reference") : (englishText(x?.title_en,x?.path,x?.id)||"Verified source reference"))), opener:"请按当前小说时间点与原著事实提问。", openerEn:"Ask about the character within the selected novel timeline and established canon.", scripted:["原著没有明确写到的部分，我不会替作者补写。"]
}));
 [...new Map(CHARACTERS.map(c => [c.firstNovelId || c.firstBook, { value: c.firstNovelId || c.firstBook, labelZh: c.firstBook || c.firstNovelId || "首次登场未标注", labelEn: c.firstBookEn || "First appearance not specified" }])).values()].forEach(item=>{const o=document.createElement("option");o.value=item.value;o.dataset.labelZh=item.labelZh;o.dataset.labelEn=item.labelEn;o.textContent=LANGUAGE==="en"?item.labelEn:item.labelZh;bf.appendChild(o);});
 bd.books.forEach(b => { const so=document.createElement("option");so.value=b.id;so.textContent=(LANGUAGE==="en"?b.titleEn:b.titleZh)+" · "+b.year;scene.appendChild(so); });
scene.value="casino-royale";
const initialBook = BOOKS.find(b => b.id === scene.value);
if ($("#sceneNovelLabel")) $("#sceneNovelLabel").textContent = initialBook ? (LANGUAGE === "en" ? initialBook.en + " · " + initialBook.year + " (matched to character debut)" : initialBook.zh + " · " + initialBook.year + "（选择人物后自动匹配）") : (LANGUAGE === "en" ? "Matched automatically when a character is selected" : "选择人物后自动匹配");
// Render character cards immediately; chapter data is loaded in the background.
renderCharGrid();
loadSceneChapters(scene.value);
if (CHARACTERS.some(c => c.id === "bond")) await selectChar("bond");
} catch(e) {
$("#charGrid").innerHTML='<div class="empty">核验知识库加载失败：'+esc(e.message)+'。请检查本地同步与API。</div>';
}
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
        const title = h.kind === "facts" ? (LANGUAGE==="en" ? (englishText(h.entity_en, h.title_en, h.id) || "Canon fact") : (h.entity || h.title_zh || "原著事实")) : (LANGUAGE==="en" ? (englishText(h.title_en, h.name_en, h.name, h.title, h.entity, h.id) || "Untitled record") : (h.title_zh || h.name_zh || h.name || h.name_en || h.title || h.entity || h.id || "未命名记录"));
        const kind = LANGUAGE==="en" ? ({facts:"Facts",characters:"Characters",locations:"Locations",organizations:"Organisations",equipment:"Equipment",events:"Events",timeline:"Timeline",books:"Novels"}[h.kind] || h.kind || "Dossier") : (h.kind || "档案");
        const sourceBook = LANGUAGE==="en" ? (englishText(h.title_en, BOOKS.find(b=>b.id===h.novel_id)?.en, h.novel_id) || "Unknown novel") : (h.title_zh || h.novel_id); const source = [sourceBook && h.novel_id ? sourceBook : null, h.chapter ? (LANGUAGE==="en" ? "Chapter "+h.chapter : "第"+h.chapter+"章") : null, LANGUAGE==="en" ? englishText(h.source_novel) : h.source_novel].filter(Boolean).join(" · ") || (LANGUAGE==="en"?"Indexed record":"索引记录");
        const detail = LANGUAGE==="en" ? (englishText(h.fact_en, h.summary_en, h.description_en, h.role_en, h.note_en, h.quote_en) || "No English summary is available for this entry.") : (h.fact || h.summary || h.description || h.story_timeline || h.role || h.note || h.change || h.quote || "该条目没有提供摘要字段。");
        const status = LANGUAGE === "en" ? (h.canon_or_inference === "inference" ? "Inference" : h.canon_or_inference === "canon" ? "Canon fact" : kind) : (h.canon_or_inference === "inference" ? "推测" : h.canon_or_inference === "canon" ? "正典事实" : kind);
        return `<div class="card" style="margin:8px 0"><h3>${esc(title)} <span class="tag gold">${esc(status)}</span></h3><p class="meta">出处：${esc(source)}</p><p>${esc(detail)}</p>${(LANGUAGE==="en" ? h.quote_en : h.quote) ? `<blockquote>${esc(LANGUAGE==="en" ? (h.quote_en || h.quote) : h.quote)}</blockquote>` : ""}</div>`;
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
      body.innerHTML = LANGUAGE==="en" ? `<p class="meta">14 original novels · Chapter records from the verified knowledge base</p><table><tr><th>Novel</th><th>Publication year</th><th>Format</th><th>Chapters</th><th>Synopsis</th></tr>` + d.books.map(b => `<tr><td><b>${esc(b.titleEn)}</b></td><td>${b.year}</td><td>${esc(LANGUAGE==="en" ? (englishText(b.kindEn) || "Novel") : b.kind)}</td><td>${b.chapters}</td><td>${esc(b.summaryEn || "Synopsis not available in English.")}</td></tr>`).join("") + `</table>` : `<p class="meta">14部原著 · 章节摘要来自逐部核验知识库</p><table><tr><th>书名</th><th>英文原名</th><th>出版年</th><th>类型</th><th>章节</th><th>故事时间线</th></tr>` + d.books.map(b => `<tr><td><b>${esc(b.titleZh)}</b></td><td>${esc(b.titleEn)}</td><td>${b.year}</td><td>${esc(b.kind)}</td><td>${b.chapters}</td><td>${esc(b.summary)}</td></tr>`).join("") + `</table>`;
    } else if (tab === "timeline") {
      body.innerHTML = LANGUAGE==="en" ? `<p class="meta">Listed by publication order; in-story chronology is distinct from publication dates.</p>` + (d.timeline || []).map(t => `<div class="log"><b style="color:var(--gold2)">${esc(LANGUAGE==="en" ? (englishText(t.title_en, BOOKS.find(b=>b.id===t.novel)?.en, t.novel) || "Unknown novel") : (t.title_zh || t.novel))}</b>: ${esc(englishText(t.story_timeline_en, t.summary_en) || "A verified English timeline summary is not available for this entry.")}</div>`).join("") : `<p class="meta">按出版顺序排列；故事内部年份与出版年份不混为一谈。</p>` + (d.timeline || []).map(t => `<div class="log"><b style="color:var(--gold2)">${esc(t.title_zh || t.novel)}</b>：${esc(t.story_timeline || "")}</div>`).join("");
    } else {
      const items = tab === "orgs" ? d.organizations : d.equipment;
      const title = LANGUAGE==="en" ? (tab === "orgs" ? "Organisation dossiers" : "Equipment dossiers") : (tab === "orgs" ? "组织档案" : "装备档案");
      body.innerHTML = `<p class="meta">${title} · ${items.length}条核验索引</p><div class="grid g2">` +
        items.map(o => `<div class="card"><h3>${esc(LANGUAGE==="en" ? (englishText(o.name_en, o.id) || "Unnamed record") : (o.name_zh || o.name || o.id))}</h3><p class="meta">${esc(o.name_en || "")} · ${esc(o.id)}</p><p>${esc(LANGUAGE==="en" ? (englishText(o.description_en, o.role_en, o.note_en) || "No English description is available for this entry.") : (o.description || o.role || o.note || "原著索引条目"))}</p><p class="meta">${LANGUAGE==="en"?"Appearances: ":"出场："}${esc((o.appearances || []).map(a => LANGUAGE==="en" ? (typeof a === "string" ? (englishText(a) || "Unknown appearance") : (englishText(a.title_en, a.novel) || "Unknown appearance")) : (a.title_zh || a.title || a.novel || a)).join(LANGUAGE==="en"?", ":"、"))}</p></div>`).join("") + `</div>`;
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
$("#missionList").onclick = (event) => {
const el = event.target.closest("[data-mission]");
if (!el) return;
const id = el.dataset.mission;
if (el.dataset.resume === "true") {
  if (!restoreMissionState(id)) startMission(id);
} else startMission(id);
};
}

function startMission(id) {
missionDef = missionById(id);
if (!missionDef) return;
loadMissionCanonBrief(missionDef.novelId || null);
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
<p class="meta">${missionDef.novelId ? "原著改编互动：玩家分支不等同于原著事件；原著结局与本次模拟结果分开呈现。" : "【非原著·原创】本任务为原创设计，结局为模拟结果，不是原著剧情。"}</p>
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

let missionBriefRequest = 0;
async function loadMissionCanonBrief(novelId = "casino-royale") {
  const requestId = ++missionBriefRequest;
  const box = $("#missionCanonBrief");
  if (!novelId) {
    box.innerHTML = LANGUAGE === "en"
      ? '<p class="meta">Original mission: no novel-canon basis. All character relationships, locations and branches are original simulation content.</p>'
      : '<p class="meta">原创任务：没有原著正典依据。所有人物关系、地点和分支均为原创模拟内容。</p>';
    return;
  }
  try {
    const r = await fetch("/api/mission?id=" + encodeURIComponent(novelId));
    if (!r.ok) throw new Error("任务正典接口返回 " + r.status);
    const d = await r.json();
    if (requestId !== missionBriefRequest) return;
    const facts = (d.facts || []).slice(0, 8);
    const events = (d.events || []).slice(0, 4);
    if (LANGUAGE === "en") {
      const title = englishText(d.novel.titleEn, d.novel.id) || "Original novel";
      const timeline = englishText(d.novel.timelineEn) || "No verified English timeline summary is available for this novel.";
      const chapters = (d.chapters || []).map(c => "Chapter " + c.no + (englishText(c.titleEn) ? " · " + englishText(c.titleEn) : "")).join(" · ");
      const factRows = facts.map(f => "<li>" + esc("Chapter " + f.chapter + ": " + (englishText(f.factEn) || "Verified fact record; English wording not available.")) + "</li>").join("");
      const eventRows = events.map(e => "<li>" + esc((englishText(e.title_en, e.titleEn, e.title, e.id) || "Canon event") + (englishText(e.effect_en, e.description_en, e.summary_en) ? " — " + englishText(e.effect_en, e.description_en, e.summary_en) : "")) + "</li>").join("");
      box.innerHTML = "<h3>" + esc(title) + " · " + d.novel.year + "</h3><p class='meta'>Interactive adaptation: player choices create branches and must not be mistaken for novel events.</p><p>" + esc(timeline) + "</p><p><b>Chapter index:</b> " + esc(chapters) + "</p><p><b>Verified canon extracts:</b></p><ul>" + factRows + "</ul><p><b>Key events:</b></p><ul>" + eventRows + "</ul>";
    } else {
      box.innerHTML = '<h3>'+esc(d.novel.titleZh)+' · '+d.novel.year+'</h3><p class="meta">'+esc(d.missionMode)+'：玩家选择会产生互动分支，不能冒充原著剧情。</p><p>'+esc(d.novel.timeline)+'</p><p><b>章节目录：</b>'+esc(d.chapters.map(c=>c.no+" "+c.title).join(" · "))+'</p><p><b>核验事实摘录：</b></p><ul>'+facts.map(f=>'<li>'+esc("第"+f.chapter+"章："+f.fact)+'</li>').join("")+'</ul><p><b>关键事件：</b></p><ul>'+events.map(e=>'<li>'+esc("第"+e.chapter+"章："+e.title+" — "+e.effect)+'</li>').join("")+'</ul>';
    }
  } catch(e) { box.innerHTML = LANGUAGE === "en" ? '<p class="meta">Failed to load canon mission records: '+esc(e.message)+'. The mission narrative is not marked as fully canon-verified.</p>' : '<p class="meta">原著任务资料加载失败：'+esc(e.message)+'。任务剧情暂不标为已完成正典核验。</p>'; }
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
    loadMissionCanonBrief(missionDef.novelId || null);
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
let bacChips = 1000, bacWins = 0, bacLosses = 0, bacPushes = 0, bacStreak = 0;
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
function createShoe() {
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) {
    const value = rank === "A" ? 1 : (["10", "J", "Q", "K"].includes(rank) ? 0 : parseInt(rank, 10));
    deck.push({ label: rank + suit, value });
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
function drawCard(shoe) { return shoe.pop(); }
function handTotal(cards) { return cards.reduce((a, c) => a + c.value, 0) % 10; }
function playBaccarat() {
  if (bacChips < 10) { $("#bacNote").textContent = "筹码不足，请点“重新领筹码”。"; return; }
  const requested = parseInt($("#bacAmount").value, 10);
  if (!Number.isFinite(requested) || requested < 10) { $("#bacNote").textContent = "每局最低下注10筹码。"; return; }
  const amount = Math.min(bacChips, requested);
  const side = $("#bacSide").value;
  const shoe = createShoe();
  const player = [drawCard(shoe), drawCard(shoe)];
  const banker = [drawCard(shoe), drawCard(shoe)];
  bacChips -= amount;
  let pTotal = handTotal(player), bTotal = handTotal(banker);
  const pNatural = pTotal >= 8, bNatural = bTotal >= 8;
  let pThird = null;
  if (!pNatural && !bNatural) {
    if (pTotal <= 5) { pThird = drawCard(shoe); player.push(pThird); pTotal = handTotal(player); }
    if (pThird === null) {
      if (bTotal <= 5) { banker.push(drawCard(shoe)); bTotal = handTotal(banker); }
    } else {
      const tv = pThird.value;
      if (bTotal <= 2) banker.push(drawCard(shoe));
      else if (bTotal === 3 && tv !== 8) banker.push(drawCard(shoe));
      else if (bTotal === 4 && tv >= 2 && tv <= 7) banker.push(drawCard(shoe));
      else if (bTotal === 5 && tv >= 4 && tv <= 7) banker.push(drawCard(shoe));
      else if (bTotal === 6 && (tv === 6 || tv === 7)) banker.push(drawCard(shoe));
      bTotal = handTotal(banker);
    }
  }
  const result = pTotal === bTotal ? "tie" : pTotal > bTotal ? "player" : "banker";
  let payout = 0, outcome = "";
  if (result === "tie" && side !== "tie") {
    bacChips += amount; bacPushes++; bacStreak = 0;
    outcome = "和局，庄闲投注退回本金，本局不输不赢。";
  } else if (side === result) {
    payout = result === "tie" ? amount * 8 : result === "banker" ? Math.floor(amount * 0.95) : amount;
    bacChips += amount + payout; bacWins++; bacStreak = bacStreak > 0 ? bacStreak + 1 : 1;
    outcome = result === "tie" ? "和局！你押中和局，净赢" + payout + "筹码。" : "你赢了这把，净赢" + payout + "筹码。";
  } else {
    bacLosses++; bacStreak = bacStreak < 0 ? bacStreak - 1 : -1;
    outcome = "这把输了，输掉" + amount + "筹码。" + (result === "player" ? "闲家胜。" : result === "banker" ? "庄家胜。" : "本局和局。");
  }
  const rival = bacStreak >= 3 ? "勒·希弗眯起眼睛：“你今晚手气不错，邦德先生。”" : bacStreak <= -3 ? "勒·希弗冷笑：“筹码会自己长脚走到我这边来。”" : bacStreak > 0 ? "勒·希弗：“继续，别停。”" : bacStreak < 0 ? "勒·希弗：“别急，牌桌还长着呢。”" : "勒·希弗观望中。";
  $("#bacChips").textContent = bacChips;
  $("#bacBet").textContent = amount + "·" + ({ player: "闲家", banker: "庄家", tie: "和局" }[side]);
  $("#bacRecord").textContent = bacWins + "胜" + bacLosses + "负" + bacPushes + "和";
  $("#bacRival").textContent = rival;
  $("#bacTable").innerHTML = `<table><tr><th>闲家</th><th>点数</th><th>庄家</th><th>点数</th></tr><tr><td>${player.map(c => esc(c.label)).join(" ")}</td><td><b>${pTotal}</b></td><td>${banker.map(c => esc(c.label)).join(" ")}</td><td><b>${bTotal}</b></td></tr></table><p style="margin-top:10px">${esc(outcome)}</p><p class="meta">${esc(rival)}</p>`;
  $("#bacNote").textContent = bacChips <= 0 ? "筹码用完了，点“重新领筹码”恢复1000。" : "";
}

function initBaccarat() {
  $("#bacDeal").addEventListener("click", playBaccarat);
  $("#bacReset").addEventListener("click", () => {
    bacChips = 1000; bacWins = 0; bacLosses = 0; bacPushes = 0; bacStreak = 0;
    $("#bacChips").textContent = bacChips;
    $("#bacRecord").textContent = "0胜0负0和";
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
const pick = (a) => a[Math.floor(Math.random() * a.length)];
if (LANGUAGE === "en") {
  const marks = ["Two missing fingers on the left hand", "Skin with an unnatural blue cast in sunlight", "A persistent smell of camphor", "A glass right eye that clicks as it moves"];
  const obs = ["antique clocks", "deep-sea wrecks", "rare orchids", "expired passports"];
  const plans = ["trigger a run on three banks on the same day", "replace genuine artefacts with convincing fakes at an auction", "cut an undersea cable and frame a rival", "launder a shipload of stolen goods through a charity gala"];
  return "Villain concept — Signature trait: " + pick(marks) + "; obsession: " + pick(obs) + "; master plan: " + pick(plans) + ". Fleming test: the trait should be instantly memorable, the obsession should shape the whole story, and the plan should be intricate enough to take Bond half a novel to unravel.";
}
const marks = ["左手缺了两根手指", "皮肤在阳光下泛着不自然的青色", "说话时总带着一股樟脑味", "右眼是玻璃义眼，转动时有轻微声响"];
const obs = ["古董钟表", "深海沉船", "稀有兰花", "过期护照"];
const plans = ["让三家银行在同一天挤兑", "在拍卖会上调包一批赝品", "切断一条海底电缆，嫁祸给对手", "用一场慈善晚宴洗白一船赃物"];
return "新反派草稿：特征——" + pick(marks) + "；痴迷之物——" + pick(obs) + "；计划——" + pick(plans) + "。弗莱明式检验：特征要一眼能记住，痴迷要贯穿全书，计划要缜密到邦德也得花半本书拆解。";
},
suspense: () => LANGUAGE === "en"
  ? "Three-act suspense structure: Act I gives Bond an apparently simple assignment and reveals only half the truth. Act II exposes the target as a decoy; every new fact overturns the previous explanation. Act III compresses the conflict into 24 hours and a single enclosed location, tightening the tension through a countdown."
  : "悬念结构（三幕）：第一幕给邦德一个看似简单的任务，只露一半真相；第二幕让邦德发现任务目标本身就是诱饵，信息每揭开一层就推翻上一层；第三幕把冲突压缩进24小时，地点只剩一个密闭空间，悬念靠倒计时收紧。",
mission: () => {
const pick = (a) => a[Math.floor(Math.random() * a.length)];
if (LANGUAGE === "en") {
  const cities = ["Lisbon", "Alexandria", "Monte Carlo", "Istanbul"];
  const targets = ["a forged consular list", "a stolen cipher machine", "a shipment of smuggled gold", "a code clerk who has defected"];
  return "Operation concept — Location: " + pick(cities) + "; objective: " + pick(targets) + "; structure: M’s briefing (only half the truth) → arrival and reconnaissance (the contact proves unreliable) → approach at a card table or masked ball (first confrontation) → extraction (a tail is spotted and the cover is blown) → debrief (M wants results, not excuses).";
}
const cities = ["里斯本", "亚历山大港", "蒙特卡洛", "伊斯坦布尔"];
const targets = ["一份伪造的领事名单", "一台失窃的密码机", "一批走私黄金", "一个叛逃的密码员"];
return "秘密行动草稿：地点——" + pick(cities) + "；目标——" + pick(targets) + "；结构：M简报（只给一半真相）→抵达侦察（发现线人不可靠）→牌桌或舞会接近目标（第一次交锋）→撤离（有人跟踪，身份暴露）→报告（M只问结果）。";
},
compare: () => {
const a = BOOKS[Math.floor(Math.random() * BOOKS.length)];
let b = BOOKS[Math.floor(Math.random() * BOOKS.length)];
if (b.id === a.id) b = BOOKS[(BOOKS.indexOf(a) + 3) % BOOKS.length];
return LANGUAGE === "en"
  ? a.en + " (" + a.year + ") and " + b.en + " (" + b.year + "): compare narrative viewpoint, character knowledge boundaries, suspense, operational pacing and resolution. This is a research outline; specific conclusions must be checked against chapter-level evidence."
  : a.zh + "（" + a.year + "年）与" + b.zh + "（" + b.year + "年）：可从叙事视角、人物知识边界、悬念铺设、行动节奏与结局结构进行比较。此处仅生成研究提纲，具体结论需回到章节证据。";
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
const r = await fetch("/api/literary", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ question: q })
});
const d = await r.json().catch(() => ({}));
const results = d.evidence || [];
const answer = d.answer
  ? `<div class="card" style="margin:8px 0"><h3>MiniMax 文学分析</h3><p style="white-space:pre-wrap">${esc(d.answer)}</p><p class="meta">模型：${esc(d.model || "MiniMax")} · 结论仅在所列原著证据范围内成立。</p></div>`
  : `<div class="empty">${esc(d.error || "模型暂不可用。以下先展示可检索到的原著证据；配置 MiniMax 后可生成完整文学分析。")}</div>`;
const evidence = results.length
  ? `<p class="meta">核验知识库证据：${results.length}条</p>` + results.map(x => `<div class="card" style="margin:8px 0"><h3>${esc(x.title || "原著记录")} <span class="tag gold">${esc(x.kind || "正典资料")}</span></h3><p class="meta">出处：${esc(x.source || "索引记录")}</p><p>${esc(x.detail || "")}</p></div>`).join("")
  : `<div class="empty">知识库没有找到直接匹配的证据；分析会明确区分推断与原著事实。</div>`;
box.innerHTML = answer + evidence;
} catch (e) {
box.innerHTML = `<div class="empty">正典检索失败：${esc(e.message)}。</div>`;
}
});
$$("[data-lab]").forEach((b) => b.addEventListener("click", async () => {
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

function locationName(p) { return LANGUAGE === "en" ? (p.nameEn || "Unnamed location") : p.name; }
function locationCountry(p) { return LANGUAGE === "en" ? (p.countryEn || "Country not specified") : (p.country || "国家未标注"); }
function locationAppearance(a) { return LANGUAGE === "en" ? ((a.titleEn || a.novel) + " — " + (a.roleEn || "Appearance details not available in English.")) : (a.title + "：" + a.role); }

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
      marker.bindPopup(`<strong>${esc(locationName(d.p))}</strong><br>${esc(locationCountry(d.p))}<br>${d.p.appearances.length} ${LANGUAGE === "en" ? "novels" : "部作品"}`);
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
        empty.textContent = LANGUAGE === "en" ? "No verified real locations with coordinates match these filters. See the dossiers below for fictional or regional locations." : "当前筛选没有可核验坐标的真实地点；虚构或区域级地点请查看下方档案。";
        empty.style.cssText = "position:absolute;z-index:500;top:12px;left:12px;max-width:70%;padding:8px 10px;background:rgba(244,240,228,.94);color:#1b241d;border-radius:4px;font-size:12px";
        wrap.appendChild(empty);
      }
      empty.textContent = LANGUAGE === "en" ? "No verified real locations with coordinates match these filters. See the dossiers below for fictional or regional locations." : "当前筛选没有可核验坐标的真实地点；虚构或区域级地点请查看下方档案。";
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
      const w = locationName(d.p).length * 11 + 4, h = 14;
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
      `<div class="mapdot" style="left:${d.xPct.toFixed(1)}%;top:${d.yPct.toFixed(1)}%" data-loc="${d.p.id}" title="${esc(locationName(d.p))}"></div><div class="maplbl" data-loc="${d.p.id}" style="left:${d.lbl.left.toFixed(0)}px;top:${d.lbl.top.toFixed(0)}px;transform:none">${esc(locationName(d.p))}</div>`
    ).join("") : `<div style="position:absolute;left:10px;right:10px;top:45%;text-align:center;font-size:13px;color:var(--muted)">${LANGUAGE === "en" ? "No verified real locations with coordinates match these filters. See the complete archive below." : "当前筛选没有可核验坐标的真实地点；请查看下方完整档案。"}</div>`;
    $$("#mapWrap .mapdot").forEach(el => el.addEventListener("click", () => showLocation(el.dataset.loc)));
  }
  const mapped = list.filter(p => !p.fictional && MAP_COORDINATES[p.id]);
  const unlocated = list.length - mapped.length;
  $("#atlasGrid").innerHTML = mapped.map(p =>
    `<div class="card clickable" data-loc="${p.id}"><h3>${esc(locationName(p))} <span class="tag gold">${LANGUAGE === "en" ? "Real location" : "真实地点"}</span></h3><p class="meta">${esc(locationCountry(p))} · ${LANGUAGE === "en" ? "City-level map marker" : "城市级地图点"} · ${p.appearances.length} ${LANGUAGE === "en" ? "novels" : "部作品"}</p><p>${esc(p.appearances.map(locationAppearance).join(" · "))}</p></div>`
  ).join("") + `<div class="card"><h3>${LANGUAGE === "en" ? "Other locations in the archive" : "档案中的其他地点"}</h3><p>${LANGUAGE === "en" ? unlocated + " locations have no verified point coordinates or are fictional. They remain in the full directory of 170 locations below." : unlocated + "处地点没有可核验的单点坐标，或属于小说虚构地点。它们仍完整保留在下方170处地点目录中。"}</p></div>`;
  $$("#atlasGrid [data-loc]").forEach(el => el.addEventListener("click", () => showLocation(el.dataset.loc)));
  renderCanonWorldDirectory();
}

function showLocation(id) {
  const p = canonWorldLocations.find(x => x.id === id);
  if (!p) return;
  const coords = MAP_COORDINATES[p.id];
  $("#atlasGrid").innerHTML = `<div class="card" style="grid-column:1/-1"><h3>${esc(locationName(p))} <span class="tag ${p.fictional?"red":"gold"}">${p.fictional ? (LANGUAGE === "en" ? "Fictional location" : "小说虚构地点") : (LANGUAGE === "en" ? "Real location" : "真实地点")}</span></h3>
    <p class="meta">${esc(locationCountry(p))} · ${coords ? (LANGUAGE === "en" ? "City-level coordinates verified" : "城市级地图坐标已核对") : (LANGUAGE === "en" ? "No verifiable point coordinates" : "没有可核验的单点坐标")}</p>
    <p><b>${LANGUAGE === "en" ? "Appearances and original-novel context:" : "出现作品与原著语境："}</b></p>${p.appearances.map(a=>`<div class="log"><b>${esc(LANGUAGE === "en" ? (a.titleEn || a.novel) : a.title)}</b> (${esc(a.year || (LANGUAGE === "en" ? "Year not specified" : "年代未标注"))}): ${esc(LANGUAGE === "en" ? (a.roleEn || "Appearance details not available in English.") : a.role)}</div>`).join("")}
    <p class="meta">${LANGUAGE === "en" ? "Location names, fictional status and novel references come from the verified canon database; map coordinates are independently registered." : "地点名称、虚构属性和作品出处来自核验知识库；地图坐标仅来自独立坐标登记。"}</p>
    <div class="row"><button class="btn small" id="locBack">${LANGUAGE === "en" ? "Back to World Explorer" : "返回地点探索"}</button><button class="btn ghost small" id="locDossier">${LANGUAGE === "en" ? "Search this location in the archive" : "去情报馆检索此地点"}</button></div></div>`;
  $("#locBack").addEventListener("click", renderAtlas);
  $("#locDossier").addEventListener("click", () => {
    $("#dossierQ").value = locationName(p);
    document.getElementById("dossier").scrollIntoView({ behavior: "smooth" });
    runDossier(locationName(p));
  });
}

function renderCanonWorldDirectory() {
  const q = ($("#canonWorldSearch")?.value || "").trim().toLowerCase();
  const list = filteredCanonLocations().filter(p =>
    [LANGUAGE === "en" ? p.nameEn : p.name, p.nameEn, LANGUAGE === "en" ? p.countryEn : p.country, ...p.appearances.map(a=>LANGUAGE === "en" ? (a.titleEn + " " + a.roleEn) : a.title)].join(" ").toLowerCase().includes(q)
  );
  const box = $("#canonWorldDirectory");
  if (!box) return;
  box.innerHTML = list.map(p =>
    `<div class="card clickable" data-canon-loc="${p.id}"><h3>${esc(locationName(p))} <span class="tag ${p.fictional?"red":"gold"}">${p.fictional ? (LANGUAGE === "en" ? "Fictional location" : "小说虚构地点") : (LANGUAGE === "en" ? "Real location" : "真实地点")}</span></h3><p class="meta">${esc(locationCountry(p))} · ${p.appearances.length} ${LANGUAGE === "en" ? "novels" : "部作品"}</p><p>${esc(p.appearances.map(locationAppearance).join(" · "))}</p></div>`
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
  try {
  await loadCanonWorldDirectory();
  const countries = [...new Set(canonWorldLocations.map(p => p.country).filter(Boolean))].sort();
  countries.forEach(c => {
    const place = canonWorldLocations.find(p => p.country === c);
    const o = document.createElement("option"); o.value = c; o.textContent = LANGUAGE === "en" ? (place?.countryEn || "Country not specified") : c;
    $("#atlasCountry").appendChild(o);
  });
  const books = await ensureCanonBooks().catch(() => []);
  books.forEach(b => {
    const o = document.createElement("option"); o.value = b.id; o.textContent = (LANGUAGE === "en" ? b.en : b.zh) + " · " + b.year;
    $("#atlasBook").appendChild(o);
  });
  ["atlasCountry","atlasBook","atlasEra"].forEach(id => document.getElementById(id).addEventListener("change", renderAtlas));
  renderAtlas();
  } catch (e) {
    const directory = $("#canonWorldDirectory");
    if (directory) directory.innerHTML = `<div class="empty">世界探索初始化失败：${esc(e.message)}</div>`;
    const map = $("#mapWrap");
    if (map) map.textContent = "地图初始化失败，请刷新重试。";
    console.error("atlas init failed", e);
  }
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
    const dataState = LANGUAGE === "en" ? (englishText(d.dataState) || "Status not specified") : (d.dataState || "unknown");
    const dataSource = LANGUAGE === "en" ? (englishText(d.dataSource) || "Not specified") : (d.dataSource || "未提供");
    const gapSummary = LANGUAGE === "en" ? (gaps.length ? "See the knowledge-base manifest for documented data gaps." : "No known gaps are listed.") : (gaps.length ? gaps.map(g => typeof g === "string" ? g : JSON.stringify(g)).join("；") : "知识库未列出缺口。");
    const syncSummary = LANGUAGE === "en" ? "Knowledge data is synchronised from the source repository during local development and builds. Generated canon files are not manually edited or writable by site visitors." : "同步方式：本地开发/构建时从知识库主分支拉取；生成文件不手工编辑、不向网站用户开放正典写入。";
    box.innerHTML = `<div class="grid g3">${stats.map(([label,value]) => `<div class="state"><span class="lbl">${esc(LANGUAGE === "en" ? (EN_TEXT.get(label) || label) : label)}</span><b>${Number(value).toLocaleString("en-US")}</b></div>`).join("")}</div>
      <p class="meta" style="margin-top:10px">${LANGUAGE === "en" ? "Data status" : "数据状态"}: ${esc(dataState)} · ${LANGUAGE === "en" ? "Source" : "来源"}: ${esc(dataSource)} · ${LANGUAGE === "en" ? "Knowledge-base version" : "知识库版本"}: ${esc(d.dataGenerated || "Not specified")}</p>
      <p class="meta">${LANGUAGE === "en" ? "Known gaps" : "已知缺口"}: ${esc(gapSummary)}</p>
      <p class="meta">${syncSummary}</p>`;
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
else { pill.textContent = "MiniMax未配置·人物对话暂停"; pill.classList.add("red"); modelAvailable = false;}
$("#modelLine").textContent = d.llm && d.llm.available? "模型已接入：" + d.llm.provider: "MiniMax未配置：正典人物对话与文学分析暂停；档案、任务与世界探索仍可使用。";
} catch (e) {
$("#statusPill").textContent = "状态接口不可用";
$("#statusPill").classList.add("red");
$("#modelLine").textContent = "状态接口不可用，无法确认模型状态；正典人物对话不会使用无约束回退。";
}
}

let appStarted = false;
function startApp() {
  if (appStarted) return;
  appStarted = true;

  initLanguage();
  const tasks = [
    ["人物剧场", initCharacters], ["情报档案馆", initDossier],
    ["任务控制中心", initMissions], ["场景体验", initExperience],
    ["百家乐", initBaccarat], ["文学研究", initLiterary],
    ["世界探索", initAtlas], ["知识库状态", initCanonDataStatus],
    ["模型状态", initStatus]
  ];
  for (const [name, init] of tasks) {
    try {
      const result = init();
      if (result && typeof result.catch === "function") result.catch(e => {
        console.error(name + "初始化失败", e);
        if (name === "模型状态" && $("#statusPill")) $("#statusPill").textContent = "模型状态检测失败";
      });
    } catch (e) { console.error(name + "初始化失败", e); }
  }
}
// Start reliably whether this script is parsed normally, deferred, or injected after DOMContentLoaded.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp, { once: true });
} else {
  startApp();
}
