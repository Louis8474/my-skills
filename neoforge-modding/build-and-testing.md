<!---
---
name: neoforge-modding-buildntest
description: Neoforge Modding - Build & Testing Guide
compatibility: opencode
license: MIT
metadata:
  author: Spudmash Media
  version: "1.0" 
---
--->
# Neoforge Modding - Build & Testing Guide

## 🚀 Quick Build Commands

### Build Mod
```bash
./gradlew build
```
**Output:** `build/libs/squishydarttagteam-1.0.0.jar`

### Run Client
```bash
./gradlew runClient
```
Opens Minecraft client with mod loaded

### Run Server
```bash
./gradlew runServer
```
Opens Minecraft server (headless)

### Refresh Dependencies
```bash
./gradlew --refresh-dependencies
```
Useful if dependencies have conflicts

### Clean Build
```bash
./gradlew clean
```
Removes build directory (doesn't affect code)

## 🛠️ Common Issues

### Dependency Issues
```bash
# Clear Gradle cache
./gradlew --refresh-dependencies

# If that doesn't work, delete .gradle folder and rebuild
rm -rf .gradle
./gradlew build
```

### Gradle Wrapper Issues
```bash
# Reinstall wrapper
./gradlew wrapper
```

### Forge/NeoForge Conflicts
Check `gradle.properties`:
- `minecraft_version=1.21.11`
- `neo_version=21.11.30-beta`
- These **must** match!

## 🧪 Testing

### GameTestServer
Runs registered game tests:
```bash
./gradlew gameTestServer
```

### Client Debug
Run client and check logs:
```bash
./gradlew runClient
```
Look in `run/caches/common/logs/client.txt`

### Server Debug
```bash
./gradlew runServer --nogui
```
Look in `run/saves/server_logs/latest.log`

## 📂 Project Layout

```
squishydarttagteam/
├── .gradle/                # Gradle cache
├── build/                  # Built artifacts and outputs
│   └── libs/              # Final mod jar
├── gradle/                # Gradle wrapper files
├── run/                   # Runtime folder
│   ├── caches/           # Gradle caches
│   └── saves/            # Minecraft saves
├── src/
│   ├── generated/        # Generated resources
│   └── main/
│       ├── java/         # Java source files
│       │   └── com/spudmash/squishydarttagteam/
│       ├── resources/    # Resource files (models, textures, etc.)
│       └── templates/    # META-INF templates
└── build.gradle
└── settings.gradle
```

## 🔍 Build Directory Contents

After building, check:
- `build/libs/` - Final mod jar
- `build/reports/` - Build reports and logs
- `build/classes/` - Compiled Java classes
- `build/resources/` - Processed resources

## 📋 Development Workflow

1. **Code changes:**
   - Edit `.java` files in `src/main/java/`

2. **Test locally:**
   ```bash
   ./gradlew runClient
   ```
   Try your changes in-game

3. **Build:**
   ```bash
   ./gradlew build
   ```

4. **Package:**
   - Copy `build/libs/squishydarttagteam-1.0.0.jar` to mods folder

5. **Install mods folder:**
   Typically found at:
   - Linux: `~/.local/share/mods`
   - Windows: `%APPDATA%\.minecraft\mods`
   - Mac: `~/Library/Application Support/minecraft/mods`

## 🐛 Debugging Tips

### Enable Detailed Logging
Modify `build.gradle` line ~89:
```java
logLevel = org.slf4j.event.Level.DEBUG
```

### Check Build Reports
```bash
# After build, check for warnings/errors
cat build/reports/build-report.txt
```

### Verify Dependencies
```bash
./gradlew dependencies --configuration runtimeClasspath
```

## 📊 Build Output Targets

| Build Task | Output Location | Purpose |
|------------|----------------|---------|
| `jar` | `build/libs/*.jar` | Standard Java jar |
| `build` | `build/libs/*.jar` | Final mod jar (ready to use) |
| `assemble` | `build/libs/*.jar` | Assembles all archives |
| `validatePlugin` | Various | Plugin validation |

## 🚨 Common Build Errors

### "Java language version should be 21"
Ensure in build.gradle:
```java
java.toolchain.languageVersion = JavaLanguageVersion.of(21)
```

### "NeoForge version must equal Minecraft version"
Match both versions in `gradle.properties`:
```properties
minecraft_version=1.21.11
neo_version=21.11.30-beta
```

### Permission Denied (Gradle Wrapper)
```bash
chmod +x gradlew
chmod +x gradlew.bat
```

## 🎯 Next Steps

### After Creating a New Item:
1. ✅ Add `System.out.println` in constructor and use method
2. ✅ Register in `ModItems.java`
3. ✅ Add to creative tab in `SquishyDartTagTeam.java`
4. ✅ Create item model and texture
5. ✅ Build and test

### For Project-Specific Tasks:
- Check `./mod-conventions.md` for project patterns
- Check `./item-creation.md` for item-specific guidance
