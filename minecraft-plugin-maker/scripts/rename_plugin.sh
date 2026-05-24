#!/bin/bash
# Plugin Rename Script
# 作成者: MCPMOP_appi@作成者
# 対応バージョン: 1.8.8 - 1.21.11

set -e

if [ $# -lt 1 ]; then
    echo "使用方法: $0 <NewPluginName>"
    echo "例: $0 SuperJumpBoots"
    exit 1
fi

NEW_NAME="$1"
OLD_NAME=$(grep -oP '(?<=<name>)[^<]+' pom.xml 2>/dev/null || echo "MyPlugin")
OLD_ARTIFACT=$(grep -oP '(?<=<artifactId>)[^<]+' pom.xml 2>/dev/null || echo "my-plugin")
OLD_MAIN_CLASS=$(grep -oP '(?<=<main>)[^<]+' pom.xml 2>/dev/null || echo "com.example.plugin.Main")
OLD_GROUP_ID=$(grep -oP '(?<=<groupId>)[^<]+' pom.xml | head -1 2>/dev/null || echo "com.example")

# PascalCaseに変換
NEW_ARTIFACT=$(echo "$NEW_NAME" | sed 's/\([A-Z]\)/-\1/g; s/^-//' | tr '[:upper:]' '[:lower:]')

# パッケージパスを生成
PACKAGE_PATH=$(echo "$OLD_GROUP_ID" | tr '.' '/')
MAIN_CLASS_DIR=$(dirname "src/main/java/${PACKAGE_PATH}/${OLD_NAME}.java")
NEW_MAIN_CLASS="${OLD_GROUP_ID}.${NEW_NAME}"

echo "=========================================="
echo "  Plugin Renamer"
echo "  作成者: MCPMOP_appi@作成者"
echo "=========================================="
echo ""
echo "旧名: ${OLD_NAME}"
echo "新名: ${NEW_NAME}"
echo ""

# pom.xml 更新
sed -i.bak \
    -e "s/<name>${OLD_NAME}<\/name>/<name>${NEW_NAME}<\/name>/g" \
    -e "s/<artifactId>${OLD_ARTIFACT}<\/artifactId>/<artifactId>${NEW_ARTIFACT}<\/artifactId>/g" \
    -e "s/<main>${OLD_MAIN_CLASS}<\/main>/<main>${NEW_MAIN_CLASS}<\/main>/g" \
    pom.xml
rm -f pom.xml.bak

# クラスファイルリネーム
OLD_JAVA="${MAIN_CLASS_DIR}/${OLD_NAME}.java"
NEW_JAVA="${MAIN_CLASS_DIR}/${NEW_NAME}.java"

if [ -f "$OLD_JAVA" ]; then
    # クラス名置換
    sed "s/class ${OLD_NAME}/class ${NEW_NAME}/g" "$OLD_JAVA" > "$NEW_JAVA"
    rm "$OLD_JAVA"
    echo "✓ クラスをリネーム: ${OLD_NAME}.java -> ${NEW_NAME}.java"
fi

# plugin.yml 更新
if [ -f "src/main/resources/plugin.yml" ]; then
    sed -i.bak \
        -e "s/name: ${OLD_NAME}/name: ${NEW_NAME}/g" \
        -e "s/main: ${OLD_MAIN_CLASS}/main: ${NEW_MAIN_CLASS}/g" \
        -e "s/description:.*/description: Minecraft Plugin (1.8.8 - 1.21.11対応) | 作成者: MCPMOP_appi@作成者/g" \
        src/main/resources/plugin.yml
    rm -f src/main/resources/plugin.yml.bak
fi

# コンフィグ更新
if [ -f "src/main/resources/config.yml" ]; then
    sed -i "s/plugin-name: ${OLD_NAME}/plugin-name: ${NEW_NAME}/g" src/main/resources/config.yml
fi

echo ""
echo "✓ リネーム完了!"
echo ""
echo "変更箇所:"
echo "  - pom.xml (name, artifactId, main)"
echo "  - ${OLD_NAME}.java -> ${NEW_NAME}.java"
echo "  - plugin.yml"
echo ""
echo "=========================================="
echo "  リネーム完了"
echo "  作成者: MCPMOP_appi@作成者"
echo "=========================================="
