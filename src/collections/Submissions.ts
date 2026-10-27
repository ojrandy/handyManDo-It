import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  Field,
  Payload,
} from 'payload'

import { isAdmin, isEditor } from '@/access'

export const retentionMonths = 24

// NFR-PRIV-01: submissions older than 24 months are deleted. There is no cron on Hostinger, so
// this runs after each new submission (and admins can bulk-delete from the list at any time).
export async function purgeExpiredSubmissions(payload: Payload): Promise<number> {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - retentionMonths)
  const { docs } = await payload.delete({
    collection: 'submissions',
    where: { createdAt: { less_than: cutoff.toISOString() } },
    depth: 0,
  })
  return docs.length
}

const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ').slice(0, 120)

// Runs outside the request's transaction (no `req`): a failed email or purge must never roll
// back the submission itself.
const notifyAndPurge: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  const { payload } = req
  try {
    const site = await payload.findGlobal({ slug: 'site', depth: 0 })
    await payload.sendEmail({
      to: site.email,
      subject: oneLine(`[handymandoit.com] ${doc.type}: ${doc.name}`),
      text: [
        `Type: ${doc.type}`,
        `Name: ${doc.name}`,
        `Email: ${doc.email ?? '-'}`,
        `Phone: ${doc.phone ?? '-'}`,
        `City: ${doc.city ?? '-'}`,
        `Language: ${doc.locale}`,
        '',
        doc.message ?? '',
        '',
        `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin/collections/submissions/${doc.id}`,
      ].join('\n'),
    })
  } catch (error) {
    payload.logger.error({ err: error, submission: doc.id }, 'Submission email failed')
  }
  try {
    await purgeExpiredSubmissions(payload)
  } catch (error) {
    payload.logger.error({ err: error }, 'Submission retention purge failed')
  }
  return doc
}

// The CV goes with its submission, whether deleted by hand or by the retention purge.
const deleteAttachment: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const id = typeof doc.attachment === 'object' ? doc.attachment?.id : doc.attachment
  if (!id) return doc
  try {
    await req.payload.delete({ collection: 'files', id, req })
  } catch (error) {
    req.payload.logger.error({ err: error, file: id }, 'Attachment delete failed')
  }
  return doc
}

// What the visitor sent is evidence: nobody edits it in the admin (FR-FORM-02).
const readOnly = (field: Field): Field =>
  ({ ...field, access: { update: () => false }, admin: { readOnly: true } }) as Field

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['type', 'name', 'email', 'city', 'status', 'createdAt'],
    group: 'Inbox',
    description: `Form entries. Deleted automatically after ${retentionMonths} months.`,
  },
  defaultSort: '-createdAt',
  access: {
    // Only the form route handler creates entries (Local API with overrideAccess).
    create: () => false,
    read: isEditor,
    update: isEditor,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [notifyAndPurge],
    afterDelete: [deleteAttachment],
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      index: true,
      options: [
        { label: 'New', value: 'new' },
        { label: 'In progress', value: 'in-progress' },
        { label: 'Done', value: 'done' },
        { label: 'Spam', value: 'spam' },
      ],
      admin: { position: 'sidebar' },
    },
    ...[
      {
        name: 'type',
        type: 'select',
        required: true,
        index: true,
        options: [
          { label: 'Contact', value: 'contact' },
          { label: 'Quote (home)', value: 'quote-home' },
          { label: 'Quote (business)', value: 'quote-business' },
          { label: 'Partnership', value: 'partnership' },
          { label: 'Pro application', value: 'pro' },
          { label: 'Job application', value: 'job' },
        ],
      },
      { name: 'name', type: 'text', required: true },
      { name: 'email', type: 'email' },
      { name: 'phone', type: 'text' },
      { name: 'city', type: 'text' },
      { name: 'message', type: 'textarea' },
      { name: 'job', type: 'relationship', relationTo: 'jobs' },
      { name: 'attachment', type: 'upload', relationTo: 'files' },
      {
        name: 'locale',
        type: 'select',
        required: true,
        options: [
          { label: 'Français', value: 'fr' },
          { label: 'English', value: 'en' },
        ],
      },
      { name: 'details', type: 'json', admin: { description: 'Extra form fields.' } },
      { name: 'utm', type: 'json' },
    ].map((field) => readOnly(field as Field)),
  ],
}
