# 📁 目录结构更新说明

## 变更概述

为了更好地组织项目文件，我们将文档和脚本分别移动到了专门的目录中。

## 目录结构

```
remote-mcp-server-authless-demo/
├── documents/          # 📚 所有文档文件
│   ├── CHECKLIST.md
│   ├── FIX_NOTES.md
│   ├── KNOWLEDGE_BASE_FEATURES.md
│   ├── PROJECT_SUMMARY.md
│   └── example-faq.md
├── scripts/            # 🔧 所有脚本文件
│   ├── quick-start.sh
│   ├── test-knowledge-base.sh
│   ├── test-mcp.sh
│   ├── test-mcp.js
│   └── test-mcp-detailed.sh
├── src/               # 💻 源代码
│   ├── index.ts
│   └── db/
│       └── schema.ts
├── drizzle/           # 🗄️ 数据库迁移
└── README.md          # 📖 项目主文档
```

## 更新的文件

### 1. README.md
✅ 更新所有文档链接：
- `KNOWLEDGE_BASE_FEATURES.md` → `documents/KNOWLEDGE_BASE_FEATURES.md`
- `PROJECT_SUMMARY.md` → `documents/PROJECT_SUMMARY.md`
- `FIX_NOTES.md` → `documents/FIX_NOTES.md`
- `example-faq.md` → `documents/example-faq.md`

✅ 更新脚本路径：
- `./quick-start.sh` → `./scripts/quick-start.sh`
- `./test-knowledge-base.sh` → `./scripts/test-knowledge-base.sh`

### 2. scripts/quick-start.sh
✅ 更新路径：
- `--file=example-faq.md` → `--file=documents/example-faq.md`
- 文档引用路径更新为 `documents/` 前缀
- 脚本引用路径更新为 `scripts/` 前缀

### 3. documents/PROJECT_SUMMARY.md
✅ 更新项目结构图
✅ 更新文档清单路径
✅ 更新示例命令中的文件路径

### 4. documents/CHECKLIST.md
✅ 更新所有文件路径引用

## 如何使用

### 运行脚本
```bash
# 快速开始
./scripts/quick-start.sh

# 测试知识库功能
./scripts/test-knowledge-base.sh

# 测试 MCP
./scripts/test-mcp.sh
```

### 查看文档
```bash
# 功能文档
cat documents/KNOWLEDGE_BASE_FEATURES.md

# 项目总结
cat documents/PROJECT_SUMMARY.md

# 检查清单
cat documents/CHECKLIST.md
```

### 上传 FAQ 示例
```bash
# 上传示例文档到 R2
wrangler r2 object put course-demo/justincourse-faq/cloudflare-mcp-deployment.md \
  --file=documents/example-faq.md
```

## 好处

1. **更清晰的组织** 📂 - 文档和脚本分类明确
2. **更易维护** 🔧 - 相关文件集中管理
3. **更好的导航** 🗺️ - 目录结构一目了然
4. **符合规范** ✨ - 遵循常见的项目结构最佳实践

## 注意事项

- 所有脚本仍然可以从项目根目录运行
- 文档链接在 README 中已全部更新
- 如果你有自己的脚本引用这些文件，请相应更新路径

---

**更新日期**: 2025-10-15
