<!---
---
name: neoforge-modding-item-creation
description: Neoforge Modding - Custom Item Creation Guide
compatibility: opencode
license: MIT
metadata:
  author: Spudmash Media
  version: "1.0" 
---
--->
# Neoforge Modding - Custom Item Creation Guide

## 🎯 Overview
This guide helps create new custom items quickly and consistently following the mod's patterns.

## 📦 Item Types

### 1. **Food Items** (extends `Item`)

**When to use:** Edible items with nutrition and saturation bonuses

**Example Template:**
```java
public class CustomFoodItem extends Item {
    public CustomFoodItem(Properties properties) {
        super(properties);
        System.out.println("CustomFoodItem CLASS LOADED!");
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        System.out.println("CustomFoodItem::use - start"); 
        ItemStack itemstack = player.getItemInHand(hand);
        System.out.println("CustomFoodItem::use - end"); 
        return InteractionResult.SUCCESS;
    }
}
```

**In ModItems.java:**
```java
public static final DeferredItem<CustomFoodItem> CUSTOM_FOOD = ITEMS.registerItem(
    "custom_food",
    CustomFoodItem::new,
    () -> new Item.Properties().food(
        new FoodProperties.Builder()
            .nutrition(4)
            .saturationModifier(0.6f)
            .alwaysEdible()
            .build())
);
```

### 2. **Projectile Weapons** (extends `ProjectileWeaponItem`)

**When to use:** Items that shoot projectile entities (like Ejectinator, BeamRifle)

**Example Template:**
```java
public class CustomProjectileItem extends ProjectileWeaponItem {
    public CustomProjectileItem(Item.Properties properties) {
        super(properties);
        System.out.println("CustomProjectileItem CLASS LOADED!");
    }

    @Override
    public Predicate<ItemStack> getAllSupportedProjectiles() {
        return (stack) -> stack.is(Items.YOUR_PROJECTILE.get());
    }

    @Override
    public int getDefaultProjectileRange() {
        return 12; // Adjust based on weapon type
    }

    @Override
    public void shootProjectile(
        LivingEntity shooter, 
        Projectile projectile, 
        int index, 
        float velocity, 
        float inaccuracy, 
        float angle, 
        @Nullable LivingEntity target
    ) {
        projectile.shootFromRotation(shooter, shooter.getXRot(), shooter.getYRot(), 0.0F, velocity, inaccuracy);
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        System.out.println("CustomProjectileItem::use - start"); 
        ItemStack weaponStack = player.getItemInHand(hand);
        ItemStack ammoStack = player.getProjectile(weaponStack);

        if(ammoStack.getCount() == 0) {
            level.playSound(null, player.getX(), player.getY(), player.getZ(), 
                SoundEvents.COMPARATOR_CLICK, SoundSource.PLAYERS, 1.0F, 1.0F);
            return InteractionResult.FAIL;
        }

        level.playSound(null, player.getX(), player.getY(), player.getZ(), 
            SoundEvents.BUBBLE_POP, SoundSource.PLAYERS, 10.0F, 0.5F);

        if (!level.isClientSide()) {
            System.out.println("Weapon Fired on Server!"); 
            CustomDartEntity dart = new CustomDartEntity(level, player, weaponStack.copy(), false);
            dart.shootFromRotation(player, player.getXRot(), player.getYRot(), 0.0F, 3.0F, 1.0F);
            level.addFreshEntity(dart);
        }

        if (!player.getAbilities().instabuild) {
            ammoStack.shrink(1);
        }

        System.out.println("CustomProjectileItem::use - end"); 
        return InteractionResult.SUCCESS;
    }
}
```

### 3. **Special Use Items** (extends `Item`)

**When to use:** Items with unique mechanics (like PhoneItem)

**Example Template:**
```java
public class CustomSpecialItem extends Item {
    public CustomSpecialItem(Properties properties) {
        super(properties);
        System.out.println("CustomSpecialItem CLASS LOADED!");
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        System.out.println("CustomSpecialItem::use - start"); 
        ItemStack stack = player.getItemInHand(hand);
        
        // Your custom logic here
        
        System.out.println("CustomSpecialItem::use - end"); 
        return InteractionResult.SUCCESS;
    }
}
```

## 📝 Registration Checklist

When creating a new item, follow these steps:

### Step 1: Create the Item Class
1. **Location:** `src/main/java/com/spudmash/squishydarttagteam/item/custom/YourItemName.java`
2. **Extend:** `Item` or `ProjectileWeaponItem` as appropriate
3. **Add prints:** Include class loader confirmation and method flow logs
4. **Implement:** Required methods and custom logic

### Step 2: Register in ModItems.java
1. **Add import:** `import com.spudmash.squishydarttagteam.item.custom.YourItemName;`
2. **Create deferred item:**
   ```java
   public static final DeferredItem<YourItemName> YOUR_ITEM = ITEMS.registerItem(
       "your_item_name",
       YourItemName::new,
       () -> new Item.Properties() // Configure properties
   );
   ```
3. **Update registration:** Ensure registration line matches the pattern

### Step 3: Add to Creative Tab
Edit the `addCreative` method in SquishyDartTagTeam.java:
```java
event.accept(ModItems.YOUR_ITEM);
```
Choose the appropriate creative tab:
- `CREATIVE_MODE_TABS.COMBAT` for weapons and darts
- `CREATIVE_MODE_TABS.FOOD` for food items (or other appropriate tab)

### Step 4: Resource Configuration
Create corresponding resources:
- Item model: `src/main/resources/assets/squishydarttagteam/models/item/your_item.json`
- Item textures: `src/main/resources/assets/squishydarttagteam/textures/item/your_item.png`
- Recipe (if needed): `src/main/resources/data/squishydarttagteam/recipes/your_item.json`

## 🔧 Common Configurations

### Food Properties
```java
new FoodProperties.Builder()
    .nutrition(4)              // How many hunger points restored
    .saturationModifier(0.6f)  // How long hunger stays full
    .alwaysEdible()            // Can eat regardless of hunger bar
    .effect(() -> new EFFECT_INSTANCE(), 0.5f) // Apply status effect (optional)
    .build()
```

### Item Properties
```java
// Basic properties
new Item.Properties()

// With food
new Item.Properties().food(foodProperties)

// With custom properties
new Item.Properties()
    .stackSize(64)
    .rarity(Rarity.RARE)
    .fireResistant()
    .component(DataComponents.CUSTOM_NAME, Component.literal("Custom Name"))
```

## 💡 Tips

1. **Consistency:** Keep debug prints in place for easier troubleshooting
2. **Testing:** Test items in-game immediately after creation
3. **Naming:** Use lowercase in resource names (e.g., "custom_food" in code = `custom_food.json` model)
4. **Inheritance:** Choose the right base class for your item's behavior
5. **Debugging:** Check the terminal for your System.out.println output

## 📚 Examples

See existing implementations for reference:
- **Food:** `BurgerItem.java`, `ShakeItem.java`
- **Weapon:** `EjectinatorItem.java`, `BeamRifleItem.java`
- **Special:** `PhoneItem.java`, `SquishyDartItem.java`
