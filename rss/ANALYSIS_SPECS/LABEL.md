# LABEL Spec

## Purpose

Generate useful labels for a target article.

## Default Style

- prefer specific, reusable labels
- avoid overly broad or redundant labels
- use lowercase kebab-case labels

## Label Dimensions

- `topic`: subject matter (for example `ai-policy`, `earnings`, `security`).
- `intent`: what the article is mainly doing (for example `announcement`, `analysis`, `opinion`).
- `urgency`: time sensitivity (`urgent`, `soon`, `evergreen`).
- `sentiment` (optional): only include when sentiment is clearly evidenced.

## Output Contract

Return a deduplicated list of 3-8 labels with short rationale for each.

## Auto-Apply Compatibility

When `--auto` is set, produce labels suitable for direct storage in the article `labels` field.

## Guardrails

- Do not label based on weak hints.
- Prefer precision over quantity.
