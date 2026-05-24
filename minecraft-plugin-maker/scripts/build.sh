#!/bin/bash
# Minecraft Plugin Build Script
# 作成者: MCPMOP_appi@作成者
# 対応バージョン: 1.8.8 - 1.21.11

set -e

# 設定読み込み
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

# デフォルト値
PLUGIN_NAME="${PLUGIN_NAME:-MyPlugin}"
PLUGIN_VERSION="${PLUGIN_VERSION:-1.0.0}"
BUILD_TOOL="${BUILD_TOOL:-maven}"

echo "=========================================="
echo "  Minecraft Plugin Builder"
echo "  作成者: MCPMOP_appi@作成者"
echo "  対応バージョン: 1.8.8 - 1.21.11"
echo "=========================================="
echo ""

cd "$PROJECT_ROOT"

case "$BUILD_TOOL" in
    maven|mvn)
        echo "[1/3] Cleaning..."
        mvn clean
        
        echo "[2/3] Compiling..."
        mvn compile
        
        echo "[3/3] Packaging..."
        mvn package
        
        echo ""
        echo "✓ ビルド完了!"
        echo "出力: target/${PLUGIN_NAME}-${PLUGIN_VERSION}.jar"
        ;;
    gradle|gradlew)
        echo "[1/2] Building with Gradle..."
        ./gradlew build
        
        echo ""
        echo "✓ ビルド完了!"
        echo "出力: build/libs/${PLUGIN_NAME}-${PLUGIN_VERSION}.jar"
        ;;
    *)
        echo "⚠ 未対応のビルドツール: $BUILD_TOOL"
        echo "maven または gradle を設定してください"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "  ビルド完了"
echo "  作成者: MCPMOP_appi@作成者"
echo "=========================================="
