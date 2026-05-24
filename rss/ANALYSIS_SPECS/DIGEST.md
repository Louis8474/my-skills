# DIGEST Spec

## Purpose

Produce an actionable digest from recent or filtered articles.

## Default Style

- compact and skimmable
- prioritize significance over volume
- plain language, low jargon

## Output Contract

1. `headline_digest`: 1 short paragraph.
2. `top_items`: 3-10 bullets, each with:
   - what happened
   - why it matters
3. `watchlist`: 2-5 forward-looking items to monitor.
4. `notable_gaps`: missing context or uncertain points.

## Ordering Rules

- rank by impact first, recency second.
- merge near-duplicate stories.

## Optional User Overrides

If user asks for domain lens (for example product, policy, finance), apply the lens to ranking and explanations.
