import { randomUUID } from 'node:crypto'
import path from 'node:path'

import { APIError, type CollectionBeforeOperationHook, type CollectionConfig } from 'payload'

import { isAdmin, isEditor } from '@/access'

export const maxFileSize = 5 * 1024 * 1024

// CVs and other private attachments (FR-FORM-04). Only the form route handler creates them
// (Local API, overrideAccess); they are served through Payload's access check, never publicly.
const checkUpload: CollectionBeforeOperationHook = ({ operation, req }) => {
  if ((operation === 'create' || operation === 'update') && req.file) {
    if (req.file.size > maxFileSize) throw new APIError('File is larger than 5 MB.', 413)
    // An unguessable name, so a leaked link pattern can't be enumerated.
    req.file.name = `${randomUUID()}${path.extname(req.file.name).toLowerCase()}`
  }
}

export const Files: CollectionConfig = {
  slug: 'files',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'mimeType', 'filesize', 'createdAt'],
    group: 'Inbox',
  },
  access: {
    read: isEditor,
    create: () => false,
    update: () => false,
    delete: isAdmin,
  },
  hooks: {
    beforeOperation: [checkUpload],
  },
  upload: {
    // Outside /public and gitignored; in production the private R2 bucket (payload.config.ts).
    staticDir: path.resolve(process.cwd(), 'private-files'),
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  fields: [],
}
