import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { en } from '@payloadcms/translations/languages/en'
import { fr } from '@payloadcms/translations/languages/fr'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { AppScreens } from './collections/AppScreens'
import { Categories } from './collections/Categories'
import { Faqs } from './collections/Faqs'
import { Files } from './collections/Files'
import { Jobs } from './collections/Jobs'
import { Media } from './collections/Media'
import { Partners } from './collections/Partners'
import { Posts } from './collections/Posts'
import { Projects } from './collections/Projects'
import { Services } from './collections/Services'
import { Submissions } from './collections/Submissions'
import { Team } from './collections/Team'
import { Testimonials } from './collections/Testimonials'
import { Users } from './collections/Users'
import { Site } from './globals/Site'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Media goes to Cloudflare R2 when configured; local disk otherwise (dev only).
const useR2 = Boolean(process.env.S3_BUCKET)

const r2Config = {
  endpoint: process.env.S3_ENDPOINT,
  region: 'auto',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
}

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || '',
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · HandyMan Do IT',
    },
  },
  i18n: {
    supportedLanguages: { en, fr },
    fallbackLanguage: 'en',
  },
  localization: {
    locales: [
      { code: 'fr', label: 'Français' },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'fr',
    fallback: true,
  },
  collections: [
    Users,
    Media,
    Services,
    Projects,
    Testimonials,
    Faqs,
    Posts,
    Categories,
    Team,
    Partners,
    AppScreens,
    Jobs,
    Submissions,
    Files,
  ],
  globals: [Site],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.EMAIL_FROM || 'handymanservicesdoit@gmail.com',
        defaultFromName: 'HandyMan Do IT',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 465),
          secure: Number(process.env.SMTP_PORT || 465) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        },
      })
    : undefined,
  sharp,
  plugins: [
    // Adds a localized meta group (title, description, image) in an SEO tab.
    seoPlugin({
      collections: [Services.slug, Projects.slug, Posts.slug],
      uploadsCollection: Media.slug,
      tabbedUI: true,
      generateTitle: ({ doc }) => `${doc.title} · HandyMan Do IT`,
      generateDescription: ({ doc }) => doc.summary ?? doc.excerpt ?? '',
    }),
    s3Storage({
      enabled: useR2,
      collections: {
        media: {
          prefix: 'media',
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            `${process.env.MEDIA_PUBLIC_URL}/${prefix ? `${prefix}/` : ''}${filename}`,
        },
      },
      bucket: process.env.S3_BUCKET || '',
      config: r2Config,
    }),
    // CVs live in a separate bucket with no public access: the media bucket is public, so a
    // prefix in it would not be private. Files are streamed through Payload's access check.
    s3Storage({
      enabled: Boolean(process.env.S3_PRIVATE_BUCKET),
      collections: { files: true },
      bucket: process.env.S3_PRIVATE_BUCKET || '',
      config: r2Config,
    }),
  ],
})
