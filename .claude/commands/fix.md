Fix all lint, type, and build errors in the project.

Steps:
1. Run `npx tsc --noEmit` and collect all TypeScript errors
2. Run `bun lint` and collect all ESLint errors
3. Fix every error found, file by file
4. Run `bun check` to auto-format with Biome
5. Re-run typecheck and lint to confirm zero errors
6. If everything passes, commit with message `fix: resolve lint and type errors`
