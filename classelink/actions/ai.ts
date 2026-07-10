'use server'

import { requireRole } from '@/lib/auth/rbac'
import { getTenantPrisma } from '@/lib/db/tenant'
import { chatCompletion, isAiEnabled, AiNotConfiguredError } from '@/lib/ai/openrouter'
import type { ActionResult } from '@/types'

function aiError<T>(e: unknown): ActionResult<T> {
  if (e instanceof AiNotConfiguredError) return { success: false, error: e.message }
  return { success: false, error: e instanceof Error ? e.message : "Erreur de l'assistant IA." }
}

/** Utilisée côté client pour afficher/masquer les boutons IA sans appel serveur. */
export async function getAiStatus(): Promise<{ enabled: boolean }> {
  return { enabled: isAiEnabled() }
}

// ─── Génération automatique des appréciations ──────────────────────────────────
export async function suggestGradeComment(input: {
  studentFirstName: string
  subjectName: string
  value: number
  maxValue: number
  classAverage?: number | null
}): Promise<ActionResult<string>> {
  try {
    await requireRole('TEACHER', 'ADMIN', 'CENSOR')

    const pct = (input.value / input.maxValue) * 20
    const contextAvg = input.classAverage != null
      ? ` La moyenne de la classe est de ${input.classAverage.toFixed(1)}/20.`
      : ''

    const text = await chatCompletion([
      {
        role: 'system',
        content: 'Tu es un enseignant expérimenté qui rédige des appréciations de bulletin scolaire en français. '
          + 'Réponds uniquement par l\'appréciation elle-même (une phrase, 15 mots maximum), sans guillemets ni préambule. '
          + 'Ton constructif et professionnel : encourageant si la note est bonne, bienveillant mais honnête si elle est faible.',
      },
      {
        role: 'user',
        content: `Élève : ${input.studentFirstName}. Matière : ${input.subjectName}. `
          + `Note obtenue : ${pct.toFixed(1)}/20.${contextAvg} Rédige une appréciation courte.`,
      },
    ], { maxTokens: 60, temperature: 0.6 })

    return { success: true, data: text }
  } catch (e) {
    return aiError(e)
  }
}

// ─── Résumé automatique des cours ──────────────────────────────────────────────
export async function summarizeLesson(input: {
  title: string
  content: string
}): Promise<ActionResult<string>> {
  try {
    await requireRole('TEACHER', 'ADMIN', 'CENSOR', 'STUDENT', 'PARENT')

    if (!input.content?.trim()) {
      return { success: false, error: 'Aucun contenu de cours à résumer.' }
    }

    const text = await chatCompletion([
      {
        role: 'system',
        content: 'Tu résumes des contenus de cours pour des élèves du secondaire, en français. '
          + 'Réponds par un résumé clair en 3 points maximum (puces courtes), sans préambule.',
      },
      {
        role: 'user',
        content: `Titre du cours : ${input.title}\n\nContenu :\n${input.content.slice(0, 4000)}`,
      },
    ], { maxTokens: 300, temperature: 0.4 })

    return { success: true, data: text }
  } catch (e) {
    return aiError(e)
  }
}

// ─── Traduction automatique ─────────────────────────────────────────────────────
const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'anglais',
  es: 'espagnol',
  ar: 'arabe',
  pt: 'portugais',
  de: 'allemand',
}

export async function translateText(input: {
  text: string
  targetLang: keyof typeof SUPPORTED_LANGUAGES
}): Promise<ActionResult<string>> {
  try {
    await requireRole('ADMIN', 'CENSOR', 'TEACHER', 'PARENT', 'STUDENT', 'ACCOUNTANT', 'STAFF')

    const languageName = SUPPORTED_LANGUAGES[input.targetLang]
    if (!languageName) return { success: false, error: 'Langue non prise en charge.' }
    if (!input.text?.trim()) return { success: false, error: 'Aucun texte à traduire.' }

    const text = await chatCompletion([
      {
        role: 'system',
        content: `Traduis le texte fourni en ${languageName}. Réponds uniquement par la traduction, sans commentaire ni guillemets.`,
      },
      { role: 'user', content: input.text.slice(0, 3000) },
    ], { maxTokens: 800, temperature: 0.2 })

    return { success: true, data: text }
  } catch (e) {
    return aiError(e)
  }
}

