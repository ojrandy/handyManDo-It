import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Int tests exercise server code (Payload Local API). Component tests opt in to jsdom
    // per file with a `// @vitest-environment jsdom` comment; it is slow to boot.
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    globalSetup: ['./tests/int/globalSetup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
    // next-intl imports `next/navigation` without an extension, which plain Node ESM can't
    // resolve; letting Vite transform it makes localized paths (src/lib/seo.ts) testable.
    server: { deps: { inline: ['next-intl'] } },
    // getPayload() connects and checks the schema in beforeAll; with every file booting Payload in
    // parallel, that takes 48–64 s on the dev machine.
    hookTimeout: 120_000,
    // Saving a versioned global writes several tables; with every file sharing one database in
    // parallel, a single test can pass 5 s.
    testTimeout: 30_000,
  },
})
