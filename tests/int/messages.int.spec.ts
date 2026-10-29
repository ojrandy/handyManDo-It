import { describe, expect, it } from 'vitest'

import en from '@/messages/en.json'
import fr from '@/messages/fr.json'

// Flattens { a: { b: 'x' }, c: ['y'] } into [['a.b', 'x'], ['c.0', 'y']] so the two trees
// (including list lengths) can be compared key by key.
function flatten(messages: object, prefix = ''): [string, string][] {
  return Object.entries(messages).flatMap(([key, value]): [string, string][] =>
    typeof value === 'string'
      ? [[`${prefix}${key}`, value]]
      : flatten(value as object, `${prefix}${key}.`),
  )
}

// QA-AUTO-04 / FR-I18N-03
describe('UI messages', () => {
  const frEntries = flatten(fr)
  const enEntries = flatten(en)

  it('fr.json and en.json have identical key trees', () => {
    expect(frEntries.map(([key]) => key).sort()).toEqual(enEntries.map(([key]) => key).sort())
  })

  it.each([
    ['fr', frEntries],
    ['en', enEntries],
  ])('%s.json has no empty values', (_locale, entries) => {
    expect(entries.filter(([, value]) => value.trim() === '').map(([key]) => key)).toEqual([])
  })

  // French puts a space before ? ! : ; and inside « », and groups thousands with a space. A plain
  // space there lets the line wrap and leave the mark alone at the start of the next line.
  it('fr.json uses no-break spaces in French punctuation', () => {
    const breakable = / [?!:;»%]|« |\d \d{3}\b/
    expect(frEntries.filter(([, value]) => breakable.test(value)).map(([key]) => key)).toEqual([])
  })
})
