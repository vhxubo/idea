---
name: git-bluff
description: 从 Git 提交记录生成格式化日报/周报/月报——自动去噪、按项目分组
url: https://github.com/vhxubo/git-bluff
tags: [工具, 生产力, Rust]
---

git-bluff 是一个命令行工具，把零散的 Git 提交记录转化为可汇报的结构化文本。

**核心功能：**
- 扫描单仓库或多仓库的提交记录
- 按日期范围、作者过滤
- 通过 YAML 配置文件将仓储映射到项目，自动分组
- 支持目录前缀、glob 模式和精确路径三种匹配方式
- 自动清洗提交信息：去除 `git-svn-id`、conventional commit 前缀（`feat:`、`fix:` 等）

**输出模式：无配置时按仓库路径列出编号条目；有配置时按项目→子仓库两层分组，每条提交一行编号。**

技术栈为 Rust，利用 `git2` 直接读 Git 对象库，不依赖 `git` CLI。