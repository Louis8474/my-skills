---
name: minecraft-plugin-maker
description: |
  Minecraft プラグインを自動生成します。

  対応ユーティリティ: ItemProcessor, DataComponentUtils, VersionUtils, FabricNeoForgeUtils, LangManager, NMSPacketSender, FakeEntityManager, PlaceholderExpansion

  対応プラットフォーム: Spigot, Paper, Bukkit, BungeeCord, Velocity, Sponge, Fabric, NeoForge

  Triggers when user mentions:
  - "Minecraft プラグインを作成して"
  - "マイクラ plugin 作成"
  - "/mc-pl"
  - "/mc-spec"
  - "/mc-server"
---

## Minecraft Plugin Maker

Minecraft プラグインを自動生成します。

### 利用可能なコマンド

| コマンド | 説明 |
|---------|------|
| `/mc-pl` | インタラクティブなプラグイン作成ウィザード |
| `/mc-spec` | 仕様書(SPEC.md)を作成 |
| `/mc-server` | Paperサーバーを起動してテスト |

### 対応プラットフォーム

- Paper, Spigot, Bukkit, BungeeCord, Velocity, Sponge, Fabric, NeoForge

### 対応ユーティリティ

- ItemProcessor: Builderパターンでアイテムを操作
- DataComponentUtils: 1.20.5+ Data Components API 対応
- VersionUtils: バージョン判定
- FabricNeoForgeUtils: Mod環境判定
- LangManager: 国際化（i18n）システム
- NMSPacketSender: NMS直接パケット送信
- FakeEntityManager: 偽エンティティ（NPC）管理
- PlaceholderExpansion: PlaceholderAPI展開サポート

> 作成者は常に MCPMOP_appi@作成者 としてコードに含めます。
---

## クイック usage ( Already Configured)

このスキルは `.env.example` の設定を読み取り、利用可能な構成から動作を推断します。

### 新しいプラグインプロジェクトを作成

```bash
mkdir -p .opencode/skills/minecraft-plugin-maker/scripts
```

### 共通プロジェクト構造を生成

```bash
# Maven pom.xml 生成スクリプト
scripts/create_pom.sh MyPlugin 1.0.0
```

## プロジェクト構造（AutoUpdatePlugins風・全プラットフォーム対応）

```
src/main/java/{groupId}/
├── common/                      # 全プラットフォーム共通コード
│   ├── ConfigManager.java       # 設定管理
│   ├── PluginCommand.java       # 共通コマンド基底
│   ├── PluginListener.java      # 共通イベント基底
│   ├── utils/                   # 共通ユーティリティ
│   │   └── CommonUtils.java
│   └── managers/                # 共通マネージャー
│       └── PermissionManager.java
│
├── Server/                      # サーバー系（ブロック干渉OK）
│   ├── Spigot/                  # Spigot 専用（全バージョン対応）
│   │   ├── SpigotPlugin.java    # メインクラス
│   │   ├── SpigotCommand.java   # コマンド
│   │   ├── SpigotListener.java  # イベントリスナー
│   │   └── handlers/            # NMSバージョン別処理
│   │       ├── v1_8_R1/        # 1.8.x対応
│   │       │   └── Handler.java
│   │       ├── v1_12_R1/        # 1.12.x対応
│   │       │   └── Handler.java
│   │       ├── v1_16_R1/        # 1.16.x対応
│   │       │   └── Handler.java
│   │       ├── v1_17_R1/        # 1.17.x対応
│   │       │   └── Handler.java
│   │       ├── v1_18_R1/        # 1.18.x対応
│   │       │   └── Handler.java
│   │       ├── v1_19_R1/        # 1.19.x対応
│   │       │   └── Handler.java
│   │       ├── v1_20_R1/        # 1.20.x対応
│   │       │   └── Handler.java
│   │       ├── v1_20_R2/        # 1.20.2-4対応
│   │       │   └── Handler.java
│   │       ├── v1_20_R3/        # 1.20.5対応
│   │       │   └── Handler.java
│   │       ├── v1_21_R1/        # 1.21.x対応
│   │       │   └── Handler.java
│   │       ├── v1_21_R2/        # 1.21.2-3対応
│   │       │   └── Handler.java
│   │       └── v1_21_R3/        # 1.21.4+対応
│   │           └── Handler.java
│   └── Paper/                   # Paper 専用（全バージョン対応）
│       ├── PaperPlugin.java
│       ├── PaperCommand.java
│       ├── PaperListener.java
│       └── handlers/            # NMSバージョン別処理（Spigot共通）
│           └── (Spigotと同じバージョン構成)
│
└── Proxy/                       # プロキシ系（ブロック干渉NG）
    ├── BungeeCord/              # BungeeCord 専用
    │   ├── BungeePlugin.java
    │   ├── BungeeCommand.java
    │   └── BungeeListener.java
    └── Velocity/                # Velocity 専用
        ├── VelocityPlugin.java
        ├── VelocityCommand.java
        └── VelocityListener.java
│
└── Mod/                         # Mod系（GeyserMC風・Fabric/NeoForge）
    ├── Fabric/                  # Fabric 専用
    │   ├── FabricMod.java       # @Modアノテーション
    │   ├── FabricCommand.java
    │   └── FabricEventListener.java
    └── NeoForge/                # NeoForge 専用
        ├── NeoForgeMod.java     # @Modアノテーション
        ├── NeoForgeCommand.java
        └── NeoForgeEventListener.java
```

### プラットフォーム別クラス構成

| プラットフォーム | パッケージ | メインクラス | 備考 |
|---------------|----------|------------|------|
| **common** | `{groupId}.common` | 共通Util/Manager | 全平台的共通処理 |
| **Server.Spigot** | `{groupId}.Server.Spigot` | `SpigotPlugin.java` | 1.8.8 ~ 1.21.11対応 |
| **Server.Paper** | `{groupId}.Server.Paper` | `PaperPlugin.java` | 1.8.8 ~ 1.21.11対応 |
| **Proxy.BungeeCord** | `{groupId}.Proxy.BungeeCord` | `BungeePlugin.java` | プロキシ向け |
| **Proxy.Velocity** | `{groupId}.Proxy.Velocity` | `VelocityPlugin.java` | プロキシ向け |
| **Mod.Fabric** | `{groupId}.Mod.Fabric` | `FabricMod.java` | Fabric対応 |
| **Mod.NeoForge** | `{groupId}.Mod.NeoForge` | `NeoForgeMod.java` | NeoForge対応 |

> **ポイント**: Spigot/PaperはNMS操作が必要な場合、handlers/配下にバージョン別のHandlerを配置して自動切り替え（ViaVersion/LuckPerms風）
> **GeyserMC風**: Fabric/NeoForge対応でModプラットフォームもサポート（GeyserMCの実装を参考）

### リフレクションでのバージョン取得

特定のバージョンに依存しないプラグインを作る場合、動的にパッケージ名を取得します。

```java
/**
 * 作成者: MCPMOP_appi@作成者
 * サーバーバージョン取得Util
 */
public class VersionUtil {
    
    /**
     * NMSバージョン文字列を取得
     * 例: "v1_21_R3"
     */
    public static String getNMSVersion() {
        String packageName = Bukkit.getServer().getClass().getPackage().getName();
        return packageName.split("\\.")[3];
        // 例: "org.bukkit.craftbukkit.v1_21_R3" → "v1_21_R3"
    }
    
    /**
     * Minecraftバージョンを取得
     * 例: "1.21.4"
     */
    public static String getMinecraftVersion() {
        return Bukkit.getVersion();
        // 例: "Paper 1.21.4-R0.1-SNAPSHOT" → "1.21.4"
    }
    
    /**
     * NMSクラスを動的に取得
     * 例: getNMSClass("EntityPlayer")
     */
    public static Class<?> getNMSClass(String className) {
        try {
            return Class.forName("net.minecraft.server." + getNMSVersion() + "." + className);
        } catch (ClassNotFoundException e) {
            return null;
        }
    }
    
    /**
     * CraftBukkitクラスを動的に取得
     * 例: getCraftClass("entity.CraftPlayer")
     */
    public static Class<?> getCraftClass(String className) {
        try {
            return Class.forName("org.bukkit.craftbukkit." + getNMSVersion() + "." + className);
        } catch (ClassNotFoundException e) {
            return null;
        }
    }
}
```

### プラットフォーム別バージョン判定ユーティリティ

#### Spigot/Paper/Bukkit用

```java
// common/VersionUtils.java
package com.example.plugin.common;

import org.bukkit.Bukkit;

/**
 * 作成者: MCPMOP_appi@作成者
 * Spigot/Paper/Bukkit バージョン判定ユーティリティ
 */
public class VersionUtils {
    private static final String VERSION_STRING = Bukkit.getBukkitVersion(); // 例: "1.21.1-R0.1-SNAPSHOT"
    private static final int MAJOR_VERSION;

    static {
        // "1.21.1" のような文字列から中央の数字 (21) を取り出す
        String version = VERSION_STRING.split("-")[0]; // "1.21.1"
        String[] parts = version.split("\\.");
        // parts[0] は常に "1" なので、parts[1] を見る
        MAJOR_VERSION = Integer.parseInt(parts[1]);
    }

    /**
     * 1.13以上（新アイテムID体系）か判定
     */
    public static boolean isModern() {
        return MAJOR_VERSION >= 13;
    }

    /**
     * 1.8.8かどうか判定（レガシーバージョン）
     */
    public static boolean isLegacy() {
        return MAJOR_VERSION <= 8;
    }

    /**
     * 1.17以上（スライムチャンク計算式変更対応）
     */
    public static boolean is117Plus() {
        return MAJOR_VERSION >= 17;
    }

    /**
     * 1.19.4以上（ChatComponents形式変更対応）
     */
    public static boolean is1194Plus() {
        return MAJOR_VERSION >= 20 || (MAJOR_VERSION == 19 && is119_4());
    }

    private static boolean is119_4() {
        String[] parts = VERSION_STRING.split("-")[0].split("\\.");
        if (parts.length >= 3) {
            return Integer.parseInt(parts[2]) >= 4;
        }
        return false;
    }

    /**
     * 1.20.5以上（Data Components API導入対応）
     * ⚠️ 重要: 1.20.5からアイテムメタデータが Data Components に刷新
     */
    public static boolean is1205Plus() {
        if (MAJOR_VERSION > 20) return true;
        if (MAJOR_VERSION < 20) return false;
        // MAJOR_VERSION == 20 の場合、minorバージョンを確認
        String[] parts = VERSION_STRING.split("-")[0].split("\\.");
        if (parts.length >= 3) {
            return Integer.parseInt(parts[2]) >= 5;
        }
        return false;
    }

    /**
     * 1.21.x以降（v1_XX_RX パッケージ完全廃止）
     */
    public static boolean is121Plus() {
        return MAJOR_VERSION >= 21;
    }

    /**
     * マイナーバージョン取得（1.21.4 → 4）
     */
    public static int getMinorVersion() {
        String[] parts = VERSION_STRING.split("-")[0].split("\\.");
        if (parts.length >= 3) {
            try {
                return Integer.parseInt(parts[2]);
            } catch (NumberFormatException e) {
                return 0;
            }
        }
        return 0;
    }

    /**
     * 完全なバージョン文字列取得（1.21.4-R0.1-SNAPSHOT）
     */
    public static String getFullVersion() {
        return VERSION_STRING;
    }

    public static int getMajorVersion() {
        return MAJOR_VERSION;
    }
}
```

### アイテム操作ユーティリティ（Data Components対応）

```java
// common/ItemUtils.java
package com.example.plugin.common;

import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.ChatColor;

import java.util.Arrays;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * アイテム操作ユーティリティ
 * 1.20.5+: Data Components API
 * 1.13-1.20.4: ItemMeta/NBTTagCompound
 * 1.8.x: Legacy Material ID
 */
public class ItemUtils {

    /**
     * カスタム名を設定したアイテムを作成
     */
    public static ItemStack createNamedItem(Material material, String displayName, String... lore) {
        ItemStack item = new ItemStack(material);
        
        if (VersionUtils.is1205Plus()) {
            // 1.20.5+: Data Components API を使用
            return createItemWithComponents(item, displayName, lore);
        } else {
            // 1.13-1.20.4: ItemMeta を使用
            return createItemWithMeta(item, displayName, lore);
        }
    }

    /**
     * 1.20.5+: Data Components API
     */
    private static ItemStack createItemWithComponents(ItemStack item, String displayName, String[] lore) {
        // Adventure ライブラリを使用して Component を生成
        // net.kyori.adventure.text.Component
        var component = net.kyori.adventure.text.Component.text(displayName);
        
        // Paper 1.21+ の場合
        if (VersionUtils.is121Plus()) {
            // ItemStack.editMeta() を使用
            item.editMeta(meta -> {
                meta.displayName(component);
                if (lore.length > 0) {
                    var loreComponent = Arrays.stream(lore)
                        .map(line -> net.kyori.adventure.text.Component.text(line))
                        .toList();
                    meta.lore(loreComponent);
                }
            });
        } else {
            // Paper 1.20.5-1.20.x の場合
            item.editMeta(meta -> {
                meta.setDisplayName(displayName);
                if (lore.length > 0) {
                    meta.setLore(Arrays.asList(lore));
                }
            });
        }
        return item;
    }

    /**
     * 1.13-1.20.4: ItemMeta API
     */
    private static ItemStack createItemWithMeta(ItemStack item, String displayName, String[] lore) {
        ItemMeta meta = item.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(ChatColor.translateAlternateColorCodes('&', displayName));
            if (lore.length > 0) {
                meta.setLore(Arrays.asList(lore));
            }
            item.setItemMeta(meta);
        }
        return item;
    }

    /**
     * アイテムに説明文を追加
     */
    public static ItemStack addLore(ItemStack item, String... lore) {
        if (item == null || item.getType() == Material.AIR) {
            return item;
        }
        
        if (VersionUtils.is1205Plus()) {
            // 1.20.5+: Data Components API
            item.editMeta(meta -> {
                var existingLore = meta.hasLore() ? meta.lore() : java.util.Collections.emptyList();
                var newLore = new java.util.ArrayList<>(existingLore);
                for (String line : lore) {
                    newLore.add(net.kyori.adventure.text.Component.text(line));
                }
                meta.lore(newLore);
            });
        } else {
            // 1.13-1.20.4: ItemMeta API
            item.editMeta(meta -> {
                java.util.List<String> existing = meta.getLore();
                if (existing == null) existing = new java.util.ArrayList<>();
                existing.addAll(Arrays.asList(lore));
                meta.setLore(existing);
            });
        }
        return item;
    }
}
```

### ItemHandler インターフェース（1.20.5+ Data Components対応）

1.20.5でNBTが完全に刷新され、Data Components APIが導入されました。アイテムを操作するたびにバージョン判定を書くのは面倒なため、ItemHandlerインターフェースで抽象化します。

```java
// common/item/ItemHandler.java
package com.example.plugin.common.item;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * アイテム操作ハンドラー基底インターフェース
 * バージョンごとに実装を切り替えて使用
 */
public interface ItemHandler {
    
    /**
     * カスタム名を設定
     */
    ItemStack setDisplayName(ItemStack item, String name);
    
    /**
     * Loreを設定
     */
    ItemStack setLore(ItemStack item, String... lore);
    
    /**
     * Loreに行を追加
     */
    ItemStack addLore(ItemStack item, String... lore);
    
    /**
     * enchantmentを追加（非enchantableなアイテム考慮）
     */
    ItemStack addEnchant(ItemStack item, String enchantment, int level);
    
    /**
     * カスタムモデルデータを設定
     */
    ItemStack setCustomModelData(ItemStack item, int data);
    
    /**
     * 特定のフラグを設定（Unbreakable等）
     */
    ItemStack setFlags(ItemStack item, Set<ItemFlag> flags);
    
    /**
     * アイテムのデータをすべてクリア
     */
    ItemStack clearItem(ItemStack item);
}
```

#### ModernItemHandler (1.20.5+ Data Components)

```java
// common/item/modern/ModernItemHandler.java
package com.example.plugin.common.item.modern;

import com.example.plugin.common.item.ItemHandler;
import net.kyori.adventure.text.Component;
import org.bukkit.Material;
import org.bukkit.inventory.ItemFlag;
import org.bukkit.inventory.ItemStack;

import java.util.Set;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * 1.20.5+ 向けアイテムハンドラー
 * Data Components API を使用
 */
public class ModernItemHandler implements ItemHandler {
    
    @Override
    public ItemStack setDisplayName(ItemStack item, String name) {
        if (item == null || item.getType() == Material.AIR) return item;
        item.editMeta(meta -> meta.displayName(Component.text(name)));
        return item;
    }
    
    @Override
    public ItemStack setLore(ItemStack item, String... lore) {
        if (item == null || item.getType() == Material.AIR) return item;
        item.editMeta(meta -> {
            meta.lore(java.util.Arrays.stream(lore).map(Component::text).toList());
        });
        return item;
    }
    
    @Override
    public ItemStack addLore(ItemStack item, String... lore) {
        if (item == null || item.getType() == Material.AIR) return item;
        item.editMeta(meta -> {
            var existingLore = meta.hasLore() ? meta.lore() : java.util.Collections.emptyList();
            var newLore = new java.util.ArrayList<>(existingLore);
            for (String line : lore) newLore.add(Component.text(line));
            meta.lore(newLore);
        });
        return item;
    }
    
    @Override
    public ItemStack addEnchant(ItemStack item, String enchantment, int level) {
        if (item == null || item.getType() == Material.AIR) return item;
        item.editMeta(meta -> {
            var ench = org.bukkit.enchantments.Enchantment.getByName(enchantment.toUpperCase());
            if (ench != null) meta.addEnchant(ench, level, true);
        });
        return item;
    }
    
    @Override
    public ItemStack setCustomModelData(ItemStack item, int data) {
        if (item == null || item.getType() == Material.AIR) return item;
        item.editMeta(meta -> meta.setCustomModelData(data));
        return item;
    }
    
    @Override
    public ItemStack setFlags(ItemStack item, Set<ItemFlag> flags) {
        if (item == null || item.getType() == Material.AIR) return item;
        item.editMeta(meta -> meta.addItemFlags(flags.toArray(new ItemFlag[0])));
        return item;
    }
    
    @Override
    public ItemStack clearItem(ItemStack item) {
        if (item == null || item.getType() == Material.AIR) return item;
        item.editMeta(meta -> {
            meta.setDisplayName(null);
            meta.setLore(null);
            meta.setCustomModelData(null);
            meta.setEnchantments(new java.util.HashMap<>());
            meta.setUnbreakable(false);
            meta.removeItemFlags(ItemFlag.values());
        });
        return item;
    }
}
```

#### LegacyItemHandler (1.13-1.20.4 ItemMeta)

