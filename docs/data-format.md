# 正式条目格式

`data/accounts.json` 的 `accounts` 数组每项字段如下。当前数组为空；不要把占位内容作为真实账号提交。

| 字段 | 内容 |
| --- | --- |
| uid | 已核实的 24 位小写十六进制固定 UID |
| profile_url | `https://www.xiaohongshu.com/user/profile/` 后接对应 UID，不含查询参数 |
| name | 当前昵称，辅助识别 |
| public_account_number | 可选，小红书号，辅助识别 |
| category | 具体的问题类型 |
| reason | 可核查的事实观察及局限 |
| counterevidence | 检查过的反证和替代解释 |
| evidence | 至少两个不同笔记对象，各含 url、observed_at、observation |
| reviewer | 人工复核者的公开 GitHub 用户名 |
| reviewed_at | 复核日期，YYYY-MM-DD |
| review_issue | 当前仓库中对应的候选 Issue 链接 |
| status | 正式执行名单只能为 reviewed |

证据 `url` 只接受干净的官方笔记链接，`observed_at` 为观察日期，`observation` 为该条的具体问题说明。同一笔记的两种 URL 不算两条证据。

更新名单后，同步 `updated_at` 和 `data/user-ids.txt`，运行 `node scripts/check.mjs`。

`removed.json` 的每个移出记录至少包含 uid、removed_at、reason，可另加关联 Issue。不把私人用户的执行日志保存在仓库。
