---
name: bundle-maintenance
description: Safely update shipped bundles and generated artifacts with manifest, integrity, and smoke-test discipline.
compatibility: opencode
---
## When to use
- A repository ships an installable bundle, generated payload, or curated artifact directory that must stay reproducible.

## Procedure
1. Identify which directories are shipped artifacts versus normal source files.
2. Make the smallest reviewable change and preserve existing bundle structure.
3. Update manifest or inventory files if the shipped file set changed.
4. Regenerate integrity metadata such as checksums when bundled content changes.
5. Review whether version and changelog files should move with the shipped change.
6. Run the narrowest smoke tests that prove install, verify, or load behavior still works.

## Rules
- Treat shipped bundle content as a product surface, not just implementation detail.
- Do not skip checksum or manifest updates when bundle contents change.
- Call out cross-platform, installer, and verification impact explicitly.
