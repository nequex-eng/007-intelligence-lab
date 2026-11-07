# 007 INTELLIGENCE LAB

007情报世界互动实验室。生产网站：https://007-intelligence-lab.pages.dev/

## 改造分支

当前四模块改造在 `feature/canon-four-labs` 独立分支进行。未经用户明确授权，不合并主分支、不部署生产。

## 四大模块

1. **INTELLIGENCE ARCHIVE / 情报档案馆**：14部原著、章节目录、人物、组织、地点、装备、事件、事实与推测，检索结果保留作品和章节出处。
2. **CHARACTER THEATRE / 人物剧场**：32位核心人物约束档案；选择小说时间点后，按人物knowledge_scope校验能否出场，注入身份、知识边界、行为边界和原著事实。
3. **MISSION CONTROL / 任务控制中心**：保留状态机与任务分支；《皇家赌场》任务简报从核验知识库读取事实、章节与故事时间线。玩家选择形成的分支明确标记为互动改编，不冒充原著事件。
4. **WORLD EXPLORER / 世界探索**：地图保留已有真实坐标点；完整展示核验知识库170处地点。没有可靠坐标的地点不伪造地图位置。文学研究、百家乐和实战体验作为辅助功能保留。

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

`npm run dev`会先执行`npm run sync:knowledge`，然后启动Wrangler Pages本地开发环境。默认打开：

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
```

测试会检查14部作品、773条事实、实体数量、32位人物约束、别名索引和关键人物时间线边界。

## API

- `GET /api/status`：服务状态、模型状态、知识库版本与数据规模。
- `GET /api/characters`：32位核心人物档案与时间线。
- `POST /api/chat`：人物对话。请求体支持`characterIds`、`novelId`、`messages`；指定小说后校验人物是否在该书时间点出场。
- `GET /api/dossier?q=关键词`：核验知识检索；支持kind与limit。
- `GET /api/canon?action=manifest|books|character|scene|resolve`：知识库元数据、作品目录、人物、场景校验和别名解析。
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

- `wrangler.toml`：Pages静态目录`public`，Workers AI绑定`AI`。
- `MINIMAX_API_KEY`：Cloudflare Pages Secret / 本地`.dev.vars`，只配置值，不提交密钥。
- 不使用D1、KV或R2；聊天历史仅保存在用户当前浏览器localStorage，消息仍会发送至模型服务生成回复。
