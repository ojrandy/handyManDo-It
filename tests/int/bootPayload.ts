import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../../src/payload.config'

// Run by globalSetup.ts: connect (and, in dev, push schema changes) once, then exit.
await getPayload({ config })
process.exit(0)
