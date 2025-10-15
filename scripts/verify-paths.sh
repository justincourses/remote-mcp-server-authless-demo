#!/bin/zsh

# 验证路径更新

echo "🔍 验证路径更新"
echo "==============="
echo ""

PROJECT_ROOT="/Users/mo/courses/remote-mcp-server-authless-demo"

# 检查目录结构
echo "📁 检查目录结构..."
echo ""

if [ -d "$PROJECT_ROOT/documents" ]; then
    echo "✅ documents/ 目录存在"
    echo "   包含文件数: $(ls $PROJECT_ROOT/documents | wc -l | xargs)"
else
    echo "❌ documents/ 目录不存在"
fi

if [ -d "$PROJECT_ROOT/scripts" ]; then
    echo "✅ scripts/ 目录存在"
    echo "   包含文件数: $(ls $PROJECT_ROOT/scripts | wc -l | xargs)"
else
    echo "❌ scripts/ 目录不存在"
fi

echo ""
echo "📄 检查文档文件..."
DOCS=("CHECKLIST.md" "FIX_NOTES.md" "KNOWLEDGE_BASE_FEATURES.md" "PROJECT_SUMMARY.md" "example-faq.md" "PATH_UPDATE.md")
for doc in "${DOCS[@]}"; do
    if [ -f "$PROJECT_ROOT/documents/$doc" ]; then
        echo "✅ documents/$doc"
    else
        echo "❌ documents/$doc 缺失"
    fi
done

echo ""
echo "🔧 检查脚本文件..."
SCRIPTS=("quick-start.sh" "test-knowledge-base.sh" "test-mcp.sh" "test-mcp-detailed.sh")
for script in "${SCRIPTS[@]}"; do
    if [ -f "$PROJECT_ROOT/scripts/$script" ]; then
        echo "✅ scripts/$script"
        if [ -x "$PROJECT_ROOT/scripts/$script" ]; then
            echo "   (可执行)"
        else
            echo "   (不可执行，需要 chmod +x)"
        fi
    else
        echo "❌ scripts/$script 缺失"
    fi
done

echo ""
echo "📖 检查 README.md 中的路径引用..."
if grep -q "documents/KNOWLEDGE_BASE_FEATURES.md" "$PROJECT_ROOT/README.md"; then
    echo "✅ README.md 中的文档路径已更新"
else
    echo "❌ README.md 中的文档路径需要更新"
fi

if grep -q "scripts/test-knowledge-base.sh" "$PROJECT_ROOT/README.md"; then
    echo "✅ README.md 中的脚本路径已更新"
else
    echo "❌ README.md 中的脚本路径需要更新"
fi

echo ""
echo "✅ 验证完成！"
echo ""
echo "💡 使用提示："
echo "  - 运行脚本: ./scripts/quick-start.sh"
echo "  - 查看文档: cat documents/KNOWLEDGE_BASE_FEATURES.md"
echo "  - 测试功能: ./scripts/test-knowledge-base.sh"
