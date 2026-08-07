# 零背景用户人工走查记录

> 本记录不包含家长邮箱、密码、PIN、Cookie、token、录音、私有教材文件名或个人数据。真实家庭凭据验收在没有安全注入凭据时不执行，不以 synthetic 账号代替真实家庭验收。

## 走查环境

- 主控环境：iPad 横屏 WebKit Playwright 模拟环境。
- 服务：本地 Next.js、NestJS、PostgreSQL、MinIO。
- 数据：synthetic fixture，仅用于自动化验收。
- 记录日期：2026-08-07。

## 已完成的零背景路径

| 步骤 | 零背景用户操作                   | 预期结果                                                     | 结果 | 证据                                          |
| ---- | -------------------------------- | ------------------------------------------------------------ | ---- | --------------------------------------------- |
| 1    | 启动 Docker 基础设施和前后端     | 页面可访问，健康检查正常                                     | 通过 | `pnpm test:synthetic` 启动并等待服务          |
| 2    | 打开登录页                       | 只看到登录，不显示公众注册                                   | 通过 | `e2e/acceptance.spec.ts`                      |
| 3    | 使用 synthetic 家长账号登录      | 进入家长区                                                   | 通过 | `e2e/authenticated-synthetic.spec.ts`         |
| 4    | 创建或复用受管孩子身份           | 只需昵称、头像和六位 PIN                                     | 通过 | API learner 测试与 fixture                    |
| 5    | 输入 PIN 切换孩子模式            | 只能进入学习区                                               | 通过 | `e2e/authenticated-synthetic.spec.ts`         |
| 6    | 在孩子模式访问家长区/API         | 服务端拒绝越权                                               | 通过 | learner/mode API 测试                         |
| 7    | 输入家长密码返回家长区           | 正确密码恢复家长权限，错误密码不恢复                         | 通过 | mode/auth API 测试                            |
| 8    | 查看今日课程与课程地图           | 显示建议目标、原因、材料和五段流程                           | 通过 | learning API 与页面测试                       |
| 9    | 开始教学                         | 出现 prepare、review、introduce、practice、finish 五阶段     | 通过 | sync manifest 与 authenticated synthetic 测试 |
| 10   | 在课末选择观察结果并填写可选记录 | 保存独立/提示/未观察/拒绝及提示、兴趣、疲劳、不适、备注      | 通过 | API/Web 测试                                  |
| 11   | 让孩子提前结束                   | 无惩罚结束，不强制完成                                       | 通过 | lesson component 与 API 测试                  |
| 12   | 打开投屏画面                     | 只显示孩子需要看到的内容，不显示家长管理信息                 | 通过 | `e2e/acceptance.spec.ts` 与 cast 测试         |
| 13   | 准备家庭内容                     | 上传后先经过编目、预览、插槽绑定和明确发布                   | 通过 | authenticated synthetic family-content 流程   |
| 14   | 撤回家庭内容                     | 后续孩子页面和新离线包不再使用，历史引用保留                 | 通过 | publication withdrawal 测试                   |
| 15   | 准备离线包                       | 包含课程目标、五阶段和已发布 learner-eligible 内容           | 通过 | sync package API 测试                         |
| 16   | 浏览器离线专项                   | Service Worker 安装、失败激活回滚、清除包和 IndexedDB 包存储 | 通过 | `e2e/offline-browser.spec.ts`，3/3            |
| 17   | 完整 synthetic iPad 验收         | 身份、课程、内容、导出、离线基础行为全部通过                 | 通过 | `pnpm test:synthetic`，18/18                  |

## 尚未执行或仍需补强的步骤

- 未使用真实家庭凭据执行 `pnpm test:real`；当前仅验证了无凭据时安全拒绝。
- 真实 UI 离线五阶段与真实 IndexedDB 队列重放/409 冲突解决仍需补充浏览器证据。
- 当前 private phonics catalog 是本机元数据目录，不会自动发布商业教材；家长仍需在本机逐项预览、绑定和发布。
- 内置可再分发真人 phonics 基础音频尚未作为仓库资产交付；不能将用户购买的商业 WMA 直接写入公共课程或 Git。

## 结论

核心身份、课程、家庭内容和离线包基础闭环已通过自动化验收。发布前仍需完成真实浏览器离线同步证据、真实家庭凭据验收（仅本机且凭据存在时）以及可再分发基础音频资产的版权确认/交付决策。
