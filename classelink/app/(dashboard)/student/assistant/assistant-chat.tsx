'use client'

import { askStudentAssistant } from '@/actions/ai'
import { AiChatPanel } from '@/components/ui/ai-chat-panel'

const SUGGESTIONS = [
  'Explique-moi le théorème de Pythagore simplement.',
  'Comment organiser mes révisions pour un contrôle dans une semaine ?',
  'Aide-moi à comprendre la conjugaison du subjonctif.',
]

export function AssistantChat() {
  return (
    <AiChatPanel
      askFn={askStudentAssistant}
      emptyStateText="Pose une question sur tes cours ou tes révisions."
      suggestions={SUGGESTIONS}
    />
  )
}
