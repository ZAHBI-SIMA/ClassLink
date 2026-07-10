import { AssistantChat } from './assistant-chat'

export const metadata = { title: 'Assistant IA' }

export default function TeacherAssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assistant IA</h1>
        <p className="text-sm text-gray-500 mt-1">
          Un assistant pédagogique pour préparer vos cours, évaluations et communications.
          Il n&apos;a pas accès aux notes, présences ou données de vos élèves.
        </p>
      </div>
      <AssistantChat />
    </div>
  )
}
