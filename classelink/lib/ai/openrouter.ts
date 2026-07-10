/**
 * Client OpenRouter (API compatible OpenAI) — infrastructure commune à toutes
 * les fonctionnalités IA de la plateforme (appréciations, résumés, traduction,
 * assistant enseignant...).
 *
 * Variables d'environnement :
 *   OPENROUTER_API_KEY   Clé API OpenRouter (obligatoire pour activer l'IA)
 *   OPENROUTER_MODEL     (optionnel) modèle à utiliser, défaut ci-dessous
 */

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'deepseek/deepseek-v4-flash'

export class AiNotConfiguredError extends Error {
  constructor() {
    super("L'assistant IA n'est pas configuré (clé OPENROUTER_API_KEY manquante).")
    this.name = 'AiNotConfiguredError'
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface CompletionOptions {
  temperature?: number
  maxTokens?: number
  model?: string
}

/** Indique si l'IA est configurée — permet aux pages d'afficher/masquer les actions IA sans lever d'exception. */
export function isAiEnabled(): boolean {
  return !!process.env.OPENROUTER_API_KEY
}

/**
 * Envoie une conversation à OpenRouter et renvoie le texte de la réponse.
 * Lève `AiNotConfiguredError` si aucune clé n'est configurée — à capter
 * explicitement dans les actions appelantes pour afficher un message clair.
 */
export async function chatCompletion(messages: ChatMessage[], options: CompletionOptions = {}): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new AiNotConfiguredError()

  const response = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://myclasslink.app',
      'X-Title': 'MyClassLink',
    },
    body: JSON.stringify({
      model: options.model ?? process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
      messages,
      temperature: options.temperature ?? 0.5,
      max_tokens: options.maxTokens ?? 500,
    }),
    // Les suggestions IA ne doivent jamais bloquer indéfiniment une action serveur.
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Erreur OpenRouter (${response.status}): ${body.slice(0, 300)}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Réponse IA vide ou invalide.')
  }
  return content.trim()
}
