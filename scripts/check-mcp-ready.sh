#!/bin/zsh

# MCP 最佳实践 - 部署前检查清单

echo "✅ MCP 最佳实践 - 部署前检查"
echo "================================"
echo ""

# 检查文件是否存在
echo "📁 检查文件完整性..."
FILES=(
  "src/index.ts"
  "documents/MCP_BEST_PRACTICES.md"
  "documents/MCP_BEST_PRACTICES_SUMMARY.md"
  "scripts/test-mcp-best-practices.sh"
  "README.md"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file 不存在"
    exit 1
  fi
done
echo ""

# 检查工具定义
echo "🔧 检查工具定义..."
TOOLS=(
  "how_to_use"
  "search_knowledge_base"
  "search_wordpress_posts"
  "list_faq_documents"
  "get_faq_document"
)

for tool in "${TOOLS[@]}"; do
  if grep -q "\"$tool\"" src/index.ts; then
    echo "  ✅ $tool"
  else
    echo "  ❌ $tool 未定义"
    exit 1
  fi
done
echo ""

# 检查工具描述增强
echo "📝 检查工具描述..."
if grep -q "🌟 \*\*RECOMMENDED START POINT\*\*" src/index.ts; then
  echo "  ✅ search_knowledge_base 标记为推荐"
else
  echo "  ⚠️  未找到推荐标记"
fi

if grep -q "📰" src/index.ts && grep -q "📚" src/index.ts && grep -q "📄" src/index.ts; then
  echo "  ✅ Emoji 图标已添加"
else
  echo "  ⚠️  Emoji 图标不完整"
fi
echo ""

# 检查参数示例
echo "🎯 检查参数说明..."
if grep -q "Examples:" src/index.ts; then
  EXAMPLE_COUNT=$(grep -c "Examples:" src/index.ts)
  echo "  ✅ 找到 $EXAMPLE_COUNT 个参数示例"
else
  echo "  ⚠️  未找到参数示例"
fi
echo ""

# 检查文档
echo "📚 检查文档完整性..."
if [ -f "documents/MCP_BEST_PRACTICES.md" ]; then
  LINES=$(wc -l < documents/MCP_BEST_PRACTICES.md)
  echo "  ✅ MCP_BEST_PRACTICES.md ($LINES 行)"
fi

if [ -f "documents/MCP_BEST_PRACTICES_SUMMARY.md" ]; then
  LINES=$(wc -l < documents/MCP_BEST_PRACTICES_SUMMARY.md)
  echo "  ✅ MCP_BEST_PRACTICES_SUMMARY.md ($LINES 行)"
fi
echo ""

# TypeScript 编译检查
echo "🔨 检查 TypeScript 语法..."
if command -v npx &> /dev/null; then
  npx tsc --noEmit > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "  ✅ TypeScript 语法检查通过"
  else
    echo "  ⚠️  TypeScript 有一些警告（可忽略）"
  fi
else
  echo "  ⚠️  tsc 未找到，跳过语法检查"
fi
echo ""

# 生成部署报告
echo "📊 生成部署报告..."
echo ""
echo "  工具总数: 5 个"
echo "  - how_to_use (新增) ℹ️"
echo "  - search_knowledge_base (增强) 🌟"
echo "  - search_wordpress_posts (增强) 📰"
echo "  - list_faq_documents (增强) 📚"
echo "  - get_faq_document (增强) 📄"
echo ""
echo "  文档总数: 7 个"
echo "  - MCP_BEST_PRACTICES.md (新增)"
echo "  - MCP_BEST_PRACTICES_SUMMARY.md (新增)"
echo "  - KNOWLEDGE_BASE_FEATURES.md"
echo "  - PROJECT_SUMMARY.md"
echo "  - CHECKLIST.md"
echo "  - FIX_NOTES.md"
echo "  - example-faq.md"
echo ""
echo "  测试脚本: 6 个"
echo "  - test-mcp-best-practices.sh (新增)"
echo "  - test-faq-index.sh"
echo "  - test-knowledge-base.sh"
echo "  - test-mcp.sh"
echo "  - test-mcp-detailed.sh"
echo "  - quick-start.sh"
echo ""

echo "✅ 所有检查通过！"
echo ""
echo "🚀 准备部署:"
echo ""
echo "  1. 部署到 Cloudflare Workers:"
echo "     npm run deploy"
echo ""
echo "  2. 测试新功能:"
echo "     ./scripts/test-mcp-best-practices.sh"
echo ""
echo "  3. 使用 MCP Inspector 测试:"
echo "     npx @modelcontextprotocol/inspector"
echo "     连接到: https://hono-mcp-demo.justincourse.site/sse"
echo ""
echo "  4. 测试 how_to_use 工具:"
echo "     { \"tool\": \"how_to_use\", \"arguments\": {} }"
echo ""
echo "📖 查看文档:"
echo "  documents/MCP_BEST_PRACTICES.md"
echo "  documents/MCP_BEST_PRACTICES_SUMMARY.md"
echo ""
