import type { Access } from 'payload'

export const anyone: Access = () => true

export const isAdmin: Access = ({ req: { user } }) => Boolean(user?.roles?.includes('admin'))

// Any signed-in editor or admin (every account in `users` has one of those roles).
export const isEditor: Access = ({ req: { user } }) =>
  Boolean(user?.roles?.some((role) => role === 'admin' || role === 'editor'))

export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.roles?.includes('admin')) return true
  return { id: { equals: user.id } }
}

// For collections with drafts: editors see everything, the public only published docs.
export const publishedOrEditor: Access = (args) => {
  if (isEditor(args)) return true
  return { _status: { equals: 'published' } }
}
