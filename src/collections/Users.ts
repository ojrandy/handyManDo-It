import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrSelf } from '@/access'

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
    // Payload's default lets any signed-in user unlock an account locked after failed logins.
    unlock: isAdmin,
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
