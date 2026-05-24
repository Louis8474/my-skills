<!---
---
name: neoforge-modding-conventions
description: Neoforge Modding - Mod Conventions
compatibility: opencode
license: MIT
metadata:
  author: Spudmash Media
  version: "1.0" 
---
--->
# Neoforge Modding - Mod Conventions

## 🌟 Overview
This document describes the development patterns and conventions used in the Squishy Dart Tag Team mod.

## Project Structure
```
src/main/java/com/spudmash/squishydarttagteam/
├── SquishyDartTagTeam.java          # Main mod class
├── SquishyDartTagTeamClient.java    # Client-side initialization
├── Config.java                       # Configuration
├── entity/                           # Entity definitions
│   ├── ModEntities.java
│   ├── custom/
│   │   └── SquishyDartEntity.java
│   └── client/
│       ├── SquishyDartEntityModel.java
│       ├── SquishyDartEntityRenderer.java
│       └── SquishyDartEntityRenderState.java
├── item/                             # Item definitions
│   ├── ModItems.java                 # Central registry
│   └── custom/                       # Custom item classes
│       ├── EjectinatorItem.java
│       ├── BeamRifleItem.java
│       ├── SquishyDartItem.java
│       ├── PhoneItem.java
│       ├── BurgerItem.java
│       └── ... (other food items)
└── sound/
    └── ModSounds.java
```

## Key Conventions

### ✅ Deferred Register Pattern
All mod objects use `DeferredRegister` for centralized registration:

**Items:**
```java
public static final DeferredRegister.Items ITEMS = DeferredRegister.createItems(SquishyDartTagTeam.MODID);
public static final DeferredItem<MyCustomItem> CUSTOM_ITEM = ITEMS.registerItem("custom_item",
    MyCustomItem::new, () -> new Item.Properties());
```

**Entities:**
```java
public static final DeferredRegister.Entities ENTITIES = DeferredRegister.createEntities(MODID);
public static final Deferred registries.EntityType CUSTOM_ENTITY = ENTITIES.register("custom_entity",
    () -> Registry.register(Registries.ENTITY_TYPE, 
        ResourceKey.create(Registries.ENTITY_TYPE, 
            new ResourceLocation(MODID, "custom_entity")),
        () -> EntityType.Builder.of(MyEntity::new, SpawnCategory.MONSTER)
            .sized(0.6f, 1.8f)
            .build("custom_entity")));
```

### ✅ Common Setup Pattern
Register event listeners in the main constructor:
```java
public SquishyDartTagTeam(IEventBus modEventBus, ModContainer modContainer) {
    modEventBus.addListener(this::commonSetup);
    modEventBus.addListener(this::addCreative);
    // ...
}
```

### ✅ Event Handling
Use specific event handlers for different tasks:
```java
@SubscribeEvent
public void addCreative(BuildCreativeModeTabContentsEvent event) {
    if(event.getTabKey() == CreativeModeTabs.COMBAT) {
        event.accept(ModItems.EJECTINATOR);
    }
}
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Mod ID | lowercase with no spaces | `squishydarttagteam` |
| Class Names | PascalCase | `EjectinatorItem` |
| Fields | PascalCase | `EJECTINATOR`, `SQUISHY_DART` |
| Method Names | camelCase | `use`, `commonSetup` |
| Resources | lowercase with underscores | `ejectinator`, `squishy_dart` |

## File Organization

1. **Main mod class**: Single entry point
2. **Deferred registers**: Grouped by type (Items, Entities, Sounds, etc.)
3. **Custom implementations**: In `custom/` subpackage
4. **Client-specific code**: In `client/` subpackage

## Code Style Guidelines

- Use System.out.println for debugging (consistent with current code)
- Add class loader confirmation prints: `System.out.println("ClassName CLASS LOADED!");`
- Add method flow prints: `System.out.println("ClassName::method - start");`
- Comment when explaining behavior or changes
