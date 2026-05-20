import { getMyBadges, getMyXP } from '@/actions/student-gamification'
import { PageHeader } from '@/components/ui/page-header'

export const metadata = { title: 'Badges & XP' }

const BADGE_DEFS: Record<string, { label: string; desc: string; icon: string }> = {
  FIRST_QUIZ:    { label: 'Premier Quiz',    desc: 'Complétez votre premier quiz',     icon: '🎯' },
  PERFECT_SCORE: { label: 'Score Parfait',   desc: '100% à un quiz',                  icon: '⭐' },
  STREAK_7:      { label: 'Assidu 7j',       desc: '7 jours consécutifs actifs',      icon: '🔥' },
  STREAK_30:     { label: 'Assidu 30j',      desc: '30 jours consécutifs actifs',     icon: '💎' },
  TOP_CLASS:     { label: 'Top Classe',      desc: 'Premier de la classe',            icon: '🏆' },
  TOP_SCHOOL:    { label: 'Top École',       desc: 'Premier de l\'école',             icon: '👑' },
  ASSIDUOUS:     { label: 'Assidu',          desc: '0 absence injustifiée',           icon: '✅' },
  BOOKWORM:      { label: 'Lecteur',         desc: 'Emprunt de 5 livres',             icon: '📚' },
  HELPER:        { label: 'Solidaire',       desc: 'Participation active',            icon: '🤝' },
  CREATIVE:      { label: 'Créatif',         desc: 'Travaux remarquables',            icon: '🎨' },
  PROGRESS:      { label: 'En Progrès',      desc: 'Objectif académique atteint',     icon: '📈' },
  CHAMPION:      { label: 'Champion',        desc: 'Excellence générale',             icon: '🥇' },
}

export default async function BadgesPage() {
  const [earned, xp] = await Promise.all([
    getMyBadges(),
    getMyXP(),
  ])

  const earnedTypes = new Set(earned.map((b: any) => b.badge_type))
  const levelPct = Math.max(0, Math.min(100, ((xp.total % 100) / 100) * 100))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Badges & XP"
        description="Vos récompenses et votre progression de niveau."
      />

      {/* XP / Level card */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-200">Niveau</p>
            <p className="text-5xl font-black mt-1">{xp.level}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-200">XP Total</p>
            <p className="text-3xl font-bold mt-1">{xp.total}</p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-purple-200">
            <span>Niveau {xp.level}</span>
            <span>{xp.nextLevelXP} XP pour le niveau {xp.level + 1}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-white h-3 rounded-full transition-all"
              style={{ width: `${levelPct}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-purple-200 mt-2">
          {earnedTypes.size} / {Object.keys(BADGE_DEFS).length} badges débloqués
        </p>
      </div>

      {/* Badges grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Collection de badges</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Object.entries(BADGE_DEFS).map(([type, def]) => {
            const isEarned = earnedTypes.has(type)
            const earnedBadge = earned.find((b: any) => b.badge_type === type)
            return (
              <div
                key={type}
                className={`rounded-xl border p-4 text-center transition
                  ${isEarned
                    ? 'bg-white border-purple-200 shadow-sm'
                    : 'bg-gray-50 border-gray-100 opacity-50'}`}
              >
                <div className="text-3xl mb-2">{isEarned ? def.icon : '🔒'}</div>
                <p className={`text-xs font-semibold ${isEarned ? 'text-gray-900' : 'text-gray-400'}`}>
                  {def.label}
                </p>
                <p className={`text-xs mt-0.5 ${isEarned ? 'text-gray-500' : 'text-gray-300'}`}>
                  {def.desc}
                </p>
                {isEarned && earnedBadge?.earned_at && (
                  <p className="text-[10px] text-purple-500 mt-1 font-medium">
                    {new Date(earnedBadge.earned_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
