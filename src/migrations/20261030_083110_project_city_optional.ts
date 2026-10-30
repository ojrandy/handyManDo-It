import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE INDEX "projects_city_idx" ON "projects" USING btree ("city");
  CREATE INDEX "_projects_v_version_version_city_idx" ON "_projects_v" USING btree ("version_city");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "projects_city_idx";
  DROP INDEX "_projects_v_version_version_city_idx";`)
}
