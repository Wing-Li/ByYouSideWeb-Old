# 迁移执行计划

本目录用于保存 ByYouSide Node.js 迁移过程中的模块级执行计划。

在实现任何较大的业务模块或跨模块基础设施之前，都应先创建或更新对应计划。计划应记录旧代码阅读证据、新 API 设计、数据模型变化、实现任务、审阅记录、验证结果和完成状态。

当前计划文档：

状态口径：

- `已完成`：该计划范围内的实现、文档、验证和收口记录均已完成。
- `进行中`：正在执行，仍有本阶段范围内的任务未完成。
- `阻塞`：需要用户输入、外部环境或上线材料后才能继续。

| 计划 | 状态 |
| --- | --- |
| `phase-01-node-foundation.md` | 已完成 |
| `phase-02-prisma-schema.md` | 已完成 |
| `phase-03-auth-users.md` | 已完成 |
| `phase-04-friends.md` | 已完成 |
| `phase-05-devices-location.md` | 已完成 |
| `phase-06-memoirs-moments.md` | 已完成 |
| `phase-07-vip.md` | 已完成 |
| `phase-08-config-content-version.md` | 已完成 |
| `phase-09-external-services-production-config.md` | 已完成 |
| `phase-10-acceptance-cutover.md` | 已完成 |
| `phase-11-production-readiness.md` | 阻塞 |

计划模板位于：

```text
.codex/skills/byyouside-node-migration/references/module-plan-standard.md
```