// ─── Assistant IA pour les enseignants ─────────────────────────────────────────
export async function askTeacherAssistant(
  question: string,
  history: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<ActionResult<string>> {
  try {
    await requireRole('TEACHER', 'ADMIN', 'CENSOR')

    if (!question?.trim()) return { success: false, error: 'Question vide.' }
    if (history.length > 20) return { success: false, error: 'Conversation trop longue — démarrez une nouvelle discussion.' }

    const text = await chatCompletion([
      {
        role: 'system',
        content: 'Tu es un assistant pédagogique pour des enseignants du secondaire en Côte d\'Ivoire, sur la plateforme MyClassLink. '
          + 'Aide-les à préparer des cours, des évaluations, des activités de classe ou à reformuler des communications aux parents. '
          + 'Réponds en français, de façon concise et pratique. Tu n\'as pas accès aux données de l\'établissement '
          + '(notes, élèves, présences) — si on te demande des données précises, rappelle-le et oriente vers les pages concernées de la plateforme.',
      },
      ...history.slice(-10),
      { role: 'user', content: question.slice(0, 2000) },
    ], { maxTokens: 500, temperature: 0.6 })

    return { success: true, data: text }
  } catch (e) {
    return aiError(e)
  }
}

// ─── Assistant IA administratif ────────────────────────────────────────────────
export async function askAdminAssistant(
  question: string,
  history: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<ActionResult<string>> {
  try {
    await requireRole('ADMIN', 'CENSOR', 'ACCOUNTANT')

    if (!question?.trim()) return { success: false, error: 'Question vide.' }
    if (history.length > 20) return { success: false, error: 'Conversation trop longue — démarrez une nouvelle discussion.' }

    const text = await chatCompletion([
      {
        role: 'system',
        content: 'Tu es un assistant administratif pour la direction d\'un établissement scolaire en Côte d\'Ivoire, '
          + 'sur la plateforme MyClassLink. Aide à rédiger des annonces, convocations, courriers officiels, comptes-rendus '
          + 'de réunion, ou à formuler des politiques internes (règlement intérieur, procédures). '
          + 'Réponds en français, de façon professionnelle et concise. Tu n\'as pas accès aux données de l\'établissement '
          + '(élèves, finances, personnel) — si on te demande des données précises, rappelle-le et oriente vers les pages '
          + 'concernées de la plateforme (Analytics, Paiements, Élèves...).',
      },
      ...history.slice(-10),
      { role: 'user', content: question.slice(0, 2000) },
    ], { maxTokens: 600, temperature: 0.5 })

    return { success: true, data: text }
  } catch (e) {
    return aiError(e)
  }
}

// ─── Chat IA pour les élèves ────────────────────────────────────────────────────
// Portée volontairement restreinte à l'aide scolaire, avec garde-fous et
// journalisation intégrale (question + réponse) pour supervision par
// l'administration — un assistant destiné à des mineurs doit rester traçable.

const FLAG_KEYWORDS = [
  'suicide', 'me tuer', 'me faire du mal', 'automutilation', 'harcèlement',
  'harcelé', 'drogue', 'violence', 'battu', 'abus', 'agressé',
]

export async function askStudentAssistant(
  question: string,
  history: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<ActionResult<string>> {
  try {
    const session = await requireRole('STUDENT')

    if (!question?.trim()) return { success: false, error: 'Question vide.' }
    if (history.length > 20) return { success: false, error: 'Conversation trop longue — démarrez une nouvelle discussion.' }

    const db = getTenantPrisma(session.user.schemaName) as any
    const students: any[] = await db.$queryRaw`SELECT id FROM students WHERE user_id = ${session.user.id} LIMIT 1`
    const studentId = students[0]?.id
    if (!studentId) return { success: false, error: 'Profil élève introuvable.' }

    const text = await chatCompletion([
      {
        role: 'system',
        content: 'Tu es un assistant scolaire bienveillant pour des élèves du secondaire en Côte d\'Ivoire, sur MyClassLink. '
          + 'Aide à comprendre des notions de cours, méthodologie de travail, organisation des révisions. '
          + 'N\'écris JAMAIS directement la réponse finale d\'un devoir noté à rendre : explique la méthode et guide l\'élève '
          + 'pas à pas pour qu\'il trouve lui-même la réponse. Réponds en français, simplement et avec bienveillance. '
          + 'Si la question sort du cadre scolaire (santé, sujets sensibles, questions personnelles graves), réponds '
          + 'brièvement que tu ne peux pas aider sur ce sujet et invite l\'élève à en parler à un adulte de confiance '
          + '(parent, enseignant, conseiller). Ne donne jamais de conseil médical, légal ou financier.',
      },
      ...history.slice(-10),
      { role: 'user', content: question.slice(0, 1000) },
    ], { maxTokens: 400, temperature: 0.5 })

    const flagged = FLAG_KEYWORDS.some(k => question.toLowerCase().includes(k))

    await db.$executeRaw`
      INSERT INTO ai_chat_logs (student_id, question, answer, flagged)
      VALUES (${studentId}, ${question.slice(0, 1000)}, ${text}, ${flagged})
    `

    return { success: true, data: text }
  } catch (e) {
    return aiError(e)
  }
}

// ─── Supervision (ADMIN/CENSOR) ────────────────────────────────────────────────
export async function getStudentAiChatLogs(onlyFlagged = false): Promise<ActionResult<any[]>> {
  try {
    const session = await requireRole('ADMIN', 'CENSOR')
    const db = getTenantPrisma(session.user.schemaName) as any

    const rows = await db.$queryRaw`
      SELECT l.id, l.question, l.answer, l.flagged, l.created_at,
             u.first_name, u.last_name, c.name AS class_name
      FROM ai_chat_logs l
      JOIN students s ON s.id = l.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'ACTIVE'
      LEFT JOIN classes c ON c.id = e.class_id
      WHERE (${onlyFlagged} = FALSE OR l.flagged = TRUE)
      ORDER BY l.created_at DESC
      LIMIT 100
    `
    return { success: true, data: rows as any[] }
  } catch (e) {
    return aiError(e)
  }
}

// ─── Correction automatique des devoirs (rendus textuels) ──────────────────────
// Limité aux rendus soumis en texte libre — une note/appréciation suggérée que
// l'enseignant doit relire et valider ; jamais enregistrée automatiquement.
export interface GradeSuggestion {
  score: number | null
  feedback: string
}

export async function suggestSubmissionGrade(input: {
  assignmentTitle: string
  assignmentDescription: string | null
  studentText: string
  maxScore: number
}): Promise<ActionResult<GradeSuggestion>> {
  try {
    await requireRole('TEACHER', 'ADMIN', 'CENSOR')

    if (!input.studentText?.trim()) {
      return { success: false, error: 'Aucun texte de rendu à corriger.' }
    }

    const raw = await chatCompletion([
      {
        role: 'system',
        content: 'Tu es un enseignant qui corrige un devoir rendu par un élève du secondaire, en français. '
          + `Le barème est sur ${input.maxScore} points. Réponds STRICTEMENT sur deux lignes, sans rien ajouter :\n`
          + `NOTE: <un nombre entre 0 et ${input.maxScore}>\n`
          + 'APPRECIATION: <une appréciation constructive de 20 mots maximum>',
      },
      {
        role: 'user',
        content: `Devoir : ${input.assignmentTitle}\n`
          + (input.assignmentDescription ? `Consigne : ${input.assignmentDescription}\n` : '')
          + `Rendu de l'élève :\n${input.studentText.slice(0, 3000)}`,
      },
    ], { maxTokens: 150, temperature: 0.3 })

    const scoreMatch = raw.match(/NOTE\s*:\s*([\d.,]+)/i)
    const feedbackMatch = raw.match(/APPRECIATION\s*:\s*([\s\S]+)/i)
    const parsedScore = scoreMatch ? parseFloat(scoreMatch[1].replace(',', '.')) : null
    const score = parsedScore !== null && !isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= input.maxScore
      ? parsedScore
      : null

    return {
      success: true,
      data: {
        score,
        feedback: feedbackMatch ? feedbackMatch[1].trim() : raw,
      },
    }
  } catch (e) {
    return aiError(e)
  }
}
