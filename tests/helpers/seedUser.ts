import { getPayload } from 'payload'

import config from '../../src/payload.config.js'

export const testUser = {
  email: 'e2e-admin@handymandoit.test',
  password: 'e2e-only-password',
}

// These helpers delete and create users. Refuse to run against anything but a local
// or CI database so a misconfigured .env can never touch staging/production.
function assertLocalDatabase(): void {
  const host = new URL(process.env.DATABASE_URL || 'postgres://unset').hostname
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    throw new Error(`E2E seeding refused: DATABASE_URL host "${host}" is not a local database.`)
  }
}

/**
 * Seeds a test admin for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  assertLocalDatabase()
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: { email: { equals: testUser.email } },
  })

  await payload.create({
    collection: 'users',
    data: { ...testUser, roles: ['admin'] },
  })
}

/**
 * Removes the test admin after the tests.
 */
export async function cleanupTestUser(): Promise<void> {
  assertLocalDatabase()
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: { email: { equals: testUser.email } },
  })
}
