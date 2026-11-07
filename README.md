# 007 INTELLIGENCE LAB

007情报世界互动实验室。生产网站：https://007-intelligence-lab.pages.dev/

## 改造分支

当前四模块改造在 `feature/canon-four-labs` 独立分支进行。未经用户明确授权，不合并主分支、不部署生产。

## 四大模块

1. **INTELLIGENCE ARCHIVE / 情报档案馆**：14部原著、章节目录、人物、组织、地点、装备、事件、事实与推测，检索结果保留作品和章节出处。
2. **CHARACTER THEATRE / 人物剧场**：32位核心人物约束档案；选择小说与章节时间点，按人物knowledge_scope和首次登场章节校验能否出场，并过滤所选章节之后的事实。章级模式不向模型提供全书背景/关系摘要；对话历史按人物、小说、章节保存在当前浏览器。
3. **MISSION CONTROL / 任务控制中心**：保留状态机与任务分支；《皇家赌场》任务简报从核验知识库读取事实、章节与故事时间线。玩家选择形成的分支明确标记为互动改编，不冒充原著事件。
4. **WORLD EXPLORER / 世界探索**：完整地点目录、国家/小说/年代筛选来自核验知识库170处地点；Leaflet + OpenStreetMap展示有独立核对城市坐标的地点，虚构地点和区域级地点不伪造点位。文学研究归入情报档案馆，百家乐与实战体验归入任务控制中心。

## 数据源与同步

唯一正典数据源：
https://github.com/nequex-eng/007-intelligence-lab-knowledge

同步脚本从知识库主分支读取：
- 14部小说JSON与manifest
- 人物、组织、地点、装备、事件、时间线索引
- 32位核心人物档案
- knowledge-control与adaptation-boundaries
- aliases、relationships、timeline解析索引

生成文件：`functions/_data/canon-data.js`。该文件由脚本生成并在`.gitignore`中排除，不应手工编辑或提交。每次本地开发和部署前同步，确保以核验知识库为准。

知识库当前记录：14部作品、773条事实（762 canon / 11 inference）、279人物、89组织、170地点、128装备、189事件。已知缺口以知识库manifest与VALIDATION-REPORT为准，不得擅自补写。

## 本地运行

要求Node.js 18或更高版本。

```bash
npm install
npm run dev
```

`npm run dev`会先执行`npm run sync:knowledge`，再由`dev-local.mjs`复制前端与Functions到临时目录，使用不含远程AI绑定的本地Wrangler配置启动Pages，不修改生产配置，也不需要Cloudflare API Token。若要真实模型回复，可在`.dev.vars`中配置MiniMax密钥；本地副本会读取该文件。默认打开：

http://localhost:8788

如需测试MiniMax主模型，在项目根目录创建`.dev.vars`：

```ini
MINIMAX_API_KEY=你的密钥
```

密钥只存在本地，不得提交Git。

## 验证

```bash
npm run sync:knowledge
npm run test:canon
npm run test:api
npm run test:ui
```

测试会检查14部作品、773条事实、实体数量、32位人物约束、别名索引、章级知识截止和人物首次登场边界；API集成测试会直接调用Pages Functions处理器，UI测试会检查四个主模块、唯一DOM ID、人物章节控件、正典地图数据源与前端脚本语法。

## API

- `GET /api/status`：服务状态、模型状态、知识库版本与数据规模。
- `GET /api/characters`：32位核心人物档案与时间线。
- `POST /api/chat`：人物对话。请求体支持`characterIds`、`novelId`、可选`chapterNo`、`messages`；校验人物在小说/章节时间点是否已登场，并过滤后续章节事实。
- `GET /api/dossier?q=关键词`：核验知识检索；支持kind与limit。
- `GET /api/canon?action=manifest|books|chapters|character|scene|resolve`：知识库元数据、作品目录、章节索引、人物、小说/章节场景校验和别名解析。
- `GET /api/mission?id=casino-royale`：返回正典任务资料、章节、事件与事实。
- `GET /api/world`：返回170处核验地点，不包含虚构或未核验坐标。
- `GET /api/canon?action=relationships&id=bond`：按规范人物ID查询关系。
- `GET /api/canon?action=timeline`：返回14部故事时间线。

## 部署（仅用户另行授权后）

```bash
npm run deploy
```

该命令会先同步核验知识库，再执行`bash deploy.sh`。需要设置`CLOUDFLARE_API_TOKEN`。当前工作阶段禁止自行部署生产；即使脚本可运行，也必须等待用户明确授权。

## Cloudflare绑定

- `wrangler.toml`：部署配置，Pages静态目录`public`，Workers AI绑定`AI`。
- `MINIMAX_API_KEY`：Cloudflare Pages Secret / 本地`.dev.vars`，只配置值，不提交密钥。
- 不使用D1、KV或R2；聊天历史仅保存在用户当前浏览器localStorage，消息仍会发送至模型服务生成回复。世界地图使用OpenStreetMap标准瓦片并显示版权归属；地图坐标仅登记城市级真实地点，不对虚构地点或区域范围做地理定位。
