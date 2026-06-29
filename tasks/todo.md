# Tenant Graph Plan

Canonical feature and retest tracking lives in `tasks/tenant-graph-feature-stories.xlsx`.

- [x] Ponytail simplification implementation
  - [x] Remove graph trace, path-reveal, shader-zone, and depth-focus animation systems
  - [x] Simplify zone floors to static materials
  - [x] Replace hand-built particle texture with a canvas texture
  - [x] Inline account-menu links and remove the helper module
  - [x] Share landing link/action styling
  - [x] Run lint, typecheck, focused tests, and full tests
- [x] Final verification
  - [x] Run production build
  - [x] Run React Doctor
  - [x] Verify dev sample route returns HTTP 200
  - [x] Record final result

Review: `npm run lint`, `npx tsc -b --pretty false`, focused Vitest, full Vitest, `npm run build`, React Doctor 100/100, and `git diff --check` passed. Playwright MCP calls were unavailable in this session, and local Playwright is not installed.
