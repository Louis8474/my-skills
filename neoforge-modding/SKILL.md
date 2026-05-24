---
name: neoforge-modding
description: Complete workflow for building, testing, creating items, and managing code conventions for Minecraft NeoForge mods.
compatibility: opencode
license: MIT
metadata:
  author: Spudmash Media
  version: "1.0" 
---
# NeoForge Modding Workflows

## Strict Lazy-Loading Requirement
CRITICAL: To prevent prompt bloat at system startup, do NOT read files preemptively. However, once any NeoForge development task is initiated by the user, you MUST immediately use your file reading tool to load ALL THREE companion markdown files listed below. Partial execution is strictly forbidden.

### Required Skill Bundle Files
* **Conventions**: Architectural guidelines and package standards found in [mod-conventions.md](./mod-conventions.md).
* **Creation**: Item, block, and data generation workflows found in [item-creation.md](./item-creation.md).
* **Testing**: Compilation targets and debugging procedures found in [build-and-testing.md](./build-and-testing.md).

## Workflow Execution Steps
1. Identify that the user query relates to NeoForge modding.
2. Call your file reading tool to load `./mod-conventions.md`, `./item-creation.md`, and `./build-and-testing.md` into your context window in a single tool execution block.
3. Process the user's request using the combined knowledge, constraints, and instructions from all three files.
