import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_navigation_header_children_link_type" AS ENUM('page', 'doc', 'external');
  CREATE TYPE "public"."enum_navigation_header_children_link_page" AS ENUM('/', '/services', '/businesses', '/buildings', '/shop', '/food', '/become-a-pro', '/our-work', '/reviews', '/about', '/careers', '/blog', '/faq', '/contact', '/legal/privacy', '/legal/terms', '/legal/disclaimer');
  CREATE TYPE "public"."enum_navigation_header_children_icon" AS ENUM('palette', 'sofa', 'wrench', 'hammer', 'signpost', 'party-popper', 'lightbulb', 'hard-hat', 'truck', 'package', 'car', 'paint-roller', 'plug', 'droplets', 'shield-check');
  CREATE TYPE "public"."enum_navigation_header_link_type" AS ENUM('page', 'doc', 'external');
  CREATE TYPE "public"."enum_navigation_header_link_page" AS ENUM('/', '/services', '/businesses', '/buildings', '/shop', '/food', '/become-a-pro', '/our-work', '/reviews', '/about', '/careers', '/blog', '/faq', '/contact', '/legal/privacy', '/legal/terms', '/legal/disclaimer');
  CREATE TYPE "public"."enum_navigation_footer_columns_links_link_type" AS ENUM('page', 'doc', 'external');
  CREATE TYPE "public"."enum_navigation_footer_columns_links_link_page" AS ENUM('/', '/services', '/businesses', '/buildings', '/shop', '/food', '/become-a-pro', '/our-work', '/reviews', '/about', '/careers', '/blog', '/faq', '/contact', '/legal/privacy', '/legal/terms', '/legal/disclaimer');
  CREATE TABLE "navigation_header_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_navigation_header_children_link_type" DEFAULT 'page' NOT NULL,
  	"link_page" "enum_navigation_header_children_link_page",
  	"link_url" varchar,
  	"icon" "enum_navigation_header_children_icon"
  );
  
  CREATE TABLE "navigation_header_children_locales" (
  	"link_label" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_navigation_header_link_type" DEFAULT 'page' NOT NULL,
  	"link_page" "enum_navigation_header_link_page",
  	"link_url" varchar
  );
  
  CREATE TABLE "navigation_header_locales" (
  	"link_label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_navigation_footer_columns_links_link_type" DEFAULT 'page' NOT NULL,
  	"link_page" "enum_navigation_footer_columns_links_link_page",
  	"link_url" varchar
  );
  
  CREATE TABLE "navigation_footer_columns_links_locales" (
  	"link_label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "navigation_footer_columns_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "navigation_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer,
  	"projects_id" integer,
  	"posts_id" integer,
  	"jobs_id" integer
  );
  
  CREATE TABLE "seo_organization_same_as" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "seo" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"og_image_id" integer,
  	"organization_legal_name" varchar DEFAULT 'HandyMan Do IT',
  	"organization_founding_date" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "seo_locales" (
  	"default_title" varchar DEFAULT 'HandyMan Do IT' NOT NULL,
  	"default_description" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "navigation_header_children" ADD CONSTRAINT "navigation_header_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_children_locales" ADD CONSTRAINT "navigation_header_children_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_header_children"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header" ADD CONSTRAINT "navigation_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_locales" ADD CONSTRAINT "navigation_header_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns_links" ADD CONSTRAINT "navigation_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns_links_locales" ADD CONSTRAINT "navigation_footer_columns_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_columns_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns" ADD CONSTRAINT "navigation_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns_locales" ADD CONSTRAINT "navigation_footer_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_rels" ADD CONSTRAINT "navigation_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_rels" ADD CONSTRAINT "navigation_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_rels" ADD CONSTRAINT "navigation_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_rels" ADD CONSTRAINT "navigation_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_rels" ADD CONSTRAINT "navigation_rels_jobs_fk" FOREIGN KEY ("jobs_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seo_organization_same_as" ADD CONSTRAINT "seo_organization_same_as_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seo" ADD CONSTRAINT "seo_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_locales" ADD CONSTRAINT "seo_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."seo"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "navigation_header_children_order_idx" ON "navigation_header_children" USING btree ("_order");
  CREATE INDEX "navigation_header_children_parent_id_idx" ON "navigation_header_children" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_header_children_locales_locale_parent_id_unique" ON "navigation_header_children_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_header_children_locales_parent_id_idx" ON "navigation_header_children_locales" USING btree ("_parent_id");
  CREATE INDEX "navigation_header_order_idx" ON "navigation_header" USING btree ("_order");
  CREATE INDEX "navigation_header_parent_id_idx" ON "navigation_header" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_header_locales_locale_parent_id_unique" ON "navigation_header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_header_locales_parent_id_idx" ON "navigation_header_locales" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_columns_links_order_idx" ON "navigation_footer_columns_links" USING btree ("_order");
  CREATE INDEX "navigation_footer_columns_links_parent_id_idx" ON "navigation_footer_columns_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_footer_columns_links_locales_locale_parent_id_uni" ON "navigation_footer_columns_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_footer_columns_links_locales_parent_id_idx" ON "navigation_footer_columns_links_locales" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_columns_order_idx" ON "navigation_footer_columns" USING btree ("_order");
  CREATE INDEX "navigation_footer_columns_parent_id_idx" ON "navigation_footer_columns" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_footer_columns_locales_locale_parent_id_unique" ON "navigation_footer_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_footer_columns_locales_parent_id_idx" ON "navigation_footer_columns_locales" USING btree ("_parent_id");
  CREATE INDEX "navigation_rels_order_idx" ON "navigation_rels" USING btree ("order");
  CREATE INDEX "navigation_rels_parent_idx" ON "navigation_rels" USING btree ("parent_id");
  CREATE INDEX "navigation_rels_path_idx" ON "navigation_rels" USING btree ("path");
  CREATE INDEX "navigation_rels_services_id_idx" ON "navigation_rels" USING btree ("services_id");
  CREATE INDEX "navigation_rels_projects_id_idx" ON "navigation_rels" USING btree ("projects_id");
  CREATE INDEX "navigation_rels_posts_id_idx" ON "navigation_rels" USING btree ("posts_id");
  CREATE INDEX "navigation_rels_jobs_id_idx" ON "navigation_rels" USING btree ("jobs_id");
  CREATE INDEX "seo_organization_same_as_order_idx" ON "seo_organization_same_as" USING btree ("_order");
  CREATE INDEX "seo_organization_same_as_parent_id_idx" ON "seo_organization_same_as" USING btree ("_parent_id");
  CREATE INDEX "seo_og_image_idx" ON "seo" USING btree ("og_image_id");
  CREATE UNIQUE INDEX "seo_locales_locale_parent_id_unique" ON "seo_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "seo_locales_parent_id_idx" ON "seo_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "navigation_header_children" CASCADE;
  DROP TABLE "navigation_header_children_locales" CASCADE;
  DROP TABLE "navigation_header" CASCADE;
  DROP TABLE "navigation_header_locales" CASCADE;
  DROP TABLE "navigation_footer_columns_links" CASCADE;
  DROP TABLE "navigation_footer_columns_links_locales" CASCADE;
  DROP TABLE "navigation_footer_columns" CASCADE;
  DROP TABLE "navigation_footer_columns_locales" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "navigation_rels" CASCADE;
  DROP TABLE "seo_organization_same_as" CASCADE;
  DROP TABLE "seo" CASCADE;
  DROP TABLE "seo_locales" CASCADE;
  DROP TYPE "public"."enum_navigation_header_children_link_type";
  DROP TYPE "public"."enum_navigation_header_children_link_page";
  DROP TYPE "public"."enum_navigation_header_children_icon";
  DROP TYPE "public"."enum_navigation_header_link_type";
  DROP TYPE "public"."enum_navigation_header_link_page";
  DROP TYPE "public"."enum_navigation_footer_columns_links_link_type";
  DROP TYPE "public"."enum_navigation_footer_columns_links_link_page";`)
}
