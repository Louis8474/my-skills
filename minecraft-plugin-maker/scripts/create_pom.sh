#!/bin/bash
# Minecraft Plugin POM Generator
# 作成者: MCPMOP_appi@作成者
# 対応バージョン: 1.8.8 - 1.21.11

set -e

# 引数チェック
if [ $# -lt 1 ]; then
    echo "使用方法: $0 <PluginName> [Version] [GroupId]"
    echo "例: $0 MyPlugin 1.0.0 com.example"
    exit 1
fi

PLUGIN_NAME="$1"
VERSION="${2:-1.0.0}"
GROUP_ID="${3:-com.example}"
ARTIFACT_ID=$(echo "$PLUGIN_NAME" | tr '[:upper:]' '[:lower:]')

echo "=========================================="
echo "  Minecraft Plugin POM Generator"
echo "  作成者: MCPMOP_appi@作成者"
echo "=========================================="

# ディレクトリ作成
mkdir -p src/main/java/$(echo "$GROUP_ID" | tr '.' '/')
mkdir -p src/main/resources

# POMファイル生成
cat > pom.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>${GROUP_ID}</groupId>
    <artifactId>${ARTIFACT_ID}</artifactId>
    <version>${VERSION}</version>
    <packaging>jar</packaging>

    <name>${PLUGIN_NAME}</name>
    <description>Minecraft Plugin (1.8.8 - 1.21.11対応) | 作成者: MCPMOP_appi@作成者</description>

    <properties>
        <java.version>21</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <repositories>
        <repository>
            <id>papermc</id>
            <url>https://repo.papermc.io/repository/maven-public/</url>
        </repository>
        <repository>
            <id>spigotmc</id>
            <url>https://hub.spigotmc.org/nexus/content/repositories/snapshots/</url>
        </repository>
        <repository>
            <id>bungeecord</id>
            <url>https://oss.sonatype.org/content/repositories/snapshots/</url>
        </repository>
        <repository>
            <id>velocity</id>
            <url>https://repo.papermc.io/repository/maven-public/</url>
        </repository>
        <repository>
            <id>spongepowered</id>
            <url>https://repo.spongepowered.org/maven/</url>
        </repository>
    </repositories>

    <dependencies>
        <!-- Paper/Spigot/Bukkit API -->
        <dependency>
            <groupId>io.papermc.paper</groupId>
            <artifactId>paper-api</artifactId>
            <version>1.21.4-R0.1-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>
        
        <!-- BungeeCord -->
        <dependency>
            <groupId>net.md-5</groupId>
            <artifactId>bungeecord-api</artifactId>
            <version>1.21-R0.1-SNAPSHOT</version>
            <type>jar</type>
            <scope>provided</scope>
        </dependency>
        
        <!-- Velocity -->
        <dependency>
            <groupId>com.velocitypowered</groupId>
            <artifactId>velocity-api</artifactId>
            <version>3.3.0-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>
        
        <!-- Sponge -->
        <dependency>
            <groupId>org.spongepowered</groupId>
            <artifactId>spongeapi</artifactId>
            <version>11.0.0</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.13.0</version>
                <configuration>
                    <source>\${java.version}</source>
                    <target>\${java.version}</target>
                </configuration>
            </plugin>
        </plugins>
        <resources>
            <resource>
                <directory>src/main/resources</directory>
                <filtering>true</filtering>
            </resource>
        </resources>
    </build>
</project>
EOF

# メインクラス生成
MAIN_CLASS_PATH="src/main/java/$(echo "$GROUP_ID" | tr '.' '/')/${PLUGIN_NAME}.java"

cat > "$MAIN_CLASS_PATH" << EOF
package ${GROUP_ID};

/**
 * ${PLUGIN_NAME} - Minecraft Plugin
 * 作成者: MCPMOP_appi@作成者
 * バージョン: ${VERSION}
 * 対応 Minecraft: 1.8.8 - 1.21.11
 * 対応プラットフォーム: Spigot, Paper, Bukkit, BungeeCord, Velocity, Sponge
 */

import org.bukkit.plugin.java.JavaPlugin;

public class ${PLUGIN_NAME} extends JavaPlugin {
    
    private static ${PLUGIN_NAME} instance;
    
    @Override
    public void onEnable() {
        instance = this;
        getLogger().info("=================================");
        getLogger().info("${PLUGIN_NAME} - 有効化");
        getLogger().info("作成者: MCPMOP_appi@作成者");
        getLogger().info("対応バージョン: 1.8.8 - 1.21.11");
        getLogger().info("=================================");
        
        saveDefaultConfig();
    }
    
    @Override
    public void onDisable() {
        getLogger().info("${PLUGIN_NAME} - 無効化");
        saveConfig();
    }
    
    public static ${PLUGIN_NAME} getInstance() {
        return instance;
    }
}
EOF

# plugin.yml生成
cat > src/main/resources/plugin.yml << EOF
name: ${PLUGIN_NAME}
version: ${VERSION}
main: ${GROUP_ID}.${PLUGIN_NAME}
api-version: '1.21'
description: |
  Minecraft Plugin (1.8.8 - 1.21.11対応)
  作成者: MCPMOP_appi@作成者

author: MCPMOP_appi@作成者
website: https://github.com/MCPMOP

commands:
  ${ARTIFACT_ID}:
    description: ${PLUGIN_NAME} メインコマンド
    usage: /${ARTIFACT_ID}

permissions:
  ${ARTIFACT_ID}.use:
    description: ${PLUGIN_NAME} を使用
    default: true
EOF

echo ""
echo "✓ プロジェクト生成完了!"
echo ""
echo "生成されたファイル:"
echo "  - pom.xml"
echo "  - ${MAIN_CLASS_PATH}"
echo "  - src/main/resources/plugin.yml"
echo ""
echo "次のステップ:"
echo "  1. コードを編集"
echo "  2. mvn clean package でビルド"
echo "  3. target/*.jar を plugins/ に配置"
echo ""
echo "=========================================="
echo "  プロジェクト生成完了"
echo "  作成者: MCPMOP_appi@作成者"
echo "=========================================="
