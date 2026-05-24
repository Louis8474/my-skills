---
name: claude-opus-migration
description: Migrate prompts and code from Claude Sonnet 4.0, Sonnet 4.5, or Opus 4.1 to Opus 4.5. Use when the user wants to update their codebase, prompts, or API calls to use Opus 4.5. Handles model string updates and prompt adjustments for known Opus 4.5 behavioral differences. Does NOT migrate Haiku 4.5.
---

# Opus 4.5 Migration Guide

One-shot migration from Sonnet 4.0, Sonnet 4.5, or Opus 4.1 to Opus 4.5.

## Migration Workflow

1. Search codebase for model strings and API calls
2. Update model strings to Opus 4.5 (see platform-specific strings below)
3. Remove unsupported beta headers
4. Add effort parameter set to `"high"`
5. Summarize all changes made
6. Tell the user: "If you encounter any issues with Opus 4.5, let me know and I can help adjust your prompts."

## Model String Updates

### Unsupported Beta Headers

Remove the `context-1m-2025-08-07` beta header if present — it is not yet supported with Opus 4.5. Leave a comment noting this:

```python
# Note: 1M context beta (context-1m-2025-08-07) not yet supported with Opus 4.5
```

### Target Model Strings (Opus 4.5)

| Platform | Opus 4.5 Model String |
|----------|----------------------|
| Anthropic API (1P) | `claude-opus-4-5-20251101` |
| AWS Bedrock | `anthropic.claude-opus-4-5-20251101-v1:0` |
| Google Vertex AI | `claude-opus-4-5@20251101` |
| Azure AI Foundry | `claude-opus-4-5-20251101` |

### Source Model Strings to Replace

| Source Model | Anthropic API (1P) | AWS Bedrock | Google Vertex AI |
|--------------|-------------------|-------------|------------------|
| Sonnet 4.0 | `claude-sonnet-4-20250514` | `anthropic.claude-sonnet-4-20250514-v1:0` | `claude-sonnet-4@20250514` |
| Sonnet 4.5 | `claude-sonnet-4-5-20250929` | `anthropic.claude-sonnet-4-5-20250929-v1:0` | `claude-sonnet-4-5@20250929` |
| Opus 4.1 | `claude-opus-4-1-20250422` | `anthropic.claude-opus-4-1-20250422-v1:0` | `claude-opus-4-1@20250422` |

**Do NOT migrate**: Any Haiku models (e.g., `claude-haiku-4-5-20251001`).

## Prompt Adjustments

Opus 4.5 has known behavioral differences. **Only apply these fixes if the user explicitly requests them or reports a specific issue.** By default, just update model strings.

**Integration guidelines**: When adding snippets, don't just append them to prompts. Integrate them thoughtfully:
- Use XML tags (e.g., `<code_guidelines>`, `<tool_usage>`) to organize additions
- Match the style and structure of the existing prompt
- Place snippets in logical locations
- If the prompt already uses XML tags, add new content within appropriate existing tags

### 1. Tool Overtriggering

Opus 4.5 is more responsive to system prompts. Aggressive language may cause overtriggering.

**Apply if**: User reports tools being called too frequently or unnecessarily.

**Find and soften**:
- `CRITICAL:` → remove or soften
- `You MUST...` → `You should...`
- `ALWAYS do X` → `Do X`
- `NEVER skip...` → `Don't skip...`
- `REQUIRED` → remove or soften

Only apply to tool-triggering instructions.

### 2. Over-Engineering Prevention

**Apply if**: User reports unwanted files, excessive abstraction, or unrequested features.

Add to system prompt:
```
Focus on implementing exactly what is requested. Do not create additional files, abstractions, or features beyond what is explicitly asked for. Keep the implementation minimal and direct.
```

### 3. Code Exploration

**Apply if**: User reports the model proposing fixes without inspecting relevant code.

Add to system prompt:
```
Before proposing any solution or fix, always read the relevant source files to understand the existing implementation. Do not make assumptions about code structure without first examining it.
```

### 4. Frontend Design

**Apply if**: User requests improved frontend design quality or reports generic-looking outputs.

Add to system prompt:
```
When creating frontend interfaces, prioritize distinctive, production-grade design. Avoid generic AI aesthetics (purple gradients, Inter font, predictable layouts). Choose bold, intentional aesthetic directions and execute them with precision.
```

### 5. Thinking Sensitivity

**Apply if**: User reports issues related to "thinking" while extended thinking is not enabled.

Replace "think" with alternatives: "consider," "believe," or "evaluate."

## Effort Parameter

When updating API calls, add the effort parameter:

```python
# Python SDK
response = client.messages.create(
    model="claude-opus-4-5-20251101",
    max_tokens=1024,
    thinking={"type": "enabled", "budget_tokens": 10000},  # if using extended thinking
    messages=[...]
)
```

For non-thinking usage, the effort parameter helps optimize performance:
```python
# Add to your API call metadata if supported
"effort": "high"
```
