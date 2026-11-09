import { describe, expect, it } from 'vitest'

import { bumpContentVersion, getContentVersion } from '@/lib/contentVersion'

// Open pages refresh when this number moves (AfterLoad, ADR-033).
describe('content version', () => {
  it('is stable between saves', () => {
    expect(getContentVersion()).toBe(getContentVersion())
  })

  it('always moves forward on a save, even twice in the same millisecond', () => {
    const before = getContentVersion()
    bumpContentVersion()
    const once = getContentVersion()
    bumpContentVersion()
    expect(once).toBeGreaterThan(before)
    expect(getContentVersion()).toBeGreaterThan(once)
  })
})
