import { z } from 'zod'

export const createStudentSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['M', 'F']).optional(),
  address: z.string().optional(),
  classId: z.string().min(1, 'Classe requise'),
  parentFirstName: z.string().min(2).optional(),
  parentLastName: z.string().min(2).optional(),
  parentEmail: z.string().email().optional().or(z.literal('')),
  parentPhone: z.string().optional(),
  parentRelation: z.enum(['Père', 'Mère', 'Tuteur', 'Autre']).optional(),
})

export const importStudentsSchema = z.array(
  z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    className: z.string().optional(),
  })
)

export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type ImportStudentsInput = z.infer<typeof importStudentsSchema>
