import { AssistantChat } from './assistant-chat'

export const metadata = { title: 'Assistant IA' }

export default function AdminAssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assistant IA</h1>
        <p className="text-sm text-gray-500 mt-1">
          Un assistant pour rédiger annonces, convocations et courriers officiels.
          Il n&apos;a pas accès aux données de l&apos;établissement.
        </p>
      </div>
      <AssistantChat />
    </div>
  )
}