```java
// common/item/legacy/LegacyItemHandler.java
package com.example.plugin.common.item.legacy;

import com.example.plugin.common.item.ItemHandler;
import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.enchantments.Enchantment;
import org.bukkit.inventory.ItemFlag;
import org.bukkit.inventory.ItemStack;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Set;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * 1.13-1.20.4 向けアイテムハンドラー
 * ItemMeta API を使用
 */
public class LegacyItemHandler implements ItemHandler {
    
    @Override
    public ItemStack setDisplayName(ItemStack item, String name) {
        if (item == null || item.getType() == Material.AIR) return item;
        item.editMeta(meta -> {
            meta.setDisplayName(ChatColor.translateAlternateColorCodes('&', name));
        });
        return item;
    }
    
    @Override
    public ItemStack setLore(ItemStack item, String... lore) {
        if (item == null || item.getType() == Material.AIR) return item;
        item.editMeta(meta -> meta.setLore(Arrays.asList(lore)));
        return item;
    }
    
    @Override
    public ItemStack addLore(ItemStack item, String... lore) {
        if (item == null || item.getType() == Material.AIR) return item;
        item.editMeta(meta -> {
            java.util.List<String> existing = meta.getLore();
            if (existing == null) existing = new java.util.ArrayList<>();
            existing.addAll(Arrays.asList(lore));
            meta.setLore(existing);
        });
        return item;
    }
    
    @Override
    public ItemStack addEnchant(ItemStack item, String enchantment, int level) {
        if (item == null || item.getType() == Material.AIR) return item;
        Enchantment ench = Enchantment.getByName(enchantment.toUpperCase());
        if (ench != null) item.addUnsafeEnchantment(ench, level);
        return item;
    }
    
    @Override
    public ItemStack setCustomModelData(ItemStack item, int data) {
        if (item == null || item.getType() == Material.AIR) return item;
        item.editMeta(meta -> meta.setCustomModelData(data));
        return item;
    }
    
    @Override
    public ItemStack setFlags(ItemStack item, Set<ItemFlag> flags) {
        if (item == null || item.getType() == Material.AIR) return item;
        item.editMeta(meta -> meta.addItemFlags(flags.toArray(new ItemFlag[0])));
        return item;
    }
    
    @Override
    public ItemStack clearItem(ItemStack item) {
        if (item == null || item.getType() == Material.AIR) return item;
        item.editMeta(meta -> {
            meta.setDisplayName(null);
            meta.setLore(null);
            meta.setCustomModelData(null);
            meta.setEnchantments(new HashMap<>());
            meta.setUnbreakable(false);
            meta.removeItemFlags(ItemFlag.values());
        });
        return item;
    }
}
```

#### ItemHandler 使用例

```java
// アイテムハンドラー取得
public class ItemManager {
    private static final ItemHandler HANDLER;
    
    static {
        if (com.example.plugin.common.VersionUtils.is1205Plus()) {
            HANDLER = new ModernItemHandler();
        } else {
            HANDLER = new LegacyItemHandler();
        }
    }
    
    public static ItemStack createSpecialItem() {
        ItemStack item = new ItemStack(Material.DIAMOND_SWORD);
        item = HANDLER.setDisplayName(item, "&6&l伝説の剣");
        item = HANDLER.addLore(item, "&7伝説の勇者が使用していた剣", "&8攻撃力: 100");
        item = HANDLER.addEnchant(item, "DAMAGE_ALL", 10);
        item = HANDLER.setCustomModelData(item, 12345);
        item = HANDLER.setFlags(item, Set.of(ItemFlag.HIDE_ATTRIBUTES, ItemFlag.HIDE_ENCHANTS));
        return item;
    }
}
```

#### Data Components API 詳細例 (1.20.5+)

1.20.5以降では、NBTタグの代わりにData Components APIを使用します。以下は主要な操作の実装例です：

```java
// common/item/modern/DataComponentHandler.java
package com.example.plugin.common.item.modern;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;
import org.bukkit.Color;
import org.bukkit.Material;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.attribute.Attribute;
import org.bukkit.attribute.AttributeModifier;
import org.bukkit.enchantments.Enchantment;

import java.util.UUID;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * 1.20.5+ 向けData Components API実装
 * 
 * ⚠️ 重要: 1.20.5からNBTが完全に刷新
 * - ItemMeta.setItemFlags() → ItemMeta.addItemFlags()
 * - ItemStack.getItemMeta().setCustomModelData() → Component 使用
 * - enchantments, attributes, unbreakable も Data Components に
 */
public class DataComponentHandler {
    
    /**
     * 染料で染色可能なアイテムを染色
     * 例: 革防具、スプラッシュポーション等
     */
    public ItemStack dyeItem(ItemStack item, int red, int green, int blue) {
        item.editMeta(meta -> {
            // Dyeable Component を使用
            meta.setColor(Color.fromRGB(red, green, blue));
        });
        return item;
    }
    
    /**
     * アイテムに属性Modifiersを追加
     * 例: 攻撃力ボーナス、防具ボーナス等
     */
    public ItemStack addAttribute(ItemStack item, Attribute attribute, 
                                   double amount, AttributeModifier.Operation operation) {
        item.editMeta(meta -> {
            // AttributeModifiers Component を使用
            UUID uuid = UUID.randomUUID();
            meta.addAttributeModifier(attribute, 
                new AttributeModifier(uuid, "custom-attribute", amount, operation));
        });
        return item;
    }
    
    /**
     * ツール使用回数を設定（耐久値）
     * 例: ダイヤモンドピッケル → 1561回
     */
    public ItemStack setMaxDurability(ItemStack item, int maxUses) {
        item.editMeta(meta -> {
            meta.setMaxStackSize(1); // スタック不可
            // ダメージは Bukkit API で設定
        });
        // ダメージ設定は LegacyItemHandler と同様の方法
        return item;
    }
    
    /**
     * エンチャント効果を表示なしに付与
     * 例: ダメージ増加 X → 非表示
     */
    public ItemStack addHiddenEnchant(ItemStack item, Enchantment enchantment, int level) {
        item.editMeta(meta -> {
            meta.addEnchant(enchantment, level, true); // true = 顯示なし
        });
        return item;
    }
    
    /**
     * ポーション効果を付与
     * 例: 衝撃耐性、有速度等
     */
    public ItemStack setPotionType(ItemStack item, String potionType) {
        if (item.getType() == Material.POTION || 
            item.getType() == Material.SPLASH_POTION ||
            item.getType() == Material.LINGERING_POTION) {
            item.editMeta(meta -> {
                // PotionContents Component (Paper 1.21+)
                if (meta instanceof org.bukkit.entity.thrownpotion.Potion) {
                    // Potions can have custom effects
                }
            });
        }
        return item;
    }
    
    /**
     * 火薬、火打石等の燃料時間を設定
     */
    public ItemStack setFuelBurnTime(ItemStack item, int ticks) {
        item.editMeta(meta -> {
            // Fuel Component (Paper 1.21+)
            // meta.setFuelBurnTime(ticks); // Paper独自API
        });
        return item;
    }
    
    /**
     * 本的情報を設定（1.21.4+）
     * 例: 書籍のタイトル、著者、内容
     */
    public ItemStack setBookInfo(ItemStack item, String title, String author, String... pages) {
        if (item.getType() == Material.WRITTEN_BOOK || item.getType() == Material.BOOK_AND_QUILL) {
            item.editMeta(meta -> {
                meta.setDisplayName(title);
                meta.setLore(java.util.Arrays.asList(pages));
                // AuthorはBukkit APIでは直接設定不可の場合がある
            });
        }
        return item;
    }
    
    /**
     * 刑吏台座位置を設定（ライトブロック等）
     * ⚠️ 1.17+専用
     */
    public ItemStack setCoyoteTime(ItemStack item, int ticks) {
        // 1.17+では、直接ブロック設置時のtickを設定
        // 主にブロック設置時に使用
        return item;
    }
}
```

#### Legacy ItemMeta 詳細例 (1.13-1.20.4)

```java
// common/item/legacy/LegacyItemMetaHandler.java
package com.example.plugin.common.item.legacy;

import org.bukkit.Color;
import org.bukkit.Material;
import org.bukkit.enchantments.Enchantment;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.inventory.meta.LeatherArmorMeta;

import java.util.Arrays;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * 1.13-1.20.4 向け ItemMeta API実装
 * 
 * ⚠️ NBTタグを直接操作する古い方法
 * - setDisplayName(), setLore() で 表示名/説明文
 * - addUnsafeEnchantment() で エンチャント
 * - setColor() で 染色
 */
public class LegacyItemMetaHandler {
    
    /**
     * 革防具を染色
     */
    public ItemStack dyeLeatherArmor(ItemStack item, int red, int green, int blue) {
        if (item.getType() == Material.LEATHER_HELMET ||
            item.getType() == Material.LEATHER_CHESTPLATE ||
            item.getType() == Material.LEATHER_LEGGINGS ||
            item.getType() == Material.LEATHER_BOOTS) {
            item.editMeta(meta -> {
                LeatherArmorMeta leatherMeta = (LeatherArmorMeta) meta;
                leatherMeta.setColor(Color.fromRGB(red, green, blue));
            });
        }
        return item;
    }
    
    /**
     * 全てのエンチャントを表示（含まれた禁忌）
     */
    public ItemStack enchantWithVisibility(ItemStack item, Enchantment enchantment, int level) {
        item.addUnsafeEnchantment(enchantment, level);
        item.editMeta(meta -> {
            meta.addItemFlags(org.bukkit.inventory.ItemFlag.HIDE_ENCHANTS);
        });
        return item;
    }
    
    /**
     * Skull的所有者を設定
     */
    public ItemStack setSkullOwner(ItemStack item, String playerName) {
        if (item.getType() == Material.PLAYER_HEAD || item.getType() == Material.PLAYER_WALL_HEAD) {
            item.editMeta(meta -> {
                if (meta instanceof org.bukkit.inventory.meta.SkullMeta skullMeta) {
                    skullMeta.setOwningPlayer(
                        org.bukkit.Bukkit.getOfflinePlayer(playerName)
                    );
                }
            });
        }
        return item;
    }
    
    /**
     * 花火を作成
     */
    public ItemStack createFirework(int power, String... colors) {
        ItemStack firework = new ItemStack(Material.FIREWORK_ROCKET, 1);
        firework.editMeta(meta -> {
            if (meta instanceof org.bukkit.inventory.meta.FireworkMeta fwMeta) {
                fwMeta.setPower(power);
                for (String colorStr : colors) {
                    int color = Integer.parseInt(colorStr.replace("#", ""), 16);
                    fwMeta.addEffect(
                        org.bukkit.FireworkEffect.builder()
                            .withColor(org.bukkit.Color.fromRGB(color))
                            .with(org.bukkit.FireworkEffect.Type.BALL)
                            .build()
                    );
                }
            }
        });
        return firework;
    }
    
    /**
     * 署名入り書を設定
     */
    public ItemStack setSignedBook(ItemStack item, String title, String author) {
        if (item.getType() == Material.WRITTEN_BOOK) {
            item.editMeta(meta -> {
                meta.setDisplayName(title);
                meta.setLore(Arrays.asList("著者: " + author));
            });
        }
        return item;
    }
}
```

#### ItemProcessor: 統一アイテム処理抽象化

1.20.5+ではData Components APIが導入され、アイテムの操作方法が根本的に変わりました。`ItemProcessor`はバージョンを意識せずにアイテムを操作できる統一インターフェースを提供します。

```java
// common/item/ItemProcessor.java
package com.example.plugin.common.item;

import com.example.plugin.common.VersionUtils;
import org.bukkit.Material;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import java.util.function.Consumer;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * 統一アイテム処理抽象化
 * 
 * バージョンを意識せずにアイテムを操作できる統一インターフェース
 * 内部で自動的に適切なハンドラーを選択
 * 
 * 使用例:
 *   ItemProcessor.create(Material.DIAMOND_SWORD)
 *       .name("§6§l伝説の剣")
 *       .lore("§7とても古い剣", "§8攻撃力: 100")
 *       .enchant("DAMAGE_ALL", 10)
 *       .customModelData(12345)
 *       .flags(ItemProcessor.ItemFlag.HIDE_ENCHANTS)
 *       .color(255, 0, 0)  // 染色（革防具等）
 *       .attribute(Attribute.GENERIC_ATTACK_DAMAGE, 5.0)
 *       .build();
 */
public class ItemProcessor {
    
    private final ItemStack item;
    private final ItemMeta meta;
    
    private String displayName;
    private java.util.List<String> lore;
    private java.util.Map<String, Integer> enchantments;
    private Integer customModelData;
    private java.util.Set<ItemFlag> flags;
    private java.awt.Color dyeColor;
    private java.util.Map<String, Double> attributes;
    
    private ItemProcessor(ItemStack item) {
        this.item = item;
        this.meta = item.getItemMeta();
        this.lore = new java.util.ArrayList<>();
        this.enchantments = new java.util.HashMap<>();
        this.flags = new java.util.HashSet<>();
        this.attributes = new java.util.HashMap<>();
    }
    
    /**
     * ItemStackからItemProcessorを生成
     */
    public static ItemProcessor of(ItemStack item) {
        return new ItemProcessor(item);
    }
    
    /**
     * Materialから新しいItemProcessorを生成
     */
    public static ItemProcessor create(Material material) {
        return new ItemProcessor(new ItemStack(material));
    }
    
    /**
     * 表示名を設定
     */
    public ItemProcessor name(String name) {
        this.displayName = name;
        return this;
    }
    
    /**
     * Loreを追加
     */
    public ItemProcessor lore(String... lines) {
        this.lore.addAll(java.util.Arrays.asList(lines));
        return this;
    }
    
    /**
     * エンチャントを追加
     */
    public ItemProcessor enchant(String enchantment, int level) {
        this.enchantments.put(enchantment.toUpperCase(), level);
        return this;
    }
    
    /**
     * カスタムモデルデータを設定
     */
    public ItemProcessor customModelData(int data) {
        this.customModelData = data;
        return this;
    }
    
    /**
     * アイテムフラグを追加
     */
    public ItemProcessor flags(ItemFlag... flags) {
        for (ItemFlag flag : flags) {
            this.flags.add(flag);
        }
        return this;
    }
    
    /**
     * 染色（革防具等用）
     */
    public ItemProcessor color(int r, int g, int b) {
        this.dyeColor = new java.awt.Color(r, g, b);
        return this;
    }
    
    /**
     * 属性Modifiersを追加
     */
    public ItemProcessor attribute(String attributeName, double amount) {
        this.attributes.put(attributeName, amount);
        return this;
    }
    
    /**
     * 最終処理を実行してItemStackを返す
     */
    public ItemStack build() {
        applyDisplayName();
        applyLore();
        applyEnchantments();
        applyCustomModelData();
        applyFlags();
        applyDyeColor();
        applyAttributes();
        
        item.setItemMeta(meta);
        return item;
    }
    
    /**
     * 表示名を設定（バージョン自動分岐）
     */
    private void applyDisplayName() {
        if (displayName == null) return;
        
        if (VersionUtils.is1205Plus()) {
            // 1.20.5+: Adventure Component API
            net.kyori.adventure.text.Component component = 
                net.kyori.adventure.text.Component.text(displayName);
            meta.displayName(component);
        } else if (VersionUtils.getMajorVersion() >= 13) {
            // 1.13-1.20.4: カラ код変換
            String translated = org.bukkit.ChatColor.translateAlternateColorCodes('&', displayName);
            meta.setDisplayName(translated);
        } else {
            // 1.8.x: そのまま設定
            meta.setDisplayName(displayName);
        }
    }
    
    /**
     * Loreを設定（バージョン自動分岐）
     */
    private void applyLore() {
        if (lore.isEmpty()) return;
        
        if (VersionUtils.is1205Plus()) {
            // 1.20.5+: Adventure Component List
            java.util.List<net.kyori.adventure.text.Component> loreComponents = new java.util.ArrayList<>();
            for (String line : lore) {
                loreComponents.add(net.kyori.adventure.text.Component.text(line));
            }
            meta.lore(loreComponents);
        } else {
            // 1.13-1.20.4: 文字列リスト
            java.util.List<String> translatedLore = new java.util.ArrayList<>();
            for (String line : lore) {
                translatedLore.add(org.bukkit.ChatColor.translateAlternateColorCodes('&', line));
            }
            meta.setLore(translatedLore);
        }
    }
    
    /**
     * エンチャントを適用
     */
    private void applyEnchantments() {
        if (enchantments.isEmpty()) return;
        
        for (java.util.Map.Entry<String, Integer> entry : enchantments.entrySet()) {
            org.bukkit.enchantments.Enchantment enchant = 
                org.bukkit.enchantments.Enchantment.getByName(entry.getKey());
            if (enchant != null) {
                item.addUnsafeEnchantment(enchant, entry.getValue());
            }
        }
    }
    
    /**
     * カスタムモデルデータを設定
     */
    private void applyCustomModelData() {
        if (customModelData == null) return;
        meta.setCustomModelData(customModelData);
    }
    
    /**
     * アイテムフラグを適用
     */
    private void applyFlags() {
        if (flags.isEmpty()) return;
        
        for (ItemFlag flag : flags) {
            switch (flag) {
                case HIDE_ENCHANTS:
                    meta.addItemFlags(org.bukkit.inventory.ItemFlag.HIDE_ENCHANTS);
                    break;
                case HIDE_ATTRIBUTES:
                    meta.addItemFlags(org.bukkit.inventory.ItemFlag.HIDE_ATTRIBUTES);
                    break;
                case HIDE_UNBREAKABLE:
                    meta.addItemFlags(org.bukkit.inventory.ItemFlag.HIDE_UNBREAKABLE);
                    break;
                case HIDE_DESTROYS:
                    meta.addItemFlags(org.bukkit.inventory.ItemFlag.HIDE_DESTROYS);
                    break;
                case HIDE_PLACED_ON:
                    meta.addItemFlags(org.bukkit.inventory.ItemFlag.HIDE_PLACED_ON);
                    break;
                case HIDE_POTION_EFFECTS:
                    meta.addItemFlags(org.bukkit.inventory.ItemFlag.HIDE_POTION_EFFECTS);
                    break;
                case SHOW_IN_TOOLTIP:
                    // 1.21+の新フラグ
                    break;
            }
        }
    }
    
    /**
     * 染色を適用（革防具等）
     */
    private void applyDyeColor() {
        if (dyeColor == null) return;
        
        if (meta instanceof org.bukkit.inventory.meta.LeatherArmorMeta leatherMeta) {
            leatherMeta.setColor(new org.bukkit.Color(dyeColor.getRGB()));
        }
        // POTION等にも適用可能
    }
    
    /**
     * 属性Modifiersを適用
     */
    private void applyAttributes() {
        if (attributes.isEmpty()) return;
        
        for (java.util.Map.Entry<String, Double> entry : attributes.entrySet()) {
            try {
                org.bukkit.attribute.Attribute attribute = 
                    org.bukkit.attribute.Attribute.valueOf(entry.getKey());
                java.util.UUID uuid = java.util.UUID.randomUUID();
                meta.addAttributeModifier(attribute, 
                    new org.bukkit.attribute.AttributeModifier(
                        uuid, 
                        "custom-" + entry.getKey(), 
                        entry.getValue(),
                        org.bukkit.attribute.AttributeModifier.Operation.ADD_NUMBER
                    )
                );
            } catch (IllegalArgumentException ignored) {
                // 不明な属性名
            }
        }
    }
    
    /**
     * ItemProcessorが 지원하는 アイテムフラグ
     */
    public enum ItemFlag {
        HIDE_ENCHANTS,
        HIDE_ATTRIBUTES,
        HIDE_UNBREAKABLE,
        HIDE_DESTROYS,
        HIDE_PLACED_ON,
        HIDE_POTION_EFFECTS,
        SHOW_IN_TOOLTIP  // 1.21+独自
    }
}
```

#### ItemProcessor 使用例

```java
// 祭壇の剣を作成
ItemStack legendarySword = ItemProcessor.create(Material.DIAMOND_SWORD)
    .name("&6&l祭壇の剣")
    .lore("&7古代の勇者が使用していた剣", "&8攻撃力: 100", "&c伝説の武器")
    .enchant("DAMAGE_ALL", 10)
    .enchant("FIRE_ASPECT", 5)
    .enchant("LOOT_BONUS_MOBS", 3)
    .customModelData(9999)
    .flags(ItemProcessor.ItemFlag.HIDE_ENCHANTS)
    .attribute("GENERIC_ATTACK_DAMAGE", 15.0)
    .build();

// 染色の革防具
ItemStack redArmor = ItemProcessor.create(Material.LEATHER_CHESTPLATE)
    .name("&c&l赤い革装備")
    .color(255, 0, 0)  // 赤色
    .flags(ItemProcessor.ItemFlag.HIDE_ATTRIBUTES)
    .build();

// エンチャント本
ItemStack enchantedBook = ItemProcessor.create(Material.ENCHANTED_BOOK)
    .enchant("PROTECTION_ENVIRONMENTAL", 10)
    .enchant("THORNS", 5)
    .lore("&5保護 X", "&5棘 V")
    .build();
```

