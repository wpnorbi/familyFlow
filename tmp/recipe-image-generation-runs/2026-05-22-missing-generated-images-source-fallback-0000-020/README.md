# Recipe Image Run

1. Generate images for the prompts in `prompt-sheet.md` or `prompts.json`.
2. Save each generated PNG with the exact slug filename into:
   `/private/tmp/family-flow-generated-recipe-images`
3. When all PNG files are ready, register them with:
   `node scripts/register-generated-recipe-image-batch.mjs --batch tmp/recipe-image-generation-runs/2026-05-22-missing-generated-images-source-fallback-0000-020/register-batch.template.json`

Expected filename rule:
- `<slug>.png`

Example:
- `a-vilag-legfinomabb-legegyszerubb-paradicsomos-sajtos-spagettije.png`
