'use client'

interface Props {
  classId: string
  classes: { id: string; name: string }[]
}

export function AtRiskFilter({ classId, classes }: Props) {
  return (
    <form method="GET" className="mb-4 flex items-center gap-3">
      <select
        name="classId"
        defaultValue={classId}
        onChange={(e) => (e.target.form as HTMLFormElement).requestSubmit()}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- Choisir une classe --</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <button
        type="submit"
        className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition"
      >
        Analyser
      </button>
    </form>
  )
}
