'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Props {
  isAuthenticated: boolean
  dashboardHref: string
}

/* ─────────────────────────── Données ─────────────────────────── */

const NAV_LINKS = [
  { href: '#accueil',         label: 'Accueil' },
  { href: '#fonctionnalites', label: 'Fonctionnalités' },
  { href: '#espaces',         label: 'Espaces' },
  { href: '#demarrage',       label: 'Démarrage' },
  { href: '#tarifs',          label: 'Tarifs' },
  { href: '#faq',             label: 'FAQ' },
]

const MODULES = [
  'Notes & moyennes', 'Bulletins PDF', 'Présences', 'Mobile Money', 'Emplois du temps',
  'Cahier de texte', 'Messagerie', 'Annonces', 'Cantine', 'Bibliothèque',
  'Devoirs en ligne', 'Quiz & récompenses', 'Bourses', 'Convocations', 'Sorties scolaires',
]

const FEATURES = [
  {
    title: 'Notes & Bulletins',
    desc: 'Saisie des notes, calcul automatique des moyennes et des rangs, bulletins exportables en PDF aux couleurs de l’établissement.',
    color: 'bg-blue-50 text-blue-600',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    wide: true,
  },
  {
    title: 'Présences & Absences',
    desc: 'Appel numérique, suivi des retards et justificatifs, alertes automatiques envoyées aux parents en temps réel.',
    color: 'bg-emerald-50 text-emerald-600',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Paiements en ligne',
    desc: 'Frais de scolarité réglés par Mobile Money (Orange, MTN, Moov) et carte bancaire. Reçus automatiques et suivi des impayés.',
    color: 'bg-amber-50 text-amber-600',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
  {
    title: 'Messagerie & Annonces',
    desc: 'Communication directe entre l’administration, les enseignants et les familles. Annonces ciblées par classe ou par rôle.',
    color: 'bg-violet-50 text-violet-600',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  {
    title: 'Emplois du temps',
    desc: 'Planification des cours par classe et par enseignant, cahier de texte numérique et agenda consultable par les élèves.',
    color: 'bg-rose-50 text-rose-600',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    title: 'Vie scolaire complète',
    desc: 'Bibliothèque, cantine, sorties scolaires, bourses, sanctions, quiz et gamification : toute la vie de l’école au même endroit.',
    color: 'bg-cyan-50 text-cyan-600',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    wide: true,
    chips: ['Cantine', 'Bibliothèque', 'Sorties', 'Bourses', 'Quiz', 'Récompenses', 'Convocations'],
  },
]

const ROLES = [
  {
    key: 'admin',
    title: 'Administration',
    tagline: 'Pilotez tout l’établissement en un coup d’œil',
    desc: 'Élèves, classes, finances, statistiques et paramètres : le tableau de bord réunit tout ce qu’il faut pour décider vite et bien.',
    points: ['Tableau de bord & statistiques en temps réel', 'Gestion des inscriptions et des classes', 'Suivi des paiements et des impayés'],
    accent: 'from-blue-500 to-blue-600',
    dot: 'bg-blue-500',
  },
  {
    key: 'teacher',
    title: 'Enseignants',
    tagline: 'Moins d’administratif, plus d’enseignement',
    desc: 'L’appel, les notes et le cahier de texte se remplissent en quelques clics — depuis la salle de classe ou depuis chez soi.',
    points: ['Saisie des notes & appréciations', 'Appel numérique & cahier de texte', 'Devoirs et ressources en ligne'],
    accent: 'from-emerald-500 to-emerald-600',
    dot: 'bg-emerald-500',
  },
  {
    key: 'parent',
    title: 'Parents',
    tagline: 'La scolarité de vos enfants, dans votre poche',
    desc: 'Notes, absences, paiements : vous êtes informés en temps réel, où que vous soyez, sur le web ou l’application mobile.',
    points: ['Notes & bulletins dès leur publication', 'Alertes d’absence en temps réel', 'Paiements Mobile Money sans déplacement'],
    accent: 'from-violet-500 to-violet-600',
    dot: 'bg-violet-500',
  },
  {
    key: 'student',
    title: 'Élèves',
    tagline: 'Un espace pour progresser à son rythme',
    desc: 'Résultats, devoirs, emploi du temps et quiz : chaque élève garde le fil de sa scolarité et gagne des récompenses.',
    points: ['Notes & classement en direct', 'Emploi du temps & devoirs à rendre', 'Quiz, badges & récompenses'],
    accent: 'from-amber-500 to-orange-500',
    dot: 'bg-amber-500',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Créez votre établissement',
    desc: 'Configurez le nom, le logo, le directeur et les paramètres de votre école en quelques minutes.',
  },
  {
    n: '02',
    title: 'Importez vos données',
    desc: 'Ajoutez classes, matières, enseignants et élèves manuellement ou par import en masse depuis Excel.',
  },
  {
    n: '03',
    title: 'Lancez l’année scolaire',
    desc: 'Notes, présences, paiements et communication : tout votre établissement est connecté.',
  },
]

// Réduction appliquée en facturation annuelle
const ANNUAL_DISCOUNT = 0.17

const STATS = [
  { value: 6,  suffix: '',   label: 'Espaces dédiés par rôle' },
  { value: 15, suffix: '+',  label: 'Modules intégrés' },
  { value: 3,  suffix: '',   label: 'Opérateurs Mobile Money' },
  { value: 24, suffix: '/7', label: 'Accès sécurisé' },
]

const TESTIMONIALS = [
  {
    quote: 'Avant, la période des bulletins était un cauchemar de plusieurs semaines. Aujourd’hui, tout est calculé et publié en quelques clics — les parents les reçoivent le jour même.',
    name: 'Directeur d’un groupe scolaire',
    place: 'Abidjan, Cocody',
    initials: 'DK',
    color: 'bg-blue-600',
  },
  {
    quote: 'Le paiement par Mobile Money a changé notre quotidien : plus de files d’attente à la caisse et un suivi des impayés enfin fiable.',
    name: 'Économe d’un collège privé',
    place: 'Yamoussoukro',
    initials: 'AT',
    color: 'bg-emerald-600',
  },
  {
    quote: 'Je sais immédiatement si mon fils est absent et je consulte ses notes depuis mon téléphone. Je n’ai plus besoin d’attendre la réunion de parents.',
    name: 'Parent d’élève',
    place: 'Abidjan, Yopougon',
    initials: 'MK',
    color: 'bg-violet-600',
  },
]

const PLANS = [
  {
    slug: 'gratuit',
    name: 'Gratuit',
    monthly: 0,
    currency: '',
    desc: 'Pour découvrir la plateforme.',
    features: ['Jusqu’à 50 élèves', 'Gestion des élèves', 'Bulletins basiques', 'Messagerie'],
    cta: 'Commencer',
    highlight: false,
  },
  {
    slug: 'starter',
    name: 'Starter',
    monthly: 15000,
    currency: 'FCFA',
    desc: 'Pour les petits établissements.',
    features: ['Jusqu’à 300 élèves', 'Tout le plan Gratuit', 'Paiements en ligne', 'Emplois du temps'],
    cta: 'Choisir Starter',
    highlight: false,
  },
  {
    slug: 'pro',
    name: 'Pro',
    monthly: 40000,
    currency: 'FCFA',
    desc: 'Le plus populaire.',
    features: ['Jusqu’à 1000 élèves', 'Tout le plan Starter', 'Multi-campus', 'Rapports avancés'],
    cta: 'Choisir Pro',
    highlight: true,
  },
  {
    slug: 'entreprise',
    name: 'Entreprise',
    monthly: 100000,
    currency: 'FCFA',
    desc: 'Pour les grands groupes scolaires.',
    features: ['Élèves illimités', 'Tout le plan Pro', 'Support prioritaire', 'Accompagnement dédié'],
    cta: 'Choisir Entreprise',
    highlight: false,
  },
]

// Calcule le prix affiché (mensuel, ou mensuel × 12 avec réduction) + l'unité de période
function getDisplayPrice(monthly: number, currency: string, billing: 'mensuel' | 'annuel') {
  if (monthly === 0) {
    return { price: '0', period: currency ? `${currency}/mois` : '/mois' }
  }
  if (billing === 'annuel') {
    const annual = Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT))
    return { price: annual.toLocaleString('fr-FR'), period: currency ? `${currency}/an` : '/an' }
  }
  return { price: monthly.toLocaleString('fr-FR'), period: currency ? `${currency}/mois` : '/mois' }
}

