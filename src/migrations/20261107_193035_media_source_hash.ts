import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site" ALTER COLUMN "app_store_url" SET DEFAULT 'https://apps.apple.com/app/handyman-do-it/id6820783542';
  ALTER TABLE "media" ADD COLUMN "source_hash" varchar;
  CREATE INDEX "media_source_hash_idx" ON "media" USING btree ("source_hash");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_source_hash_idx";
  ALTER TABLE "site" ALTER COLUMN "app_store_url" SET DEFAULT '';
  ALTER TABLE "media" DROP COLUMN "source_hash";`)
}
