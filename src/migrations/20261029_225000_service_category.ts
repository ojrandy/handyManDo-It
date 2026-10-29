import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_services_category" AS ENUM('design', 'build', 'moving', 'business');
  CREATE TYPE "public"."enum__services_v_version_category" AS ENUM('design', 'build', 'moving', 'business');
  ALTER TABLE "services" ADD COLUMN "category" "enum_services_category" DEFAULT 'build';
  ALTER TABLE "_services_v" ADD COLUMN "version_category" "enum__services_v_version_category" DEFAULT 'build';
  CREATE INDEX "services_category_idx" ON "services" USING btree ("category");
  CREATE INDEX "_services_v_version_version_category_idx" ON "_services_v" USING btree ("version_category");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "services_category_idx";
  DROP INDEX "_services_v_version_version_category_idx";
  ALTER TABLE "services" DROP COLUMN "category";
  ALTER TABLE "_services_v" DROP COLUMN "version_category";
  DROP TYPE "public"."enum_services_category";
  DROP TYPE "public"."enum__services_v_version_category";`)
}
