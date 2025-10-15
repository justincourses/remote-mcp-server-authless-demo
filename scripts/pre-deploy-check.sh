#!/bin/zsh

# 部署前检查清单

echo "📋 部署前检查清单"
echo "================"
echo ""

ERRORS=0
WARNINGS=0

# 1. 检查代码文件
echo "📁 1. 检查代码文件..."
if [ -f "src/index.ts" ]; then
    echo "  ✅ src/index.ts 存在"
else
    echo "  ❌ src/index.ts 缺失"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "src/db/schema.ts" ]; then
    echo "  ✅ src/db/schema.ts 存在"
else
    echo "  ❌ src/db/schema.ts 缺失"
    ERRORS=$((ERRORS + 1))
fi

# 2. 检查配置文件
echo ""
echo "⚙️  2. 检查配置文件..."
if [ -f "wrangler.jsonc" ]; then
    echo "  ✅ wrangler.jsonc 存在"

    if grep -q "account_id" wrangler.jsonc; then
        echo "  ✅ account_id 已配置"
    else
        echo "  ⚠️  account_id 未配置"
        WARNINGS=$((WARNINGS + 1))
    fi

    if grep -q "database_id" wrangler.jsonc; then
        echo "  ✅ database_id 已配置"
    else
        echo "  ⚠️  database_id 未配置"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "  ❌ wrangler.jsonc 缺失"
    ERRORS=$((ERRORS + 1))
fi

# 3. 检查数据库迁移
echo ""
echo "🗄️  3. 检查数据库迁移文件..."
MIGRATION_COUNT=$(ls drizzle/*.sql 2>/dev/null | wc -l)
echo "  ✅ 找到 $MIGRATION_COUNT 个迁移文件"

if [ $MIGRATION_COUNT -lt 3 ]; then
    echo "  ⚠️  预期至少3个迁移文件（包含 faq_index 表）"
    WARNINGS=$((WARNINGS + 1))
fi

# 4. 检查文档
echo ""
echo "📚 4. 检查文档文件..."
DOCS=(
    "documents/MCP_BEST_PRACTICES.md"
    "documents/AI_GUIDANCE_OPTIMIZATION.md"
    "documents/KNOWLEDGE_BASE_FEATURES.md"
    "documents/PROJECT_SUMMARY.md"
    "README.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "  ✅ $doc"
    else
        echo "  ⚠️  $doc 缺失"
        WARNINGS=$((WARNINGS + 1))
    fi
done

# 5. 检查测试脚本
echo ""
echo "🧪 5. 检查测试脚本..."
SCRIPTS=(
    "scripts/test-faq-index.sh"
    "scripts/test-ai-guidance.sh"
    "scripts/test-knowledge-base.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            echo "  ✅ $script (可执行)"
        else
            echo "  ⚠️  $script (不可执行)"
            chmod +x "$script"
            echo "     已自动设置执行权限"
        fi
    else
        echo "  ⚠️  $script 缺失"
        WARNINGS=$((WARNINGS + 1))
    fi
done

# 6. 检查关键代码特性
echo ""
echo "🔍 6. 检查关键代码特性..."

if grep -q "how_to_use" src/index.ts; then
    echo "  ✅ how_to_use 工具已实现"
else
    echo "  ❌ how_to_use 工具缺失"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "PRIMARY SOURCE" src/index.ts; then
    echo "  ✅ WordPress 标注为主要内容源"
else
    echo "  ⚠️  WordPress 未标注为主要来源"
    WARNINGS=$((WARNINGS + 1))
fi

if grep -q "justincourse.com" src/index.ts; then
    echo "  ✅ 包含官网链接"
else
    echo "  ❌ 缺少官网链接"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "RECOMMENDED NEXT STEPS\|Recommended Next Steps" src/index.ts; then
    echo "  ✅ 包含下一步建议"
else
    echo "  ⚠️  缺少下一步建议"
    WARNINGS=$((WARNINGS + 1))
fi

# 7. 检查 package.json
echo ""
echo "📦 7. 检查依赖..."
if [ -f "package.json" ]; then
    echo "  ✅ package.json 存在"

    if [ -d "node_modules" ]; then
        echo "  ✅ node_modules 已安装"
    else
        echo "  ⚠️  node_modules 未安装"
        echo "     运行: npm install"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "  ❌ package.json 缺失"
    ERRORS=$((ERRORS + 1))
fi

# 8. 检查版本号
echo ""
echo "🏷️  8. 检查版本信息..."
VERSION=$(grep -o '"version": *"[^"]*"' src/index.ts | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
if [ -n "$VERSION" ]; then
    echo "  ✅ MCP 服务器版本: $VERSION"
else
    echo "  ⚠️  未找到版本号"
    WARNINGS=$((WARNINGS + 1))
fi

# 总结
echo ""
echo "========================================"
echo "📊 检查总结"
echo "========================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ 所有检查通过！可以部署。"
    echo ""
    echo "🚀 部署命令："
    echo "  npm run deploy"
    echo ""
    echo "📋 部署后测试："
    echo "  ./scripts/test-ai-guidance.sh"
    echo "  npx @modelcontextprotocol/inspector"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  发现 $WARNINGS 个警告，但可以继续部署"
    echo ""
    echo "🚀 部署命令："
    echo "  npm run deploy"
    exit 0
else
    echo "❌ 发现 $ERRORS 个错误和 $WARNINGS 个警告"
    echo "   请修复错误后再部署"
    exit 1
fi
