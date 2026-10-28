const localHosts = ['localhost', '127.0.0.1', '::1', '[::1]']

export type DatabaseTarget = {
  host: string
  database: string
  local: boolean
}

// Host and database name only: the URL also carries the password, which must never be logged.
export function describeDatabase(url: string | undefined): DatabaseTarget {
  if (!url) throw new Error('DATABASE_URL is not set.')
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('DATABASE_URL is not a valid URL.')
  }
  return {
    host: parsed.hostname,
    database: parsed.pathname.replace(/^\//, ''),
    local: localHosts.includes(parsed.hostname),
  }
}

// Seeding writes content in bulk. Anything that is not a local database (Neon staging or
// production) is refused unless the operator passes --force on purpose.
export function assertSeedTarget(url: string | undefined, force: boolean): DatabaseTarget {
  const target = describeDatabase(url)
  if (!target.local && !force) {
    throw new Error(
      `Seeding refused: DATABASE_URL host "${target.host}" is not a local database. ` +
        'Re-run with --force only if you really mean to seed it.',
    )
  }
  return target
}
