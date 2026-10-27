import { spawnSync } from 'node:child_process'

// Boot Payload once before the test files run in parallel. In dev, the first boot after a
// schema change pushes the new tables; several workers doing that at once race and fail.
// It runs in a child process because Payload leaves handles open that would keep Vitest alive.
export default function setup() {
  const result = spawnSync(
    process.execPath,
    ['--no-deprecation', '--import=tsx/esm', 'tests/int/bootPayload.ts'],
    { stdio: 'inherit', timeout: 180_000 },
  )
  if (result.status !== 0) throw new Error('Payload failed to boot before the int tests')
}
