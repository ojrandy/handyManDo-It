import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "home_hero_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "_home_v_version_hero_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "home_hero_slides" ADD CONSTRAINT "home_hero_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_hero_slides" ADD CONSTRAINT "home_hero_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides" ADD CONSTRAINT "_home_v_version_hero_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides" ADD CONSTRAINT "_home_v_version_hero_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_hero_slides_order_idx" ON "home_hero_slides" USING btree ("_order");
  CREATE INDEX "home_hero_slides_parent_id_idx" ON "home_hero_slides" USING btree ("_parent_id");
  CREATE INDEX "home_hero_slides_locale_idx" ON "home_hero_slides" USING btree ("_locale");
  CREATE INDEX "home_hero_slides_image_idx" ON "home_hero_slides" USING btree ("image_id");
  CREATE INDEX "_home_v_version_hero_slides_order_idx" ON "_home_v_version_hero_slides" USING btree ("_order");
  CREATE INDEX "_home_v_version_hero_slides_parent_id_idx" ON "_home_v_version_hero_slides" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_hero_slides_locale_idx" ON "_home_v_version_hero_slides" USING btree ("_locale");
  CREATE INDEX "_home_v_version_hero_slides_image_idx" ON "_home_v_version_hero_slides" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "home_hero_slides" CASCADE;
  DROP TABLE "_home_v_version_hero_slides" CASCADE;`)
}
