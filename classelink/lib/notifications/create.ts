import { sendPushNotification, isPushEnabled } from '@/lib/firebase-admin'

/**
 * Point d'entrée unique pour notifier un utilisateur : écrit dans la table
 * `notifications` (alimente la cloche in-app) et envoie un push FCM aux
 * appareils mobiles enregistrés pour cet utilisateur.
 *
 * `db` est le client Prisma déjà résolu sur le schéma tenant de l'appelant.
 */
export async function notifyUser(db: any, params: {
  userId: string
  type: string
  title: string
  body: string
  href?: string
}): Promise<void> {
  const data = params.href ? { href: params.href } : null

  // 1. Notification in-app (cloche)
  await db.$executeRaw`
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (${params.userId}, ${params.type}, ${params.title}, ${params.body}, ${data ? JSON.stringify(data) : null}::jsonb)
  `

  // 2. Push mobile — best-effort, ne doit jamais faire échouer l'appelant
  if (!isPushEnabled()) return

  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id         BIGSERIAL PRIMARY KEY,
        user_id    TEXT        NOT NULL,
        token      TEXT        NOT NULL,
        platform   TEXT        NOT NULL DEFAULT 'android',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, token)
      )
    `)

    const devices: any[] = await db.$queryRaw`
      SELECT token FROM device_tokens WHERE user_id = ${params.userId}
    `
    if (devices.length === 0) return

    const tokens = devices.map(d => d.token as string)
    const result = await sendPushNotification({ tokens, title: params.title, body: params.body })

    if (result.invalidTokens.length > 0) {
      await db.$executeRaw`
        DELETE FROM device_tokens
        WHERE user_id = ${params.userId} AND token = ANY(${result.invalidTokens})
      `
    }
  } catch (e) {
    // L'échec du push ne doit jamais faire échouer l'action métier appelante.
    console.error('[notifyUser] Échec envoi push (ignoré) :', e)
  }
}

/** Notifie tous les parents liés à un élève. */
export async function notifyParentsOfStudent(db: any, studentId: string, params: {
  type: string
  title: string
  body: string
  href?: string
}): Promise<void> {
  const parents: any[] = await db.$queryRaw`
    SELECT p.user_id
    FROM parent_students ps
    JOIN parents p ON p.id = ps.parent_id
    WHERE ps.student_id = ${studentId}
  `
  await Promise.all(parents.map(p => notifyUser(db, { ...params, userId: p.user_id })))
}