const FAQS = [
  {
    q: 'Faut-il installer un logiciel dans l’école ?',
    a: 'Non. MyClassLink fonctionne entièrement en ligne : un navigateur web suffit, sur ordinateur comme sur téléphone. Les élèves et les parents disposent en plus d’une application mobile Android.',
  },
  {
    q: 'Puis-je importer mes élèves depuis un fichier Excel ?',
    a: 'Oui. L’import en masse vous permet d’ajouter vos classes, matières, enseignants et élèves depuis un fichier Excel ou CSV en quelques minutes, sans ressaisie manuelle.',
  },
  {
    q: 'Quels moyens de paiement sont acceptés ?',
    a: 'Les familles peuvent régler les frais de scolarité par Mobile Money (Orange Money, MTN MoMo, Moov Money) et par carte bancaire. Chaque paiement génère automatiquement un reçu.',
  },
  {
    q: 'Mes données sont-elles en sécurité ?',
    a: 'Chaque établissement dispose de son propre espace isolé et sécurisé. Les accès sont protégés par mot de passe, avec double authentification disponible, et les données sont sauvegardées automatiquement.',
  },
  {
    q: 'Puis-je changer de forfait en cours d’année ?',
    a: 'Oui, à tout moment. Vous pouvez commencer avec le plan Gratuit et évoluer vers un forfait supérieur quand votre effectif grandit, sans perdre aucune donnée.',
  },
  {
    q: 'Et si mes enseignants ne sont pas à l’aise avec l’informatique ?',
    a: 'L’interface a été pensée pour être aussi simple qu’une application de messagerie. Notre équipe vous accompagne au démarrage et reste disponible pour former vos équipes.',
  },
]

