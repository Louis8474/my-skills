---
description: Minecraft プラグインの仕様書(SPEC.md)のみを作成
agent: general
model: gpt-5.2-codex
---

# Minecraft プラグイン仕様書作成

現在のディレクトリに`spec/SPEC.md`を作成します。

## 質問

以下の内容を質問し、回答を記録します：

```
1. プラグイン名（PascalCase）:
2. Descrição（何をするプラグインか）:
3. 対応バージョン（例: 1.20.4, 1.21.1）:
4. 対応プラットフォーム（例: Paper, Spigot）:
5. 主要機能（カンマ区切り）:
6. 必要に応じて追加の質問:
```

## SPEC.mdテンプレート

以下の内容で`spec/SPEC.md`を作成：

```markdown
# [プラグイン名]

> 作成者: MCPMOP_appi@作成者
> 作成日: $CURRENT_DATE

## 概要

[Descrição]

## 対応環境

| 項目 | 内容 |
|------|------|
| Minecraft | [バージョン] |
| Platform | [プラットフォーム] |
| Java | 17+ |

## 機能

### コマンド
| コマンド | 説明 | 権限 |
|---------|------|------|
| /[cmd] | [説明] | [permission] |

### パーミッション
| 権限 | デフォルト | 説明 |
|------|----------|------|
| [perm] | [default] | [説明] |

### 設定
| キー | 型 | デフォルト | 説明 |
|------|---|----------|------|
| [key] | [type] | [default] | [説明] |

## ファイル構造

```
[プラグイン名]/
├── src/main/java/
│   └── com/example/
│       └── [PluginName]Plugin.java
├── src/main/resources/
│   ├── plugin.yml
│   └── config.yml
└── pom.xml
```

## TODO

- [ ] 基本構造作成
- [ ] メインクラス実装
- [ ] コマンド登録
- [ ] 設定ファイル作成
- [ ] テスト
```

## 出力

- `spec/SPEC.md` を作成
- 完了メッセージを表示
