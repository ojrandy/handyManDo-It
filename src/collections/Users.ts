import type { Access, CollectionConfig } from 'payload'

export const isAdmin: Access = ({ req: { user } }) => Boolean(user?.roles?.includes('admin'))

// Any signed-in editor or admin (every account in `users` has one of those roles).
export const isEditor: Access = ({ req: { user } }) =>
  Boolean(user?.roles?.some((role) => role === 'admin' || role === 'editor'))

export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.roles?.includes('admin')) return true
  return { id: { equals: user.id } }
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'roles'],
  },
  auth: true,
  hooks: {
    beforeChange: [
      // The first account ever created (via /admin/create-first-user) becomes admin.
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users', req })
        if (totalDocs === 0) data.roles = ['admin']
        return data
      },
    ],
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      saveToJWT: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      // Hidden on /admin/create-first-user (no user yet); the hook above makes that account admin.
      access: {
        create: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
        update: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
      },
    },
  ],
}
