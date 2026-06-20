'use client'

import { useActionState, useMemo, useState } from 'react'
import Link from 'next/link'
import { createStaff, updateStaff, resetStaffPassword, toggleStaffActive } from '@/actions/staff'
import type { ActionResult } from '@/types'
import type { ModuleDef, JobPreset } from '@/lib/permissions/modules'

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  job_title: string | null
  allowed_modules: string[] | null
  is_active: boolean
}

interface Props {
  staff:   StaffMember[]
  modules: ModuleDef[]
  presets: JobPreset[]
}

const CUSTOM = '__custom__'

export function StaffClient({ staff, modules, presets }: Props) {
  const [editing, setEditing] = useState<StaffMember | 'new' | null>(null)

  const categories = useMemo(() => {
    const map = new Map<string, ModuleDef[]>()
    for (const m of modules) {
      const arr = map.get(m.category) ?? []
      arr.push(m)
      map.set(m.category, arr)
    }
    return Array.from(map.entries())
  }, [modules])

  return (
    <div className="space-y-6">
      {/* Barre d'action */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{staff.length} membre(s) du personnel</p>
        {editing === null && (
          <button
            onClick={() => setEditing('new')}
            className="px-4 py-2 bg-primary hover:opacity-90 text-white text-sm font-semibold rounded-lg transition"
          >
            + Ajouter un membre
          </button>
        )}
      </div>

      {/* Formulaire création / édition */}
      {editing !== null && (
        <StaffForm
          key={editing === 'new' ? 'new' : editing.id}
          mode={editing === 'new' ? 'create' : 'edit'}
          member={editing === 'new' ? null : editing}
          categories={categories}
          presets={presets}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Liste du personnel */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {staff.length === 0 && (
          <p className="p-6 text-sm text-gray-400 text-center">Aucun membre du personnel pour l&apos;instant.</p>
        )}
        {staff.map(m => (
          <div key={m.id} className="flex items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {m.first_name} {m.last_name}
                {!m.is_active && <span className="ml-2 text-xs font-medium text-red-600">(désactivé)</span>}
              </p>
              <p className="text-xs text-gray-500 truncate">{m.job_title} · {m.email}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{(m.allowed_modules ?? []).length} fonctionnalité(s)</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setEditing(m)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Modifier
              </button>
              <form action={toggleStaffActive}>
                <input type="hidden" name="userId" value={m.id} />
                <button className="text-xs font-medium text-gray-500 hover:underline">
                  {m.is_active ? 'Désactiver' : 'Activer'}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <Link href="/admin/settings" className="inline-block text-sm text-gray-500 hover:underline">
        ← Retour aux paramètres
      </Link>
    </div>
  )
}

// ─── Formulaire (création ou édition) ─────────────────────────────────────────
function StaffForm({
  mode,
  member,
  categories,
  presets,
  onClose,
}: {
  mode: 'create' | 'edit'
  member: StaffMember | null
  categories: [string, ModuleDef[]][]
  presets: JobPreset[]
  onClose: () => void
}) {
  const action = mode === 'create' ? createStaff : updateStaff
  const [state, formAction, pending] = useActionState<ActionResult<any> | null, FormData>(action as any, null)

  const [jobTitle, setJobTitle] = useState(member?.job_title ?? '')
  const [isCustom, setIsCustom] = useState(
    mode === 'edit' && !presets.some(p => p.title === member?.job_title)
  )
  const [checked, setChecked] = useState<Set<string>>(
    new Set(member?.allowed_modules ?? [])
  )

  const tempPassword = (state?.success && (state as any).data?.tempPassword) || null

  function onSelectPreset(value: string) {
    if (value === CUSTOM) {
      setIsCustom(true)
      setJobTitle('')
      setChecked(new Set())
      return
    }
    const preset = presets.find(p => p.title === value)
    if (preset) {
      setIsCustom(false)
      setJobTitle(preset.title)
      setChecked(new Set(preset.modules))
    }
  }

  function toggle(key: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const primaryPresets   = presets.filter(p => p.level === 'Primaire')
  const secondaryPresets = presets.filter(p => p.level === 'Secondaire')

  // Succès création → message + mot de passe ; on garde le panneau ouvert pour le copier.
  return (
    <form action={formAction} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          {mode === 'create' ? 'Nouveau membre du personnel' : `Modifier ${member?.first_name} ${member?.last_name}`}
        </h3>
        <button type="button" onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">Fermer</button>
      </div>

      {state && !state.success && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      {tempPassword && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Compte créé. Mot de passe temporaire : <span className="font-mono font-bold">{tempPassword}</span>
          <p className="text-xs text-green-700 mt-1">Communiquez-le au membre — il ne sera plus affiché.</p>
        </div>
      )}
      {mode === 'edit' && member && <input type="hidden" name="userId" value={member.id} />}

      {/* Identité (création uniquement) */}
      {mode === 'create' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
            <input name="firstName" required className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input name="lastName" required className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input name="email" type="email" required className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input name="phone" className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>
      )}

      {/* Poste */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Poste *</label>
        <select
          value={isCustom ? CUSTOM : jobTitle}
          onChange={e => onSelectPreset(e.target.value)}
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">— Choisir un poste —</option>
          <optgroup label="Primaire">
            {primaryPresets.map(p => <option key={'P'+p.title} value={p.title}>{p.title}</option>)}
          </optgroup>
          <optgroup label="Secondaire">
            {secondaryPresets.map(p => <option key={'S'+p.title} value={p.title}>{p.title}</option>)}
          </optgroup>
          <option value={CUSTOM}>Autre (poste personnalisé)…</option>
        </select>
        {isCustom && (
          <input
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            placeholder="Intitulé du poste"
            className="mt-2 w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        )}
        <input type="hidden" name="jobTitle" value={jobTitle} />
      </div>

      {/* Modules */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fonctionnalités accessibles *</label>
        <div className="space-y-4">
          {categories.map(([cat, mods]) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{cat}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {mods.map(m => (
                  <label key={m.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="modules"
                      value={m.key}
                      checked={checked.has(m.key)}
                      onChange={() => toggle(m.key)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/40"
                    />
                    <span className="truncate">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 bg-primary hover:opacity-90 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition"
        >
          {pending ? 'Enregistrement…' : mode === 'create' ? 'Créer le compte' : 'Enregistrer les accès'}
        </button>
        {mode === 'edit' && member && (
          <ResetPasswordButton userId={member.id} />
        )}
      </div>
    </form>
  )
}

function ResetPasswordButton({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult<any> | null, FormData>(resetStaffPassword, null)
  const pwd = (state?.success && (state as any).data?.tempPassword) || null
  return (
    <span className="flex items-center gap-2">
      <form action={formAction}>
        <input type="hidden" name="userId" value={userId} />
        <button disabled={pending} className="px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">
          {pending ? '…' : 'Réinitialiser le mot de passe'}
        </button>
      </form>
      {pwd && <span className="text-xs font-mono font-bold text-green-700">{pwd}</span>}
    </span>
  )
}
