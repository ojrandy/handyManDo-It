import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_app_screens_key" ADD VALUE 'pro' BEFORE 'tracking';
  ALTER TABLE "media" ADD COLUMN "sizes_phone_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_phone_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_phone_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_phone_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_phone_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_phone_filename" varchar;
  CREATE INDEX "media_sizes_phone_sizes_phone_filename_idx" ON "media" USING btree ("sizes_phone_filename");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "app_screens" ALTER COLUMN "key" SET DATA TYPE text;
  DROP TYPE "public"."enum_app_screens_key";
  CREATE TYPE "public"."enum_app_screens_key" AS ENUM('welcome', 'home', 'services', 'category', 'shop', 'food', 'help', 'tracking', 'wallet', 'chat', 'completion');
  ALTER TABLE "app_screens" ALTER COLUMN "key" SET DATA TYPE "public"."enum_app_screens_key" USING "key"::"public"."enum_app_screens_key";
  DROP INDEX "media_sizes_phone_sizes_phone_filename_idx";
  ALTER TABLE "media" DROP COLUMN "sizes_phone_url";
  ALTER TABLE "media" DROP COLUMN "sizes_phone_width";
  ALTER TABLE "media" DROP COLUMN "sizes_phone_height";
  ALTER TABLE "media" DROP COLUMN "sizes_phone_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_phone_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_phone_filename";`)
}
