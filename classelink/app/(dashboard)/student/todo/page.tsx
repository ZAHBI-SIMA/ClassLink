import { getMyTodos, createTodo, toggleTodo, deleteTodo } from '@/actions/student-gamification'
import { PageHeader } from '@/components/ui/page-header'

async function createTodoAction(formData: FormData) {
  'use server'
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const dueDate = formData.get('dueDate') as string
  const priority = formData.get('priority') as string
  await createTodo(title, description, dueDate, priority)
}

export const metadata = { title: 'To-do liste' }

const PRIORITY_BADGE: Record<string, string> = {
  HIGH:   'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW:    'bg-gray-100 text-gray-600',
}
const PRIORITY_LABEL: Record<string, string> = {
  HIGH: 'Urgent', MEDIUM: 'Moyen', LOW: 'Faible',
}

export default async function TodoPage() {
  const todos = await getMyTodos()
  const pending = todos.filter((t: any) => !t.completed)
  const completed = todos.filter((t: any) => t.completed)

  return (
    <div className="space-y-6">
      <PageHeader
        title="To-do liste"
        description="Organisez vos tâches scolaires et gagnez 10 XP à chaque tâche complétée."
      />

      {/* Add form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Nouvelle tâche</h3>
        <form action={createTodoAction} className="space-y-3">
          <input
            name="title" required placeholder="Titre de la tâche"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            name="description" rows={2} placeholder="Description (optionnel)"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Échéance</label>
              <input
                name="dueDate" type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Priorité</label>
              <select
                name="priority" defaultValue="MEDIUM"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="LOW">Faible</option>
                <option value="MEDIUM">Moyen</option>
                <option value="HIGH">Urgent</option>
              </select>
            </div>
          </div>
          <button type="submit"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm
                       font-medium rounded-lg transition">
            Ajouter la tâche
          </button>
        </form>
      </div>

      {/* Pending todos */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">
            À faire ({pending.length})
          </h3>
          {pending.map((t: any) => (
            <div key={t.id}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-start gap-3">
              <form action={toggleTodo.bind(null, t.id) as any} className="flex-shrink-0 mt-0.5">
                <button type="submit"
                  className="w-5 h-5 rounded border-2 border-gray-300 hover:border-purple-500 transition" />
              </form>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PRIORITY_BADGE[t.priority]}`}>
                    {PRIORITY_LABEL[t.priority]}
                  </span>
                  {t.due_date && (
                    <span className="text-xs text-gray-400">
                      📅 {new Date(t.due_date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
              <form action={deleteTodo.bind(null, t.id) as any} className="flex-shrink-0">
                <button type="submit"
                  className="text-gray-300 hover:text-red-500 transition p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {/* Completed todos */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-400">
            Terminé ({completed.length})
          </h3>
          {completed.map((t: any) => (
            <div key={t.id}
              className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 flex items-start gap-3 opacity-60">
              <form action={toggleTodo.bind(null, t.id) as any} className="flex-shrink-0 mt-0.5">
                <button type="submit"
                  className="w-5 h-5 rounded border-2 border-green-400 bg-green-400 flex items-center justify-center transition">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </form>
              <p className="flex-1 text-sm text-gray-500 line-through">{t.title}</p>
              <form action={deleteTodo.bind(null, t.id) as any} className="flex-shrink-0">
                <button type="submit"
                  className="text-gray-300 hover:text-red-500 transition p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {todos.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-700 font-medium">Aucune tâche</p>
          <p className="text-sm text-gray-400 mt-1">Ajoutez vos premières tâches scolaires !</p>
        </div>
      )}
    </div>
  )
}
