---
name: discover-plugins
description: Discovers OpenCode plugins and skills by searching curated sources and returns categorized recommendations with install steps. Use when users ask for functionality, plugins, extensions, or skills.
license: MIT
compatibility: opencode
metadata:
  audience: users
  workflow: discovery
---

## What I Do

Discovers OpenCode plugins and skills by searching curated sources and returns categorized recommendations with install steps.

## When to use

- The user asks for a plugin, extension, or skill for a specific capability
- The user describes functionality they want to add to OpenCode
- The user asks to browse available plugins or skills

## Workflow

1. Clarify the user's goal and required capabilities.
2. Fetch sources in parallel.
3. Normalize entries into a single catalog (plugins + skill packs).
4. Deduplicate by repo URL or package/product id.
5. Semantically match entries to the user's request.
6. Return categorized recommendations with install steps.

## Sources

Primary (structured JSON)
- opencode.cafe plugin catalog
- URL: https://raw.githubusercontent.com/R44VC0RP/opencode.cafe/main/bulk/plugins.json
- Format: JSON array
- Fields: productId, displayName, description, repoUrl, homepageUrl, tags, installation
- Notes: best source for structured data and install guidance

Secondary (markdown list)
- awesome-opencode README
- URL: https://raw.githubusercontent.com/awesome-opencode/awesome-opencode/main/README.md
- Format: Markdown
- Parse: extract bullet entries with repo links and descriptions
- Notes: includes plugins, themes, agents, resources

Tertiary (markdown source)
- OpenCode ecosystem
- URL: https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/web/src/content/docs/ecosystem.mdx
- Format: Markdown/MDX
- Parse: section lists into entries (Plugins, Projects, Agents)

Fetching guidance
- Fetch all sources in parallel
- Record per-source counts for reporting
- Keep raw source names in entries for provenance

## Categories

Use these categories to group results. Infer category from tags, name, description.

auth
- Keywords: oauth, authentication, login, credentials, api key, subscription, billing
- Examples: opencode-gemini-auth, opencode-openai-codex-auth

memory
- Keywords: memory, persistence, context, vector, recall, storage
- Examples: opencode-mem, opencode-agent-memory

workflow
- Keywords: workflow, orchestration, background agents, sessions, scheduling, tasks
- Examples: opencode-workspace, opencode-scheduler

notifications
- Keywords: notify, notification, alert, bell, sound, voice
- Examples: opencode-notify, opencode-smart-voice-notify

code-tools
- Keywords: lsp, ast, shell, fast apply, formatter, markdown, tokens
- Examples: opencode-morph-fast-apply, opencode-shell-strategy

integrations
- Keywords: github, linear, slack, web, devcontainers, wakatime, analytics
- Examples: opencode-wakatime, opencode-devcontainers

skills
- Keywords: skills, skill packs, skill loader, prompt library
- Examples: opencode-skills, opencode-skillful

ui
- Keywords: ui, theme, dashboard, web, interface
- Examples: opencode-notificator, opencode-zellij-namer

## Install guidance

Default plugin install template
Prefer config-based installs (OpenCode auto-installs on startup):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["<package>"]
}
```

CLI install (only if explicitly required)
Some plugins require global install or manual build steps. Use the source-provided instructions when available.

```bash
npm install -g <package>
# or
bun add -g <package>
```

Use source-provided install instructions
If the entry includes explicit install steps (e.g. opencode.cafe JSON), prefer those verbatim.

Notes
- If multiple install options exist, present the simplest path first.
- For plugin entries without clear package names, provide repo link and mention manual setup required.

## Output format

Use this structure:

```markdown
## Extensions for "<user need>"

### <Category>

**<Name>**
<One-line description>
<Install instructions>
[Repo](url)

---

Searched: <sources> • Indexed: <count>
```

## Notes

- Prefer entries labeled as plugins or skill packs.
- If multiple entries fit, return the top 5-7 per category.
- If no matches, suggest broader terms and show the top 3 closest categories.
