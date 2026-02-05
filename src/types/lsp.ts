import { z } from 'zod'

export interface HoverResult {
  kind: 'success' | 'error'
  contents: {
    kind: 'markdown' | 'plaintext'
    value: string
  } | null
  range?: {
    start: { line: number; character: number }
    end: { line: number; character: number }
  }
}

export const HoverResultSchema = z.object({
  kind: z.enum(['success', 'error']),
  contents: z.union([
    z.object({
      kind: z.enum(['markdown', 'plaintext']),
      value: z.string(),
    }),
    z.null(),
  ]),
  range: z
    .object({
      start: z.object({
        line: z.number(),
        character: z.number(),
      }),
      end: z.object({
        line: z.number(),
        character: z.number(),
      }),
    })
    .optional(),
})

export const LocationSchema = z.object({
  uri: z.string(),
  range: z.object({
    start: z.object({
      line: z.number(),
      character: z.number(),
    }),
    end: z.object({
      line: z.number(),
      character: z.number(),
    }),
  }),
})

export const DiagnosticSchema = z.object({
  range: z.object({
    start: z.object({
      line: z.number(),
      character: z.number(),
    }),
    end: z.object({
      line: z.number(),
      character: z.number(),
    }),
  }),
  severity: z.number().optional(),
  code: z.union([z.string(), z.number()]).optional(),
  source: z.string().optional(),
  message: z.string(),
  relatedInformation: z
    .array(
      z.object({
        location: LocationSchema,
        message: z.string(),
      }),
    )
    .optional(),
})
