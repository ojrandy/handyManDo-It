import { z } from 'zod'

// Form definitions shared by the browser and the intake route (FR-FORM-01, ADR-023): the same
// schema validates on both sides. Errors are codes; the form shows `forms.errors.<code>`.

export const formTypes = [
  'contact',
  'quote-home',
  'quote-business',
  'partnership',
  'pro',
  'job',
] as const
export type FormType = (typeof formTypes)[number]

export const isFormType = (value: string): value is FormType =>
  (formTypes as readonly string[]).includes(value)

export type ErrorCode =
  'required' | 'tooLong' | 'email' | 'phone' | 'contactMethod' | 'consent' | 'fileType' | 'fileSize'

// Loose on purpose: Cameroonian numbers are written many ways (+237 6 52 76 76 74, 652767674).
const phonePattern = /^\+?[\d\s().-]{8,20}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const optional = (max: number) => z.string().max(max, 'tooLong')
const required = (max: number) => optional(max).min(1, 'required')
const email = (needed: boolean) =>
  (needed ? required(200) : optional(200)).refine(
    (value) => value === '' || emailPattern.test(value),
    'email',
  )
const phone = (needed: boolean) =>
  (needed ? required(30) : optional(30)).refine(
    (value) => value === '' || phonePattern.test(value),
    'phone',
  )

const shared = {
  name: required(100),
  consent: z.literal('on', 'consent'),
}

const schemas = {
  contact: z
    .object({
      ...shared,
      email: email(false),
      phone: phone(false),
      subject: optional(150),
      message: required(4000),
    })
    // A reply needs one way back.
    .refine((data) => data.email !== '' || data.phone !== '', {
      message: 'contactMethod',
      path: ['phone'],
    }),
  'quote-home': z.object({
    ...shared,
    phone: phone(true),
    email: email(false),
    city: required(80),
    service: optional(120),
    message: required(4000),
  }),
  'quote-business': z.object({
    ...shared,
    company: required(150),
    email: email(true),
    phone: phone(true),
    city: optional(80),
    service: optional(120),
    message: required(4000),
  }),
  partnership: z.object({
    ...shared,
    company: required(150),
    email: email(true),
    phone: phone(false),
    message: required(4000),
  }),
  pro: z.object({
    ...shared,
    phone: phone(true),
    email: email(false),
    city: required(80),
    skills: required(300),
    message: optional(2000),
  }),
  job: z.object({
    ...shared,
    email: email(true),
    phone: phone(true),
    city: optional(80),
    message: optional(4000),
  }),
} satisfies Record<FormType, z.ZodType>

export type FormValues<T extends FormType> = z.infer<(typeof schemas)[T]>

// Fields each form shows, in order (the consent box always comes last).
export const formFields = {
  contact: ['name', 'email', 'phone', 'subject', 'message'],
  'quote-home': ['name', 'phone', 'email', 'city', 'service', 'message'],
  'quote-business': ['name', 'company', 'email', 'phone', 'city', 'service', 'message'],
  partnership: ['name', 'company', 'email', 'phone', 'message'],
  pro: ['name', 'phone', 'email', 'city', 'skills', 'message'],
  job: ['name', 'email', 'phone', 'city', 'message'],
} as const satisfies Record<FormType, readonly string[]>

export type FieldName = (typeof formFields)[FormType][number]

// Saved to their own `submissions` columns; every other field goes to `details`.
export const columnFields = ['name', 'email', 'phone', 'city', 'message'] as const

// A field is required when the empty string fails its own schema (zod 4 keeps `.refine` on the
// object, so `.shape` is there for every form).
export const isRequired = (type: FormType, field: string): boolean => {
  const shape: Record<string, z.ZodType | undefined> = schemas[type].shape
  return shape[field] ? !shape[field].safeParse('').success : false
}

export type ValidationResult<T extends FormType> =
  { ok: true; data: FormValues<T> } | { ok: false; errors: Record<string, ErrorCode> }

// Trims every value first, so "  " counts as empty on both sides.
export function validateForm<T extends FormType>(
  type: T,
  values: Record<string, string>,
): ValidationResult<T> {
  const trimmed = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value.trim()]),
  )
  const keys = [...formFields[type], 'consent']
  const input = Object.fromEntries(keys.map((key) => [key, trimmed[key] ?? '']))
  const result = schemas[type].safeParse(input)
  if (result.success) return { ok: true, data: result.data as FormValues<T> }
  const errors: Record<string, ErrorCode> = {}
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? 'form')
    errors[field] ??= issue.message as ErrorCode
  }
  return { ok: false, errors }
}

// CV rules (FR-FORM-04), mirrored by the `files` collection.
export const cvMaxBytes = 5 * 1024 * 1024
export const cvMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
export const cvAccept = '.pdf,.doc,.docx'

export function checkCv(file: { size: number; type: string } | null): ErrorCode | null {
  if (!file || file.size === 0) return 'required'
  if (!cvMimeTypes.includes(file.type)) return 'fileType'
  if (file.size > cvMaxBytes) return 'fileSize'
  return null
}
