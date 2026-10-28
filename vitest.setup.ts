// Load .env files
import 'dotenv/config'

import { testDatabaseURL } from './tests/int/testDatabase'

// Point every worker at the test database before payload.config is imported (T-1.16).
process.env.DATABASE_URL = testDatabaseURL()
