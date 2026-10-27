import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_home_hero_cues_icon" AS ENUM('badge-check', 'shield-check', 'navigation', 'circle-check', 'key-round', 'clock', 'handshake', 'sparkles', 'wallet', 'smartphone');
  CREATE TYPE "public"."enum_home_pillars_values_icon" AS ENUM('badge-check', 'shield-check', 'navigation', 'circle-check', 'key-round', 'clock', 'handshake', 'sparkles', 'wallet', 'smartphone');
  CREATE TYPE "public"."enum_home_pillars_trust_icon" AS ENUM('badge-check', 'shield-check', 'navigation', 'circle-check', 'key-round', 'clock', 'handshake', 'sparkles', 'wallet', 'smartphone');
  CREATE TYPE "public"."enum_home_audiences_items_audience" AS ENUM('homes', 'businesses', 'buildings');
  CREATE TYPE "public"."enum_home_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__home_v_version_hero_cues_icon" AS ENUM('badge-check', 'shield-check', 'navigation', 'circle-check', 'key-round', 'clock', 'handshake', 'sparkles', 'wallet', 'smartphone');
  CREATE TYPE "public"."enum__home_v_version_pillars_values_icon" AS ENUM('badge-check', 'shield-check', 'navigation', 'circle-check', 'key-round', 'clock', 'handshake', 'sparkles', 'wallet', 'smartphone');
  CREATE TYPE "public"."enum__home_v_version_pillars_trust_icon" AS ENUM('badge-check', 'shield-check', 'navigation', 'circle-check', 'key-round', 'clock', 'handshake', 'sparkles', 'wallet', 'smartphone');
  CREATE TYPE "public"."enum__home_v_version_audiences_items_audience" AS ENUM('homes', 'businesses', 'buildings');
  CREATE TYPE "public"."enum__home_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__home_v_published_locale" AS ENUM('fr', 'en');
  CREATE TABLE "home_hero_cues" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"time" numeric,
  	"icon" "enum_home_hero_cues_icon",
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "home_pillars_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_home_pillars_values_icon",
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "home_pillars_trust" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_home_pillars_trust_icon",
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "home_how_it_works_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "home_audiences_items_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "home_audiences_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"audience" "enum_home_audiences_items_audience",
  	"title" varchar
  );
  
  CREATE TABLE "home_earn_tabs_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "home_earn_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"title" varchar
  );
  
  CREATE TABLE "home_earn_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_video_mp4_id" integer,
  	"hero_video_webm_id" integer,
  	"hero_video_poster_id" integer,
  	"hero_film_video_id" integer,
  	"hero_film_poster_id" integer,
  	"hero_film_captions_id" integer,
  	"_status" "enum_home_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_locales" (
  	"hero_eyebrow" varchar,
  	"hero_title_start" varchar,
  	"hero_title_highlight" varchar,
  	"hero_subtitle" varchar,
  	"hero_values" varchar,
  	"pillars_eyebrow" varchar,
  	"pillars_title" varchar,
  	"pillars_trust_title" varchar,
  	"numbers_eyebrow" varchar,
  	"numbers_title" varchar,
  	"numbers_body" varchar,
  	"how_it_works_eyebrow" varchar,
  	"how_it_works_title" varchar,
  	"audiences_eyebrow" varchar,
  	"audiences_title" varchar,
  	"earn_eyebrow" varchar,
  	"earn_title" varchar,
  	"earn_body" varchar,
  	"services_eyebrow" varchar,
  	"services_title" varchar,
  	"testimonials_eyebrow" varchar,
  	"testimonials_title" varchar,
  	"faq_eyebrow" varchar,
  	"faq_title" varchar,
  	"download_eyebrow" varchar,
  	"download_title" varchar,
  	"download_body_android" varchar,
  	"download_body_all" varchar,
  	"blog_eyebrow" varchar,
  	"blog_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_v_version_hero_cues" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"time" numeric,
  	"icon" "enum__home_v_version_hero_cues_icon",
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_pillars_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__home_v_version_pillars_values_icon",
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_pillars_trust" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__home_v_version_pillars_trust_icon",
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_how_it_works_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_audiences_items_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_audiences_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"audience" "enum__home_v_version_audiences_items_audience",
  	"title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_earn_tabs_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_earn_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_earn_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_video_mp4_id" integer,
  	"version_hero_video_webm_id" integer,
  	"version_hero_video_poster_id" integer,
  	"version_hero_film_video_id" integer,
  	"version_hero_film_poster_id" integer,
  	"version_hero_film_captions_id" integer,
  	"version__status" "enum__home_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__home_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_home_v_locales" (
  	"version_hero_eyebrow" varchar,
  	"version_hero_title_start" varchar,
  	"version_hero_title_highlight" varchar,
  	"version_hero_subtitle" varchar,
  	"version_hero_values" varchar,
  	"version_pillars_eyebrow" varchar,
  	"version_pillars_title" varchar,
  	"version_pillars_trust_title" varchar,
  	"version_numbers_eyebrow" varchar,
  	"version_numbers_title" varchar,
  	"version_numbers_body" varchar,
  	"version_how_it_works_eyebrow" varchar,
  	"version_how_it_works_title" varchar,
  	"version_audiences_eyebrow" varchar,
  	"version_audiences_title" varchar,
  	"version_earn_eyebrow" varchar,
  	"version_earn_title" varchar,
  	"version_earn_body" varchar,
  	"version_services_eyebrow" varchar,
  	"version_services_title" varchar,
  	"version_testimonials_eyebrow" varchar,
  	"version_testimonials_title" varchar,
  	"version_faq_eyebrow" varchar,
  	"version_faq_title" varchar,
  	"version_download_eyebrow" varchar,
  	"version_download_title" varchar,
  	"version_download_body_android" varchar,
  	"version_download_body_all" varchar,
  	"version_blog_eyebrow" varchar,
  	"version_blog_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "home_hero_cues" ADD CONSTRAINT "home_hero_cues_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_pillars_values" ADD CONSTRAINT "home_pillars_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_pillars_trust" ADD CONSTRAINT "home_pillars_trust_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_how_it_works_steps" ADD CONSTRAINT "home_how_it_works_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_audiences_items_points" ADD CONSTRAINT "home_audiences_items_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_audiences_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_audiences_items" ADD CONSTRAINT "home_audiences_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_earn_tabs_points" ADD CONSTRAINT "home_earn_tabs_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_earn_tabs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_earn_tabs" ADD CONSTRAINT "home_earn_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_earn_steps" ADD CONSTRAINT "home_earn_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_hero_video_mp4_id_media_id_fk" FOREIGN KEY ("hero_video_mp4_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_hero_video_webm_id_media_id_fk" FOREIGN KEY ("hero_video_webm_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_hero_video_poster_id_media_id_fk" FOREIGN KEY ("hero_video_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_hero_film_video_id_media_id_fk" FOREIGN KEY ("hero_film_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_hero_film_poster_id_media_id_fk" FOREIGN KEY ("hero_film_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_hero_film_captions_id_media_id_fk" FOREIGN KEY ("hero_film_captions_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_locales" ADD CONSTRAINT "home_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_cues" ADD CONSTRAINT "_home_v_version_hero_cues_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_pillars_values" ADD CONSTRAINT "_home_v_version_pillars_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_pillars_trust" ADD CONSTRAINT "_home_v_version_pillars_trust_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_how_it_works_steps" ADD CONSTRAINT "_home_v_version_how_it_works_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_audiences_items_points" ADD CONSTRAINT "_home_v_version_audiences_items_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v_version_audiences_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_audiences_items" ADD CONSTRAINT "_home_v_version_audiences_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_earn_tabs_points" ADD CONSTRAINT "_home_v_version_earn_tabs_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v_version_earn_tabs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_earn_tabs" ADD CONSTRAINT "_home_v_version_earn_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_earn_steps" ADD CONSTRAINT "_home_v_version_earn_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_hero_video_mp4_id_media_id_fk" FOREIGN KEY ("version_hero_video_mp4_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_hero_video_webm_id_media_id_fk" FOREIGN KEY ("version_hero_video_webm_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_hero_video_poster_id_media_id_fk" FOREIGN KEY ("version_hero_video_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_hero_film_video_id_media_id_fk" FOREIGN KEY ("version_hero_film_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_hero_film_poster_id_media_id_fk" FOREIGN KEY ("version_hero_film_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_hero_film_captions_id_media_id_fk" FOREIGN KEY ("version_hero_film_captions_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_locales" ADD CONSTRAINT "_home_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_hero_cues_order_idx" ON "home_hero_cues" USING btree ("_order");
  CREATE INDEX "home_hero_cues_parent_id_idx" ON "home_hero_cues" USING btree ("_parent_id");
  CREATE INDEX "home_hero_cues_locale_idx" ON "home_hero_cues" USING btree ("_locale");
  CREATE INDEX "home_pillars_values_order_idx" ON "home_pillars_values" USING btree ("_order");
  CREATE INDEX "home_pillars_values_parent_id_idx" ON "home_pillars_values" USING btree ("_parent_id");
  CREATE INDEX "home_pillars_values_locale_idx" ON "home_pillars_values" USING btree ("_locale");
  CREATE INDEX "home_pillars_trust_order_idx" ON "home_pillars_trust" USING btree ("_order");
  CREATE INDEX "home_pillars_trust_parent_id_idx" ON "home_pillars_trust" USING btree ("_parent_id");
  CREATE INDEX "home_pillars_trust_locale_idx" ON "home_pillars_trust" USING btree ("_locale");
  CREATE INDEX "home_how_it_works_steps_order_idx" ON "home_how_it_works_steps" USING btree ("_order");
  CREATE INDEX "home_how_it_works_steps_parent_id_idx" ON "home_how_it_works_steps" USING btree ("_parent_id");
  CREATE INDEX "home_how_it_works_steps_locale_idx" ON "home_how_it_works_steps" USING btree ("_locale");
  CREATE INDEX "home_audiences_items_points_order_idx" ON "home_audiences_items_points" USING btree ("_order");
  CREATE INDEX "home_audiences_items_points_parent_id_idx" ON "home_audiences_items_points" USING btree ("_parent_id");
  CREATE INDEX "home_audiences_items_points_locale_idx" ON "home_audiences_items_points" USING btree ("_locale");
  CREATE INDEX "home_audiences_items_order_idx" ON "home_audiences_items" USING btree ("_order");
  CREATE INDEX "home_audiences_items_parent_id_idx" ON "home_audiences_items" USING btree ("_parent_id");
  CREATE INDEX "home_audiences_items_locale_idx" ON "home_audiences_items" USING btree ("_locale");
  CREATE INDEX "home_earn_tabs_points_order_idx" ON "home_earn_tabs_points" USING btree ("_order");
  CREATE INDEX "home_earn_tabs_points_parent_id_idx" ON "home_earn_tabs_points" USING btree ("_parent_id");
  CREATE INDEX "home_earn_tabs_points_locale_idx" ON "home_earn_tabs_points" USING btree ("_locale");
  CREATE INDEX "home_earn_tabs_order_idx" ON "home_earn_tabs" USING btree ("_order");
  CREATE INDEX "home_earn_tabs_parent_id_idx" ON "home_earn_tabs" USING btree ("_parent_id");
  CREATE INDEX "home_earn_tabs_locale_idx" ON "home_earn_tabs" USING btree ("_locale");
  CREATE INDEX "home_earn_steps_order_idx" ON "home_earn_steps" USING btree ("_order");
  CREATE INDEX "home_earn_steps_parent_id_idx" ON "home_earn_steps" USING btree ("_parent_id");
  CREATE INDEX "home_earn_steps_locale_idx" ON "home_earn_steps" USING btree ("_locale");
  CREATE INDEX "home_hero_video_hero_video_mp4_idx" ON "home" USING btree ("hero_video_mp4_id");
  CREATE INDEX "home_hero_video_hero_video_webm_idx" ON "home" USING btree ("hero_video_webm_id");
  CREATE INDEX "home_hero_video_hero_video_poster_idx" ON "home" USING btree ("hero_video_poster_id");
  CREATE INDEX "home_hero_film_hero_film_video_idx" ON "home" USING btree ("hero_film_video_id");
  CREATE INDEX "home_hero_film_hero_film_poster_idx" ON "home" USING btree ("hero_film_poster_id");
  CREATE INDEX "home_hero_film_hero_film_captions_idx" ON "home" USING btree ("hero_film_captions_id");
  CREATE INDEX "home__status_idx" ON "home" USING btree ("_status");
  CREATE UNIQUE INDEX "home_locales_locale_parent_id_unique" ON "home_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_locales_parent_id_idx" ON "home_locales" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_hero_cues_order_idx" ON "_home_v_version_hero_cues" USING btree ("_order");
  CREATE INDEX "_home_v_version_hero_cues_parent_id_idx" ON "_home_v_version_hero_cues" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_hero_cues_locale_idx" ON "_home_v_version_hero_cues" USING btree ("_locale");
  CREATE INDEX "_home_v_version_pillars_values_order_idx" ON "_home_v_version_pillars_values" USING btree ("_order");
  CREATE INDEX "_home_v_version_pillars_values_parent_id_idx" ON "_home_v_version_pillars_values" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_pillars_values_locale_idx" ON "_home_v_version_pillars_values" USING btree ("_locale");
  CREATE INDEX "_home_v_version_pillars_trust_order_idx" ON "_home_v_version_pillars_trust" USING btree ("_order");
  CREATE INDEX "_home_v_version_pillars_trust_parent_id_idx" ON "_home_v_version_pillars_trust" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_pillars_trust_locale_idx" ON "_home_v_version_pillars_trust" USING btree ("_locale");
  CREATE INDEX "_home_v_version_how_it_works_steps_order_idx" ON "_home_v_version_how_it_works_steps" USING btree ("_order");
  CREATE INDEX "_home_v_version_how_it_works_steps_parent_id_idx" ON "_home_v_version_how_it_works_steps" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_how_it_works_steps_locale_idx" ON "_home_v_version_how_it_works_steps" USING btree ("_locale");
  CREATE INDEX "_home_v_version_audiences_items_points_order_idx" ON "_home_v_version_audiences_items_points" USING btree ("_order");
  CREATE INDEX "_home_v_version_audiences_items_points_parent_id_idx" ON "_home_v_version_audiences_items_points" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_audiences_items_points_locale_idx" ON "_home_v_version_audiences_items_points" USING btree ("_locale");
  CREATE INDEX "_home_v_version_audiences_items_order_idx" ON "_home_v_version_audiences_items" USING btree ("_order");
  CREATE INDEX "_home_v_version_audiences_items_parent_id_idx" ON "_home_v_version_audiences_items" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_audiences_items_locale_idx" ON "_home_v_version_audiences_items" USING btree ("_locale");
  CREATE INDEX "_home_v_version_earn_tabs_points_order_idx" ON "_home_v_version_earn_tabs_points" USING btree ("_order");
  CREATE INDEX "_home_v_version_earn_tabs_points_parent_id_idx" ON "_home_v_version_earn_tabs_points" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_earn_tabs_points_locale_idx" ON "_home_v_version_earn_tabs_points" USING btree ("_locale");
  CREATE INDEX "_home_v_version_earn_tabs_order_idx" ON "_home_v_version_earn_tabs" USING btree ("_order");
  CREATE INDEX "_home_v_version_earn_tabs_parent_id_idx" ON "_home_v_version_earn_tabs" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_earn_tabs_locale_idx" ON "_home_v_version_earn_tabs" USING btree ("_locale");
  CREATE INDEX "_home_v_version_earn_steps_order_idx" ON "_home_v_version_earn_steps" USING btree ("_order");
  CREATE INDEX "_home_v_version_earn_steps_parent_id_idx" ON "_home_v_version_earn_steps" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_earn_steps_locale_idx" ON "_home_v_version_earn_steps" USING btree ("_locale");
  CREATE INDEX "_home_v_version_hero_video_version_hero_video_mp4_idx" ON "_home_v" USING btree ("version_hero_video_mp4_id");
  CREATE INDEX "_home_v_version_hero_video_version_hero_video_webm_idx" ON "_home_v" USING btree ("version_hero_video_webm_id");
  CREATE INDEX "_home_v_version_hero_video_version_hero_video_poster_idx" ON "_home_v" USING btree ("version_hero_video_poster_id");
  CREATE INDEX "_home_v_version_hero_film_version_hero_film_video_idx" ON "_home_v" USING btree ("version_hero_film_video_id");
  CREATE INDEX "_home_v_version_hero_film_version_hero_film_poster_idx" ON "_home_v" USING btree ("version_hero_film_poster_id");
  CREATE INDEX "_home_v_version_hero_film_version_hero_film_captions_idx" ON "_home_v" USING btree ("version_hero_film_captions_id");
  CREATE INDEX "_home_v_version_version__status_idx" ON "_home_v" USING btree ("version__status");
  CREATE INDEX "_home_v_created_at_idx" ON "_home_v" USING btree ("created_at");
  CREATE INDEX "_home_v_updated_at_idx" ON "_home_v" USING btree ("updated_at");
  CREATE INDEX "_home_v_snapshot_idx" ON "_home_v" USING btree ("snapshot");
  CREATE INDEX "_home_v_published_locale_idx" ON "_home_v" USING btree ("published_locale");
  CREATE INDEX "_home_v_latest_idx" ON "_home_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_home_v_locales_locale_parent_id_unique" ON "_home_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_home_v_locales_parent_id_idx" ON "_home_v_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "home_hero_cues" CASCADE;
  DROP TABLE "home_pillars_values" CASCADE;
  DROP TABLE "home_pillars_trust" CASCADE;
  DROP TABLE "home_how_it_works_steps" CASCADE;
  DROP TABLE "home_audiences_items_points" CASCADE;
  DROP TABLE "home_audiences_items" CASCADE;
  DROP TABLE "home_earn_tabs_points" CASCADE;
  DROP TABLE "home_earn_tabs" CASCADE;
  DROP TABLE "home_earn_steps" CASCADE;
  DROP TABLE "home" CASCADE;
  DROP TABLE "home_locales" CASCADE;
  DROP TABLE "_home_v_version_hero_cues" CASCADE;
  DROP TABLE "_home_v_version_pillars_values" CASCADE;
  DROP TABLE "_home_v_version_pillars_trust" CASCADE;
  DROP TABLE "_home_v_version_how_it_works_steps" CASCADE;
  DROP TABLE "_home_v_version_audiences_items_points" CASCADE;
  DROP TABLE "_home_v_version_audiences_items" CASCADE;
  DROP TABLE "_home_v_version_earn_tabs_points" CASCADE;
  DROP TABLE "_home_v_version_earn_tabs" CASCADE;
  DROP TABLE "_home_v_version_earn_steps" CASCADE;
  DROP TABLE "_home_v" CASCADE;
  DROP TABLE "_home_v_locales" CASCADE;
  DROP TYPE "public"."enum_home_hero_cues_icon";
  DROP TYPE "public"."enum_home_pillars_values_icon";
  DROP TYPE "public"."enum_home_pillars_trust_icon";
  DROP TYPE "public"."enum_home_audiences_items_audience";
  DROP TYPE "public"."enum_home_status";
  DROP TYPE "public"."enum__home_v_version_hero_cues_icon";
  DROP TYPE "public"."enum__home_v_version_pillars_values_icon";
  DROP TYPE "public"."enum__home_v_version_pillars_trust_icon";
  DROP TYPE "public"."enum__home_v_version_audiences_items_audience";
  DROP TYPE "public"."enum__home_v_version_status";
  DROP TYPE "public"."enum__home_v_published_locale";`)
}
