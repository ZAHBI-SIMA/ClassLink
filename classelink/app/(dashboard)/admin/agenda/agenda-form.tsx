'use client'

import { useState } from 'react'
import { createAgendaEvent } from '@/actions/agenda'

interface Props {
  classes: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
}

export function AgendaForm({ classes, subjects }: Props) {
  const [eventType, setEventType] = useState('GENERAL')
  const [error, setError] = useState<string | null>(null)
  const isExam = eventType === 'EXAM'

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createAgendaEvent({
      title:       formData.get('title') as string,
      description: formData.get('description') as string,
      eventType:   formData.get('eventType') as string,
      startDate:   formData.get('startDate') as string,
      endDate:     formData.get('endDate') as string,
      startTime:   formData.get('startTime') as string,
      endTime:     formData.get('endTime') as string,
      classId:     formData.get('classId') as string,
      allClasses:  formData.get('allClasses') === 'true',
      subjectId:   formData.get('subjectId') as string,
      room:        formData.get('room') as string,
      maxValue:    formData.get('maxValue') as string,
      coefficient: formData.get('coefficient') as string,
    })
    if (!result.success) setError(result.error)
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <input name="title" required placeholder="Titre"
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <textarea name="description" rows={2} placeholder="Description (optionnel)"
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      <select name="eventType" required value={eventType} onChange={e => setEventType(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="GENERAL">Général</option>
        <option value="EXAM">Examen</option>
        <option value="HOLIDAY">Vacances</option>
        <option value="MEETING">Réunion</option>
        <option value="ACTIVITY">Activité</option>
        <option value="DEADLINE">Échéance</option>
      </select>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500">Début</label>
          <input name="startDate" type="date" required
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Fin (opt.)</label>
          <input name="endDate" type="date"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Heure début</label>
          <input name="startTime" type="time"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Heure fin</label>
          <input name="endTime" type="time"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <select name="classId" required={isExam}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">{isExam ? 'Sélectionner une classe' : 'Toutes les classes'}</option>
        {classes.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {isExam && (
        <div className="rounded-lg border border-red-100 bg-red-50/50 p-3 space-y-2">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Détails de l&apos;examen</p>
          <select name="subjectId" required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400">
            <option value="">Matière</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <input name="room" placeholder="Salle"
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400" />
            <input name="maxValue" type="number" step="0.5" defaultValue="20" placeholder="Barème"
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400" />
            <input name="coefficient" type="number" step="0.5" defaultValue="1" placeholder="Coeff."
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
        </div>
      )}

      {!isExam && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="allClasses" value="true"
            className="rounded border-gray-300 text-blue-600" />
          Visible par toutes les classes
        </label>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button type="submit"
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
        Créer l&apos;événement
      </button>
    </form>
  )
}