#### DataComponentUtils: 1.20.5+ Data Components API ユーティリティ

1.20.5でアイテムのデータ構造が完全に刷新されました。`DataComponentUtils`は新旧のAPIを統一的に扱うためのユーティリティです。

```java
// common/item/DataComponentUtils.java
package com.example.plugin.common.item;

import com.example.plugin.common.VersionUtils;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.serializer.plain.PlainTextComponentSerializer;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.inventory.meta.PotionMeta;
import org.bukkit.potion.PotionData;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;

import java.util.ArrayList;
import java.util.List;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * Data Components API ユーティリティ（1.20.5+）
 * 
 * ⚠️ 1.20.5からの変更点:
 * - NBTタグ → Data Components
 * - ItemMeta.setDisplayName(String) → ItemMeta.displayName(Component)
 * - ItemMeta.setLore(List<String>) → ItemMeta.lore(List<Component>)
 * - ポーション効果が Data Components で管理
 * 
 * 使用例:
 *   // 1.20.5+ でも 1.13-1.20.4 でも動作
 *   DataComponentUtils.setDisplayName(item, "伝説の剣");
 *   DataComponentUtils.setLore(item, Arrays.asList("説明1", "説明2"));
 *   DataComponentUtils.setPotionEffect(item, PotionEffectType.SPEED, 60, 1);
 */
public class DataComponentUtils {
    
    // ==================== 表示名操作 ====================
    
    /**
     * アイテムの表示名を設定（バージョン自動分岐）
     * 
     * @param item 対象アイテム
     * @param name 表示名（&コード対応）
     * @return 設定後のアイテム
     */
    public static ItemStack setDisplayName(ItemStack item, String name) {
        if (item == null || item.getType() == Material.AIR) return item;
        
        item.editMeta(meta -> {
            if (VersionUtils.is1205Plus()) {
                // 1.20.5+: Adventure Component 使用
                Component component = parseColoredComponent(name);
                meta.displayName(component);
            } else if (VersionUtils.getMajorVersion() >= 13) {
                // 1.13-1.20.4: 文字列直接設定
                String translated = org.bukkit.ChatColor.translateAlternateColorCodes('&', name);
                meta.setDisplayName(translated);
            } else {
                // 1.8.x: レガシー
                meta.setDisplayName(name);
            }
        });
        return item;
    }
    
    /**
     * アイテムの表示名を取得（バージョン自動分岐）
     */
    public static String getDisplayName(ItemStack item) {
        if (item == null || !item.hasItemMeta()) return null;
        
        ItemMeta meta = item.getItemMeta();
        if (VersionUtils.is1205Plus()) {
            // 1.20.5+: Component から取得
            Component displayName = meta.displayName();
            if (displayName != null) {
                return PlainTextComponentSerializer.plainText().serialize(displayName);
            }
        } else {
            // 1.13-1.20.4: 文字列で取得
            return meta.getDisplayName();
        }
        return null;
    }
    
    // ==================== Lore操作 ====================
    
    /**
     * アイテムのLoreを設定（バージョン自動分岐）
     * 
     * @param item 対象アイテム
     * @param lines Loreの行列表記（&コード対応）
     * @return 設定後のアイテム
     */
    public static ItemStack setLore(ItemStack item, List<String> lines) {
        if (item == null || item.getType() == Material.AIR) return item;
        
        item.editMeta(meta -> {
            if (VersionUtils.is1205Plus()) {
                // 1.20.5+: Component のリスト
                List<Component> loreComponents = new ArrayList<>();
                for (String line : lines) {
                    loreComponents.add(parseColoredComponent(line));
                }
                meta.lore(loreComponents);
            } else {
                // 1.13-1.20.4: 文字列リスト
                List<String> translatedLines = new ArrayList<>();
                for (String line : lines) {
                    translatedLines.add(org.bukkit.ChatColor.translateAlternateColorCodes('&', line));
                }
                meta.setLore(translatedLines);
            }
        });
        return item;
    }
    
    /**
     * アイテムのLoreに行を追加（バージョン自動分岐）
     */
    public static ItemStack addLore(ItemStack item, String... lines) {
        if (item == null || item.getType() == Material.AIR) return item;
        
        item.editMeta(meta -> {
            if (VersionUtils.is1205Plus()) {
                // 1.20.5+: Component 操作
                List<Component> existingLore = meta.hasLore() ? meta.lore() : new ArrayList<>();
                for (String line : lines) {
                    existingLore.add(parseColoredComponent(line));
                }
                meta.lore(existingLore);
            } else {
                // 1.13-1.20.4: 文字列操作
                List<String> existingLore = meta.getLore();
                if (existingLore == null) existingLore = new ArrayList<>();
                for (String line : lines) {
                    existingLore.add(org.bukkit.ChatColor.translateAlternateColorCodes('&', line));
                }
                meta.setLore(existingLore);
            }
        });
        return item;
    }
    
    /**
     * アイテムのLoreをクリア
     */
    public static ItemStack clearLore(ItemStack item) {
        if (item == null || item.getType() == Material.AIR) return item;
        
        item.editMeta(meta -> {
            if (VersionUtils.is1205Plus()) {
                meta.lore(new ArrayList<>());
            } else {
                meta.setLore(new ArrayList<>());
            }
        });
        return item;
    }
    
    // ==================== ポーション操作 ====================
    
    /**
     * ポーション効果を追加（バージョン自動分岐）
     * 
     * @param item 対象アイテム（スプラッシュポーション等）
     * @param effectType 効果タイプ
     * @param duration 継続時間（秒）
     * @param amplifier 効果レベル（0起点）
     * @return 設定後のアイテム
     */
    public static ItemStack setPotionEffect(ItemStack item, PotionEffectType effectType, 
                                           int duration, int amplifier) {
        if (item == null || item.getType() == Material.AIR) return item;
        
        item.editMeta(meta -> {
            if (meta instanceof PotionMeta potionMeta) {
                // ポーション効果を直接設定
                PotionEffect effect = new PotionEffect(effectType, duration * 20, amplifier);
                
                if (VersionUtils.is1205Plus()) {
                    // 1.20.5+: custom_potion_effects Component
                    potionMeta.addCustomEffect(effect);
                } else {
                    // 1.13-1.20.4: 従来の方法
                    potionMeta.addCustomEffect(effect);
                }
            }
        });
        return item;
    }
    
    /**
     * ポーションタイプを設定
     */
    public static ItemStack setBasePotionType(ItemStack item, PotionEffectType baseType) {
        if (item == null || item.getType() == Material.AIR) return item;
        
        item.editMeta(meta -> {
            if (meta instanceof PotionMeta potionMeta) {
                PotionData data = new PotionData(baseType);
                potionMeta.setBasePotionData(data);
            }
        });
        return item;
    }
    
    // ==================== ヘルパーメソッド ====================
    
    /**
     * &カラーコードをAdventure Componentに変換
     */
    private static Component parseColoredComponent(String text) {
        String translated = org.bukkit.ChatColor.translateAlternateColorCodes('&', text);
        return Component.text(translated);
    }
    
    /**
     * アイテムが染色可能かチェック
     */
    public static boolean isDyeable(ItemStack item) {
        if (item == null) return false;
        Material type = item.getType();
        return type == Material.LEATHER_HELMET ||
               type == Material.LEATHER_CHESTPLATE ||
               type == Material.LEATHER_LEGGINGS ||
               type == Material.LEATHER_BOOTS ||
               type == Material.LEATHER_HORSE_ARMOR ||
               type == Material.GLASS_BOTTLE ||
               type == Material.POTION ||
               type == Material.SPLASH_POTION ||
               type == Material.LINGERING_POTION;
    }
    
    /**
     * アイテムがBooks系かチェック
     */
    public static boolean isBook(ItemStack item) {
        if (item == null) return false;
        Material type = item.getType();
        return type == Material.BOOK_AND_QUILL ||
               type == Material.WRITTEN_BOOK ||
               type == Material.ENCHANTED_BOOK;
    }
    
    /**
     * アイテムが防具かチェック
     */
    public static boolean isArmor(ItemStack item) {
        if (item == null) return false;
        Material type = item.getType();
        return type.name().contains("HELMET") ||
               type.name().contains("CHESTPLATE") ||
               type.name().contains("LEGGINGS") ||
               type.name().contains("BOOTS") ||
               type.name().contains("HORSE_ARMOR");
    }
    
    /**
     * アイテムがツール/武器かチェック
     */
    public static boolean isToolOrWeapon(ItemStack item) {
        if (item == null) return false;
        Material type = item.getType();
        return type.name().contains("SWORD") ||
               type.name().contains("AXE") ||
               type.name().contains("PICKAXE") ||
               type.name().contains("SHOVEL") ||
               type.name().contains("HOE") ||
               type.name().contains("BOW") ||
               type.name().contains("TRIDENT") ||
               type.name().contains("CROSSBOW");
    }
    
    /**
     * バージョンを示す文字列を取得
     */
    public static String getVersionInfo() {
        if (VersionUtils.is121Plus()) {
            return "1.21.x+ (Mojang Mappings, Data Components)";
        } else if (VersionUtils.is1205Plus()) {
            return "1.20.5+ (Data Components API)";
        } else if (VersionUtils.getMajorVersion() >= 13) {
            return "1.13-1.20.4 (ItemMeta API)";
        } else {
            return "1.8.x (Legacy)";
        }
    }
}
```

#### DataComponentUtils 使用例

```java
// 基本的な使用方法
ItemStack item = new ItemStack(Material.DIAMOND_SWORD);

// 表示名設定
DataComponentUtils.setDisplayName(item, "&6&l伝説の剣");

// Lore設定
DataComponentUtils.setLore(item, Arrays.asList(
    "&7古代の勇者が使用していた",
    "&8攻撃力: &c100",
    "&e&l★伝説の武器★"
));

// Loreに行を追加
DataComponentUtils.addLore(item, "&a新機能追加!", "&dバージョン情報付き");

// 表示名取得
String name = DataComponentUtils.getDisplayName(item);

// ポーション作成
ItemStack potion = new ItemStack(Material.POTION);
DataComponentUtils.setPotionEffect(potion, PotionEffectType.SPEED, 60, 2);
DataComponentUtils.setPotionEffect(potion, PotionEffectType.JUMP, 30, 1);

// 染色（革防具）
ItemStack leatherHelmet = new ItemStack(Material.LEATHER_HELMET);
if (DataComponentUtils.isDyeable(leatherHelmet)) {
    leatherHelmet.editMeta(meta -> {
        if (meta instanceof LeatherArmorMeta leatherMeta) {
            leatherMeta.setColor(Color.RED);
        }
    });
}

// バージョン情報表示
getLogger().info("現在のバージョン: " + DataComponentUtils.getVersionInfo());
// → "1.20.5+ (Data Components API)" 等

// アイテム種別の判定
if (DataComponentUtils.isBook(item)) {
    // 書籍特有の処理
} else if (DataComponentUtils.isArmor(item)) {
    // 防具特有の処理
} else if (DataComponentUtils.isToolOrWeapon(item)) {
    // 武器・ツール特有の処理
}
```

#### バージョン判定 Helper メソッド集

```java
// common/VersionHelper.java
package com.example.plugin.common;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * バージョン判定ヘルパー
 * ItemHandler選択やAPI分岐に使用
 */
public class VersionHelper {
    
    /**
     * Data Components API 是否使用（1.20.5+）
     */
    public static boolean useDataComponents() {
        return VersionUtils.is1205Plus();
    }
    
    /**
     * Adventure Component API 是否使用（1.16+）
     * setDisplayName() にStringではなくComponentが必要
     */
    public static boolean useAdventureComponents() {
        return VersionUtils.getMajorVersion() >= 16;
    }
    
    /**
     * 新しいたん白標識名体系是否使用（1.13+）
     */
    public static boolean useNamespacedKey() {
        return VersionUtils.getMajorVersion() >= 13;
    }
    
    /**
     * グループ командам 是否サポート（1.13+）
     */
    public static boolean supportRecipeGroups() {
        return VersionUtils.getMajorVersion() >= 13;
    }
    
    /**
     * Mojang Mappings 直接参照是否可能（1.21+）
     */
    public static boolean useMojangMappings() {
        return VersionUtils.is121Plus();
    }
    
    /**
     * Paper独自API是否使用可能
     */
    public static boolean isPaper() {
        try {
            Class.forName("io.papermc.paper.inventory.ItemStack");
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }
    
    /**
     * Paper Molten でアイテム操作
     * ⚠️ Paper 1.21+ 推奨
     */
    public static Object getPaperItemStack(ItemStack bukkitItem) {
        if (isPaper()) {
            // io.papermc.paper.inventory.ItemStack#adapt(bukkitItem)
            // を使用して Paper独自APIにアクセス可能
        }
        return bukkitItem;
    }
}
```

### Java 8/21 共存ガイド

#### ビルド設定の注意点

```xml
<!-- pom.xml -->
<properties>
    <!-- ⚠️ source/target ではなく release を使用 -->
    <!-- Java 8 のバイトコードを出力（1.8.8サーバーで動作） -->
    <java.release>8</java.release>
    <!-- ビルド環境のJavaバージョン（開発PC） -->
    <java.build.version>21</java.build.version>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>

<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <version>3.13.0</version>
    <configuration>
        <!-- 
            release: 8 = バイトコードを Java 8 形式で出力
            重要: <source>と<target>ではなく<release>を使用
            こうすることで、Java 8に存在しないAPI использовать不会出现
        -->
        <release>${java.release}</release>
        <!-- 
            コンパイラのバージョン確認
            Java 21 でコンパイルしても、release=8 で出力は Java 8 バイトコード
        -->
    </configuration>
</plugin>
```

#### Java 8互換コードの書き方（詳細ガイド）

Java 21で開発し、Java 8で動作させる場合の具体的な指針：

```java
// ❌ Java 8でコンパイルエラーになる例

// 1. var は使用不可
var item = new ItemStack(Material.DIAMOND); // エラー

// 2. switch式は使用不可 (Java 14+)
String result = switch (type) {
    case A -> "a";
    case B -> "b";
    default -> "unknown";
};

// 3. レコードは使用不可 (Java 16+)
public record Point(int x, int y) {}

// 4. sealed class は使用不可 (Java 17+)
public sealed class Shape permits Circle, Square {}

// 5. Stream API は使用可能（for loopで代替可能）
items.stream().filter().map().collect();

// 6. List.of(), Map.of() は使用可能（Java 9+、ビルド时会エラーにならない）
List<String> list = List.of("a", "b"); // ⚠️ Java 8 では実行時エラー
List<String> list = Arrays.asList("a", "b"); // ✅ Java 8 互換
```

#### 最新機能をJava 8で動作させる実践的パターン

```java
// common/Java8Compatible.java
package com.example.plugin.common;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * Java 8との互換性を保ちながら最新機能を使うためのパターン集
 */
public class Java8CompatiblePatterns {
    
    /**
     * ✅ Pattern 1: for loop で Stream を代替
     * 
     * Java 8ではStream API使用不可のため、伝統的なfor loopを使用
     */
    public void processItemsJava8Style(java.util.List<ItemStack> items) {
        for (ItemStack item : items) {
            if (item != null && item.getType() != Material.AIR) {
                processItem(item);
            }
        }
    }
    
    /**
     * ❌ Java 8 で実行時エラーになる例
     */
    public void problematicListCreation() {
        // List.of() は Java 9+ で導入
        // Java 8 で実行時に UnsupportedClassVersionError 等发生
        java.util.List<String> list = java.util.List.of("a", "b"); // ⚠️
        
        // ✅ Arrays.asList() を使用
        java.util.List<String> safeList = java.util.Arrays.asList("a", "b");
    }
    
    /**
     * ✅ Pattern 2: 明示的な型宣言
     */
    public void explicitTypeDeclaration() {
        // ❌ var は Java 10+ で導入
        // var item = new ItemStack(Material.DIAMOND);
        
        // ✅ 明示的な型宣言
        ItemStack item = new ItemStack(Material.DIAMOND);
        ItemMeta meta = item.getItemMeta();
        java.util.List<String> lore = new java.util.ArrayList<>();
    }
    
    /**
     * ✅ Pattern 3: メソッド参照の代わりに Lambda
     * 
     * メソッド参照 (Item::getName) は使用可能
     * しかし、複雑な式は Lambda 式で記述
     */
    public void lambdaExamples() {
        java.util.List<String> names = new java.util.ArrayList<>();
        names.add("Player1");
        names.add("Player2");
        
        // ✅ forEach + Lambda は使用可能
        names.forEach(name -> {
            org.bukkit.Bukkit.broadcastMessage("Hello, " + name);
        });
        
        // ✅ メソッド参照も使用可能
        names.forEach(org.bukkit.Bukkit::broadcastMessage);
    }
    
    /**
     * ✅ Pattern 4: Optional の安全な使用
     * 
     * Optional は Java 8 で導入なので使用可能
     * ただし、メソッド参照に注意
     */
    public void optionalSafeUsage(java.util.Optional<ItemStack> optionalItem) {
        // ✅ ifPresent + Lambda は安全
        optionalItem.ifPresent(item -> {
            org.bukkit.Bukkit.getLogger().info("Item: " + item.getType().name());
        });
        
        // ✅ orElse でデフォルト値
        ItemStack item = optionalItem.orElse(new ItemStack(Material.AIR));
    }
    
    /**
     * ✅ Pattern 5: Builder パターンで複雑なオブジェクト構築
     * 
     * 名前を更新するBuilderクラスを作成して使用
     */
    public ItemStack buildItem() {
        return ItemBuilder.of(Material.DIAMOND_SWORD)
            .name("§6§l伝説の剣")
            .lore("§7とても古い剣", "§8攻撃力: 100")
            .enchant(org.bukkit.enchantments.Enchantment.DAMAGE_ALL, 10)
            .customModelData(12345)
            .flags(org.bukkit.inventory.ItemFlag.HIDE_ENCHANTS)
            .build();
    }
}

// ItemBuilder クラス例
class ItemBuilder {
    private final ItemStack item;
    
    private ItemBuilder(Material material) {
        this.item = new ItemStack(material);
    }
    
    public static ItemBuilder of(Material material) {
        return new ItemBuilder(material);
    }
    
    public ItemBuilder name(String name) {
        item.editMeta(meta -> {
            meta.setDisplayName(org.bukkit.ChatColor.translateAlternateColorCodes('&', name));
        });
        return this;
    }
    
    public ItemBuilder lore(String... lines) {
        item.editMeta(meta -> {
            java.util.List<String> loreList = meta.getLore();
            if (loreList == null) loreList = new java.util.ArrayList<>();
            for (String line : lines) {
                loreList.add(org.bukkit.ChatColor.translateAlternateColorCodes('&', line));
            }
            meta.setLore(loreList);
        });
        return this;
    }
    
    public ItemBuilder enchant(org.bukkit.enchantments.Enchantment enchant, int level) {
        item.addUnsafeEnchantment(enchant, level);
        return this;
    }
    
    public ItemBuilder customModelData(int data) {
        item.editMeta(meta -> meta.setCustomModelData(data));
        return this;
    }
    
    public ItemBuilder flags(org.bukkit.inventory.ItemFlag... flags) {
        item.editMeta(meta -> meta.addItemFlags(flags));
        return this;
    }
    
    public ItemStack build() {
        return item;
    }
}
```

#### MRJAR で Java 21専用機能を使用

一部の高級機能（Virtual Threads 等）は Java 21専用にしたい场合、MRJARを使用します：

```xml
<!-- pom.xml MRJAR設定 -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-jar-plugin</artifactId>
    <version>3.3.0</version>
    <configuration>
        <archive>
            <manifestEntries>
                <!-- JARをMRJARとしてマーク -->
                <Multi-Release>true</Multi-Release>
            </manifestEntries>
        </archive>
    </configuration>
</plugin>
```

