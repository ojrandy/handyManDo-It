// Saves the old WordPress blog into data/wordpress (posts, categories, media records and every
// image the import uploads), so `npm run migrate:wordpress` works after handymandoit.com stops
// serving the old site.
//
//   npm run archive:wordpress
//
// Reads WORDPRESS_API (default: the live blog). Images already in .cache/wordpress are not fetched
// again. Re-running overwrites the archive with the blog as it is now.
import 'dotenv/config'

import { archiveDir, defaultApi, saveArchive, wordPressSource } from './wordpress/source'

async function main() {
  const api = process.env.WORDPRESS_API || defaultApi
  console.log(`Archiving ${api} into ${archiveDir}…`)
  const counts = await saveArchive(wordPressSource(api))
  console.log(
    `✓ ${counts.posts} posts, ${counts.categories} categories, ${counts.media} media records, ${counts.files} images saved.`,
  )
}

main().catch((error: unknown) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
