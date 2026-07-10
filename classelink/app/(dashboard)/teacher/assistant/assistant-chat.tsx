'use client'

import { askTeacherAssistant } from '@/actions/ai'
import { AiChatPanel } from '@/components/ui/ai-chat-panel'

const SUGGESTIONS = [
  'Propose 3 activités pour réviser les fractions en 6e.',
  'Rédige un message aux parents pour annoncer une sortie scolaire.',
  'Suggère un barème de correction pour une dissertation.',
]

export function AssistantChat() {
  return (
    <AiChatPanel
      askFn={askTeacherAssistant}
      emptyStateText="Posez une question pour préparer un cours, une évaluation ou une communication."
      suggestions={SUGGESTIONS}
    />
  )
}
