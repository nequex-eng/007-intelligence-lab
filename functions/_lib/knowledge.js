// 示例知识库：只含公认基础事实，全部标注示例数据/待TXT导入核验。
// 待用户提供全本txt后，由导入接口逐条核验并替换为带书名、章节、原文位置的记录。
export const SAMPLE_NOTICE = "示例数据·待TXT导入核验";
export const BOOKS = [
  { id: "casino-royale", titleEn: "Casino Royale", titleZh: "皇家赌场", year: 1953, kind: "长篇", setting: "法国皇家莱索", villain: "勒·希弗", summary: "邦德受命在皇家赌场牌桌上击败苏联情报机构出纳勒·希弗，阻止其翻本。牌桌、酷刑与薇丝朋·琳德之死，构成系列开篇。", chapters: "已核验：27章（CHAPTER 1 - 标题格式）", status: "示例" },
  { id: "live-and-let-die", titleEn: "Live and Let Die", titleZh: "生死关头", year: 1954, kind: "长篇", setting: "美国、牙买加", villain: "Mr Big（大先生）", summary: "邦德追查与苏联方面勾结的犯罪头目，费利克斯·莱特首次登场并与邦德结盟。", chapters: "已核验：23章（CHAPTER I–XXIII）", status: "示例" },
  { id: "moonraker", titleEn: "Moonraker", titleZh: "月亮牌", year: 1955, kind: "长篇", setting: "英国肯特郡", villain: "雨果·德拉克斯", summary: "邦德调查月亮牌导弹计划，揭开德拉克斯爵士的真实身份与阴谋。", chapters: "已核验：25章（CHAPTER I–XXV）", status: "示例" },
  { id: "diamonds-are-forever", titleEn: "Diamonds Are Forever", titleZh: "金刚钻", year: 1956, kind: "长篇", setting: "非洲、美国、拉斯维加斯", villain: "钻石走私集团", summary: "邦德卧底追查钻石走私链，从非洲一路追到拉斯维加斯。", chapters: "已核验：25章（裸数字1-25+次行全大写标题，第1章THE PIPELINE OPENS，第25章THE PIPELINE CLOSES）", status: "示例" },
  { id: "from-russia-with-love", titleEn: "From Russia with Love", titleZh: "来自俄罗斯的爱情", year: 1957, kind: "长篇", setting: "伊斯坦布尔、东方快车", villain: "克伦斯坦、罗莎·克莱布", summary: "苏联方面以密码机为诱饵设下诱杀局，塔蒂亚娜·罗曼诺娃在途中倒向邦德。", chapters: "已核验：28章（Chapter One格式）", status: "示例" },
  { id: "dr-no", titleEn: "Dr No", titleZh: "诺博士", year: 1958, kind: "长篇", setting: "牙买加、蟹礁岛", villain: "诺博士", summary: "邦德前往牙买加调查失踪事件，登上蟹礁岛，对付双手为钢钳的诺博士。", chapters: "已核验：20章（罗马数字独占一行+次行标题）", status: "示例" },
  { id: "goldfinger", titleEn: "Goldfinger", titleZh: "金手指", year: 1959, kind: "长篇", setting: "英国、美国诺克斯堡", villain: "奥里克·金手指", summary: "邦德从高尔夫球场一路追查黄金走私巨头金手指，挫败其诺克斯堡行动。", chapters: "已核验：23章（CHAPTER ONE–TWENTY-THREE）", status: "示例" },
  { id: "for-your-eyes-only", titleEn: "For Your Eyes Only", titleZh: "只为你的双眼", year: 1960, kind: "短篇集", setting: "多地", villain: "多位", summary: "短篇集，含多个独立任务故事。", chapters: "已核验：短篇集5篇故事（FROM A VIEW TO A KILL等），无章节编号，以故事为索引单位", status: "示例" },
  { id: "thunderball", titleEn: "Thunderball", titleZh: "霹雳弹", year: 1961, kind: "长篇", setting: "巴哈马、拿骚", villain: "布洛菲尔德、埃米利奥·拉戈", summary: "幽灵党首脑布洛菲尔德首次登场，策划核勒索，邦德在巴哈马海域追击。", chapters: "已核验：24章（数字加点标题1.-24.，首尾两章同名«Take It Easy, Mr. Bond»）", status: "示例" },
  { id: "spy-who-loved-me", titleEn: "The Spy Who Loved Me", titleZh: "爱我的间谍", year: 1962, kind: "长篇", setting: "美国", villain: "黑帮打手", summary: "以女性视角讲述的特别篇章，邦德在旅馆夜战中救下女主人公。", chapters: "已核验：3部15章（Part One: Me第1-6章、Part Two: Them第7-9章、Part Three: Him第10-15章）", status: "示例" },
  { id: "on-her-majestys-secret-service", titleEn: "On Her Majesty's Secret Service", titleZh: "女王密使", year: 1963, kind: "长篇", setting: "瑞士阿尔卑斯山区", villain: "布洛菲尔德", summary: "邦德追查布洛菲尔德，与崔西相恋结婚，婚礼当日崔西遇害。", chapters: "已核验：27章（裸数字1-27+次行标题，第1章Seascape with Figures，第27章All the Time in the World）", status: "示例" },
  { id: "you-only-live-twice", titleEn: "You Only Live Twice", titleZh: "雷霆谷", year: 1964, kind: "长篇", setting: "日本", villain: "布洛菲尔德", summary: "失忆与复仇之作，邦德前往日本，在雷霆谷与化名博士的布洛菲尔德对决。", chapters: "已核验：22章（裸数字1-22+次行全大写标题，分Part One、Part Two两部）", status: "示例" },
  { id: "man-with-golden-gun", titleEn: "The Man with the Golden Gun", titleZh: "金枪人", year: 1965, kind: "长篇", setting: "牙买加", villain: "弗朗西斯科·斯卡拉曼加", summary: "邦德追查以金枪闻名的杀手斯卡拉曼加，弗莱明去世后出版的遗作。", chapters: "已核验：17章（裸数字1-17+次行标题，第1章\"Can I Help You?\"，第17章Endit）", status: "示例" },
  { id: "octopussy", titleEn: "Octopussy and The Living Daylights", titleZh: "八爪女与黎明生死线", year: 1966, kind: "短篇集", setting: "多地", villain: "多位", summary: "短篇集，弗莱明去世后出版，含八爪女等故事。", chapters: "已确认3篇故事（OCTOPUSSY、THE LIVING DAYLIGHTS、THE PROPERTY OF A LADY）；007 in New York本版全文0次，是否缺第4篇待换版核对", status: "示例" }
];

