import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_app_screens_key" AS ENUM('welcome', 'home', 'services', 'category', 'shop', 'food', 'help', 'tracking', 'wallet', 'chat', 'completion');
  CREATE TYPE "public"."enum_app_screens_lang" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_app_screens_theme" AS ENUM('light', 'dark');
  CREATE TABLE "app_screens" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" "enum_app_screens_key" NOT NULL,
  	"lang" "enum_app_screens_lang" NOT NULL,
  	"theme" "enum_app_screens_theme" DEFAULT 'light' NOT NULL,
  	"image_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "app_screens_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "app_screens_id" integer;
  ALTER TABLE "app_screens" ADD CONSTRAINT "app_screens_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "app_screens_locales" ADD CONSTRAINT "app_screens_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."app_screens"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "app_screens_image_idx" ON "app_screens" USING btree ("image_id");
  CREATE INDEX "app_screens_updated_at_idx" ON "app_screens" USING btree ("updated_at");
  CREATE INDEX "app_screens_created_at_idx" ON "app_screens" USING btree ("created_at");
  CREATE UNIQUE INDEX "key_lang_theme_idx" ON "app_screens" USING btree ("key","lang","theme");
  CREATE UNIQUE INDEX "app_screens_locales_locale_parent_id_unique" ON "app_screens_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "app_screens_locales_parent_id_idx" ON "app_screens_locales" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_app_screens_fk" FOREIGN KEY ("app_screens_id") REFERENCES "public"."app_screens"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_app_screens_id_idx" ON "payload_locked_documents_rels" USING btree ("app_screens_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "app_screens" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "app_screens_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "app_screens" CASCADE;
  DROP TABLE "app_screens_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_app_screens_fk";
  
  DROP INDEX "payload_locked_documents_rels_app_screens_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "app_screens_id";
  DROP TYPE "public"."enum_app_screens_key";
  DROP TYPE "public"."enum_app_screens_lang";
  DROP TYPE "public"."enum_app_screens_theme";`)
}
