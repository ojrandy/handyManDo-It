import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/collections/Users'
import { site } from '@/lib/site'

export const Site: GlobalConfig = {
  slug: 'site',
  label: 'Site settings',
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contact',
          fields: [
            { name: 'phone', type: 'text', required: true, defaultValue: site.phoneDisplay },
            { name: 'whatsappUrl', type: 'text', required: true, defaultValue: site.whatsappUrl },
            { name: 'email', type: 'email', required: true, defaultValue: site.email },
            {
              name: 'hours',
              type: 'text',
              localized: true,
              defaultValue: 'Every day, 07:00–21:00 (WAT)',
            },
            {
              name: 'offices',
              type: 'array',
              fields: [
                { name: 'label', type: 'text', required: true, localized: true },
                { name: 'address', type: 'text', required: true },
                { name: 'city', type: 'text', required: true },
                { name: 'mapUrl', type: 'text' },
              ],
              defaultValue: [
                { label: 'Technical direction', address: 'Mile 16 Shopping Mall', city: 'Buea' },
                { label: 'Office', address: 'Mobile Njo Njo, Bonapriso', city: 'Douala' },
              ],
            },
          ],
        },
        {
          label: 'Apps',
          fields: [
            { name: 'webAppUrl', type: 'text', required: true, defaultValue: site.webAppUrl },
            { name: 'playStoreUrl', type: 'text', defaultValue: site.playStoreUrl },
            {
              name: 'appStoreUrl',
              type: 'text',
              defaultValue: site.appStoreUrl,
              admin: { description: 'Leave empty to hide the App Store badge.' },
            },
            { name: 'rating', type: 'number', min: 0, max: 5, admin: { step: 0.1 } },
            { name: 'reviewCount', type: 'number', min: 0 },
          ],
        },
        {
          label: 'Stats',
          fields: [
            { name: 'towns', type: 'number', defaultValue: site.stats.towns },
            { name: 'years', type: 'number', defaultValue: site.stats.years },
            { name: 'clients', type: 'number', defaultValue: site.stats.clients },
            { name: 'projects', type: 'number', defaultValue: site.stats.projects },
          ],
        },
        {
          label: 'Social',
          fields: [
            { name: 'facebook', type: 'text', defaultValue: site.socials.facebook },
            { name: 'instagram', type: 'text', defaultValue: site.socials.instagram },
            { name: 'x', type: 'text', defaultValue: site.socials.x },
            { name: 'youtube', type: 'text', defaultValue: site.socials.youtube },
          ],
        },
      ],
    },
  ],
}
