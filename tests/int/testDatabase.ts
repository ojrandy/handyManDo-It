import pg from 'pg'

// Int tests write to globals and collections, so they get their own database next to the dev one
// (`handymandoit` → `handymandoit_test`) and never overwrite seeded content (T-1.16).
// TEST_DATABASE_URL overrides the derived name.
export function testDatabaseURL(databaseURL = process.env.DATABASE_URL): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL
  if (!databaseURL) throw new Error('DATABASE_URL is not set')
  const url = new URL(databaseURL)
  const name = url.pathname.slice(1)
  if (!name) throw new Error('DATABASE_URL has no database name')
  if (!name.endsWith('_test')) url.pathname = `/${name}_test`
  return url.toString()
}

// Creates the test database on the same server if it is missing. Payload's dev schema push then
// builds the tables on the first boot (globalSetup.ts).
export async function ensureTestDatabase(testURL: string): Promise<void> {
  const url = new URL(testURL)
  const name = decodeURIComponent(url.pathname.slice(1))
  url.pathname = '/postgres'
  const client = new pg.Client({ connectionString: url.toString() })
  await client.connect()
  try {
    const { rowCount } = await client.query('select 1 from pg_database where datname = $1', [name])
    if (!rowCount) await client.query(`create database ${client.escapeIdentifier(name)}`)
  } finally {
    await client.end()
  }
}
