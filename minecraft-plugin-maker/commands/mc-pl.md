---
description: Minecraft プラグインをインタラクティブに作成します
agent: general
model: gpt-5.2-codex
---

# Minecraft プラグイン作成ウィザード

言語設定: $ARGUMENTS (デフォルト: jp)

## ワークフロー

### ステップ1: プロジェクトの保存場所を確認
現在の作業ディレクトリを確認し、必要に応じて新しいディレクトリを作成します。

### ステップ2: ヒアリング（質問）

以下の内容を順番に質問し、ユーザーの回答を記録します：

```
質問リスト:
1. プラグイン名は？（半角英数字のみ、PascalCase）
   - 例: SuperJumpBoots, PlayerPoints, EconomyPlugin

2. プラグインのDescriçãoは？（何をするプラグインか）
   - 例: プレイヤーがジャンプ力を強化できる靴を追加する

3. 対応バージョンは？（カンマ区切りで複数指定可能）
   - 例: 1.20.4, 1.21.1

4. 対応プラットフォームは？（カンマ区切りで複数指定可能）
   - 例: Paper, Spigot
   - 利用可能なプラットフォーム: Paper, Spigot, Bukkit, BungeeCord, Velocity, Sponge, Fabric, NeoForge

5. メインワールドイベントが必要か？（ブロック干渉、プレイヤー操作など）
   - 例: はい/いいえ

6. コマンドを追加するか？
   - 例: はい/いいえ
   - はいの場合: コマンド名と説明を入力

7. 権限(パーミッション)を追加するか？
   - 例: はい/いいえ
   - はいの場合: 権限名とデフォルト値を入力

8. 設定ファイル(config.yml)が必要か？
   - 例: はい/いいえ

9. データベースが必要か？（SQLite/MySQL等）
   - 例: いいえ/SQLite/MySQL

10. 他に依存するプラグインは？（ProtocolLib, PlaceholderAPI等）
    - 例: なし/ProtocolLib/PlaceholderAPI
```

### ステップ3: 仕様書(SPEC.md)生成

ヒアリングの結果をもとに、`spec/SPEC.md`を作成します：

```markdown
# プラグイン名

## 基本情報
- バージョン: 1.0.0
- 対応プラットフォーム: Paper, Spigot
- 対応Minecraftバージョン: 1.20.4, 1.21.1
- 作成者: MCPMOP_appi@作成者

## 機能概要
[ヒアリングで得られたDescrição]

## コマンド
[追加するコマンドのリスト]

## パーミッション
[追加する権限のリスト]

## 設定ファイル
[config.ymlの設定項目]

## データベース
[必要な場合、データベース構造]

## 外部依存
[依存するプラグイン]
```

### ステップ4: ユーザー確認

```
仕様書を作成しました。内容を確認してください:

[spec/SPEC.mdの内容を表示]

この内容でよろしいですか？
- はい (y/yes): 作成を続行
- いいえ (n/no): 内容を修正

>> 
```

### ステップ5: プロジェクト作成

ユーザーが「はい」と答えた場合：

1. Mavenプロジェクトのpom.xmlを作成
2. ディレクトリ構造を作成
3. メインクラスを作成
4. コマンドクラスを作成（必要な場合）
5. リスナークラスを作成（必要な場合）
6. config.ymlを作成（必要な場合）
7. plugin.ymlを作成
8. .env.exampleを作成

### ステップ6: サーバースクリプト作成

Kamesuta/minecraft-plugin-maker のパターンを参考に、`scripts/`ディレクトリに以下を作成：

- `build.sh`: Mavenビルドとjarコピー
- `setup_server.sh`: Paperサーバーセットアップ
- `rcon.sh`: RCONコマンド送信（開発用）

### ステップ7: 完了確認

```
プロジェクト作成完了！

作成されたファイル:
- pom.xml
- src/main/java/{groupId}/[PluginName]Plugin.java
- src/main/resources/plugin.yml
- src/main/resources/config.yml
- scripts/build.sh
- scripts/setup_server.sh
- scripts/rcon.sh

次のステップ:
1. scripts/setup_server.sh を実行してサーバーをセットアップ
2. scripts/build.sh でプラグインをビルド
3. Minecraftからサーバーに接続してテスト

サーバーを今すぐ起動しますか？ (y/n)
```

### エラー処理

- ユーザーが「いいえ」と答えた場合: ステップ3に戻り、修正箇所を特定
- ディレクトリが既に存在する場合: 上書き確認
- ビルド失敗時: エラーログを表示し、再試行オプションを提供

## 出力ファイル

- `SPEC.md` - 仕様書
- `pom.xml` - Maven設定
- `src/main/java/` - Javaソースコード
- `src/main/resources/` - リソースファイル
- `scripts/` - ビルド&実行スクリプト
