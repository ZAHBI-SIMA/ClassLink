import { getStudentAiChatLogs } from '@/actions/ai'
import Link from 'next/link'

export const metadata = { title: 'Supervision IA' }

interface Props {
  searchParams: Promise<{ flagged?: string }>
}

export default async function AiSupervisionPage({ searchParams }: Props) {
  const { flagged } = await searchParams
  const onlyFlagged = flagged === '1'
  const result = await getStudentAiChatLogs(onlyFlagged)
  const logs = result.success ? (result.data ?? []) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Supervision — Assistant IA élèves</h1>
        <p className="text-sm text-gray-500 mt-1">
          Historique des échanges entre les élèves et l&apos;assistant IA, conservé pour supervision.
        </p>
      </div>

      <div className="flex gap-2">
        <Link href="/admin/ai-supervision"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            !onlyFlagged ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          }`}>
          Tous les échanges
        </Link>
        <Link href="/admin/ai-supervision?flagged=1"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            onlyFlagged ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-200 hover:border-red-400'
          }`}>
          Signalés uniquement
        </Link>
      </div>

      {!result.success ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{result.error}</div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm text-gray-400">
            {onlyFlagged ? 'Aucun échange signalé.' : 'Aucun échange enregistré pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log: any) => (
            <div key={log.id} className={`bg-white rounded-xl border p-4 ${log.flagged ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-xs font-semibold text-gray-700">
                  {log.first_name} {log.last_name}
                  <span className="ml-2 font-normal text-gray-400">{log.class_name}</span>
                </p>
                <div className="flex items-center gap-2">
                  {log.flagged && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Signalé</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg px-3 py-2 mb-2">
                <p className="text-[10px] font-semibold text-blue-600 uppercase mb-0.5">Question</p>
                <p className="text-sm text-blue-900">{log.question}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Réponse</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{log.answer}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
