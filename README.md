# 007 INTELLIGENCE LAB

基于Ian Fleming 14部007原著的互动文学与情报世界实验室。线上站：https://007-intelligence-lab.pages.dev/

## 基线说明

- 本仓库以当前Cloudflare生产部署版本为基准完整导出，不是重写。生产部署72d68e05（2026-11-06约22:15），晚于本地最后改动（public/app.js 21:28、public/index.html 21:27），本地源码与线上一致。
- 线上核验（2026-11-07）：首页200，`GET /api/status`返回MiniMax-M3/minimax/available:true，七大模块正常。
- 本仓库只含网站源码。原著全文、知识库与交接文档不在此仓，见文末。

## 功能

单页应用，六大模块加首页：

- 人物档案：12人（邦德、M、钱彭妮、Q、莱特、勒·希弗、诺博士、金手指、布洛菲尔德、薇丝朋·琳德、塔蒂亚娜、崔西），含三层约束提示词，支持自由对话、向M汇报、找Q领装备、多角色同场（最多3人）。
- 情报馆：14本书目、时间线、组织、武器，跨书检索，事实与推测区分。
- 任务模拟器：2个可玩任务，真实状态机（资金、风险、可信度、线索、关系、装备、时间）：正典皇家赌场（4阶段）与原创威尼斯密码（3阶段，全程标注原创）。
- 邦德体验：9个场景加可玩百家乐（闲/庄/和，赔付1倍/0.95倍/8倍，筹码，勒·希弗对手点评）。
- 文学研究室：10个研究主题、问答、4个原创写作实验（始终标注非正典）。
- 世界地图：15个地点，按人物/国家/书籍/年代筛选；真实城市用真实坐标，虚构地点（Royale-les-Eaux、蟹礁岛）明确标注虚构，不标假坐标。
- TXT导入：前端本地解析txt（算哈希、识别小说名与章节、统计字数行数），摘要POST到服务端校验（重复检测、小说识别、错误报告）；服务端不接收、不存储原著全文。

## 结构

- public/index.html：全站单页，六大模块加首页。
- public/app.js：全部前端交互、任务状态机、百家乐、地图筛选、TXT导入解析。
- functions/_lib/characters.js：12人档案加三层约束提示词。
- functions/_lib/knowledge.js：14本书目、地点、组织、武器、事件等知识库（当前仍标示例数据，见数据状态）。
- functions/_lib/llm.js：模型调用层（MiniMax-M3主路，Workers AI备用）。
- functions/api/chat.js：人物对话接口（POST）。
- functions/api/characters.js：人物档案接口（GET）。
- functions/api/dossier.js：情报检索接口（GET，参数q）。
- functions/api/import.js：TXT导入校验接口（POST，只收摘要，不收全文）。
- functions/api/status.js：健康与模型接入状态（GET）。
- wrangler.toml：Pages配置，含`[ai]`绑定。
- deploy.sh：部署脚本（见部署一节）。
- package.json：唯一开发依赖为wrangler 4.157.0；业务代码零npm依赖，全部导入均为相对路径。

## API接口

- `GET /api/status`：健康与模型接入状态，返回llm.provider、llm.mode、llm.available、modules、dataState。
- `GET /api/characters`：12人档案列表（id、姓名、角色、简介等）。
- `POST /api/chat`：人物对话，请求体含人物id与消息，返回模型回复与实际使用的模型名；未接入模型时返回503。
- `GET /api/dossier?q=关键词`：情报检索，返回带书名出处的结果。
- `POST /api/import`：TXT导入校验，请求体为`{files:[{name,hash,size,charCount,lineCount,chapters,head}]}`，只做重复检测、小说识别与章节结构检查，不接收全文。

## Cloudflare绑定与环境变量

- 绑定：`[ai]` binding="AI"（wrangler.toml），Workers AI备用模型Llama-3.3-70b-instruct-fp8-fast。
- 环境变量（名称清单，不含值）：
  - `MINIMAX_API_KEY`：Pages项目Secret，用户自行在Cloudflare后台设置；主路模型MiniMax-M3用它调用。仓库里任何文件都不含它的值。
  - 无其他环境变量，无KV、D1、R2绑定。
- 模型调用链（functions/_lib/llm.js）：有MINIMAX_API_KEY时走MiniMax-M3（max_tokens必须1024，推理模型低于此值会只思考不回答；temperature 0.8）；否则走Workers AI；都不可用时对话接口返回503，前端用标注过的离线脚本化演示回复。
- 注意：绑定必须写进wrangler.toml，`wrangler pages deploy`会按toml重写项目绑定，后台单独改的绑定会被部署清掉。

## 本地运行

```bash
npm install
npx wrangler pages dev public
```

打开http://localhost:8788。本地开发时`[ai]`绑定由wrangler提供；要测MiniMax主路，在项目根目录建.dev.vars（已进.gitignore，绝不提交），写入一行`MINIMAX_API_KEY=你的密钥`。

## 部署

```bash
bash deploy.sh
```

默认项目名007-intelligence-lab。部署前需设置环境变量`CLOUDFLARE_API_TOKEN`（有Pages部署权限的API Token）与账号ID（已写进deploy.sh）。部署只发public/目录与functions/，不发其他文件。不要在未获用户授权时部署生产。

## 数据状态

- 站上数据目前仍标“示例数据·待TXT导入核验”，对话层用的functions/_lib/knowledge.js与characters.js仍是示例库加已核验修正，不是全库。
- 已核验的原著知识库在另一个仓库：https://github.com/nequex-eng/007-intelligence-lab-knowledge（14部逐部阅读，773条带出处事实，三层约束，本地提交170c3b1，GitHub提交126c57d7）。下一步（须ChatGPT验收通过并获用户明确授权后）：用该库带出处的核验事实替换本仓库functions/_lib/knowledge.js与characters.js中的示例内容，三层约束按character-core、knowledge-control、adaptation-boundaries落地。

## 版权边界

- 不提供整本小说下载，不大段公开展示原著文本，不做公开阅读网站。原著引用必要、简短并标注出处。原创内容与原著明确区分。站脚标注粉丝研究模拟、非官方。
- 原著全文只存在于用户本地source/，绝不进本仓库、绝不经API对外提供。

## 不在本仓库的内容

- source/：原著.pages与txt全文（版权原因永不进GitHub）。
- knowledge/与docs/：已核验的原著知识库与交接文档，在https://github.com/nequex-eng/007-intelligence-lab-knowledge。
- .wrangler/与node_modules/：构建产物与依赖，不提交。
- 任何密钥：deploy.sh里的Token已替换为占位符，部署时从环境变量读取。

## 中文行文铁律

中文与英文字母、数字、符号之间一律不加空格，适用于网站全部文案与全部文档，交付前自查。