```
プロジェクト構造:
src/
├── main/java/           # Java 8 互換コード
│   └── com/example/
│       └── plugin/
│           └── CommonClass.java
└── META-INF/
    └── versions/
        └── 21/          # Java 21専用コード
            └── com/example/
                └── plugin/
                    └── ModernClass.java  # Virtual Threads 等使用可能
```

```java
// src/main/java/com/example/plugin/PlatformService.java
// Java 8 互換
public class PlatformService {
    public void execute(Runnable task) {
        // 伝統的なThread使用
        new Thread(task).start();
    }
}

// META-INF/versions/21/com/example/plugin/PlatformService.java
// Java 21専用（Virtual Threads使用可能）
public class PlatformService {
    public void execute(Runnable task) {
        // Virtual Threads で実行
        Thread.startVirtualThread(task);
    }
}
```

#### プラットフォーム별 Javaバージョン要件

| Minecraftバージョン | 最低Javaバージョン | 備考 |
|-------------------|------------------|------|
| 1.8.8 - 1.16.5 | Java 8 | 最も広い互換性 |
| 1.17 - 1.20.4 | Java 17 | Mojang Mappings導入 |
| 1.21+ | Java 21 | v1_XX_RX パッケージ廃止 |

```xml
<!-- バージョン別pom.xml条件分岐 -->
<profiles>
    <!-- Java 8 互換設定 -->
    <profile>
        <id>java8-compatible</id>
        <properties>
            <java.release>8</java.release>
        </properties>
    </profile>
    
    <!-- Java 21 対応設定 -->
    <profile>
        <id>java21</id>
        <properties>
            <java.release>21</java.release>
        </properties>
    </profile>
</profiles>
```

#### Java 8 では使えない機能

| 機能 | Java 8 | Java 21 | 代替案 |
|------|--------|---------|--------|
| Stream API | ❌ | ✅ | for loop, Iterator |
| Lambda | ✅ | ✅ | 使用可能 |
| var (ローカル変数推論) | ❌ | ✅ | 明示的な型宣言 |
| switch式 | ❌ | ✅ | traditional switch |
| レコード | ❌ | ✅ | class |
| sealed class | ❌ | ✅ | abstract class |
| Pattern Matching | ❌ | ✅ | instanceof + cast |
| Virtual Threads | ❌ | ✅ | Thread/ExecutorService |
| Text Blocks | ❌ | ✅ | 文字列結合 |

#### Java 8互換コード例

```java
// ❌ Java 8ではコンパイルエラー
public void processItems(List<Item> items) {
    items.stream()
        .filter(item -> item.isValid())
        .map(item -> item.getName())
        .forEach(System.out::println);
}

// ✅ Java 8互換
public void processItems(List<Item> items) {
    for (Item item : items) {
        if (item.isValid()) {
            System.out.println(item.getName());
        }
    }
}

// ✅ Lambda は使用可能
public void processItems(List<Item> items) {
    items.forEach(item -> {
        if (item.isValid()) {
            System.out.println(item.getName());
        }
    });
}

// ❌ var は使用不可
public void createItem() {
    var item = new ItemStack(Material.DIAMOND); // エラー
}

// ✅ 明示的型宣言
public void createItem() {
    ItemStack item = new ItemStack(Material.DIAMOND);
}
```

#### Conditionally Compiled Code

```java
// common/PlatformDetector.java
package com.example.plugin.common;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * プラットフォーム・バージョン検出
 */
public class PlatformDetector {
    
    private static final PlatformType PLATFORM;
    private static final boolean IS_JAVA_8;
    
    static {
        // プラットフォーム判定
        if (isSpigot()) {
            PLATFORM = PlatformType.SPIGOT;
        } else if (isBungeeCord()) {
            PLATFORM = PlatformType.BUNGEE;
        } else if (isVelocity()) {
            PLATFORM = PlatformType.VELOCITY;
        } else {
            PLATFORM = PlatformType.UNKNOWN;
        }
        
        // Javaバージョン判定
        String javaVersion = System.getProperty("java.version");
        IS_JAVA_8 = javaVersion.startsWith("1.8") || javaVersion.startsWith("8");
    }
    
    private static boolean isSpigot() {
        try {
            Class.forName("org.bukkit.entity.Player");
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }
    
    private static boolean isBungeeCord() {
        try {
            Class.forName("net.md_5.bungee.api.ProxyServer");
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }
    
    private static boolean isVelocity() {
        try {
            Class.forName("com.velocitypowered.api.proxy.ProxyServer");
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }
    
    public static PlatformType getPlatform() { return PLATFORM; }
    public static boolean isJava8() { return IS_JAVA_8; }
    public static boolean isModernJava() { return !IS_JAVA_8; }
}

// 使用例
public class ExampleService {
    public void process() {
        if (PlatformDetector.isJava8()) {
            processJava8();
        } else {
            processModern();
        }
    }
    
    private void processJava8() { /* Java 8 専用処理 */ }
    private void processModern() { /* Java 21 専用処理 */ }
}
```
```

#### NMSリフレクションUtility

```java
// common/NMSReflectionUtils.java
package com.example.plugin.common;

import org.bukkit.Bukkit;

/**
 * 作成者: MCPMOP_appi@作成者
 * NMSリフレクションUtility
 * 
 * ⚠️ 重要: 1.21.x以降では v1_XX_RX パッケージが完全に廃止
 *        → Mojang Mappings (net.minecraft) が直接参照可能に
 */
public class NMSReflectionUtils {
    
    private static final String PACKAGE_NAME = Bukkit.getServer().getClass().getPackage().getName();
    private static final boolean IS_NEWER_VERSION;

    static {
        // 1.21.x以降かを判定（バージョンサフィックスがなくなった）
        String suffix = getVersionSuffixRaw();
        IS_NEWER_VERSION = suffix == null || suffix.isEmpty();
    }

    /**
     * パッケージ名からバージョン部分を取得 (例: "v1_8_R3")
     * ⚠️ 1.20.5+/1.21.x以降では null を返す
     */
    private static String getVersionSuffixRaw() {
        String[] parts = PACKAGE_NAME.split("\\.");
        if (parts.length > 3) {
            return parts[3];
        }
        return null;
    }

    /**
     * 最新バージョン(1.21.x+)か判定
     * v1_XX_RX パッケージが廃止され、直接import可能
     */
    public static boolean isNewerVersion() {
        return IS_NEWER_VERSION;
    }

    /**
     * NMSクラス取得（最新対応）
     * 1.21.x+: Mojang Mappings 直接参照 (net.minecraft.server.EntityPlayer)
     * 1.20.x以前: リフレクションで v1_XX_RX.EntityPlayer を取得
     */
    public static Class<?> getNMSClass(String className) {
        if (isNewerVersion()) {
            // 1.21.x+: 直接参照可能
            try {
                return Class.forName("net.minecraft.server." + className);
            } catch (ClassNotFoundException e) {
                return null;
            }
        } else {
            // 1.20.x以前: リフレクション
            try {
                String suffix = getVersionSuffixRaw();
                return Class.forName("net.minecraft.server." + suffix + "." + className);
            } catch (ClassNotFoundException e) {
                return null;
            }
        }
    }

    /**
     * CraftBukkitクラス取得
     */
    public static Class<?> getCraftClass(String className) {
        if (isNewerVersion()) {
            // 1.21.x+: org.bukkit.craftbukkit. + className
            try {
                return Class.forName("org.bukkit.craftbukkit." + className);
            } catch (ClassNotFoundException e) {
                return null;
            }
        } else {
            // 1.20.x以前: org.bukkit.craftbukkit.v1_XX_RX. + className
            try {
                String suffix = getVersionSuffixRaw();
                return Class.forName("org.bukkit.craftbukkit." + suffix + "." + className);
            } catch (ClassNotFoundException e) {
                return null;
            }
        }
    }

    /**
     * NMSクラス存在チェック
     */
    public static boolean hasNMSClass(String className) {
        try {
            return getNMSClass(className) != null;
        } catch (Exception e) {
            return false;
        }
    }
}
```

#### 使い分けの例

```java
// Spigot/SpigotListener.java
package com.example.plugin.Server.Spigot;

import com.example.plugin.common.VersionUtils;
import org.bukkit.Sound;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerLevelChangeEvent;

/**
 * 作成者: MCPMOP_appi@作成者
 */
public class SpigotListener implements Listener {

    @EventHandler
    public void onLevelUp(PlayerLevelChangeEvent event) {
        if (event.getNewLevel() > event.getOldLevel()) {
            playLevelUpSound(event.getPlayer());
        }
    }

    private void playLevelUpSound(Player player) {
        if (VersionUtils.getMajorVersion() >= 13) {
            // 1.13+: 新サウンド名
            player.playSound(player.getLocation(), Sound.valueOf("ENTITY_PLAYER_LEVELUP"), 1.0f, 1.0f);
        } else {
            // 1.8.x: レガシーサウンド名
            player.playSound(player.getLocation(), Sound.valueOf("LEVEL_UP"), 1.0f, 1.0f);
        }
    }
}
```

#### Sponge用

```java
// sponge/SpongeUtils.java
package com.example.plugin.sponge;

/**
 * 作成者: MCPMOP_appi@作成者
 * Sponge バージョン判定ユーティリティ
 */
public class SpongeUtils {
    
    /**
     * ゲーム自体のバージョンを取得
     * 例: "1.12.2"
     */
    public static String getMinecraftVersion() {
        return org.spongepowered.api.Sponge.platform()
            .container(org.spongepowered.api.Platform.Component.GAME)
            .metadata()
            .version()
            .toString();
    }

    /**
     * メジャーバージョン取得
     */
    public static int getMajorVersion() {
        String version = getMinecraftVersion();
        String[] parts = version.split("\\.");
        if (parts.length >= 2) {
            return Integer.parseInt(parts[1]);
        }
        return 0;
    }
}
```

#### BungeeCord用

```java
// bungee/BungeeUtils.java
package com.example.plugin.Proxy.BungeeCord;

/**
 * 作成者: MCPMOP_appi@作成者
 * BungeeCord バージョン判定ユーティリティ
 */
public class BungeeUtils {
    
    /**
     * BungeeCordのバージョン文字列を取得
     * 例: "git:BungeeCord-Bootstrap:1.20-R0.1-SNAPSHOT:..."
     */
    public static String getBungeeVersion() {
        return net.md_5.bungee.api.ProxyServer.getInstance().getVersion();
    }

    /**
     * Minecraftプロトコルバージョン（間接的なバージョン判定）
     * BungeeCordは直接的なMCバージョンを返さないため注意
     */
    public static int getProtocolVersion() {
        return net.md_5.bungee.protocol.ProtocolConstants.DATA_VERSION;
    }
}
```

#### Velocity用

```java
// velocity/VelocityUtils.java
package com.example.plugin.Proxy.Velocity;

/**
 * 作成者: MCPMOP_appi@作成者
 * Velocity バージョン判定ユーティリティ
 */
public class VelocityUtils {
    
    /**
     * Velocity APIのバージョンを取得
     * 例: "3.3.0-SNAPSHOT"
     * 注意: Minecraftバージョンではない
     */
    public static String getVelocityVersion(com.velocitypowered.api.proxy.ProxyServer proxy) {
        return proxy.getVersion().getVersion();
    }

    /**
     * Minecraftプロトコルバージョン
     */
    public static int getProtocolVersion(com.velocitypowered.api.proxy.ProxyServer proxy) {
        return proxy.getVersion().getProtocolVersion();
    }

    /**
     * Minecraftバージョン名
     */
    public static String getMinecraftVersion(com.velocitypowered.api.proxy.ProxyServer proxy) {
        return proxy.getVersion().getMinecraftVersion();
    }
}
```

### 依存関係分離（pom.xml）

```xml
<!-- Spigot/Paper/Folia 用 -->
<dependency>
    <groupId>io.papermc.paper</groupId>
    <artifactId>paper-api</artifactId>
    <version>1.21.4-R0.1-SNAPSHOT</version>
    <scope>provided</scope>
</dependency>

<!-- BungeeCord 用 -->
<dependency>
    <groupId>net.md-5</groupId>
    <artifactId>bungeecord-api</artifactId>
    <version>1.21-R0.1-SNAPSHOT</version>
    <type>jar</type>
    <scope>provided</scope>
</dependency>

<!-- Velocity 用 -->
<dependency>
    <groupId>com.velocitypowered</groupId>
    <artifactId>velocity-api</artifactId>
    <version>3.3.0-SNAPSHOT</version>
    <scope>provided</scope>
</dependency>
```

### 共通コード例（common/）

```java
package com.example.plugin.common;

/**
 * 作成者: MCPMOP_appi@作成者
 * 全プラットフォーム共通クラス
 */
public class CommonUtils {
    
    public static String formatMessage(String message) {
        return message.replace("&", "§");
    }
    
    public static void log(String message) {
        System.out.println("[Plugin] " + message);
    }
}
```

### Spigot専用コード例（Server/Spigot/）

```java
package com.example_plugin.Server.Spigot;

import com.example_plugin.common.CommonUtils;
import org.bukkit.plugin.java.JavaPlugin;

/**
 * 作成者: MCPMOP_appi@作成者
 * Spigot 专用メインクラス
 */
public class SpigotPlugin extends JavaPlugin {
    
    @Override
    public void onEnable() {
        getLogger().info("Spigot 対応");
        getLogger().info("作成者: MCPMOP_appi@作成者");
        
        // コマンド登録
        getCommand("test").setExecutor(new SpigotCommand());
        
        // イベント登録
        getServer().getPluginManager().registerEvents(new SpigotListener(), this);
    }
}
```

### タスクスケジューラー（共通インターフェース）

Bukkit/BungeeCord/Velocity では Scheduler API が異なるため、共通インターフェースを定義します。

```java
// common/TaskScheduler.java
package com.example.plugin.common;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * プラットフォーム非依存タスクスケジューラー
 * 各プラットフォームの実装クラスを共通APIで使用可能
 */
public interface TaskScheduler {
    
    /**
     * タスクを遅延実行（指定tick後）
     */
    int delayed(Runnable task, long delay);
    
    /**
     * タスクを定期実行（間隔tick）
     */
    int repeating(Runnable task, long delay, long period);
    
    /**
     * タスクを非同期で実行
     */
    int async(Runnable task);
    
    /**
     * タスクをキャンセル
     */
    void cancel(int taskId);
    
    /**
     * 全タスクをキャンセル
     */
    void cancelAll();
}
```

#### Spigot実装

```java
// Server/Spigot/SpigotTaskScheduler.java
package com.example.plugin.Server.Spigot;

import com.example.plugin.common.TaskScheduler;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

/**
 * 作成者: MCPMOP_appi@作成者
 * Spigot 向けタスクスケジューラー実装
 */
public class SpigotTaskScheduler implements TaskScheduler {
    
    private final JavaPlugin plugin;
    
    public SpigotTaskScheduler(JavaPlugin plugin) {
        this.plugin = plugin;
    }
    
    @Override
    public int delayed(Runnable task, long delay) {
        return plugin.getServer().getScheduler()
            .scheduleSyncDelayedTask(plugin, task, delay);
    }
    
    @Override
    public int repeating(Runnable task, long delay, long period) {
        return plugin.getServer().getScheduler()
            .scheduleSyncRepeatingTask(plugin, task, delay, period);
    }
    
    @Override
    public int async(Runnable task) {
        return plugin.getServer().getScheduler()
            .runTaskAsynchronously(plugin, task).getTaskId();
    }
    
    @Override
    public void cancel(int taskId) {
        plugin.getServer().getScheduler().cancelTask(taskId);
    }
    
    @Override
    public void cancelAll() {
        plugin.getServer().getScheduler().cancelTasks(plugin);
    }
}
```

#### BungeeCord実装

```java
// Proxy/BungeeCord/BungeeTaskScheduler.java
package com.example.plugin.Proxy.BungeeCord;

import com.example.plugin.common.TaskScheduler;
import net.md_5.bungee.api.plugin.Plugin;
import net.md_5.bungee.api.scheduler.ScheduledTask;

import java.util.concurrent.TimeUnit;

/**
 * 作成者: MCPMOP_appi@作成者
 * BungeeCord 向けタスクスケジューラー実装
 */
public class BungeeTaskScheduler implements TaskScheduler {
    
    private final Plugin plugin;
    private final List<ScheduledTask> tasks = new java.util.concurrent.CopyOnWriteArrayList<>();
    
    public BungeeTaskScheduler(Plugin plugin) {
        this.plugin = plugin;
    }
    
    @Override
    public int delayed(Runnable task, long delay) {
        ScheduledTask t = plugin.getProxy().getScheduler().schedule(
            plugin, task, delay, TimeUnit.SECONDS
        );
        tasks.add(t);
        return tasks.size();
    }
    
    @Override
    public int repeating(Runnable task, long delay, long period) {
        ScheduledTask t = plugin.getProxy().getScheduler().schedule(
            plugin, task, delay, period, TimeUnit.SECONDS
        );
        tasks.add(t);
        return tasks.size();
    }
    
    @Override
    public int async(Runnable task) {
        ScheduledTask t = plugin.getProxy().getScheduler().runAsync(plugin, task);
        tasks.add(t);
        return tasks.size();
    }
    
    @Override
    public void cancel(int taskId) {
        if (taskId > 0 && taskId <= tasks.size()) {
            tasks.get(taskId - 1).cancel();
        }
    }
    
    @Override
    public void cancelAll() {
        for (ScheduledTask task : tasks) {
            task.cancel();
        }
        tasks.clear();
    }
}
```

#### Velocity実装

```java
// Proxy/Velocity/VelocityTaskScheduler.java
package com.example.plugin.Proxy.Velocity;

import com.example.plugin.common.TaskScheduler;
import com.velocitypowered.api.scheduler.VelocityScheduler;
import com.velocitypowered.api.plugin.Plugin;

import java.util.concurrent.TimeUnit;

/**
 * 作成者: MCPMOP_appi@作成者
 * Velocity 向けタスクスケジューラー実装
 */
public class VelocityTaskScheduler implements TaskScheduler {
    
    private final Plugin plugin;
    private final VelocityScheduler scheduler;
    private final List<java.util.concurrent.Future<?>> futures = new java.util.concurrent.CopyOnWriteArrayList<>();
    
    public VelocityTaskScheduler(Plugin plugin, VelocityScheduler scheduler) {
        this.plugin = plugin;
        this.scheduler = scheduler;
    }
    
    @Override
    public int delayed(Runnable task, long delay) {
        var future = scheduler.delayAfter(plugin, task, delay, TimeUnit.SECONDS);
        futures.add(future);
        return futures.size();
    }
    
    @Override
    public int repeating(Runnable task, long delay, long period) {
        var future = scheduler.schedule(plugin, task, delay, period, TimeUnit.SECONDS);
        futures.add(future);
        return futures.size();
    }
    
    @Override
    public int async(Runnable task) {
        var future = scheduler.runAsync(plugin, task);
        futures.add(future);
        return futures.size();
    }
    
    @Override
    public void cancel(int taskId) {
        if (taskId > 0 && taskId <= futures.size()) {
            futures.get(taskId - 1).cancel(false);
        }
    }
    
    @Override
    public void cancelAll() {
        for (var future : futures) {
            future.cancel(false);
        }
        futures.clear();
    }
}
```

#### 使用例

```java
// common/AbstractPlugin.java で共通使用
public abstract class AbstractPlugin {
    protected TaskScheduler scheduler;
    
    public void sendDelayedMessage(UUID player, String message, long delaySeconds) {
        scheduler.delayed(() -> {
            sendMessage(player, message);
        }, delaySeconds * 20L); // Spigotはtick単位
    }
}
```

### Paper専用コード例（Server/Paper/）

```java
package com.example_plugin.Server.Paper;

