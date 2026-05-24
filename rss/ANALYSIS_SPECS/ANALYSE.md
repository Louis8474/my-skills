# ANALYSE Spec

## Purpose

Generate structured analysis of selected articles while preserving factual grounding.

## Default Style

- clear and concise
- evidence-first claims
- neutral tone unless user asks for stance
- explicitly separate facts from inferences

## Output Contract

1. `summary`: 2-4 sentences covering the main development.
2. `key_points`: 3-7 bullets of material facts.
3. `signals`: trends, risks, opportunities, contradictions.
4. `confidence`: `high|medium|low` with a short reason.
5. `next_questions`: open questions worth follow-up.

## Optional User Overrides

If the user asks for extra focus (for example sentiment, bias, market impact), add that as a dedicated section after `key_points`.

## Guardrails

- Do not invent facts not present in the provided article context.
- If evidence is thin, state uncertainty explicitly.
