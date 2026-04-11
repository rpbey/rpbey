Synchronize the Prisma schema with the database.

Steps:
1. Run `bun db:generate` to regenerate the Prisma client
2. Run `bun db:push` to push schema changes to the database
3. Verify by running `npx tsc --noEmit` to check for type issues
4. Report any issues found
