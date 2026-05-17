import type { NotificationChannel, NotificationType } from '@/types'

interface NotificationPayload {
  userId: string
  type: NotificationType
  title: string
  body: string
  channels: NotificationChannel[]
  data?: Record<string, unknown>
  email?: {
    to: string
    subject: string
    html?: string
  }
  sms?: {
    to: string
    message: string
  }
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const { channels, email, sms } = payload

  await Promise.allSettled([
    channels.includes('email') && email ? sendEmail(email) : null,
    channels.includes('sms') && sms ? sendSMS(sms) : null,
  ])
}

async function sendEmail(params: { to: string; subject: string; html?: string }) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: params.to,
    subject: params.subject,
    html: params.html ?? params.subject,
  })
}

async function sendSMS(params: { to: string; message: string }) {
  if (!process.env.AT_API_KEY || !process.env.AT_USERNAME) return

  const { default: AfricasTalking } = await import('africastalking')
  const at = AfricasTalking({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
  })

  await at.SMS.send({
    to: [params.to],
    message: params.message,
    from: process.env.AT_SHORTCODE,
  })
}

// Templates de messages prédéfinis
export const notificationTemplates = {
  GRADE_PUBLISHED: (studentName: string, subject: string) => ({
    title: 'Nouvelles notes disponibles',
    body: `Les notes de ${subject} pour ${studentName} ont été publiées.`,
    sms: `ClasseLink: Notes de ${subject} pour ${studentName} disponibles. Consultez votre espace parent.`,
  }),

  ABSENCE_RECORDED: (studentName: string, date: string, subject: string) => ({
    title: 'Absence enregistrée',
    body: `${studentName} a été absent(e) le ${date} en ${subject}.`,
    sms: `ClasseLink: Absence de ${studentName} le ${date} en ${subject}. Connectez-vous pour justifier.`,
  }),

  REPORT_CARD_AVAILABLE: (studentName: string, term: string) => ({
    title: 'Bulletin disponible',
    body: `Le bulletin du ${term} de ${studentName} est disponible.`,
    sms: `ClasseLink: Bulletin ${term} de ${studentName} disponible. Téléchargez-le sur votre espace.`,
  }),

  PAYMENT_RECEIVED: (amount: string, reference: string) => ({
    title: 'Paiement confirmé',
    body: `Votre paiement de ${amount} a été confirmé. Référence : ${reference}`,
    sms: `ClasseLink: Paiement de ${amount} confirmé. Ref: ${reference}. Merci.`,
  }),

  PAYMENT_DUE: (amount: string, dueDate: string) => ({
    title: 'Rappel de paiement',
    body: `Un paiement de ${amount} est dû le ${dueDate}.`,
    sms: `ClasseLink: Rappel - Paiement de ${amount} attendu le ${dueDate}.`,
  }),
}
