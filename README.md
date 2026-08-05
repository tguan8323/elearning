# 家庭英语教学网站

面向一个中国家庭的家长陪伴式英语教学网页。网站帮助家长用稳定、低刺激、可调整的方式，支持孩子在 **2027 年 9 月**学校正式英语教学开始前，优先建立课堂参与、英语直接理解、功能性表达、基础合音和早期阅读参与能力。

## 当前阶段

项目已经进入**首个产品闭环阶段**：需求与课程架构文档保持为实现依据，单仓库中已建立 Next.js 前端、NestJS 后端、共享 TypeScript 包、Prisma 数据层和本地基础设施，并提供预建家长账号的安全初始化与登录入口。正式教学功能仍在后续工单中实现。第一版只服务当前家庭中的一个孩子，不按公共教学平台设计。

## 核心原则

- 新内容由家长陪伴教学，孩子独立活动只用于巩固已接触内容。
- 采用与 Jolly Phonics 思路兼容的原创完整自然拼读路线，统一使用美式示范音。
- 英语直接连接情境、动作、物体和意图；中文主要用于家长指导及必要支持。
- 默认每周提供 5 个约 15 分钟的教学机会，允许跳过或无惩罚提前结束。
- 从第二次教学起，每次先回顾上一课；系统提出建议，家长决定是否推进。
- 默认低刺激、无竞争输赢、无自动发音评分；至少约一半时间用于屏幕外互动。
- iPad Safari 横屏优先，支持投屏、离线教学和联网后同步。
- 服务器只保存必要的结构化学习记录；学习录音、照片、视频与诊断资料默认不上传。
- 合法可再分发素材与原创素材直接内置；其他素材由家长在私有内容管理模块中上传、预览并发布。
- 商业教材继续提供实体材料导航；家庭上传内容不进入公共素材库、AI 输入或模型训练。

## 技术栈与目录

- `apps/web`：Next.js 16、React、TypeScript 前端；
- `apps/api`：NestJS 模块化单体 REST API；
- `packages/contracts`：共享 API 契约；
- `packages/domain`：不依赖框架的领域类型与规则；
- `packages/design-system`：低刺激设计变量和基础组件；
- `prisma`：PostgreSQL 数据模型与迁移；
- `e2e`：Playwright iPad 横屏端到端测试；
- `docs`：需求、课程、架构和 ADR。

本地基础设施使用 Docker Compose 运行 PostgreSQL 和 MinIO。Redis 暂不加入，待异步文件处理确有需要时再引入。

## 本地开发

需要 Node.js 24+、Corepack/pnpm 11+、Git 和 Docker Desktop。

```powershell
Copy-Item .env.example .env
corepack pnpm install
corepack pnpm infra:up
corepack pnpm db:validate
corepack pnpm db:migrate
corepack pnpm --filter @family-english/api parent:init
corepack pnpm dev
```

初始化命令只接受交互式终端输入，密码至少 12 个字符且输入时不回显；不要把邮箱或密码写在命令参数、`.env`、源码或日志中。重复初始化不会创建第二个家长账号。项目没有公众注册入口。

家长首次登录后，在家长区为当前家庭建立唯一的受管孩子学习身份。系统只采集昵称、预设头像和 6 位数字 PIN，不采集真实姓名、生日、学校或诊断资料；PIN 使用 Argon2id 哈希保存，不会由 API 返回或在页面显示。PIN 只用于有效家长会话内的孩子模式切换，不能单独建立互联网登录会话。

前端默认访问 `http://localhost:3000`，API 健康检查为 `http://localhost:3001/api/health`，开发环境 Swagger 为 `http://localhost:3001/api/docs`。浏览器认证请求统一通过前端 `/api` 同源代理转发到后端，避免 `localhost` 与 `127.0.0.1` 混用造成 Cookie 丢失；服务端请求使用 `API_INTERNAL_URL`。

完整验证：

```powershell
corepack pnpm check
corepack pnpm exec playwright install webkit
corepack pnpm test:e2e
```

`.env`、本地数据库卷、上传内容和备份不得提交。Docker 本地卷不是正式备份。

## 文档

- [领域词汇表](CONTEXT.md)
- [产品需求](docs/PRODUCT_REQUIREMENTS.md)
- [课程架构](docs/CURRICULUM_ARCHITECTURE.md)
- [教学时段与进阶规则](docs/TEACHING_SESSION_AND_PROGRESSION.md)
- [产品与数据架构](docs/PRODUCT_AND_DATA_ARCHITECTURE.md)
- [内容与交互指南](docs/CONTENT_AND_INTERACTION_GUIDE.md)
- [ORT 分级参考资料](ort_level-chart.pdf)

## 产品边界

本项目是家庭自用的教学辅助工具，不提供医疗、诊断、康复或治疗服务。它不是 Jolly Learning、Oxford University Press 或 Oxford Reading Tree 的官方产品，也不会在系统内置课程中复制其受保护的故事、歌曲、动作、书页、插图、录音或练习内容。商业教材默认通过实体材料导航使用；家长可在私有内容管理模块中自行管理家庭合法持有的补充素材，并对其来源与使用范围负责。
