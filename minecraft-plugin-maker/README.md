# TotalSync MC-Framework

> OpenCode AI で Minecraft プラグインを超高速開発

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Platform: Spigot/Paper](https://img.shields.io/badge/Platform-Spigot%2FPaper-brightgreen.svg)](https://www.spigotmc.org/)
[![Version: 1.8.8-1.21.x](https://img.shields.io/badge/Version-1.8.8--1.21.x-orange.svg)]()

## 🎯 概要

TotalSync MC-Framework は、OpenCode AI 用の Minecraft プラグイン開発スキルです。

AI に欲しいプラグイン機能を伝えるだけで、以下のことができます：

- ✅ 完全なプロジェクト構造を自動生成
- ✅ 複数プラットフォーム対応（Spigot, Paper, BungeeCord, Velocity...）
- ✅ バージョン自動判別（1.8.8 ~ 1.21.x）
- ✅ NMS リフレクション対応
- ✅ Data Components API（1.20.5+）対応
- ✅ 国際化（i18n）対応

## 🚀 クイックスタート

### 1. OpenCode をインストール

[OpenCode](https://opencode.ai/) をインストール

### 2. スキルを使用

```
"Minecraft プラグインを作成して"
```

またはコマンドを入力：

```
/mc-pl
```

### 3. AI が質問

以下質問に答えるだけ：

```
1. プラグイン名（PascalCase）
2. Descrição（何をするか）
3. 対応バージョン
4. 対応プラットフォーム
5. 必要機能
```

### 4. 完成！

```
plugins/
├── pom.xml
├── src/main/java/
│   └── com/example/
│       └── [PluginName]Plugin.java
├── src/main/resources/
│   ├── plugin.yml
│   └── config.yml
├── scripts/
│   ├── build.sh
│   └── setup_server.sh
└── SPEC.md
```

## 📦 対応プラットフォーム

| プラットフォーム | サポート |
|---------------|---------|
| Paper | ✅ |
| Spigot | ✅ |
| Bukkit | ✅ |
| BungeeCord | ✅ |
| Velocity | ✅ |
| Sponge | ✅ |
| Fabric | ✅ |
| NeoForge | ✅ |

## 🔧 対応バージョン

- **1.8.8** ~ **1.21.x** 完全対応

### 特別な対応

| バージョン | 対応内容 |
|-----------|---------|
| 1.21.x+ | v1_XX_RX パッケージ廃止、Mojang Mappings 直接参照 |
| 1.20.5+ | Data Components API 完全対応 |
| 1.17+ | パッケージ構造変更対応 |
| 1.13+ | 新しいアイテムID体系対応 |

## 🛠️ 組み込みユーティリティ

| ユーティリティ | 説明 |
|--------------|------|
| `VersionUtils` | バージョン判定（is1205Plus, is121Plus等） |
| `ItemProcessor` | Builderパターンでアイテムを操作 |
| `DataComponentUtils` | 1.20.5+ Data Components API 対応 |
| `LangManager` | 国際化（i18n）システム |
| `NMSPacketSender` | NMS直接パケット送信 |
| `FakeEntityManager` | 偽エンティティ（NPC）管理 |
| `PlaceholderExpansion` | PlaceholderAPI 展開サポート |
| `FabricNeoForgeUtils` | Mod環境判定 |

## 📁 プロジェクト構造

```
src/main/java/{groupId}/
├── common/                    # 全プラットフォーム共通コード
│   ├── VersionUtils.java
│   ├── ItemProcessor.java
│   ├── DataComponentUtils.java
│   └── LangManager.java
│
├── Server/                   # サーバー系（ブロック干渉OK）
│   ├── Spigot/
│   └── Paper/
│
├── Proxy/                    # プロキシ系（ブロック干渉NG）
│   ├── BungeeCord/
│   └── Velocity/
│
└── Mod/                     # Mod系
    ├── Fabric/
    └── NeoForge/
```

## 📚 参考にしたプロジェクト

- [minecraft-plugin-maker](https://github.com/appipinopi/minecraft-plugin-maker)

## 📖 ドキュメント

詳細なドキュメントは [Wiki](https://github.com/TotalSync/MC-Framework/wiki) をご覧ください。

## 🤝 コントリビュート

1. Fork
2. ブランチ作成 (`git checkout -b feature/amazing-feature`)
3. コミット (`git commit -m 'Add amazing feature'`)
4. プッシュ (`git push origin feature/amazing-feature`)
5. Pull Request

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) をご覧ください。

## 👤 作成者

**appipinopi** - [GitHub](https://github.com/appipinopi)

---

*Made with ❤️ for the Minecraft developer community*