/* ─────────────────────────── Sous-composants ─────────────────────────── */

function Logo({ className = 'h-14 w-auto' }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="MyClassLink"
      width={2000}
      height={2000}
      priority
      className={className}
    />
  )
}

function CheckIcon({ className = 'h-4 w-4 flex-shrink-0 text-blue-500' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

/** Compteur animé déclenché à l'apparition à l'écran. */
function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let started = false
    let fallback: ReturnType<typeof setTimeout>

    const check = () => {
      if (started) return
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight && r.bottom > 0) {
        started = true
        window.removeEventListener('scroll', check)
        const duration = 1200
        const t0 = performance.now()
        const tick = (t: number) => {
          const p = Math.min((t - t0) / duration, 1)
          setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        // Garantit la valeur finale même si requestAnimationFrame est suspendu
        fallback = setTimeout(() => setDisplay(value), duration + 300)
      }
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => {
      window.removeEventListener('scroll', check)
      clearTimeout(fallback)
    }
  }, [value])

  return (
    <span ref={ref} className="tabular-nums">
      {display}{suffix}
    </span>
  )
}

/** Faux tableau de bord affiché dans le hero. */
function HeroMockup() {
  const bars = [45, 70, 55, 85, 65, 95, 78]
  return (
    <div className="relative mx-auto mt-16 max-w-4xl px-2">
      {/* Fenêtre */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-blue-900/10">
        {/* Barre de navigateur */}
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <div className="ml-3 hidden flex-1 rounded-md bg-white px-3 py-1 text-[11px] text-gray-400 ring-1 ring-gray-200 sm:block">
            app.myclasslink — Tableau de bord
          </div>
        </div>

        <div className="flex">
          {/* Mini sidebar */}
          <div className="hidden w-40 flex-shrink-0 border-r border-gray-100 bg-gray-50/60 p-3 sm:block">
            <div className="mb-4 flex items-center gap-2 px-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-bold text-white">M</span>
              <span className="text-xs font-bold text-gray-800">MyClassLink</span>
            </div>
            {['Tableau de bord', 'Élèves', 'Notes', 'Paiements', 'Messages'].map((item, i) => (
              <div key={item}
                className={`mb-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${i === 0 ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>
                {item}
              </div>
            ))}
          </div>

          {/* Contenu */}
          <div className="flex-1 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-900 sm:text-sm">Bonjour, Directeur 👋</p>
                <p className="text-[10px] text-gray-400 sm:text-xs">Année scolaire 2025-2026 · Trimestre 2</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
                ● En ligne
              </span>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                ['Élèves inscrits', '1 248', 'text-blue-600'],
                ['Taux de présence', '96%', 'text-emerald-600'],
                ['Recouvrement', '87%', 'text-amber-600'],
              ].map(([label, val, color]) => (
                <div key={label} className="rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm sm:p-3">
                  <p className="text-[9px] text-gray-400 sm:text-[11px]">{label}</p>
                  <p className={`mt-0.5 text-sm font-extrabold sm:text-lg ${color}`}>{val}</p>
                </div>
              ))}
            </div>

            {/* Graphique + liste */}
            <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
              <div className="col-span-3 rounded-xl border border-gray-100 p-3">
                <p className="mb-2 text-[10px] font-semibold text-gray-600 sm:text-xs">Paiements par mois</p>
                <div className="flex h-16 items-end gap-1.5 sm:h-20">
                  {bars.map((h, i) => (
                    <div key={i}
                      className="animate-grow-bar flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400"
                      style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }} />
                  ))}
                </div>
              </div>
              <div className="col-span-2 rounded-xl border border-gray-100 p-3">
                <p className="mb-2 text-[10px] font-semibold text-gray-600 sm:text-xs">Activité récente</p>
                {[
                  ['Note publiée · 6e A', 'bg-blue-400'],
                  ['Paiement reçu', 'bg-emerald-400'],
                  ['Absence justifiée', 'bg-amber-400'],
                ].map(([txt, dot]) => (
                  <div key={txt} className="mb-1.5 flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dot}`} />
                    <span className="truncate text-[9px] text-gray-500 sm:text-[11px]">{txt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes flottantes */}
      <div className="animate-float-soft absolute -left-2 top-24 hidden rounded-xl border border-gray-100 bg-white p-3 shadow-xl md:block lg:-left-14">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-bold text-gray-900">Paiement reçu</p>
            <p className="text-[11px] text-gray-500">+45 000 FCFA · Orange Money</p>
          </div>
        </div>
      </div>

      <div className="animate-float-soft-delayed absolute -right-2 bottom-16 hidden rounded-xl border border-gray-100 bg-white p-3 shadow-xl md:block lg:-right-14">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-bold text-gray-900">Bulletin publié</p>
            <p className="text-[11px] text-gray-500">SMS envoyé aux parents de 6e A</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Faux écran illustrant l'espace du rôle sélectionné. */
function RolePreview({ roleKey }: { roleKey: string }) {
  if (roleKey === 'admin') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[['Élèves', '1 248', 'text-blue-600'], ['Recouvrement', '87%', 'text-emerald-600']].map(([l, v, c]) => (
            <div key={l} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <p className="text-[11px] text-gray-400">{l}</p>
              <p className={`text-xl font-extrabold ${c}`}>{v}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold text-gray-600">Inscriptions par niveau</p>
          {[['6e', 82], ['5e', 74], ['4e', 61], ['3e', 55]].map(([l, w]) => (
            <div key={l} className="mb-1.5 flex items-center gap-2">
              <span className="w-5 text-[10px] font-medium text-gray-400">{l}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${w}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (roleKey === 'teacher') {
    return (
      <div className="space-y-2.5">
        {[
          ['6e A · Mathématiques', 'Appel fait · Notes saisies', 'bg-emerald-100 text-emerald-700', '✓'],
          ['5e B · Mathématiques', 'Appel fait · 3 devoirs à corriger', 'bg-amber-100 text-amber-700', '3'],
          ['4e A · Mathématiques', 'Cours à 14h00 · Salle 12', 'bg-blue-100 text-blue-700', '14h'],
        ].map(([cls, info, badge, b]) => (
          <div key={cls} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <div>
              <p className="text-xs font-bold text-gray-900">{cls}</p>
              <p className="text-[11px] text-gray-500">{info}</p>
            </div>
            <span className={`flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${badge}`}>{b}</span>
          </div>
        ))}
      </div>
    )
  }
  if (roleKey === 'parent') {
    return (
      <div className="space-y-2.5">
        {[
          ['Nouvelle note · Aya', 'Mathématiques : 16/20', 'bg-blue-100 text-blue-600', 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
          ['Paiement confirmé', 'Scolarité T2 · 45 000 FCFA', 'bg-emerald-100 text-emerald-600', 'M5 13l4 4L19 7'],
          ['Alerte absence · Koffi', 'Absent en SVT ce matin', 'bg-rose-100 text-rose-600', 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
        ].map(([title, sub, color, icon]) => (
          <div key={title} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${color}`}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
            </span>
            <div>
              <p className="text-xs font-bold text-gray-900">{title}</p>
              <p className="text-[11px] text-gray-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-600">Ma moyenne générale</p>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">3e du classement</span>
        </div>
        <p className="mt-1 text-2xl font-extrabold text-blue-600">14,8<span className="text-sm text-gray-400">/20</span></p>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <p className="mb-2 text-xs font-semibold text-gray-600">Aujourd’hui</p>
        {[['08h00 · Mathématiques', 'Salle 12'], ['10h00 · Histoire-Géo', 'Salle 7'], ['14h00 · Devoir de SVT à rendre', '⚠ À faire']].map(([t, s]) => (
          <div key={t} className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-700">{t}</span>
            <span className="text-[10px] text-gray-400">{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────── Page ─────────────────────────── */

export function Landing({ isAuthenticated, dashboardHref }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [billing, setBilling] = useState<'mensuel' | 'annuel'>('mensuel')
  const [activeSection, setActiveSection] = useState('#accueil')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeRole, setActiveRole] = useState('admin')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [testimonialIdx, setTestimonialIdx] = useState(0)
  const testimonialPaused = useRef(false)
  const headerRef = useRef<HTMLElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  /* Mesure la hauteur réelle du header (fixe) pour réserver l'espace
     équivalent sous celui-ci — évite que le contenu saute au chargement. */
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const update = () => setHeaderHeight(el.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const primaryHref = isAuthenticated ? dashboardHref : '/login'
  const primaryLabel = isAuthenticated ? 'Accéder à mon espace' : 'Se connecter'
  const startHref = isAuthenticated ? dashboardHref : '/register'
  const startLabel = isAuthenticated ? 'Accéder à mon espace' : 'Créer mon établissement'

  /* Révélation au scroll, scrollspy et barre de progression (basés sur la
     position réelle — pas d'IntersectionObserver, suspendu sur certains
     navigateurs quand l'onglet est masqué). */
  useEffect(() => {
    const reveals = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    const sections = NAV_LINKS
      .map(l => document.querySelector<HTMLElement>(l.href))
      .filter((s): s is HTMLElement => s !== null)

    const onScroll = () => {
      // Barre de progression
      const max = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(max > 0 ? window.scrollY / max : 0)

      // Révélation des blocs entrés dans le viewport
      const limit = window.innerHeight * 0.92
      for (const el of reveals) {
        if (!el.classList.contains('is-visible') && el.getBoundingClientRect().top < limit) {
          el.classList.add('is-visible')
        }
      }

      // Section active : la dernière dont le haut est passé au-dessus du milieu
      const mid = window.innerHeight * 0.45
      let current = sections[0]
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= mid) current = s
      }
      if (current) setActiveSection(`#${current.id}`)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  /* Carrousel témoignages auto */
  useEffect(() => {
    const id = setInterval(() => {
      if (!testimonialPaused.current) {
        setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length)
      }
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const currentRole = ROLES.find(r => r.key === activeRole) ?? ROLES[0]

  return (
    <div className="min-h-screen scroll-smooth bg-white text-gray-900">

      {/* ══════════════ NAVBAR ══════════════ */}
      <header ref={headerRef} className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        {/* Barre de progression de lecture */}
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-blue-400 transition-[width] duration-150"
          style={{ width: `${scrollProgress * 100}%` }}
        />
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2.5">
          <Link href="#accueil"><Logo /></Link>

          <div className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href}
                className={`relative text-sm font-medium transition ${
                  activeSection === l.href
                    ? 'text-blue-600 after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}>
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link href={primaryHref}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20">
              {primaryLabel}
            </Link>
          </div>

          {/* Burger mobile */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 md:hidden"
            aria-label="Menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </nav>

        {/* Menu mobile déroulant */}
        <div className={`overflow-hidden border-t border-gray-100 bg-white transition-all duration-300 md:hidden ${menuOpen ? 'max-h-96 px-5 py-4' : 'max-h-0'}`}>
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                {l.label}
              </a>
            ))}
            <Link href={primaryHref}
              className="mt-2 rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white">
              {primaryLabel}
            </Link>
          </div>
        </div>
      </header>

      {/* Espaceur : compense le retrait du header du flux normal (position fixed) */}
      <div aria-hidden style={{ height: headerHeight }} />

      {/* ══════════════ 1. HERO ══════════════ */}
      <section id="accueil" className="relative overflow-hidden scroll-mt-20">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50/80 via-white to-white" />
        <div className="absolute -top-24 left-1/4 -z-10 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute right-1/4 top-40 -z-10 h-64 w-64 rounded-full bg-secondary/25 blur-3xl" />

        <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 text-center sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
            La gestion scolaire numérique pensée pour l’Afrique
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Toute votre école,{' '}
            <span className="bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 bg-clip-text text-transparent">
              dans une seule plateforme
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Notes, bulletins, présences, paiements Mobile Money et communication avec les familles.
            MyClassLink réunit tous les acteurs de l’établissement dans un espace simple et sécurisé.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={startHref}
              className="group w-full rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 sm:w-auto">
              {startLabel}
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <a href="#fonctionnalites"
              className="w-full rounded-xl border border-gray-300 bg-white px-7 py-3 text-sm font-semibold text-gray-700 transition hover:border-blue-300 hover:bg-blue-50/50 sm:w-auto">
              Découvrir la plateforme
            </a>
          </div>

          <p className="mt-5 text-xs text-gray-400">
            Plan gratuit disponible · Aucune carte bancaire requise · Prêt en 3 minutes
          </p>

          <HeroMockup />
        </div>
      </section>

      {/* ══════════════ BANDEAU MODULES ══════════════ */}
      <section className="marquee-paused border-y border-gray-100 bg-gray-50/70 py-5">
        <div className="overflow-hidden">
          <div className="animate-marquee flex w-max gap-3">
            {[...MODULES, ...MODULES].map((m, i) => (
              <span key={`${m}-${i}`}
                className="flex-shrink-0 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ 2. FONCTIONNALITÉS (bento) ══════════════ */}
      <section id="fonctionnalites" className="scroll-mt-20 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Fonctionnalités</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Tout ce dont votre établissement a besoin
            </h2>
            <p className="mt-4 text-gray-600">
              Une suite complète d’outils conçus pour simplifier la gestion quotidienne de l’école.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                style={{ transitionDelay: `${(i % 3) * 90}ms` }}
                className={`reveal group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-600/5 ${
                  f.wide ? 'sm:col-span-2 lg:col-span-2' : ''
                }`}>
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-50/0 blur-2xl transition group-hover:bg-blue-100/60" />
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${f.color}`}>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={f.icon} />
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</p>
                {f.chips && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {f.chips.map(c => (
                      <span key={c} className="rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500 ring-1 ring-gray-100">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ 3. ESPACES (onglets interactifs) ══════════════ */}
      <section id="espaces" className="scroll-mt-20 bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Espaces dédiés</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Une expérience adaptée à chaque rôle
            </h2>
            <p className="mt-4 text-gray-600">
              Cliquez sur un profil pour découvrir son espace personnalisé.
            </p>
          </div>

          {/* Onglets */}
          <div className="reveal mt-10 flex flex-wrap justify-center gap-2">
            {ROLES.map(r => (
              <button key={r.key}
                onClick={() => setActiveRole(r.key)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  activeRole === r.key
                    ? `bg-gradient-to-r text-white shadow-lg ${r.accent}`
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-blue-300'
                }`}>
                {r.title}
              </button>
            ))}
          </div>

          {/* Panneau */}
          <div key={currentRole.key}
            className="mx-auto mt-8 grid max-w-5xl items-center gap-8 rounded-3xl border border-gray-100 bg-white p-7 shadow-sm sm:p-10 lg:grid-cols-2">
            <div>
              <span className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white ${currentRole.accent}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                Espace {currentRole.title}
              </span>
              <h3 className="mt-4 text-2xl font-bold text-gray-900">{currentRole.tagline}</h3>
              <p className="mt-3 leading-relaxed text-gray-600">{currentRole.desc}</p>
              <ul className="mt-5 space-y-3">
                {currentRole.points.map(p => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                    {p}
                  </li>
                ))}
              </ul>
              <Link href={startHref}
                className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:gap-3">
                Essayer cet espace <span>→</span>
              </Link>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100 sm:p-5">
              <RolePreview roleKey={currentRole.key} />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ 4. CHIFFRES ══════════════ */}
      <section className="border-y border-gray-100 bg-white py-14">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-5 text-center md:grid-cols-4">
          {STATS.map(s => (
            <div key={s.label} className="reveal">
              <p className="text-4xl font-extrabold text-blue-600">
                <Counter value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ 5. DÉMARRAGE ══════════════ */}
      <section id="demarrage" className="scroll-mt-20 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Démarrage</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Opérationnel en 3 étapes
            </h2>
            <p className="mt-4 text-gray-600">
              Mettez votre établissement en ligne rapidement, sans compétences techniques.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.n}
                style={{ transitionDelay: `${i * 120}ms` }}
                className="reveal relative rounded-2xl border border-gray-100 bg-gradient-to-b from-blue-50/40 to-white p-7 text-center transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-600/5">
                <span className="text-4xl font-extrabold text-blue-200">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <svg className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-blue-200 md:block"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          <div className="reveal mt-10 text-center">
            <Link href={startHref}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700">
              {startLabel} <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════ 6. TÉMOIGNAGES ══════════════ */}
      <section
        className="bg-gray-50 py-20 sm:py-24"
        onMouseEnter={() => { testimonialPaused.current = true }}
        onMouseLeave={() => { testimonialPaused.current = false }}
      >
        <div className="mx-auto max-w-4xl px-5">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Ils en parlent</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Pensé avec les établissements, pour les établissements
            </h2>
          </div>

          <div className="reveal relative mt-12 overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${testimonialIdx * 100}%)` }}>
              {TESTIMONIALS.map(t => (
                <figure key={t.name} className="w-full flex-shrink-0 px-1">
                  <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm sm:p-10">
                    <svg className="mx-auto h-8 w-8 text-blue-200" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                    <blockquote className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-700 sm:text-lg">
                      « {t.quote} »
                    </blockquote>
                    <figcaption className="mt-6 flex items-center justify-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${t.color}`}>
                        {t.initials}
                      </span>
                      <span className="text-left">
                        <span className="block text-sm font-semibold text-gray-900">{t.name}</span>
                        <span className="block text-xs text-gray-500">{t.place}</span>
                      </span>
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>

            {/* Points de navigation */}
            <div className="mt-6 flex justify-center gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button key={i}
                  onClick={() => setTestimonialIdx(i)}
                  aria-label={`Témoignage ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === testimonialIdx ? 'w-6 bg-blue-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ 7. TARIFS ══════════════ */}
      <section id="tarifs" className="scroll-mt-20 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Tarifs</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Des forfaits pour chaque établissement
            </h2>
            <p className="mt-4 text-gray-600">
              Commencez gratuitement, évoluez quand vous le souhaitez. Sans engagement.
            </p>
          </div>

          {/* Sélecteur de facturation mensuel / annuel */}
          <div className="reveal mt-10 flex items-center justify-center gap-3">
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setBilling('mensuel')}
                aria-pressed={billing === 'mensuel'}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                  billing === 'mensuel' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}>
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setBilling('annuel')}
                aria-pressed={billing === 'annuel'}
                className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition ${
                  billing === 'annuel' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}>
                Annuel
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  billing === 'annuel' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  -17%
                </span>
              </button>
            </div>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((p, i) => {
              const { price, period } = getDisplayPrice(p.monthly, p.currency, billing)
              return (
              <div key={p.name}
                style={{ transitionDelay: `${i * 90}ms` }}
                className={`reveal relative flex flex-col rounded-2xl border bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                  p.highlight ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-100 hover:border-blue-200'
                }`}>
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground shadow-md">
                    ⭐ Populaire
                  </span>
                )}
                <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
                <p className="mt-1 text-xs text-gray-500">{p.desc}</p>
                <div className="mt-5 flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-extrabold text-gray-900">{price}</span>
                  <span className="text-xs font-medium text-gray-500">{period}</span>
                </div>
                {billing === 'annuel' && p.monthly > 0 && (
                  <p className="mt-1 text-xs font-medium text-emerald-600">
                    soit 2 mois offerts par an
                  </p>
                )}
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start justify-center gap-2 text-sm text-gray-600">
                      <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={isAuthenticated ? dashboardHref : `/register?plan=${p.slug}&billing=${billing}`}
                  className={`mt-7 rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${
                    p.highlight
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700'
                      : 'border border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}>
                  {p.cta}
                </Link>
              </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════ 8. FAQ ══════════════ */}
      <section id="faq" className="scroll-mt-20 bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-5">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">FAQ</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Les questions qu’on nous pose souvent
            </h2>
          </div>

          <div className="reveal mt-12 space-y-3">
            {FAQS.map((f, i) => {
              const open = openFaq === i
              return (
                <div key={f.q}
                  className={`overflow-hidden rounded-2xl border bg-white transition ${
                    open ? 'border-blue-200 shadow-md shadow-blue-600/5' : 'border-gray-100'
                  }`}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                    aria-expanded={open}
                  >
                    <span className="text-sm font-semibold text-gray-900 sm:text-base">{f.q}</span>
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                      open ? 'rotate-45 bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm leading-relaxed text-gray-600">{f.a}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="reveal mt-8 text-center text-sm text-gray-500">
            Une autre question ?{' '}
            <a href="mailto:support@classelink.ci" className="font-semibold text-blue-600 hover:underline">
              Écrivez-nous
            </a>
          </p>
        </div>
      </section>

      {/* ══════════════ 9. CTA FINAL ══════════════ */}
      <section id="contact" className="scroll-mt-20 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-5">
          <div className="reveal relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 px-8 py-14 text-center shadow-xl sm:px-16">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-blue-300/10 blur-2xl" />
            <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Prêt à moderniser votre établissement ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-blue-100">
              Rejoignez les écoles qui ont déjà digitalisé leur gestion avec MyClassLink.
              Notre équipe vous accompagne à chaque étape.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={startHref}
                className="w-full rounded-xl bg-white px-7 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 sm:w-auto">
                {startLabel}
              </Link>
              <a href="mailto:support@classelink.ci"
                className="w-full rounded-xl border border-white/40 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto">
                Demander une démo
              </a>
            </div>

            <p className="mt-6 text-xs text-blue-200">
              Plan gratuit à vie · Sans engagement · Support en français
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="flex flex-col items-center justify-between gap-8 text-center md:flex-row md:items-start md:text-left">
            <div className="max-w-xs">
              <Logo />
              <p className="mt-3 text-sm text-gray-500">
                La plateforme de gestion scolaire numérique pour les établissements africains.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Produit</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-500">
                  <li><a href="#fonctionnalites" className="hover:text-blue-600">Fonctionnalités</a></li>
                  <li><a href="#espaces" className="hover:text-blue-600">Espaces</a></li>
                  <li><a href="#tarifs" className="hover:text-blue-600">Tarifs</a></li>
                  <li><a href="#faq" className="hover:text-blue-600">FAQ</a></li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Société</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-500">
                  <li><a href="#demarrage" className="hover:text-blue-600">Démarrage</a></li>
                  <li><a href="#contact" className="hover:text-blue-600">Contact</a></li>
                  <li><Link href="/login" className="hover:text-blue-600">Connexion</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Contact</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-500">
                  <li><a href="mailto:support@classelink.ci" className="hover:text-blue-600">support@classelink.ci</a></li>
                  <li>Abidjan, Côte d’Ivoire</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} MyClassLink. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}
