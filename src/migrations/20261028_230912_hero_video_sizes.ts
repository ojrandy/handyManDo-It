import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" ADD COLUMN "hero_video_mp4_large_id" integer;
  ALTER TABLE "home" ADD COLUMN "hero_video_webm_large_id" integer;
  ALTER TABLE "home" ADD COLUMN "hero_video_mp4_small_id" integer;
  ALTER TABLE "home" ADD COLUMN "hero_video_webm_small_id" integer;
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_video_mp4_large_id" integer;
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_video_webm_large_id" integer;
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_video_mp4_small_id" integer;
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_video_webm_small_id" integer;
  ALTER TABLE "home" ADD CONSTRAINT "home_hero_video_mp4_large_id_media_id_fk" FOREIGN KEY ("hero_video_mp4_large_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_hero_video_webm_large_id_media_id_fk" FOREIGN KEY ("hero_video_webm_large_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_hero_video_mp4_small_id_media_id_fk" FOREIGN KEY ("hero_video_mp4_small_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_hero_video_webm_small_id_media_id_fk" FOREIGN KEY ("hero_video_webm_small_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_hero_video_mp4_large_id_media_id_fk" FOREIGN KEY ("version_hero_video_mp4_large_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_hero_video_webm_large_id_media_id_fk" FOREIGN KEY ("version_hero_video_webm_large_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_hero_video_mp4_small_id_media_id_fk" FOREIGN KEY ("version_hero_video_mp4_small_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_hero_video_webm_small_id_media_id_fk" FOREIGN KEY ("version_hero_video_webm_small_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_hero_video_hero_video_mp4_large_idx" ON "home" USING btree ("hero_video_mp4_large_id");
  CREATE INDEX "home_hero_video_hero_video_webm_large_idx" ON "home" USING btree ("hero_video_webm_large_id");
  CREATE INDEX "home_hero_video_hero_video_mp4_small_idx" ON "home" USING btree ("hero_video_mp4_small_id");
  CREATE INDEX "home_hero_video_hero_video_webm_small_idx" ON "home" USING btree ("hero_video_webm_small_id");
  CREATE INDEX "_home_v_version_hero_video_version_hero_video_mp4_large_idx" ON "_home_v" USING btree ("version_hero_video_mp4_large_id");
  CREATE INDEX "_home_v_version_hero_video_version_hero_video_webm_large_idx" ON "_home_v" USING btree ("version_hero_video_webm_large_id");
  CREATE INDEX "_home_v_version_hero_video_version_hero_video_mp4_small_idx" ON "_home_v" USING btree ("version_hero_video_mp4_small_id");
  CREATE INDEX "_home_v_version_hero_video_version_hero_video_webm_small_idx" ON "_home_v" USING btree ("version_hero_video_webm_small_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" DROP CONSTRAINT "home_hero_video_mp4_large_id_media_id_fk";
  
  ALTER TABLE "home" DROP CONSTRAINT "home_hero_video_webm_large_id_media_id_fk";
  
  ALTER TABLE "home" DROP CONSTRAINT "home_hero_video_mp4_small_id_media_id_fk";
  
  ALTER TABLE "home" DROP CONSTRAINT "home_hero_video_webm_small_id_media_id_fk";
  
  ALTER TABLE "_home_v" DROP CONSTRAINT "_home_v_version_hero_video_mp4_large_id_media_id_fk";
  
  ALTER TABLE "_home_v" DROP CONSTRAINT "_home_v_version_hero_video_webm_large_id_media_id_fk";
  
  ALTER TABLE "_home_v" DROP CONSTRAINT "_home_v_version_hero_video_mp4_small_id_media_id_fk";
  
  ALTER TABLE "_home_v" DROP CONSTRAINT "_home_v_version_hero_video_webm_small_id_media_id_fk";
  
  DROP INDEX "home_hero_video_hero_video_mp4_large_idx";
  DROP INDEX "home_hero_video_hero_video_webm_large_idx";
  DROP INDEX "home_hero_video_hero_video_mp4_small_idx";
  DROP INDEX "home_hero_video_hero_video_webm_small_idx";
  DROP INDEX "_home_v_version_hero_video_version_hero_video_mp4_large_idx";
  DROP INDEX "_home_v_version_hero_video_version_hero_video_webm_large_idx";
  DROP INDEX "_home_v_version_hero_video_version_hero_video_mp4_small_idx";
  DROP INDEX "_home_v_version_hero_video_version_hero_video_webm_small_idx";
  ALTER TABLE "home" DROP COLUMN "hero_video_mp4_large_id";
  ALTER TABLE "home" DROP COLUMN "hero_video_webm_large_id";
  ALTER TABLE "home" DROP COLUMN "hero_video_mp4_small_id";
  ALTER TABLE "home" DROP COLUMN "hero_video_webm_small_id";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_video_mp4_large_id";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_video_webm_large_id";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_video_mp4_small_id";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_video_webm_small_id";`)
}
