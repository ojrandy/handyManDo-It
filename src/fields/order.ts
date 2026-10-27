import type { Field } from 'payload'

export const orderField: Field = {
  name: 'order',
  type: 'number',
  defaultValue: 0,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Lower numbers come first.',
  },
}