export const LOCATIONS = [
  { id: "london", name: "伦敦", country: "英国", lat: 51.5074, lng: -0.1278, fictional: false, books: ["皇家赌场", "月亮牌", "金手指"], note: "秘密情报机构总部所在地，M办公室与Q部门所在地。", people: ["M", "钱彭妮", "Q", "邦德"] },
  { id: "royale", name: "皇家莱索", country: "法国", lat: null, lng: null, fictional: true, books: ["皇家赌场"], note: "虚构海滨赌城，皇家赌场所在地。小说虚构地点，不标注真实坐标。", people: ["邦德", "勒·希弗", "薇丝朋·琳德"] },
  { id: "paris", name: "巴黎", country: "法国", lat: 48.8566, lng: 2.3522, fictional: false, books: ["皇家赌场", "来自俄罗斯的爱情"], note: "邦德多次途经与停留的欧洲城市。", people: ["邦德"] },
  { id: "istanbul", name: "伊斯坦布尔", country: "土耳其", lat: 41.0082, lng: 28.9784, fictional: false, books: ["来自俄罗斯的爱情"], note: "诱杀计划的关键城市，东方快车起点。", people: ["邦德", "塔蒂亚娜·罗曼诺娃"] },
  { id: "venice", name: "威尼斯", country: "意大利", lat: 45.4408, lng: 12.3155, fictional: false, books: ["来自俄罗斯的爱情"], note: "东方快车沿线城市。", people: ["邦德", "塔蒂亚娜·罗曼诺娃"] },
  { id: "jamaica-kingston", name: "金斯敦", country: "牙买加", lat: 17.9712, lng: -76.7936, fictional: false, books: ["生死关头", "诺博士", "金枪人"], note: "邦德多次行动的加勒比海基地。", people: ["邦德", "费利克斯·莱特"] },
  { id: "crab-key", name: "蟹礁岛", country: "牙买加", lat: null, lng: null, fictional: true, books: ["诺博士"], note: "虚构岛屿，诺博士基地所在地。小说虚构地点，不标注真实坐标。", people: ["邦德", "诺博士"] },
  { id: "new-york", name: "纽约", country: "美国", lat: 40.7128, lng: -74.006, fictional: false, books: ["生死关头", "金刚钻"], note: "邦德在美国行动的重要城市。", people: ["邦德", "费利克斯·莱特"] },
  { id: "las-vegas", name: "拉斯维加斯", country: "美国", lat: 36.1699, lng: -115.1398, fictional: false, books: ["金刚钻"], note: "钻石走私链终点，赌场城市。", people: ["邦德"] },
  { id: "florida", name: "佛罗里达", country: "美国", lat: 27.6648, lng: -81.5158, fictional: false, books: ["生死关头", "金手指"], note: "邦德多次前往的美国南部州。", people: ["邦德", "费利克斯·莱特"] },
  { id: "nassau", name: "拿骚", country: "巴哈马", lat: 25.0443, lng: -77.3504, fictional: false, books: ["霹雳弹"], note: "核勒索案的海域行动中心。", people: ["邦德", "布洛菲尔德"] },
  { id: "swiss-alps", name: "瑞士阿尔卑斯山区", country: "瑞士", lat: 46.559, lng: 9.787, fictional: false, books: ["女王密使"], note: "布洛菲尔德山顶诊所所在地一带，坐标为区域示意。", people: ["邦德", "崔西·邦德", "布洛菲尔德"] },
  { id: "tokyo", name: "东京", country: "日本", lat: 35.6762, lng: 139.6503, fictional: false, books: ["雷霆谷"], note: "邦德在日本行动的起点。", people: ["邦德"] },
  { id: "fort-knox", name: "诺克斯堡", country: "美国", lat: 37.8937, lng: -85.9574, fictional: false, books: ["金手指"], note: "美国黄金储备库，金手指行动目标。", people: ["邦德", "金手指"] },
  { id: "kent", name: "肯特郡", country: "英国", lat: 51.2787, lng: 0.5217, fictional: false, books: ["月亮牌"], note: "月亮牌导弹基地所在地一带。", people: ["邦德"] }
];

