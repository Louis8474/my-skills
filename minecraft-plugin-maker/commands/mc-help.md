---
description: Minecraft Plugin Maker - ヘルプを表示
agent: general
model: gpt-5.2-codex
---

# Minecraft Plugin Maker - ヘルプ

## 利用可能なコマンド

| コマンド | 説明 |
|---------|------|
| `/mc-pl` | インタラクティブなプラグイン作成ウィザードを開始 |
| `/mc-spec` | 仕様書(SPEC.md)のみを作成 |
| `/mc-server` | Paperサーバーを起動してテスト |

## コマンド詳細

### /mc-pl [lang]

インタラクティブなウィザードで、Minecraftプラグインを最初から作成します。

```
使用方法: /mc-pl
          /mc-pl jp    # 日本語モード
          /mc-pl en    # 英語モード
```

**フロー:**
1. ヒアリング（質問への回答）
2. 仕様書(SPEC.md)生成
3. ユーザー確認（yes/no）
4. プロジェクト作成
5. サーバースクリプト作成

---

### /mc-spec

現在のディレクトリに仕様書(SPEC.md)を作成します。

```
使用方法: /mc-spec
```

**質問内容:**
- プラグイン名
- Descrição
- 対応バージョン
- 対応プラットフォーム
- 主要機能

---

### /mc-server

Paperサーバーを起動し、プラグインをテストします。

```
使用方法: /mc-server
```

**機能:**
- Mavenビルド確認
- サーバー起動
- RCON設定
- 接続情報表示

---

## プロジェクト構造

```
plugins/
├── SPEC.md           # 仕様書
├── pom.xml           # Maven設定
├── src/
│   └── main/
│       ├── java/    # Javaソース
│       └── resources/  # リソースファイル
├── scripts/          # ビルドスクリプト
│   ├── build.sh
│   ├── setup_server.sh
│   └── rcon.sh
└── run/             # サーバー運行目
```

## 対応プラットフォーム

- Paper
- Spigot
- Bukkit
- BungeeCord
- Velocity
- Sponge
- Fabric
- NeoForge

## 対応バージョン

- 1.8.8 ~ 1.21.x

## 外部ライブラリ

- Adventure Text Library
- ProtocolLib
- PlaceholderAPI
- Data Components API (1.20.5+)

## 追加リソース

このスキルの詳細については、SKILL.md ファイルを参照してください。
