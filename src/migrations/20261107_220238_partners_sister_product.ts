import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Footer "Sister Products" (FR-GLB-02, owner 2026-11-07). Values copied here, not imported from
// src/lib/site.ts, so this migration keeps doing the same thing if that list changes later.
const sisterProducts = [
  { name: 'Spectron Limited LLC', url: 'https://spectronlimitedllc.com/' },
  { name: 'Spectron Magazine', url: 'https://spectronmagazine.com/' },
  { name: 'Web Spectron', url: 'https://webspectron.com/' },
  { name: 'Kenta Beauty Clinic', url: 'https://kentabeautyclinic.com/' },
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "partners" ADD COLUMN "sister_product" boolean DEFAULT false;`)

  // Ticks the partners the footer showed before this was editable, so a deploy changes nothing
  // visible. A link an editor already set is kept. No match (renamed or absent) is a no-op.
  for (const { name, url } of sisterProducts) {
    await db.execute(sql`
     UPDATE "partners" SET "sister_product" = true, "url" = COALESCE(NULLIF("url", ''), ${url})
     WHERE "name" = ${name};`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "partners" DROP COLUMN "sister_product";`)
}