export const ORGANIZATIONS = [
  { id: "sis", name: "英国秘密情报机构", nameEn: "Secret Intelligence Service", kind: "情报机构", note: "邦德所属机构，首长为M，总部在伦敦。", books: ["全系列"] },
  { id: "cia", name: "美国中央情报局", nameEn: "Central Intelligence Agency", kind: "情报机构", note: "费利克斯·莱特所属机构，邦德的盟友。", books: ["皇家赌场", "生死关头", "金刚钻", "金手指", "霹雳弹", "金枪人"] },
  { id: "smersh", name: "苏联反间谍机构", nameEn: "SMERSH", kind: "情报机构", note: "早期小说中的苏联方面机构，勒·希弗为其出纳。", books: ["皇家赌场", "生死关头", "来自俄罗斯的爱情"] },
  { id: "spectre", name: "幽灵党", nameEn: "SPECTRE", kind: "犯罪组织", note: "布洛菲尔德领导的跨国犯罪组织，霹雳弹起成为主要对手。", books: ["霹雳弹", "女王密使", "雷霆谷"] },
  { id: "q-branch", name: "Q部门", nameEn: "Q Branch", kind: "技术部门", note: "负责军械与特种装备，负责人为Q。", books: ["全系列"] }
];

export const WEAPONS = [
  { id: "beretta", name: "贝雷塔手枪", nameEn: "Beretta 418", kind: "手枪", note: "邦德早期配枪，诺博士起被换下。", books: ["皇家赌场", "生死关头", "月亮牌", "金刚钻", "来自俄罗斯的爱情"] },
  { id: "ppk", name: "瓦尔特PPK手枪", nameEn: "Walther PPK", kind: "手枪", note: "诺博士起成为邦德标志性配枪。", books: ["诺博士", "金手指", "霹雳弹", "女王密使", "雷霆谷", "金枪人"] },
  { id: "golden-gun", name: "金枪", nameEn: "Golden Gun", kind: "手枪", note: "斯卡拉曼加的标志性武器，金色手枪。", books: ["金枪人"] },
  { id: "knife", name: "搏击刀", nameEn: "Fighting knife", kind: "冷兵器", note: "邦德近身格斗常用装备（示例，待TXT核验）。", books: ["全系列"] }
];

