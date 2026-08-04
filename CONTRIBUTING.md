# 贡献与开发约定

## 环境

- Node.js 24 或更高版本；
- pnpm 11，由 Corepack 调用；
- Docker Desktop；
- Windows 11 PowerShell 为首要开发环境。

复制 `.env.example` 为 `.env`，只在本机填写开发凭据。任何真实账号、孩子信息、家庭素材或生产密钥都不得提交。

## 常用命令

```powershell
corepack pnpm install
corepack pnpm infra:up
corepack pnpm dev
corepack pnpm check
corepack pnpm test:e2e
```

数据库结构修改必须通过 Prisma migration 保存，不能只修改本地数据库。家庭文件存入私有对象存储，不进入 Git。

## 代码边界

- React 页面和浏览器逻辑放在 `apps/web`；
- 服务端业务规则和授权放在 `apps/api`；
- API 输入输出结构放在 `packages/contracts`；
- 纯领域规则放在 `packages/domain`；
- 低刺激视觉基础放在 `packages/design-system`；
- `CONTEXT.md` 只记录领域词汇，不记录框架和部署细节。

## 变更流程

1. 从默认分支创建短期功能分支；
2. 优先写可验证的纵向切片，避免提前创建空模块；
3. 修改行为时同步测试和文档；
4. 提交前运行 `corepack pnpm check`；
5. 涉及 iPad、离线、音频或投屏时增加对应真机验收记录；
6. 不使用 `--no-verify` 绕过检查。

本仓库创建后尚未配置远程地址，也不自动推送或部署。
