'use client'

import { askAdminAssistant } from '@/actions/ai'
import { AiChatPanel } from '@/components/ui/ai-chat-panel'

const SUGGESTIONS = [
  'Rédige une annonce pour informer les parents d\'un changement d\'horaires.',
  'Prépare une convocation pour un conseil de discipline.',
  'Rédige un courrier de relance pour les frais de scolarité impayés.',
]

export function AssistantChat() {
  return (
    <AiChatPanel
      askFn={askAdminAssistant}
      emptyStateText="Posez une question pour rédiger une communication ou une procédure administrative."
      suggestions={SUGGESTIONS}
    />
  )
}
