import { AssistantChat } from './assistant-chat'

export const metadata = { title: 'Assistant IA' }

export default function StudentAssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assistant IA</h1>
        <p className="text-sm text-gray-500 mt-1">
          Un assistant pour t&apos;aider à comprendre tes cours et organiser tes révisions.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Tes échanges avec l&apos;assistant sont conservés et peuvent être consultés par l&apos;administration de ton établissement.
        </p>
      </div>
      <AssistantChat />
    </div>
  )
}
