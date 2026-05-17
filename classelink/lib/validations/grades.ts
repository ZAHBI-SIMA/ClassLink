import { z } from 'zod'

export const saveGradeSchema = z.object({
  id: z.string().optional(),
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  termId: z.string().min(1),
  type: z.enum(['DEVOIR', 'INTERROGATION', 'COMPOSITION', 'EXAM']),
  value: z.number().min(0).max(20),
  maxValue: z.number().min(1).default(20),
  coefficient: z.number().min(0.1).max(10).default(1),
  comment: z.string().max(500).optional(),
})

export const publishGradesSchema = z.object({
  termId: z.string().min(1),
  classId: z.string().min(1),
  subjectId: z.string().min(1),
})

export type SaveGradeInput = z.infer<typeof saveGradeSchema>
export type PublishGradesInput = z.infer<typeof publishGradesSchema>