export const TIMELINE = [
  { year: 1953, book: "皇家赌场", event: "邦德在皇家赌场牌桌击败勒·希弗，薇丝朋·琳德身亡" },
  { year: 1954, book: "生死关头", event: "邦德追查犯罪头目，费利克斯·莱特首次登场" },
  { year: 1955, book: "月亮牌", event: "邦德调查月亮牌导弹计划" },
  { year: 1956, book: "金刚钻", event: "邦德卧底追查钻石走私链" },
  { year: 1957, book: "来自俄罗斯的爱情", event: "伊斯坦布尔诱杀局，塔蒂亚娜倒向邦德" },
  { year: 1958, book: "诺博士", event: "邦德登上蟹礁岛，换装瓦尔特PPK手枪" },
  { year: 1959, book: "金手指", event: "邦德挫败金手指的诺克斯堡行动" },
  { year: 1960, book: "只为你的双眼", event: "短篇集出版" },
  { year: 1961, book: "霹雳弹", event: "布洛菲尔德首次登场，策划核勒索" },
  { year: 1962, book: "爱我的间谍", event: "女性视角特别篇章出版" },
  { year: 1963, book: "女王密使", event: "邦德与崔西结婚，婚礼当日崔西遇害" },
  { year: 1964, book: "雷霆谷", event: "邦德前往日本，在雷霆谷对决布洛菲尔德" },
  { year: 1965, book: "金枪人", event: "邦德追查金枪杀手斯卡拉曼加" },
  { year: 1966, book: "八爪女与黎明生死线", event: "短篇集出版" }
];

// 跨书检索：关键词到记录的映射，全部返回带出处的结果。
export function searchDossier(q) {
  const query = (q || "").trim();
  if (!query) return { query, results: [], note: "请输入关键词" };
  const hits = [];
  const push = (type, title, source, detail) => hits.push({ type, title, source, detail });
  if (/日本/.test(query)) push("小说", "雷霆谷", "雷霆谷（1964年）", "邦德前往日本，在雷霆谷对决布洛菲尔德。示例数据，待TXT核验。");
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
  if (/邦德|007/.test(query)) BOOKS.forEach((b) => push("小说", b.titleZh, b.titleEn + "（" + b.year + "年）", b.summary));
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
  if (!hits.length) return { query, results: [], note: "示例知识库中没有匹配结果。待TXT导入后可检索全系列。", sample: true };
  return { query, results: hits, sample: true, note: "示例数据·待TXT导入核验：结果只含公认基础事实，细节存疑处已标注。" };
}
