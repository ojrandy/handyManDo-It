import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_navigation_header_children_link_page" ADD VALUE '/get-the-app' BEFORE '/legal/privacy';
  ALTER TYPE "public"."enum_navigation_header_link_page" ADD VALUE '/get-the-app' BEFORE '/legal/privacy';
  ALTER TYPE "public"."enum_navigation_footer_columns_links_link_page" ADD VALUE '/get-the-app' BEFORE '/legal/privacy';
  CREATE TABLE "legal" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"privacy_last_updated" timestamp(3) with time zone NOT NULL,
  	"terms_last_updated" timestamp(3) with time zone NOT NULL,
  	"disclaimer_last_updated" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "legal_locales" (
  	"privacy_content" jsonb NOT NULL,
  	"terms_content" jsonb NOT NULL,
  	"disclaimer_content" jsonb NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "legal_locales" ADD CONSTRAINT "legal_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."legal"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "legal_locales_locale_parent_id_unique" ON "legal_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "legal_locales_parent_id_idx" ON "legal_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "legal" CASCADE;
  DROP TABLE "legal_locales" CASCADE;
  ALTER TABLE "navigation_header_children" ALTER COLUMN "link_page" SET DATA TYPE text;
  DROP TYPE "public"."enum_navigation_header_children_link_page";
  CREATE TYPE "public"."enum_navigation_header_children_link_page" AS ENUM('/', '/services', '/businesses', '/buildings', '/shop', '/food', '/become-a-pro', '/our-work', '/reviews', '/about', '/careers', '/blog', '/faq', '/contact', '/legal/privacy', '/legal/terms', '/legal/disclaimer');
  ALTER TABLE "navigation_header_children" ALTER COLUMN "link_page" SET DATA TYPE "public"."enum_navigation_header_children_link_page" USING "link_page"::"public"."enum_navigation_header_children_link_page";
  ALTER TABLE "navigation_header" ALTER COLUMN "link_page" SET DATA TYPE text;
  DROP TYPE "public"."enum_navigation_header_link_page";
  CREATE TYPE "public"."enum_navigation_header_link_page" AS ENUM('/', '/services', '/businesses', '/buildings', '/shop', '/food', '/become-a-pro', '/our-work', '/reviews', '/about', '/careers', '/blog', '/faq', '/contact', '/legal/privacy', '/legal/terms', '/legal/disclaimer');
  ALTER TABLE "navigation_header" ALTER COLUMN "link_page" SET DATA TYPE "public"."enum_navigation_header_link_page" USING "link_page"::"public"."enum_navigation_header_link_page";
  ALTER TABLE "navigation_footer_columns_links" ALTER COLUMN "link_page" SET DATA TYPE text;
  DROP TYPE "public"."enum_navigation_footer_columns_links_link_page";
  CREATE TYPE "public"."enum_navigation_footer_columns_links_link_page" AS ENUM('/', '/services', '/businesses', '/buildings', '/shop', '/food', '/become-a-pro', '/our-work', '/reviews', '/about', '/careers', '/blog', '/faq', '/contact', '/legal/privacy', '/legal/terms', '/legal/disclaimer');
  ALTER TABLE "navigation_footer_columns_links" ALTER COLUMN "link_page" SET DATA TYPE "public"."enum_navigation_footer_columns_links_link_page" USING "link_page"::"public"."enum_navigation_footer_columns_links_link_page";`)
}
