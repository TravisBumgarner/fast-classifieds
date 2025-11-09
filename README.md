# Setup

1. `npm install` dependencies
1. `npm run dev` local run
1. `npm run db:studio` to browse SQL lite 

# Gotchas

- No HMR for main.ts. Need to restart debugger.

# Dev Notes

**Migrations**

1. Add to `src/main/database/schema.ts`
1. Generate migration `npm run db:generate`
1. Push migration `npm run db:push`