import com.example_plugin.common.CommonUtils;
import io.papermc.paper.plugin.configuration.PluginMeta;
import org.bukkit.plugin.java.JavaPlugin;

/**
 * 作成者: MCPMOP_appi@作成者
 * Paper 専用メインクラス
 */
public class PaperPlugin extends JavaPlugin {
    
    @Override
    public void onEnable() {
        getLogger().info("Paper 対応");
        getLogger().info("作成者: MCPMOP_appi@作成者");
        
        // Paper独自機能を活用可能
        // 例: Paper の最適化された非同期処理
    }
}
```

### BungeeCord専用コード例（Proxy/BungeeCord/）

```java
package com.example_plugin.Proxy.BungeeCord;

import net.md_5.bungee.api.plugin.Plugin;

/**
 * 作成者: MCPMOP_appi@作成者
 * BungeeCord 専用メインクラス
 */
public class BungeePlugin extends Plugin {
    
    @Override
    public void onEnable() {
        getLogger().info("BungeeCord 対応");
        getLogger().info("作成者: MCPMOP_appi@作成者");
        
        // BungeeCord 用コマンド登録
        getProxy().getPluginManager().registerCommand(this, new BungeeCommand());
    }
}
```

### Velocity専用コード例（Proxy/Velocity/）

```java
package com.example_plugin.Proxy.Velocity;

import com.velocitypowered.api.plugin.Plugin;
import com.velocitypowered.api.plugin.annotation.DataDirectory;
import java.nio.file.Path;

/**
 * 作成者: MCPMOP_appi@作成者
 * Velocity 専用メインクラス
 */
@Plugin(
    id = "my-plugin",
    name = "MyPlugin",
    version = "1.0.0",
    description = "作成者: MCPMOP_appi@作成者"
)
public class VelocityPlugin {
    
    private final Path dataDirectory;
    
    public VelocityPlugin(@DataDirectory Path dataDirectory) {
        this.dataDirectory = dataDirectory;
    }
}
```

### 国際化（i18n）システム（GeyserVoice風）

言語ファイルをresourcesに配置し、コードをシンプルに保ったまま多言語対応を実現します。

#### プロジェクト構造

```
src/main/resources/
├── lang/
│   ├── en_us.yml       # 英語（デフォルト）
│   ├── ja_jp.yml       # 日本語
│   ├── zh_cn.yml       # 簡体字中国語
│   └── ko_kr.yml       # 韓国語
└── config.yml          # 設定ファイル
```

#### 言語ファイル例（en_us.yml / ja_jp.yml）

```yaml
# en_us.yml
plugin:
  name: "&6MyPlugin"
  prefix: "&8[&6MyPlugin&8]"
  version: "Version: {version}"
  
commands:
  help: "&eUse &f/myplugin help &efor help"
  reload: "&aConfiguration reloaded!"
  
messages:
  player_only: "&cThis command can only be used by players!"
  no_permission: "&cYou don't have permission to use this command!"
  success: "&aOperation completed successfully!"
  error: "&cAn error occurred: {error}"
  
placeholders:
  player_name: "{player}"
  server_name: "{server}"
```

```yaml
# ja_jp.yml
plugin:
  name: "&6マイプラグイン"
  prefix: "&8[&6マイプラグイン&8]"
  version: "バージョン: {version}"
  
commands:
  help: "&e&f/myplugin help &eでヘルプを表示"
  reload: "&a設定ファイルを再読み込みしました！"
  
messages:
  player_only: "&cこのコマンドはプレイヤーのみ使用可能です！"
  no_permission: "&cこのコマンドを実行する権限がありません！"
  success: "&a操作が正常に完了しました！"
  error: "&cエラーが発生しました: {error}"
  
placeholders:
  player_name: "{player}"
  server_name: "{server}"
```

#### LangManager（言語管理クラス）

```java
// common/lang/LangManager.java
package com.example.plugin.common.lang;

import com.example.plugin.common.ConfigManager;
import org.bukkit.ChatColor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.regex.*;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * 多言語対応マネージャー
 * 
 * 使用例:
 *   LangManager.send(player, "messages.success");
 *   LangManager.broadcast("messages.player_joined", "{player}", player.getName());
 */
public class LangManager {
    
    private static Map<String, String> lang = new HashMap<>();
    private static String currentLang = "en_us";
    
    /**
     * 言語ファイルをロード
     */
    public static void load(String langCode) {
        currentLang = langCode;
        lang.clear();
        
        String fileName = "lang/" + langCode + ".yml";
        Path langFile = Paths.get("plugins/MyPlugin", fileName);
        
        // デフォルト言語Fallback
        if (!Files.exists(langFile)) {
            langFile = Paths.get("plugins/MyPlugin", "lang/en_us.yml");
        }
        
        try {
            List<String> lines = Files.readAllLines(langFile, StandardCharsets.UTF_8);
            parseYaml(lines);
        } catch (IOException e) {
            // デフォルトメッセージ
            loadDefaults();
        }
    }
    
    /**
     * YAML風のファイルを解析
     */
    private static void parseYaml(List<String> lines) {
        String currentSection = "";
        
        for (String line : lines) {
            line = line.trim();
            
            // コメントをスキップ
            if (line.startsWith("#") || line.isEmpty()) continue;
            
            // セクション名を抽出
            if (!line.contains(":")) continue;
            
            String key = line.substring(0, line.indexOf(":")).trim();
            String value = line.substring(line.indexOf(":") + 1).trim();
            
            // ネストされたキーを處理
            if (line.startsWith(" ")) {
                // サブセクション内
                key = currentSection + "." + key;
            } else {
                currentSection = key;
            }
            
            lang.put(key, value);
        }
    }
    
    /**
     * デフォルト言語をロード
     */
    private static void loadDefaults() {
        lang.put("plugin.prefix", "&8[&6MyPlugin&8]");
        lang.put("messages.player_only", "&cPlayers only!");
        lang.put("messages.no_permission", "&cNo permission!");
        lang.put("messages.success", "&aSuccess!");
    }
    
    /**
     * メッセージを取得
     */
    public static String get(String key) {
        String message = lang.getOrDefault(key, key);
        return translateAlternateColorCodes(message);
    }
    
    /**
     * プレースホルダー付きでメッセージを取得
     */
    public static String get(String key, String... replacements) {
        String message = get(key);
        
        Pattern pattern = Pattern.compile("\\{([^}]+)\\}");
        Matcher matcher = pattern.matcher(message);
        StringBuffer sb = new StringBuffer();
        
        int i = 0;
        while (matcher.find()) {
            if (i < replacements.length) {
                matcher.appendReplacement(sb, Matcher.quoteReplacement(replacements[i]));
            }
            i++;
        }
        matcher.appendTail(sb);
        
        return sb.toString();
    }
    
    /**
     * プレイヤーにメッセージを送信
     */
    public static void send(Player player, String key, String... replacements) {
        player.sendMessage(get(key, replacements));
    }
    
    /**
     * コマンド送信者にメッセージを送信
     */
    public static void send(CommandSender sender, String key, String... replacements) {
        sender.sendMessage(get(key, replacements));
    }
    
    /**
     * 全員にブロードキャスト
     */
    public static void broadcast(String key, String... replacements) {
        String message = get(key, replacements);
        for (Player player : org.bukkit.Bukkit.getOnlinePlayers()) {
            player.sendMessage(message);
        }
    }
    
    /**
     * カラーコードを変換
     */
    private static String translateAlternateColorCodes(String message) {
        if (message == null) return "";
        return ChatColor.translateAlternateColorCodes('&', message);
    }
    
