import { getInbox, getSent } from '@/actions/messages'
import { MessageList } from '@/components/messages/message-list'
import Link from 'next/link'

export const metadata = { title: 'Messagerie' }

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function StudentMessagesPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const activeTab = tab === 'sent' ? 'sent' : 'inbox'

  const messages = activeTab === 'inbox' ? await getInbox() : await getSent()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messagerie</h1>
          <p className="text-sm text-gray-500 mt-1">Vos messages.</p>
        </div>
        <Link
          href="/student/messages/compose"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          Nouveau message
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <Link
            href="/student/messages?tab=inbox"
            className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'inbox'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Boîte de réception
          </Link>
          <Link
            href="/student/messages?tab=sent"
            className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'sent'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Messages envoyés
          </Link>
        </div>

        <MessageList messages={messages} type={activeTab} basePath="/student/messages" />
      </div>
    </div>
  )
}
