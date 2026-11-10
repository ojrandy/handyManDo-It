import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Footer group row (FR-GLB-02, owner 2026-11-10): Spectron Limited LLC is the parent company,
// shown on its own, and Luxecam Tours joins the sister products. Data only, no schema change.
// Africa DMC Group is a new partner with a logo upload, which a migration can't make: the seed
// creates it (LOAD_CONTENT on Hostinger, `npm run seed` locally) or an editor adds it in /admin.
// Values copied here, not imported, so this migration keeps doing the same thing if
// src/lib/site.ts changes later.
const parent = 'Spectron Limited LLC'
const added = { name: 'Luxecam Tours Ltd', url: 'https://luxecamtours.com/' }

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "partners" SET "sister_product" = false WHERE "name" = ${parent};`)
  // A link an editor already set is kept. No match (renamed or absent) is a no-op.
  await db.execute(sql`
   UPDATE "partners" SET "sister_product" = true, "url" = COALESCE(NULLIF("url", ''), ${added.url})
   WHERE "name" = ${added.name};`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "partners" SET "sister_product" = true WHERE "name" = ${parent};`)
  await db.execute(sql`
   UPDATE "partners" SET "sister_product" = false WHERE "name" = ${added.name};`)
}