    /**
     * 利用可能な言語リストを取得
     */
    public static List<String> getAvailableLanguages() {
        List<String> languages = new ArrayList<>();
        Path langDir = Paths.get("plugins/MyPlugin/lang/");
        
        if (Files.exists(langDir)) {
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(langDir, "*.yml")) {
                for (Path file : stream) {
                    String fileName = file.getFileName().toString();
                    languages.add(fileName.replace(".yml", ""));
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        
        return languages;
    }
    
    public static String getCurrentLang() {
        return currentLang;
    }
}
```

#### LangManager 使用例

```java
// 基本的な使用
LangManager.send(player, "messages.success");
LangManager.send(player, "messages.player_joined", player.getName());

// 複数プレースホルダー
LangManager.send(sender, "messages.kill_message", 
    "{killer}", killerName, 
    "{victim}", victimName,
    "{weapon}", weaponName);

// プレフィックス付きメッセージ
sender.sendMessage(LangManager.get("plugin.prefix") + " " + 
    LangManager.get("messages.reloaded"));
```

### 偽パケット送信（NMS直接操作）

ProtocolLib等の外部ライブラリを使わず、NMSを直接操作してパケットを送信します。
軽量NPCプラグインや特定演出用プラグインはこの手法をよく使います。

#### NMSパケット送信クラス

```java
// common/packet/NMSPacketSender.java
package com.example.plugin.common.packet;

import com.example.plugin.common.VersionUtils;
import org.bukkit.Location;
import org.bukkit.entity.Player;

import java.lang.reflect.*;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * NMS直接操作によるパケット送信
 * ProtocolLib不要の軽量実装
 * 
 * ⚠️ 1.21.x以降ではパケットクラス名が変更されています
 */
public class NMSPacketSender {
    
    /**
     * プレイヤーConnectionを取得
     */
    private static Object getConnection(Player player) throws Exception {
        Object craftPlayer = player.getClass().getMethod("getHandle").invoke(player);
        return craftPlayer.getClass().getField("b").get(craftPlayer); // connection
    }
    
    /**
     * パケットを送信
     */
    public static void sendPacket(Player player, Object packet) {
        try {
            Object connection = getConnection(player);
            Method sendPacket = connection.getClass().getMethod("a", getNMSPacketClass());
            sendPacket.invoke(connection, packet);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * NMSパケットクラスを取得
     */
    private static Class<?> getNMSPacketClass(String packetName) {
        if (VersionUtils.is121Plus()) {
            // 1.21.x+: 直接パッケージ
            return getClassSafe("net.minecraft.network.protocol.game." + packetName);
        } else {
            // 1.20.x以前: バージョンサフィックス付き
            String version = getServerVersion();
            return getClassSafe("net.minecraft.server." + version + ".network.protocol.game." + packetName);
        }
    }
    
    /**
     * サーバー、バージョンサフィックスを取得
     */
    private static String getServerVersion() {
        return org.bukkit.Bukkit.getServer().getClass().getPackage().getName().split("\\.")[3];
    }
    
    /**
     * 安全にクラスを取得
     */
    private static Class<?> getClassSafe(String className) {
        try {
            return Class.forName(className);
        } catch (ClassNotFoundException e) {
            return null;
        }
    }
}
```

#### 偽のプレイヤー（非表示）を作成

```java
// common/packet/FakeEntityManager.java
package com.example.plugin.common.packet;

import org.bukkit.Location;
import org.bukkit.entity.Player;
import org.bukkit.util.Vector;

import java.util.*;
import java.util.concurrent.*;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * 偽エンティティ（NPC）マネージャー
 * サーバーに見えないプレイヤーを出現させます
 * 
 * 応用例:
 * - NPCプラグイン
 * - 、特定の演出
 * - プレイヤー名のオーバーレイ表示
 */
public class FakeEntityManager {
    
    private static final Map<UUID, FakeEntity> entities = new ConcurrentHashMap<>();
    private static final int ENTITY_TYPE_PLAYER = 63; // プレイヤーエンティティ
    
    /**
     * 偽プレイヤーを出現
     */
    public static UUID spawnFakePlayer(Player viewer, Location loc, String name) {
        UUID entityId = UUID.randomUUID();
        
        try {
            // Entityを生成
            Object entityPlayer = createEntityPlayer(entityId, loc, name);
            
            // メタデータを送信
            sendMetadataPacket(viewer, entityId, entityPlayer);
            
            // スポーンパケットを送信
            sendSpawnPacket(viewer, entityId, loc, name);
            
            // リストに保存
            entities.put(entityId, new FakeEntity(name, loc));
            
            return entityId;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * 偽プレイヤーを削除
     */
    public static void removeFakePlayer(Player viewer, UUID entityId) {
        if (!entities.containsKey(entityId)) return;
        
        try {
            // 破壊パケットを送信
            sendDestroyPacket(viewer, entityId);
            entities.remove(entityId);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * 偽プレイヤーを移動
     */
    public static void moveFakePlayer(Player viewer, UUID entityId, Location newLoc) {
        if (!entities.containsKey(entityId)) return;
        
        try {
            // 移動パケットを送信
            sendRelMovePacket(viewer, entityId, newLoc);
            entities.get(entityId).setLocation(newLoc);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    // === パケット生成ヘルパーメソッド ===
    
    private static Object createEntityPlayer(UUID entityId, Location loc, String name) throws Exception {
        // バージョン別のEntityPlayer生成
        // 具体的な実装はバージョンに依存
        return null;
    }
    
    private static void sendSpawnPacket(Player viewer, UUID entityId, Location loc, String name) throws Exception {
        // PacketPlayOutNamedEntitySpawn 生成
        Object packet = createSpawnPacket(entityId, loc, name);
        NMSPacketSender.sendPacket(viewer, packet);
    }
    
    private static void sendDestroyPacket(Player viewer, UUID entityId) throws Exception {
        // PacketPlayOutEntityDestroy 生成
        Object packet = createDestroyPacket(entityId);
        NMSPacketSender.sendPacket(viewer, packet);
    }
    
    private static void sendRelMovePacket(Player viewer, UUID entityId, Location loc) throws Exception {
        // PacketPlayOutEntity.PacketPlayOutRelEntityMove 生成
        Object packet = createRelMovePacket(entityId, loc);
        NMSPacketSender.sendPacket(viewer, packet);
    }
    
    private static void sendMetadataPacket(Player viewer, UUID entityId, Object entityPlayer) throws Exception {
        // PacketPlayOutEntityMetadata 生成
        Object packet = createMetadataPacket(entityId, entityPlayer);
        NMSPacketSender.sendPacket(viewer, packet);
    }
    
    // === パケットクラス取得 ===
    
    private static Class<?> getPacketClass(String name) {
        if (VersionUtils.is121Plus()) {
            return getClassSafe("net.minecraft.network.protocol.game." + name);
        } else {
            String version = getServerVersion();
            return getClassSafe("net.minecraft.server." + version + ".network.protocol.game." + name);
        }
    }
    
    private static String getServerVersion() {
        return org.bukkit.Bukkit.getServer().getClass().getPackage().getName().split("\\.")[3];
    }
    
    private static Class<?> getClassSafe(String name) {
        try {
            return Class.forName(name);
        } catch (ClassNotFoundException e) {
            return null;
        }
    }
    
    // === 内部クラス ===
    
    private static class FakeEntity {
        private final String name;
        private Location location;
        
        public FakeEntity(String name, Location location) {
            this.name = name;
            this.location = location;
        }
        
        public String getName() { return name; }
        public Location getLocation() { return location; }
        public void setLocation(Location loc) { this.location = loc; }
    }
}
```

### PlaceholderAPI展開サポート

PlaceholderAPI互換のプレースホルダーを作成し、其他のプラグインと連携可能にします。

#### PlaceholderExpansion基本クラス

```java
// common/placeholder/ExamplePlaceholderExpansion.java
package com.example.plugin.common.placeholder;

import me.clip.placeholderapi.expansion.*;
import org.bukkit.entity.Player;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * PlaceholderAPI展開クラス
 * 
 * プレースホルダー例:
 *   %myplugin_player_kills%
 *   %myplugin_player_deaths%
 *   %myplugin_server_online%
 */
public class ExamplePlaceholderExpansion extends PlaceholderExpansion {
    
    private Object plugin;
    
    /**
     * 展開を識別する一意の識別子
     */
    @Override
    public String getIdentifier() {
        return "myplugin";
    }
    
    /**
     * 展開 автор
     */
    @Override
    public String getAuthor() {
        return "MCPMOP_appi@作成者";
    }
    
    /**
     * 展開バージョン
     */
    @Override
    public String getVersion() {
        return "1.0.0";
    }
    
    /**
     * この展開が必要とするバージョン
     */
    @Override
    public String getRequiredPlugin() {
        return "MyPlugin";
    }
    
    /**
     * expansionが正しく登録されたかどうか
     */
    @Override
    public boolean persist() {
        return true; // 再読み込み時に 유지
    }
    
    /**
     * 実際のプレースホルダー値を取得
     */
    @Override
    public String onPlaceholderRequest(Player player, String params) {
        
        // %myplugin_player_kills%
        if (params.equalsIgnoreCase("player_kills")) {
            if (player == null) return "";
            return String.valueOf(getPlayerKills(player));
        }
        
        // %myplugin_player_deaths%
        if (params.equalsIgnoreCase("player_deaths")) {
            if (player == null) return "";
            return String.valueOf(getPlayerDeaths(player));
        }
        
        // %myplugin_server_online%
        if (params.equalsIgnoreCase("server_online")) {
            return String.valueOf(org.bukkit.Bukkit.getOnlinePlayers().size());
        }
        
        // %myplugin_player_balance%
        if (params.equalsIgnoreCase("player_balance")) {
            if (player == null) return "";
            return "$" + getPlayerBalance(player);
        }
        
        // %myplugin_prefix%
        if (params.equalsIgnoreCase("prefix")) {
            return "§6§lMyPlugin §7§l>> ";
        }
        
        return null; // 未知のプレースホルダー
    }
    
    // === プレースホルダー値の取得 ===
    
    private int getPlayerKills(Player player) {
        // 実際の実装ではデータベースや設定ファイルから取得
        return 42;
    }
    
    private int getPlayerDeaths(Player player) {
        return 10;
    }
    
    private double getPlayerBalance(Player player) {
        return 1000.0;
    }
}
```

#### PlaceholderExpansion登録

```java
// Main.java
@Override
public void onEnable() {
    // PlaceholderAPIがインストールされているかチェック
    if (Bukkit.getPluginManager().getPlugin("PlaceholderAPI") != null) {
        // 展開を登録
        new ExamplePlaceholderExpansion().register();
        getLogger().info("PlaceholderAPI expansion registered!");
    }
}
```

#### 利用可能なプレースホルダー

| プレースホルダー | 説明 | 例 |
|-----------------|------|-----|
| `%myplugin_player_kills%` | プレイヤーのキル数 | `42` |
| `%myplugin_player_deaths%` | プレイヤーの死亡数 | `10` |
| `%myplugin_server_online%` | オンライン人数 | `25` |
| `%myplugin_player_balance%` | プレイヤーの残高 | `$1000.0` |
| `%myplugin_prefix%` | プラグインプレフィックス | `§6§lMyPlugin` |

### ProtocolLib統合

ProtocolLibを使用すると、パケット操作がシンプルになり、バージョン互換性も向上します。

#### ProtocolLib依存関係追加

```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.comphenix.protocol</groupId>
    <artifactId>ProtocolLib</artifactId>
    <version>5.4.0</version>
    <scope>provided</scope>
</dependency>
```

```groovy
// build.gradle
dependencies {
    compileOnly 'com.comphenix.protocol:ProtocolLib:5.4.0'
}
```

#### ProtocolLib基本使用方法

```java
// common/packet/ProtocolLibPacketHandler.java
package com.example.plugin.common.packet;

import com.comphenix.protocol.*;
import com.comphenix.protocol.events.*;
import org.bukkit.entity.Player;
import org.bukkit.plugin.Plugin;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * ProtocolLibを使用したパケット処理
 * 
 * メリット:
 * - バージョン互換性が高い
 * - シンプルなAPI
 * - 読み取り/書き込みが簡単
 */
public class ProtocolLibPacketHandler {
    
    private final ProtocolManager protocolManager;
    private final Plugin plugin;
    
    public ProtocolLibPacketHandler(Plugin plugin) {
        this.plugin = plugin;
        this.protocolManager = ProtocolLibrary.getProtocolManager();
    }
    
    /**
     * パケットリスナーを登録
     */
    public void registerPacketListener() {
        
        // サーバーからクライアントへのパケットを監視
        protocolManager.addPacketListener(new PacketAdapter(
            plugin,
            ListenerPriority.NORMAL,
            PacketType.Play.Server.CHAT
        ) {
            @Override
            public void onPacketSending(PacketEvent event) {
                Player player = event.getPlayer();
                
                // パケット内容を読み取り
                PacketContainer packet = event.getPacket();
                
                // チャットタイプを確認
                int type = packet.getChatTypes().read(0).getType();
                
                // 内容を修改
                if (type == 0) { // システムメッセージ
                    String message = packet.getStrings().read(0);
                    if (message.contains("keyword")) {
                        event.setCancelled(true);
                        player.sendMessage("§cメッセージが遮断されました");
                    }
                }
            }
        });
        
        // クライアントからサーバーへのパケットを監視
        protocolManager.addPacketListener(new PacketAdapter(
            plugin,
            ListenerPriority.NORMAL,
            PacketType.Play.Client.CHAT
        ) {
            @Override
            public void onPacketReceiving(PacketEvent event) {
                Player player = event.getPlayer();
                PacketContainer packet = event.getPacket();
                
                String message = packet.getStrings().read(0);
                
                // 禁則文字チェック
                if (message.contains("bad_word")) {
                    event.setCancelled(true);
                    player.sendMessage("§cその言葉は使用できません！");
                }
            }
        });
    }
    
    /**
     * カスタムパケットを送信
     */
    public void sendFakeExplosion(Player player, double x, double y, double z) {
        try {
            PacketContainer packet = protocolManager.createPacket(PacketType.Play.Server.EXPLOSION);
            
            packet.getDoubles()
                .write(0, x)
                .write(1, y)
                .write(2, z);
            
            packet.getFloat()
                .write(0, 3.0f); // 強度
            
            // 空のブロックリスト
            packet.getBlockPositionCollectionModifier()
                .write(0, new java.util.ArrayList<>());
            
            // 速度
            packet.getVectors()
                .write(0, new org.bukkit.util.Vector(0, 0, 0));
            
            protocolManager.sendServerPacket(player, packet);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * タイトルを送信
     */
    public void sendTitle(Player player, String title, String subtitle) {
        try {
            // タイトルパケット
            PacketContainer titlePacket = protocolManager.createPacket(PacketType.Play.Server.TITLE);
            titlePacket.getChatComponents().write(0, 
                WrappedChatComponent.fromText(title));
            protocolManager.sendServerPacket(player, titlePacket);
            
            // サブタイトル（少し遅らせて送信）
            if (subtitle != null) {
                Bukkit.getScheduler().runTaskLater(plugin, () -> {
                    try {
                        PacketContainer subPacket = protocolManager.createPacket(PacketType.Play.Server.TITLE);
                        subPacket.getChatComponents().write(0, 
                            WrappedChatComponent.fromText(subtitle));
                        protocolManager.sendServerPacket(player, subPacket);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }, 2L);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * プレイヤーの頭上にある名前を変更
     */
    public void setPlayerlistName(Player player, String customName) {
        try {
            PacketContainer packet = protocolManager.createPacket(PacketType.Play.Server.PLAYER_LIST_HEADER_FOOTER);
            packet.getChatComponents().write(0, 
                WrappedChatComponent.fromText(customName));
            
            protocolManager.sendServerPacket(player, packet);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

#### ProtocolLib vs NMS直接操作 比較

| 項目 | NMS直接操作 | ProtocolLib |
|------|------------|-------------|
| 依存関係 | なし | ProtocolLib必要 |
| バージョン互換 | 低（変更が多い） | 高（自動解決） |
| 学習コスト | 高 | 中 |
| 機能 | 全て | 大部分 |
| パフォーマンス | やや高速 | 微量に遅い |

### Fabric専用コード例（Mod/Fabric/）

FabricはMod.loaderの一つで、直接Minecraft本体を改造します（GeyserMCもFabric版があります）。

```java
package com.example_plugin.Mod.Fabric;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;
import net.minecraft.server.network.ServerPlayerEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 作成者: MCPMOP_appi@作成者
 * Fabric 専用メインクラス
 * 
 * GeyserMC風: Fabric対応でModプラットフォームもサポート
 */
public class FabricMod implements ModInitializer {
    
    // Fabricのmod.jsonのmod_idと合わせる
    public static final String MOD_ID = "my-plugin";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);
    
    @Override
    public void onInitialize() {
        LOGGER.info("Fabric 対応");
        LOGGER.info("作成者: MCPMOP_appi@作成者");
        
        // サーバー開始/終了イベント
        ServerLifecycleEvents.SERVER_STARTED.register(server -> {
            LOGGER.info("サーバーが開始しました: " + server.getName());
        });
        
        ServerLifecycleEvents.SERVER_STOPPING.register(server -> {
            LOGGER.info("サーバーが停止しています...");
        });
        
        // コマンド登録
        CommandRegistrationCallback.EVENT.register((dispatcher, registryAccess, environment) -> {
            // コマンド登録処理
            // dispatcher.register(literal("mycommand").executes(context -> {
            //     context.getSource().sendMessage(Text.literal("Fabricで動作中！"));
            //     return 1;
            // }));
        });
    }
}
```

#### Fabric mod.json

```json
{
    "schemaVersion": 1,
    "id": "my-plugin",
    "version": "1.0.0",
    "name": "MyPlugin",
    "description": "Fabric版プラグイン - 作成者: MCPMOP_appi@作成者",
    "authors": ["MCPMOP_appi@作成者"],
    "contact": {},
    "license": "MIT",
    "icon": "assets/my-plugin/icon.png",
    "environment": "*",
    "entrypoints": {
        "modInitializer": ["com.example_plugin.Mod.Fabric.FabricMod"]
    },
    "depends": {
        "fabricloader": ">=0.14.0",
        "fabric-api": "*",
        "minecraft": "1.21.x"
    }
}
```

#### Fabric ビルド設定（build.gradle）

```groovy
plugins {
    id 'fabric-loom' version '1.4-SNAPSHOT'
    id 'maven-publish'
}

version = project.mod_version
group = project.mod_group_id

base {
    archivesName = project.archives_base_name
}

minecraft {
    runs {
        client {
            setSource sourceSets.main
            ideConfigGenerated 'run', 'client'
        }
        server {
            setSource sourceSets.main
            ideConfigGenerated 'run', 'server'
        }
    }
}

dependencies {
    // Fabric API
    modImplementation "net.fabricmc.fabric-api:fabric-api:${project.fabric_version}"
}

processResources {
    inputs.property 'version', project.version
    
    filesMatching('fabric.mod.json') {
        expand 'version': project.version
    }
}
```

### NeoForge専用コード例（Mod/NeoForge/）

NeoForgeはForgeの後継で、1.20.5以降の新Modローダーです（GeyserMCもNeoForge版があります）。

```java
package com.example_plugin.Mod.NeoForge;

import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.Mod;
import net.neoforged.fml.event.lifecycle.FMLClientSetupEvent;
import net.neoforged.fml.event.lifecycle.FMLCommonSetupEvent;
import net.neoforged.neoforge.event.RegisterCommandsEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.mojang.brigadier.CommandDispatcher;

/**
 * 作成者: MCPMOP_appi@作成者
 * NeoForge 専用メインクラス
 * 
 * GeyserMC風: NeoForge対応でModプラットフォームもサポート
 */
@Mod("my-plugin")
public class NeoForgeMod {
    
    public static final String MOD_ID = "my-plugin";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);
    
    public NeoForgeMod() {
        // イベントバスに登録
        NeoForgeModSetup.init();
    }
    
    // 共通セットアップ
    @Mod.EventBusSubscriber(modid = MOD_ID, bus = Mod.EventBusSubscriber.Bus.MOD)
    public static class NeoForgeModSetup {
        
        @SubscribeEvent
        public static void onCommonSetup(FMLCommonSetupEvent event) {
            LOGGER.info("NeoForge 共通セットアップ");
            LOGGER.info("作成者: MCPMOP_appi@作成者");
        }
        
        @SubscribeEvent
        public static void onClientSetup(FMLClientSetupEvent event) {
            LOGGER.info("NeoForge クライアントセットアップ");
        }
        
        @SubscribeEvent
        public static void onCommandRegister(RegisterCommandsEvent event) {
            CommandDispatcher<CommandSourceStack> dispatcher = event.getDispatcher();
            // コマンド登録
            // dispatcher.register(Commands.literal("mycommand")
            //     .executes(context -> {
            //         context.getSource().sendSuccess(() -> Component.literal("NeoForgeで動作中！"), true);
            //         return 1;
            //     })
            // );
        }
    }
}
```

#### NeoForge mods.toml

```toml
modLoader="javafml"
loaderVersion="[50,)"
license="MIT"

[[mods]]
modId="my-plugin"
version="1.0.0"
displayName="MyPlugin"
description='''
NeoForge版プラグイン
作成者: MCPMOP_appi@作成者
'''

[[dependencies.my-plugin]]
modId="neoforge"
type="required"
versionRange="[21.0,)"
ordering="NONE"
side="BOTH"

[[dependencies.my-plugin]]
modId="minecraft"
type="required"
versionRange="[1.21,1.22)"
ordering="NONE"
side="BOTH"
```

### Fabric/NeoForge 判定ユーティリティ

```java
// common/FabricNeoForgeUtils.java
package com.example.plugin.common;

/**
 * 作成者: MCPMOP_appi@作成者
 * Fabric/NeoForge 判定ユーティリティ
 */
public class FabricNeoForgeUtils {
    
    /**
     * Fabric環境で動作中か判定
     */
    public static boolean isFabric() {
        try {
            Class.forName("net.fabricmc.api.ModInitializer");
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }
    
    /**
     * NeoForge環境で動作中か判定
     */
    public static boolean isNeoForge() {
        try {
            Class.forName("net.neoforged.fml.common.Mod");
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }
    
    /**
     * Forge環境か判定（レガシー）
     */
    public static boolean isLegacyForge() {
        try {
            Class.forName("net.minecraftforge.common.MinecraftForge");
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }
    
    /**
     * Mod環境か判定
     */
    public static boolean isModEnvironment() {
        return isFabric() || isNeoForge() || isLegacyForge();
    }
    
    /**
     * Modローダー名を取得
     */
    public static String getModLoader() {
        if (isFabric()) return "Fabric";
        if (isNeoForge()) return "NeoForge";
        if (isLegacyForge()) return "Forge";
        return "Unknown";
    }
}
```

## コード生成規則

### タイプ判定ルール

| 入力 | 生成するタイプ | 例 |
|------|---------------|-----|
| Typeなし (通常) | 全タイプ (Spigot, Paper, Bukkit, BungeeCord, Velocity, Sponge, Fabric, NeoForge) | "Minecraft プラグインを作成して" |
| Type指定あり | 指定タイプのみ | "Paper プラグインを作成して" |
| ブロック名あり | Spigot/Paper/Bukkit/Sponge/Fabric/NeoForge のみ | "ライトブロックのプラグインを作成して" |

> ⚠️ **重要**: ブロック干渉系は BungeeCord/Velocity に対応しません。proxy系はサーバー上のブロックイベントを直接処理できないため除外されます。
> **注意**: Mod系（Fabric/NeoForge）はサーバー/クライアント両方に導入が必要です。

### Type指定パターン

| タイプ | キーワード |
|-------|----------|
| Paper | Paper, PaperMC |
| Spigot | Spigot |
| Bukkit | Bukkit |
| BungeeCord | BungeeCord, Bungee |
| Velocity | Velocity |
| Sponge | Sponge |
| Fabric | Fabric |
| NeoForge | NeoForge |

### ブロック追加バージョン早見表

| ブロック | 追加バージョン |
|---------|--------------|
| ライトブロック (Light Block) | 1.17 |
| アxmoid (Axolotl) | 1.17 |
| グローリング (Glow Squid) | 1.17 |
| スポーンアxmoidバケツ (Bucket) | 1.17 |
| ディープスレート (Deepslate) | 1.17 |
| ティント (Tint) | 1.17 |
| 銅ブロック (Copper) | 1.17 |
| スポナー (Spawner) 改善 | 1.17 |
| アンダース� (Underwater) 関連 | 1.13+ |
| ビーコニック (Beacon) | 1.9+ |
| シュルカー (Shulker) | 1.11+ |
| エルダーガーディアン (Elder Guardian) | 1.11+ |
| 黑龙 (End City) | 1.9+ |
| ナSection (Section) | 1.17+ |
| ビしょうか (Crying Obsidian) | 1.16+ |
| ネザライト (Netherite) | 1.16+ |
| .basalt (Basalt) | 1.16+ |
| Soul (Soul Sand, Soul Soil) | 1.16+ |
| lodestone (Lodestone) | 1.16+ |
| Respawn Anchor | 1.16+ |
| 竜頭 (Dragon Head) | 1.9+ |

> 備考: ブロック名からバージョンを判断できない場合は、1.8.8をデフォルトとする

### 必須事項

1. **作成者**: すべての Java クラスの javadoc/コメントに以下を含める:
   ```java
   /**
    * 作成者: MCPMOP_appi@作成者
    * バージョン: {version}
    */
   ```

2. **全サーバatype対応** (Type未指定の場合): コードには以下を常にコメントアウトなしで含める:
   ```java
   // Spigot/Paper/Bukkit/BungeeCord/Velocity/Sponge
   import org.bukkit.Bukkit;
   import org.spigotmc.event.entity.EntityMountEvent;
   import net.md_5.bungee.api.plugin.Plugin;
   import com.velocitypowered.api.plugin.Plugin;
   import org.spongepowered.api.plugin.Plugin;
   ```

3. **バージョン対応**: 対応バージョンはブロック名から判断。デフォルトは 1.8.8

### バージョン別対応表

| バージョン範囲 | Minecraft | Paper | Spigot |
|---|---|---|---|
| 1.8.8 - 1.12.2 | 1.8.8 - 1.12.2 | N/A | 1.9.4, 1.10.2, 1.11.2, 1.12.2 |
| 1.13 - 1.16.5 | 1.13 - 1.16.5 | 1.13 - 1.16.5 | 1.13.2, 1.14.4, 1.15.2, 1.16.5 |
| 1.17 - 1.18.2 | 1.17 - 1.18.2 | 1.17 - 1.18.2 | 1.18.2 |
| 1.19 - 1.20.4 | 1.19 - 1.20.4 | 1.19 - 1.20.4 | 1.19.4, 1.20.4 |
| 1.21 - 1.21.11 | 1.21 - 1.21.11 | 1.21 - 1.21.11 | 1.21+ |

### 最小 pom.xml テンプレート

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>my-plugin</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>MyPlugin</name>
    <description>Plugin for Minecraft 1.8.8 - 1.21.11</description>

    <properties>
        <!-- ⚠️ Java 8 へのリリース設定: 1.8.8サーバーでの実行に必要な重要設定 -->
        <java.release>8</java.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <!-- Adventure API (1.20.5+ Data Components対応) -->
        <adventure.version>4.17.0</adventure.version>
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
        <!-- Adventure API (1.20.5+対応) -->
        <repository>
            <id>sonatype</id>
            <url>https://oss.sonatype.org/content/repositories/snapshots/</url>
        </repository>
    </repositories>

    <dependencies>
        <!-- Paper/Spigot/Bukkit -->
        <dependency>
            <groupId>io.papermc.paper</groupId>
            <artifactId>paper-api</artifactId>
            <version>1.21.4-R0.1-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>
        
        <!-- Adventure API (1.20.5+ Data Components対応) -->
        <dependency>
            <groupId>net.kyori</groupId>
            <artifactId>adventure-text-minimessage</artifactId>
            <version>${adventure.version}</version>
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
            <!-- Java コンパイラ設定 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.13.0</version>
                <configuration>
                    <!-- ⚠️ release: 8 でJava 8との下位互換性を保証 -->
                    <release>${java.release}</release>
                </configuration>
            </plugin>

            <!-- Shade (JAR結合) + Relocation (パッケージ名変更) -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>3.5.1</version>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>shade</goal>
                        </goals>
                        <configuration>
                            <createDependencyReducedPom>false</createDependencyReducedPom>
                            <minimizeJar>false</minimizeJar>
                            
                            <!-- Relocation: ライブラリのパッケージ名を変更して衝突を防ぐ -->
                            <relocations>
                                <!-- Gson の衝突防止 -->
                                <relocation>
                                    <pattern>com.google.gson</pattern>
                                    <shadedPattern>com.example.lib.gson.v2</shadedPattern>
                                </relocation>
                                <!-- Adventure API の衝突防止 -->
                                <relocation>
                                    <pattern>net.kyori.adventure</pattern>
                                    <shadedPattern>com.example.lib.adventure</shadedPattern>
                                </relocation>
                                <!-- Jackson の衝突防止 -->
                                <relocation>
                                    <pattern>com.fasterxml.jackson</pattern>
                                    <shadedPattern>com.example.lib.jackson</shadedPattern>
                                </relocation>
                                <!-- Reflections Library -->
                                <relocation>
                                    <pattern>org.reflections</pattern>
                                    <shadedPattern>com.example.lib.reflections</shadedPattern>
                                </relocation>
                            </relocations>
                            
                            <filters>
                                <filter>
                                    <artifact>*:*</artifact>
                                    <excludes>
                                        <exclude>META-INF/*.SF</exclude>
                                        <exclude>META-INF/*.DSA</exclude>
                                        <exclude>META-INF/*.RSA</exclude>
                                        <exclude>META-INF/versions/**</exclude>
                                    </excludes>
                                </filter>
                            </filters>
                        </configuration>
                    </execution>
                </executions>
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
```

### Main クラス テンプレート

```java
package com.example.plugin;

import org.bukkit.plugin.java.JavaPlugin;
import net.md_5.bungee.api.plugin.Plugin;
import com.velocitypowered.api.plugin.Plugin;
import org.spongepowered.api.plugin.Plugin;

/**
 * 作成者: MCPMOP_appi@作成者
 * マイクラプラグインのメインクラス
 * 
 * 対応バージョン: Minecraft 1.8.8 - 1.21.11
 * 対応プラットフォーム: Spigot / Paper / Bukkit / BungeeCord / Velocity / Sponge
 */
public class Main extends JavaPlugin {
    
    private static Main instance;
    
    @Override
    public void onEnable() {
        instance = this;
        getLogger().info("=================================");
        getLogger().info("Plugin enabled!");
        getLogger().info("作成者: MCPMOP_appi@作成者");
        getLogger().info("対応バージョン: 1.8.8 - 1.21.11");
        getLogger().info("=================================");
        
        // コマンド登録
        getCommand("mycommand").setExecutor(new MyCommandExecutor());
        
        // イベント登録
        getServer().getPluginManager().registerEvents(new MyListener(), this);
        
        // 設定ファイル生成
        saveDefaultConfig();
    }
    
    @Override
    public void onDisable() {
        getLogger().info("Plugin disabled!");
        saveConfig();
    }
    
    public static Main getInstance() {
        return instance;
    }
}
```

### コマンドクラス テンプレート

```java
package com.example.plugin;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

/**
 * 作成者: MCPMOP_appi@作成者
 */
public class MyCommandExecutor implements CommandExecutor {
    
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        // コマンド処理
        if (command.getName().equalsIgnoreCase("mycommand")) {
            if (sender instanceof Player) {
                Player player = (Player) sender;
                player.sendMessage("§aこのコマンドは MCPMOP_appi@作成者 が作成しました");
                player.sendMessage("§b対応バージョン: 1.8.8 - 1.21.11");
            } else {
                sender.sendMessage("コンソールからは実行できません");
            }
            return true;
        }
        return false;
    }
}
```

### イベントリスナークラス テンプレート

```java
package com.example.plugin;

import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;

/**
 * 作成者: MCPMOP_appi@作成者
 */
public class MyListener implements Listener {
    
    @Main main;
    
    public MyListener(Main main) {
        this.main = main;
    }
    
    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        String playerName = event.getPlayer().getName();
        event.setJoinMessage("§a[+] " + playerName + " が参加しました");
        event.getPlayer().sendMessage("§6§l===== ようこそ =====");
        event.getPlayer().sendMessage("§eこのサーバーは MCPMOP_appi@作成者 のプラグインで運営されています");
        event.getPlayer().sendMessage("§e対応バージョン: §a1.8.8 - 1.21.11");
    }
    
    @EventHandler
    public void onPlayerQuit(PlayerQuitEvent event) {
        String playerName = event.getPlayer().getName();
        event.setQuitMessage("§c[-] " + playerName + " が退出しました");
    }
}
```

### plugin.yml テンプレート

```yaml
name: MyPlugin
version: 1.0.0
main: com.example.plugin.Main
api-version: '1.21'
description: |
  Minecraft 1.8.8 - 1.21.11 対応のプラグイン
  作成者: MCPMOP_appi@作成者

author: MCPMOP_appi@作成者

commands:
  mycommand:
    description: テストコマンド
    usage: /mycommand
    permission: myplugin.use

permissions:
  myplugin.use:
    description: 기본コマンドを使用する権限
    default: true
```

## ビルド方法

### Maven ビルド

```bash
mvn clean package
```

### 出力 jar の場所

```
target/{artifactId}-{version}.jar
```

## NMS バージョン対応ベストプラクティス

LuckPerms/ViaVersion のようなマルチモジュール構成を推奨します。

### ⚠️ 重要: 1.21.x以降での変更点

| 項目 | 1.20.x以前 | 1.21.x以降 |
|------|-----------|------------|
| パッケージ名 | `net.minecraft.server.v1_XX_RX` | `net.minecraft.server` (直接参照) |
| CraftBukkit | `org.bukkit.craftbukkit.v1_XX_RX` | `org.bukkit.craftbukkit` |
| MojangMappings | リフレクション必要 | 直接import可能 |
| バージョン判定 | `parts[3]` で取得 | `parts.length <= 3` で判定 |

**1.21.x以降では v1_XX_RX パッケージが完全に廃止**され、Mojang Mappings がデフォルトになりました。

### 1. プロジェクト構造の設計（ViaVersion/LuckPerms風）

```
my-plugin/
├── api/                     # APIモジュール（共通インターフェース）
│   └── src/main/java/
│       └── com/example/plugin/api/
│           ├── MyPluginAPI.java
│           └── platform/
│               └── PlatformType.java
├── common/                  # 共通実装モジュール
│   └── src/main/java/
│       └── com/example/plugin/common/
│           ├── AbstractPlugin.java     # 抽象基本クラス
│           ├── ConfigManager.java
│           ├── NMSReflectionUtils.java  # 1.21.x対応リフレクション
│           └── managers/
│               └── PermissionManager.java
├── bukkit/                  # Bukkit/Spigot/Paper モジュール
│   └── src/main/java/
│       └── com/example/plugin/bukkit/
│           ├── BukkitPlugin.java      # メインクラス
│           ├── commands/
│           ├── listeners/
│           └── v1_XX_RX/             # 1.20.x以前向けバージョン別NMS実装
│           │   ├── Handler_v1_19_R1.java
│           │   ├── Handler_v1_20_R1.java
│           │   └── Handler_v1_20_R3.java
│           └── modern/                # 1.21.x+向け直接参照
│               └── ModernHandler.java   # Mojang Mappings直接使用
├── bungee/                  # BungeeCord モジュール
│   └── src/main/java/
│       └── com/example/plugin/bungee/
│           └── BungeePlugin.java
├── velocity/                # Velocity モジュール
│   └── src/main/java/
│       └── com/example/plugin/velocity/
│           └── VelocityPlugin.java
├── sponge/                  # Sponge モジュール
│   └── src/main/java/
│       └── com/example/plugin/sponge/
│           └── SpongePlugin.java
├── universal/               # 全プラットフォーム共通
│   └── src/main/java/
│       └── com/example/plugin/universal/
│           └── PluginBootstrap.java
└── build.gradle.kts         # Gradleビルド設定
```

### LuckPerms風のモジュール構成

| モジュール | 役割 | 依存 |
|-----------|------|------|
| **api** | 共通インターフェース定義 | なし |
| **common** | コアロジック実装 | api |
| **bukkit** | Spigot/Paper実装 | api, common |
| **bungee** | BungeeCord実装 | api, common |
| **velocity** | Velocity実装 | api, common |
| **sponge** | Sponge実装 | api, common |
| **universal** | 全プラットフォーム共通 | api |

### 2. インターフェース定義（apiモジュール）

```java
// api/src/main/java/com/example/plugin/api/MyPluginAPI.java
package com.example.plugin.api;

/**
 * 作成者: MCPMOP_appi@作成者
 */
public interface MyPluginAPI {
    
    /**
     * プレイヤーにメッセージを送信
     */
    void sendMessage(UUID player, String message);
    
    /**
     * パーミッション付与
     */
    void addPermission(UUID player, String permission);
    
    /**
     * 設定取得
     */
    Object getConfig(String key);
}
```

```java
// api/src/main/java/com/example/plugin/api/platform/PlatformType.java
package com.example.plugin.api.platform;

/**
 * 作成者: MCPMOP_appi@作成者
 */
public enum PlatformType {
    BUKKIT,    // Spigot/Paper
    BUNGEE,    // BungeeCord
    VELOCITY,  // Velocity
    SPONGE     // Sponge
}
```

### 3. 共通抽象クラス（commonモジュール）

```java
// common/src/main/java/com/example/plugin/common/AbstractPlugin.java
package com.example.plugin.common;

import com.example.plugin.api.MyPluginAPI;
import com.example.plugin.api.platform.PlatformType;

/**
 * 作成者: MCPMOP_appi@作成者
 * 全プラットフォーム共通抽象クラス
 */
public abstract class AbstractPlugin implements MyPluginAPI {
    
    protected final PlatformType platformType;
    protected Object config;
    
    protected AbstractPlugin(PlatformType platformType) {
        this.platformType = platformType;
    }
    
    @Override
    public Object getConfig(String key) {
        return config;
    }
    
    /**
     * プラットフォーム種別の取得
     */
    public PlatformType getPlatformType() {
        return platformType;
    }
    
    /**
     * ログ出力
     */
    protected abstract void log(String message);
    
    /**
     * 設定ファイルのロード
     */
    protected abstract void loadConfig();
}
```

### 4. Bukkit版実装（バージョン別NMS処理）

```java
// bukkit/src/main/java/com/example/plugin/bukkit/BukkitPlugin.java
package com.example.plugin.bukkit;

import com.example.plugin.api.platform.PlatformType;
import com.example.plugin.common.AbstractPlugin;
import org.bukkit.plugin.java.JavaPlugin;

/**
 * 作成者: MCPMOP_appi@作成者
 * Spigot/Paper 向けメインクラス
 */
public class BukkitPlugin extends JavaPlugin {
    
    private static BukkitPlugin instance;
    private BukkitHandler handler;
    
    @Override
    public void onEnable() {
        instance = this;
        
        // バージョン別ハンドラーを取得
        handler = BukkitHandler.getHandler();
        
        log("BukkitPlugin 有効化");
        log("対応バージョン: " + handler.getVersion());
        log("作成者: MCPMOP_appi@作成者");
    }
    
    @Override
    public void onDisable() {
        log("BukkitPlugin 無効化");
    }
    
    private void log(String message) {
        getLogger().info(message);
    }
    
    public static BukkitPlugin getInstance() {
        return instance;
    }
}
```

```java
// bukkit/src/main/java/com/example/plugin/bukkit/BukkitHandler.java
package com.example.plugin.bukkit;

/**
 * 作成者: MCPMOP_appi@作成者
 * NMSバージョン別ハンドラー基底クラス
 */
public abstract class BukkitHandler {
    
    private static BukkitHandler handler;
    
    /**
     * バージョンに応じたハンドラーを生成
     */
    public static BukkitHandler getHandler() {
        if (handler != null) return handler;
        
        String version = getServerVersion();
        
        switch (version) {
            case "v1_21_R3":
                handler = new v1_21_R3.Handler();
                break;
            case "v1_21_R2":
                handler = new v1_21_R2.Handler();
                break;
            case "v1_21_R1":
                handler = new v1_21_R1.Handler();
                break;
            case "v1_20_R4":
            case "v1_20_R3":
                handler = new v1_20_R3.Handler();
                break;
            case "v1_20_R2":
                handler = new v1_20_R2.Handler();
                break;
            case "v1_20_R1":
                handler = new v1_20_R1.Handler();
                break;
            case "v1_19_R3":
                handler = new v1_19_R3.Handler();
                break;
            case "v1_19_R1":
                handler = new v1_19_R1.Handler();
                break;
            default:
                // 未知バージョンは最新として扱う
                handler = new v1_21_R3.Handler();
                break;
        }
        return handler;
    }
    
    /**
     * サーバーNMSバージョンを取得
     */
    private static String getServerVersion() {
        String packageName = org.bukkit.Bukkit.getServer().getClass().getPackage().getName();
        return packageName.split("\\.")[3];
    }
    
    public abstract String getVersion();
    
    public abstract void sendTitle(Object player, String title, String subtitle);
}
```

```java
// bukkit/src/main/java/com/example/plugin/bukkit/v1_21_R3/Handler.java
package com.example.plugin.bukkit.v1_21_R3;

/**
 * 作成者: MCPMOP_appi@作成者
 * 対応バージョン: 1.21.4+ (v1_XX_RX パッケージ廃止)
 */
public class Handler extends com.example.plugin.bukkit.BukkitHandler {
    
    @Override
    public String getVersion() {
        return "1.21.4+ (Modern - Mojang Mappings)";
    }
    
    @Override
    public void sendTitle(Object player, String title, String subtitle) {
        // 1.21.4+ のタイトル送信実装
        // v1_XX_RX パッケージが廃止されたため、
        // Mojang Mappings を直接使用可能
        // import net.minecraft.network.protocol.game.ClientboundSetTitleTextPacket;
    }
}
```

### 1.21.x+ 向け ModernHandler（Mojang Mappings 直接使用）

```java
// bukkit/src/main/java/com/example/plugin/bukkit/modern/ModernHandler.java
package com.example.plugin.bukkit.modern;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * ⚠️ 1.21.x以降専用
 * v1_XX_RX パッケージが完全に廃止されたため、
 * Mojang Mappings を直接 import 可能
 */
public class ModernHandler {
    
    /**
     * Mojang Mappings を直接使用可能
     * 例: net.minecraft.server.EntityPlayer
     */
    public void exampleMethod(org.bukkit.entity.Player player) {
        // 1.21.x+: 直接参照
        // import net.minecraft.server.EntityPlayer;
        // import net.minecraft.network.protocol.game.ClientboundSetTitleTextPacket;
        
        // 例: プレイヤー接続情報を取得
        // Object entityPlayer = ((CraftPlayer) player).getHandle();
    }
    
    /**
     * EntityPlayer クラスを直接取得（リフレクション不要）
     */
    public Class<?> getEntityPlayerClass() {
        // 1.21.x+: 直接クラス参照
        return net.minecraft.server.EntityPlayer.class;
    }
    
    /**
     * NMSパケットを直接送信
     */
    public void sendPacket(org.bukkit.entity.Player player, Object packet) {
        // 1.21.x+: CraftPlayer#getHandle() で EntityPlayer を取得
        // その後 player.connection.send(packet) で送信
        var craftPlayer = (org.bukkit.craftbukkit.entity.CraftPlayer) player;
        var entityPlayer = craftPlayer.getHandle();
        // entityPlayer.b.a(packet); // send packet
    }
}
```

### 5. BungeeCord版実装

```java
// bungee/src/main/java/com/example/plugin/bungee/BungeePlugin.java
package com.example.plugin.bungee;

import com.example.plugin.api.platform.PlatformType;
import com.example.plugin.common.AbstractPlugin;
import net.md_5.bungee.api.plugin.Plugin;

/**
 * 作成者: MCPMOP_appi@作成者
 * BungeeCord 向けメインクラス
 */
public class BungeePlugin extends Plugin {
    
    private static BungeePlugin instance;
    private BungeePluginImpl pluginImpl;
    
    @Override
    public void onEnable() {
        instance = this;
        pluginImpl = new BungeePluginImpl();
        
        getLogger().info("BungeeCord Plugin 有効化");
        getLogger().info("作成者: MCPMOP_appi@作成者");
    }
}
```

### 6. Velocity版実装

```java
// velocity/src/main/java/com/example/plugin/velocity/VelocityPlugin.java
package com.example.plugin.velocity;

import com.google.inject.Inject;
import com.velocitypowered.api.event.Subscribe;
import com.velocitypowered.api.event.proxy.ProxyInitializeEvent;
import com.velocitypowered.api.plugin.Plugin;
import com.velocitypowered.api.plugin.annotation.DataDirectory;
import java.nio.file.Path;

/**
 * 作成者: MCPMOP_appi@作成者
 * Velocity 向けメインクラス
 */
@Plugin(
    id = "my-plugin",
    name = "MyPlugin",
    version = "1.0.0",
    description = "作成者: MCPMOP_appi@作成者"
)
public class VelocityPlugin {
    
    @Inject
    public VelocityPlugin(@DataDirectory Path dataDirectory) {
        // 初期化
    }
    
    @Subscribe
    public void onProxyInitialization(ProxyInitializeEvent event) {
        // 有効化処理
    }
}
```

### Mojang Mappings 難読化対策EnhancedReflectionUtils

1.21.x以降ではフィールド名・メソッド名が難読化されている場合があるため、バージョンごとにマッピングを解決するEnhanced版を用意します。

```java
// common/EnhancedReflectionUtils.java
package com.example.plugin.common;

import org.bukkit.Bukkit;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

/**
 * 作成者: MCPMOP_appi@作成者
 * 
 * Mojang Mappings 対応リフレクションUtility
 * 
 * ⚠️ 1.21.x以降では実行時のフィールド名・メソッド名が
 *    難読化（obfuscated）されている場合がある
 *    Paperweight使用時はビルド時Mappingsで解決可能
 */
public class EnhancedReflectionUtils {
    
    // Mojang Mappings → SpigotMappings (srg名) のマッピング
    // よく使うフィールド・メソッドを事前定義
    private static final Map<String, String> SRG_TO_MOJANG = new HashMap<>();
    
    static {
        // EntityPlayer関連
        SRG_TO_MOJANG.put("b", "playerConnection");    // PlayerConnection
        SRG_TO_MOJANG.put("c", "networkManager");       // NetworkManager
        SRG_TO_MOJANG.put("d", "ch");                   // Packet
        SRG_TO_MOJANG.put("getHandle", "b");            // CraftPlayer -> EntityPlayer
        
        // WorldServer関連
        SRG_TO_MOJANG.put("worldData", "od");           // WorldData
        
        // Packet関連
        SRG_TO_MOJANG.put("a", "a");                    // write
        SRG_TO_MOJANG.put("b", "b");                    // read
    }
    
    private static final String VERSION = Bukkit.getServer().getClass()
        .getPackage().getName().split("\\.")[3];
    
    /**
     * SRG名（難読化名）からMojang名を取得
     */
    public static String demap(String srgName) {
        return SRG_TO_MOJANG.getOrDefault(srgName, srgName);
    }
    
    /**
     * フィールドを名前で取得（難読化名対応）
     */
    public static Field getField(Class<?> clazz, String... names) {
        for (String name : names) {
            try {
                // Mojang名から試行
                try {
                    return clazz.getDeclaredField(name);
                } catch (NoSuchFieldException e) {
                    // SRG名で再試行
                    String demapped = demap(name);
                    if (!demapped.equals(name)) {
                        return clazz.getDeclaredField(demapped);
                    }
                }
            } catch (NoSuchFieldException ignored) {}
        }
        return null;
    }
    
    /**
     * メソッドを名前で取得（難読化名対応）
     */
    public static Method getMethod(Class<?> clazz, String name, Class<?>... paramTypes) {
        try {
            return clazz.getMethod(name, paramTypes);
        } catch (NoSuchMethodException e) {
            // SRG名で再試行
            String demapped = demap(name);
            if (!demapped.equals(name)) {
                try {
                    return clazz.getMethod(demapped, paramTypes);
                } catch (NoSuchMethodException ignored) {}
            }
        }
        return null;
    }
    
    /**
     * フィールドの値を取得
     */
    public static Object getFieldValue(Object obj, String fieldName) {
        try {
            Class<?> clazz = obj.getClass();
            Field field = getField(clazz, fieldName);
            if (field != null) {
                field.setAccessible(true);
                return field.get(obj);
            }
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        }
        return null;
    }
    
    /**
     * フィールドの値を設定
     */
    public static void setFieldValue(Object obj, String fieldName, Object value) {
        try {
            Class<?> clazz = obj.getClass();
            Field field = getField(clazz, fieldName);
            if (field != null) {
                field.setAccessible(true);
                field.set(obj, value);
            }
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        }
    }
    
    /**
     * メソッドをinvoke
     */
    public static Object invoke(Object obj, String methodName, Object... args) {
        try {
            Class<?> clazz = obj.getClass();
            Class<?>[] paramTypes = new Class[args.length];
            for (int i = 0; i < args.length; i++) {
                paramTypes[i] = args[i].getClass();
            }
            Method method = getMethod(clazz, methodName, paramTypes);
            if (method != null) {
                method.setAccessible(true);
                return method.invoke(obj, args);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
```

### 7. バージョン別パッケージ名一覧

| バージョン | NMS パッケージ名 | CraftBukkit パッケージ名 |
|-----------|----------------|------------------------|
| 1.8.8 | v1_8_R1 | v1_8_R1 |
| 1.12.2 | v1_12_R1 | v1_12_R1 |
| 1.16.5 | v1_16_R1 | v1_16_R1 |
| 1.17 | v1_17_R1 | v1_17_R1 |
| 1.18.2 | v1_18_R1 | v1_18_R1 |
| 1.19.4 | v1_19_R1 | v1_19_R1 |
| 1.20.1 | v1_20_R1 | v1_20_R1 |
| 1.20.4 | v1_20_R2 | v1_20_R2 |
| 1.21 | v1_21_R1 | v1_21_R1 |
| 1.21.4 | v1_21_R3 | v1_21_R3 |

### 8. リフレクションUtil（共通）

```java
// common/src/main/java/com/example/plugin/common/utils/ReflectionUtils.java
package com.example.plugin.common.utils;

/**
 * 作成者: MCPMOP_appi@作成者
 * NMSリフレクション汎用Util
 */
public class ReflectionUtils {
    
    /**
     * NMS バージョン文字列を取得
     * 例: v1_21_R3
     */
    public static String getNMSVersion(Class<?> serverClass) {
        String packageName = serverClass.getPackage().getName();
        return packageName.split("\\.")[3];
    }
    
    /**
     * NMS クラスを動的に取得
     */
    public static Class<?> getNMSClass(String version, String className) {
        try {
            return Class.forName("net.minecraft.server." + version + "." + className);
        } catch (ClassNotFoundException e) {
            return null;
        }
    }
    
    /**
     * CraftBukkit クラスを動的に取得
     */
    public static Class<?> getCraftClass(String version, String className) {
        try {
            return Class.forName("org.bukkit.craftbukkit." + version + "." + className);
        } catch (ClassNotFoundException e) {
            return null;
        }
    }
    
    /**
     * メソッドをinvoke
     */
    public static Object invokeMethod(Object obj, String methodName, Object... args) {
        try {
            for (java.lang.reflect.Method method : obj.getClass().getDeclaredMethods()) {
                if (method.getName().equals(methodName)) {
                    method.setAccessible(true);
                    return method.invoke(obj, args);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
```

## 高度なトピック

### マルチリリースJAR (MRJAR)

Java 8とJava 21の機能を混在させる場合、Multi-Release JARを活用すると、実行環境のJavaバージョンに応じて読み込むクラスファイルを自動で切り替えられます。

#### プロジェクト構造

```
src/
├── main/
│   ├── java/
│   │   └── com/example/plugin/        # Java 8互換コード
│   └── java21/
│       └── com/example/plugin/        # Java 21専用コード
└── META-INF/
    └── versions/
        └── 21/
            └── com/example/plugin/     # Java 21専用クラス
```

#### pom.xml設定

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <version>3.13.0</version>
    <configuration>
        <release>8</release>
    </configuration>
</plugin>

<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-jar-plugin</artifactId>
    <version>3.3.0</version>
    <configuration>
        <archive>
            <manifestEntries>
                <Multi-Release>true</Multi-Release>
            </manifestEntries>
        </archive>
    </configuration>
</plugin>
```

#### Java 8コード例

```java
// src/main/java/com/example/plugin/ExampleClass.java
package com.example.plugin;

public class ExampleClass {
    public String getGreeting() {
        return "Hello from Java 8!";
    }
}
```

#### Java 21コード例

```java
// src/main/java21/com/example/plugin/ExampleClass.java
package com.example.plugin;

public class ExampleClass {
    public String getGreeting() {
        return "Hello from Java 21 with Virtual Threads!";
    }
}
```

### Paperweight ツールチェーン（Paper 1.17+特化）

PaperweightはPaperMC公式のビルドツールチェーンで、Mojang Mappingsを直接利用可能にし、開発効率を飛躍的に向上させます。

#### build.gradle.kts設定例

```kotlin
plugins {
    id("io.papermc.paperweight.userdev") version "1.7.1"
}

repositories {
    mavenCentral()
}

paperweight {
    minecraftVersion.set("1.21.4")
}

tasks {
    assemble {
        dependsOn("reobfJar")
    }

    reobfJar {
        output.set(file("build/libs/${project.name}-${version}.jar"))
    }
}
```

#### Paperweightを使うメリット

| 項目 | リフレクション | Paperweight |
|------|--------------|-------------|
| NMS直接参照 | `Class.forName()` | 直接import可能 |
| MojangMappings | 使用不可 | 使用可能 |
| ビルド速度 | 早い | やや遅い |
| サーバー依存 | なし | ビルド時必要 |

#### バージョン指定なしの時 (Type=Paper推奨)

```kotlin
// 最新Paper対応の場合
paperweight {
    minecraftVersion.set("1.21.4")
}

// 範囲指定したい場合（注意: Paperweightは単一バージョン）
// 複数バージョン対応は handlers/ によるリフレクションが必要
```

### Gradle Build-Conventions（GeyserMC風）

大規模プロジェクトでは、共通ビルド設定を`build-logic`モジュールに分離して、再利用性と一貫性を確保します（GeyserMCのパターンを参考）。

#### プロジェクト構造

```
my-plugin/
├── build-logic/                     # 共通ビルド設定
│   ├── build.gradle.kts
│   └── src/main/kotlin/
│       ├── conventions/
│       │   ├── java-conventions.gradle.kts
│       │   ├── minecraft-conventions.gradle.kts
│       │   └── publishing-conventions.gradle.kts
│       └── plugins/
│           ├── java-conventions-plugin.gradle.kts
│           └── minecraft-conventions-plugin.gradle.kts
│
├── build.gradle.kts                 # プロジェクトルート
├── settings.gradle.kts             # プロジェクト設定
│
├── api/                            # APIモジュール
├── common/                         # 共通モジュール
├── bukkit/                         # Spigot/Paperモジュール
├── bungee/                         # BungeeCordモジュール
├── velocity/                       # Velocityモジュール
├── fabric/                         # Fabricモジュール
└── neoforge/                       # NeoForgeモジュール
```

#### build-logic/build.gradle.kts

```kotlin
plugins {
    `kotlin-dsl`
}

repositories {
    mavenCentral()
    gradlePluginPortal()
}

dependencies {
    // Kotlin Gradle Plugin
    implementation("org.jetbrains.kotlin:kotlin-gradle-plugin:2.0.0")
    
    // Minecraft Development Plugin
    implementation("org.gradle:gradle-kotlin-dsl:2.0")
}
```

#### build-logic/src/main/kotlin/conventions/java-conventions.gradle.kts

```kotlin
// 共通Java設定
plugins {
    `java-library`
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
    
    withSourcesJar()
    withJavadocJar()
}

// コーディングスタイル
tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
}

// リント
tasks.withType<Test> {
    useJUnitPlatform()
}
```

#### build-logic/src/main/kotlin/conventions/minecraft-conventions.gradle.kts

```kotlin
// Minecraftプロジェクト共通設定
plugins {
    id("java-conventions")
}

dependencies {
    // Adventure Text Library（GeyserMCも使用）
    api("net.kyori:adventure-api:4.17.0")
    api("net.kyori:adventure-text-minimessage:4.17.0")
    api("net.kyori:adventure-text-logback-slf4j:4.17.0")
}

// プラットフォーム別依存関係
subprojects {
    dependencies {
        // Spigot
        "spigotImplementation"("org.spigotmc:spigot-api:1.21.4-R0.1-SNAPSHOT")
        
        // BungeeCord
        "bungeeImplementation"("net.md-5:bungeecord-api:1.21-R0.1-SNAPSHOT")
        
        // Velocity
        "velocityImplementation"("com.velocitypowered:velocity-api:3.3.0-SNAPSHOT")
        "velocityAnnotationProcessor"("com.velocitypowered:velocity-api:3.3.0-SNAPSHOT")
        
        // Fabric
        "fabricImplementation"("net.fabricmc:fabric-api:+")
        
        // NeoForge
        "neoforgeImplementation"("net.neoforged:neoforge:+")
    }
}
```

#### ルートbuild.gradle.kts

```kotlin
plugins {
    id("conventions.java")
    id("conventions.minecraft") version "1.0.0"
}

allprojects {
    group = "com.example.plugin"
    version = "1.0.0"
    
    repositories {
        mavenCentral()
        maven("https://repo.papermc.io/repository/maven-public/")
        maven("https://oss.sonatype.org/content/repositories/snapshots/")
        maven("https://maven.neoforged.net/releases")
    }
}

subprojects {
    // 各プラットフォーム向け設定
    configure(listOf(
        project(":bukkit"),
        project(":bungee"),
        project(":velocity"),
        project(":fabric"),
        project(":neoforge")
    )) {
        tasks.jar {
            manifest {
                attributes["Created-By"] = "MCPMOP_appi@作成者"
            }
        }
    }
}
```

#### settings.gradle.kts

```kotlin
rootProject.name = "my-plugin"

include(":api")
include(":common")
include(":bukkit")
include(":bungee")
include(":velocity")
include(":fabric")
include(":neoforge")

// build-logic はインクルードしない
val buildLogicProjects = listOf(":build-logic")
```

#### GitHub Actions ビルド設定

```yaml
# .github/workflows/build.yml
name: Build

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
      with:
        submodules: recursive
        
    - name: Set up JDK 21
      uses: actions/setup-java@v4
      with:
        java-version: '21'
        distribution: 'temurin'
        cache: 'gradle'
        
    - name: Build with Gradle
      run: ./gradlew build
      
    - name: Upload artifacts
      uses: actions/upload-artifact@v4
      with:
        name: plugin-jars
        path: '**/build/libs/*.jar'
```

## ブロック名指定時の Proxy 除外ルール（重要）

### なぜProxy (BungeeCord/Velocity) を除外するのか

| プラットフォーム | ブロックイベント | 理由 |
|---------------|----------------|------|
| **Spigot/Paper** | ✅ 対応 | サーバー内でブロック操作可能 |
| **BungeeCord** | ❌ 非対応 | プロキシはブロックに触れられない |
| **Velocity** | ❌ 非対応 | プロキシはブロックに触れられない |

**物理的な不整合**: プロキシサーバーはワールドデータを持たず、直接的なブロック操作が不可能なため、ブロック干渉系プラグインでは除外が必須です。

### 判定フロー

```
入力: "ライトブロックのプラグインを作成して"
  │
  ├─ ブロック名あり? → はい
  │    └─ Proxy除外 → Spigot, Paper, Bukkit, Sponge のみ生成
  │
  ├─ Type指定あり? → はい (例: Paper)
  │    └─ 指定タイプのみ生成
  │
  └─ どちらもなし → 全タイプ生成 (Spigot, Paper, Bukkit, BungeeCord, Velocity, Sponge)
```

### アイテム操作判定フロー

```
入力: "特定のアイテムにカスタム名を付けて配布する"
  │
  ├─ 1.20.5以上? → Data Components API (Adventure/Component)
  │    └─ ItemUtils.is1205Plus() → Component API使用
  │
  ├─ 1.13 〜 1.20.4? → ItemMeta API (Legacy)
  │    └─ ItemMeta.setDisplayName() / setLore()
  │
  └─ 1.8.8? → Material.ID 考慮
       └─ 数字IDを使用（必要に応じて）
```

### データ構造別処理分岐

```java
// アイテム操作のバージョン分岐
if (VersionUtils.is1205Plus()) {
    // 1.20.5+: Data Components API
    item.editMeta(meta -> {
        meta.displayName(net.kyori.adventure.text.Component.text("名前"));
        meta.lore(List.of(net.kyori.adventure.text.Component.text("説明")));
    });
} else if (VersionUtils.getMajorVersion() >= 13) {
    // 1.13-1.20.4: ItemMeta
    ItemMeta meta = item.getItemMeta();
    meta.setDisplayName("名前");
    meta.setLore(List.of("説明"));
    item.setItemMeta(meta);
} else {
    // 1.8.x: Material ID
    item.setDurability((short) 0);
}
```

## 共通 GOTCHAS

- **LuckPerms/ViaVersion風アーキテクチャ**: モジュール分割でプラットフォーム別・バージョン別の管理が容易
  - `api/` → 共通インターフェース定義
  - `common/` → コアロジック実装
  - `bukkit/`, `bungee/`, `velocity/` → 各プラットフォーム実装
  - `fabric/`, `neoforge/` → Modプラットフォーム実装（GeyserMC風）
  - `modern/` → 1.21.x+ 向け直接参照（NMSリフレクション不要）
- **Java リリース設定**: `<release>8</release>` でJava 8との下位互換性を保証（Java 8サーバーでの実行に必須）
- **バージョン確認**: NMS (net.minecraft.server) はバージョンごとにパッケージ名が変わります
  - 1.17以前: `net.minecraft.server.v1_XX_R1`
  - 1.18-1.20.x: `net.minecraft.server` (パッケージ構造変更)
  - **1.21.x以降: v1_XX_RX パッケージが完全廃止 → Mojang Mappings 直接参照可能**
- **Paper API**: `paper-api` だけで OK
- **RCON**: 開発中は `.env` の RCON パスワードを安全に管理
- **ビルドツール**: Gradle を推奨 (LuckPerms/ViaVersion/GeyserMC が使用)
- **Gradle Build-Conventions**: `build-logic/` で共通ビルド設定を分離（GeyserMC風パターン）
- **NMS依存**: NMS はサーバーに依存するため、本番環境でのテスト必須
- **バージョン判定**: `isNewerVersion()` で1.21.x以降かを判定
- **未知バージョン対応**: スイッチ-case でデフォルト処理を追加し、未知バージョンでも動作させる
- **MRJAR**: Java 8/21混在時に `Multi-Release: true` をJAR manifestに設定
- **Paperweight**: Paper 1.17+ で Mojang Mappings を直接利用したい場合は公式ツールチェーンを検討
- **Proxy除外**: ブロック干渉系は BungeeCord/Velocity では動作しないため自動除外
- **Mod除外**: ブロック干渉系は Fabric/NeoForge で正常に動作（サーバーサイドModとして）
- **1.21.x+: ModernHandler**: v1_XX_RX パッケージ廃止により、直接importとビルド時Mappingsが可能に
- **1.20.5+: Data Components API**: アイテムメタデータが刷新され、ItemProcessor/ItemHandler/DataComponentUtilsで自動分岐
- **ItemProcessor**: 統一アイテム処理抽象化（displayName, lore, enchantments, attributes, dyeColor, flags対応）
- **DataComponentUtils**: Data Components API ユーティリティ（setDisplayName, setLore, setPotionEffect等）
- **FabricNeoForgeUtils**: Mod環境判定ユーティリティ（isFabric, isNeoForge, isModEnvironment等）
- **LangManager**: 国際化（i18n）システム（`lang/` ディレクトリにyaml配置で簡単追加）
- **NMSPacketSender**: NMS直接パケット送信（ProtocolLib不要の軽量実装）
- **FakeEntityManager**: 偽エンティティ（NPC）マネージャー（Citizen風の軽量実装）
- **PlaceholderExpansion**: PlaceholderAPI展開サポート（他プラグインとの連携）
- **ProtocolLib統合**: パケット読み取り/書き込み（バージョン互換性が高い）
- **Relocation (Shade)**: maven-shade-plugin の relocation でライブラリ衝突を防ぐ（gson, adventure, jackson等）
- **TaskScheduler**: プラットフォーム非依存タスクスケジューラー（Delayed, Repeating, Async）
- **EnhancedReflectionUtils**: Mojang Mappings難読化対応（SRG→Mojang名マッピング）
- **VersionHelper**: バージョン判定ヘルパー（useDataComponents, isPaper, useMojangMappings等）
- **Adventure Text Library**: Kyori製（GeyserMCも使用）のモダンなテキスト処理ライブラリ

## First-Time Setup (If Not Configured)

### ステップ1: プロジェクト作成

```bash
# プロジェクトディレクトリ作成
mkdir my-plugin && cd my-plugin

# Maven pom.xml 生成
scripts/create_pom.sh MyPlugin 1.0.0 com.example
```

### ステップ2: 設定

```bash
# 設定ファイルコピー
cp .env.example .env

# .env を編集
PLUGIN_NAME=MyPlugin
PLUGIN_VERSION=1.0.0
```

### ステップ3: ビルド

```bash
# Maven ビルド
mvn clean package

# または Gradle ビルド
./gradlew build
```

### ステップ4: 配置とテスト

```bash
# JAR をサーバに配置
cp target/my-plugin-1.0.0.jar /path/to/server/plugins/

# サーバ再起動
# または PlugMan でリロード
/plugman reload MyPlugin
```

## テストのやり方

### ユニットテスト（JUnit 5）

```java
// src/test/java/com/example/plugin/ExampleTest.java
package com.example.plugin;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ExampleTest {
    
    @Test
    void testVersionUtils() {
        // VersionUtils のテスト
        assertTrue(VersionUtils.getMajorVersion() >= 8);
    }
    
    @Test
    void testCommonUtils() {
        // 色コード変換テスト
        String result = CommonUtils.formatMessage("&aTest");
        assertEquals("§aTest", result);
    }
}
```

### pom.xml テスト依存関係

```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.10.0</version>
    <scope>test</scope>
</dependency>
```

### 統合テスト（Spigot Testing）

```java
// src/test/java/com/example/plugin/integration/IntegrationTest.java
package com.example.plugin;

import org.bukkit.Server;
import org.bukkit.plugin.PluginManager;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mockito;

class IntegrationTest {
    
    private Server server;
    private MyPlugin plugin;
    
    @BeforeEach
    void setUp() {
        server = Mockito.mock(Server.class);
        PluginManager pm = Mockito.mock(PluginManager.class);
        Mockito.when(server.getPluginManager()).thenReturn(pm);
        
        // プラグイン初期化テスト
    }
}
```

## デバッグ方法

### IDE デバッグ設定

#### VS Code (launch.json)

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "java",
            "name": "Debug Server",
            "request": "attach",
            "hostName": "localhost",
            "port": 5005,
            "sourcePaths": ["src/main/java"],
            "projectName": "my-plugin"
        }
    ]
}
```

#### IntelliJ IDEA

1. **Run > Edit Configurations**
2. **+ > Remote JVM Debug**
3. Host: `localhost`, Port: `5005`
4. サーバ起動時に `-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005` を追加

### Paper サーバ デバッグ起動

```bash
# デバッグモードで起動
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar paper-server.jar
```

## トラブルシューティング

### よくあるエラーと解決策

| エラー | 原因 | 解決策 |
|--------|------|--------|
| `ClassNotFoundException: net.minecraft.server...` | NMSクラス名ミス | `getVersionSuffix()` を確認 |
| `NoClassDefFoundError` | 依存関係不足 | pom.xml の scope を確認 |
| `IllegalArgumentException: Plugin already exists` | 重複登録 | plugin.yml の name を確認 |
| `NullPointerException at onEnable` | 設定ファイル未生成 | `saveDefaultConfig()` を確認 |
| `UnsupportedClassVersionError` | Javaバージョン不一致 | pom.xml の source/target を確認 |

### NMS関連エラー

```java
// ❌  잘못された方法
Class<?> clazz = Class.forName("net.minecraft.server.v1_21_R3.EntityPlayer");

// ✅ 正しい方法（リフレクション）
Class<?> clazz = NMSReflectionUtils.getNMSClass("EntityPlayer");

// ✅ またはPaperweight使用（1.17+）
import net.minecraft.server.v1_21_4.EntityPlayer;
```

### サウンド名エラー

```java
// ❌ 1.8.x でこのサウンド名は存在しない
player.playSound(loc, Sound.ENTITY_PLAYER_LEVELUP, 1, 1);

// ✅ バージョン判定後使用
if (VersionUtils.getMajorVersion() >= 13) {
    player.playSound(loc, Sound.valueOf("ENTITY_PLAYER_LEVELUP"), 1, 1);
} else {
    player.playSound(loc, Sound.valueOf("LEVEL_UP"), 1, 1);
}
```

## CI/CD（GitHub Actions）

### 自動ビルド設定

```yaml
# .github/workflows/build.yml
name: Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up JDK 21
      uses: actions/setup-java@v4
      with:
        java-version: '21'
        distribution: 'temurin'
        
    - name: Build with Maven
      run: mvn clean package -DskipTests
      
    - name: Build with Gradle
      run: ./gradlew build
```

### 自動テスト設定

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-java@v4
      with:
        java-version: '21'
        
    - name: Run Tests
      run: mvn test
      
    - name: Upload Reports
      uses: actions/upload-artifact@v4
      with:
        name: test-reports
        path: target/surefire-reports/
```

## 完全スケルトンプロジェクト

完全なプロジェクト構造が必要な場合、以下のコマンドで生成：

```bash
# 完全スケルトンプロジェクト生成
curl -O https://raw.githubusercontent.com/Kamesuta/minecraft-plugin-maker/main/scripts/generate_skeleton.sh
chmod +x generate_skeleton.sh
./generate_skeleton.sh MyPlugin com.example
```

生成される構造：

```
my-plugin/
├── pom.xml
├── build.gradle.kts
├── settings.gradle.kts
├── src/
│   ├── main/
│   │   ├── java/com/example/
│   │   │   ├── common/
│   │   │   ├── Server/Spigot/
│   │   │   ├── Server/Paper/
│   │   │   ├── Proxy/BungeeCord/
│   │   │   └── Proxy/Velocity/
│   │   └── resources/
│   │       ├── spigot-plugin.yml
│   │       └── bungee-plugin.yml
│   └── test/
│       └── java/com/example/
├── .github/workflows/
│   └── build.yml
├── scripts/
│   ├── build.sh
│   └── test.sh
├── .env.example
└── README.md
```

## scripts/

`scripts/` ディレクトリには再利用可能なスクリプトを配置:

- `build.sh` - ビルドスクリプト
- `create_pom.sh` - pom.xml 生成スクリプト
- `rename_plugin.sh` - プラグイン名変更スクリプト

各スクリプトは `.env.example` の設定を読み取って動作します。
