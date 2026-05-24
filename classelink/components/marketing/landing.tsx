'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  isAuthenticated: boolean
  dashboardHref: string
}

const NAV_LINKS = [
  { href: '#accueil',         label: 'Accueil' },
  { href: '#fonctionnalites', label: 'Fonctionnalités' },
  { href: '#espaces',         label: 'Espaces' },
  { href: '#demarrage',       label: 'Démarrage' },
  { href: '#tarifs',          label: 'Tarifs' },
  { href: '#contact',         label: 'Contact' },
]

const FEATURES = [
  {
    title: 'Notes & Bulletins',
    desc: 'Saisie des notes, calcul automatique des moyennes, rangs et bulletins exportables en PDF aux couleurs de l’établissement.',
    color: 'bg-blue-50 text-blue-600',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    title: 'Présences & Absences',
    desc: 'Appel numérique, suivi des retards et justificatifs, alertes automatiques envoyées aux parents en temps réel.',
    color: 'bg-emerald-50 text-emerald-600',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Paiements en ligne',
    desc: 'Frais de scolarité réglés par Mobile Money (Orange, MTN, Moov) et carte. Reçus automatiques et suivi des impayés.',
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
  },
]

const ROLES = [
  {
    title: 'Administration',
    desc: 'Pilotez l’établissement : élèves, classes, finances, statistiques et paramètres en un coup d’œil.',
    points: ['Tableau de bord & analytics', 'Gestion des inscriptions', 'Suivi des paiements'],
    accent: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Enseignants',
    desc: 'Gagnez du temps sur les tâches administratives et concentrez-vous sur l’essentiel : enseigner.',
    points: ['Saisie des notes & appréciations', 'Appel & cahier de texte', 'Devoirs en ligne'],
    accent: 'from-emerald-500 to-emerald-600',
  },
  {
    title: 'Parents',
    desc: 'Suivez la scolarité de vos enfants où que vous soyez, et restez informés en temps réel.',
    points: ['Notes & bulletins', 'Absences & alertes', 'Paiements Mobile Money'],
    accent: 'from-violet-500 to-violet-600',
  },
  {
    title: 'Élèves',
    desc: 'Un espace personnel pour suivre ses résultats, ses devoirs et progresser à son rythme.',
    points: ['Notes & classement', 'Emploi du temps & devoirs', 'Quiz & récompenses'],
    accent: 'from-amber-500 to-orange-500',
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
    desc: 'Ajoutez classes, matières, enseignants et élèves manuellement ou par import en masse.',
  },
  {
    n: '03',
    title: 'Lancez l’année scolaire',
    desc: 'Notes, présences, paiements et communication : tout votre établissement est connecté.',
  },
]

const PLANS = [
  {
    name: 'Gratuit',
    price: '0',
    period: '/mois',
    desc: 'Pour découvrir la plateforme.',
    features: ['Jusqu’à 50 élèves', 'Gestion des élèves', 'Bulletins basiques', 'Messagerie'],
    cta: 'Commencer',
    highlight: false,
  },
  {
    name: 'Starter',
    price: '15 000',
    period: 'FCFA/mois',
    desc: 'Pour les petits établissements.',
    features: ['Jusqu’à 300 élèves', 'Tout le plan Gratuit', 'Paiements en ligne', 'Emplois du temps'],
    cta: 'Choisir Starter',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '40 000',
    period: 'FCFA/mois',
    desc: 'Le plus populaire.',
    features: ['Jusqu’à 1000 élèves', 'Tout le plan Starter', 'Multi-campus', 'Rapports avancés'],
    cta: 'Choisir Pro',
    highlight: true,
  },
  {
    name: 'Entreprise',
    price: '100 000',
    period: 'FCFA/mois',
    desc: 'Pour les grands groupes scolaires.',
    features: ['Élèves illimités', 'Tout le plan Pro', 'Support prioritaire', 'Accompagnement dédié'],
    cta: 'Nous contacter',
    highlight: false,
  },
]

function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight text-gray-900">ClasseLink</span>
    </span>
  )
}

export function Landing({ isAuthenticated, dashboardHref }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  const primaryHref = isAuthenticated ? dashboardHref : '/login'
  const primaryLabel = isAuthenticated ? 'Accéder à mon espace' : 'Se connecter'

  return (
    <div className="min-h-screen scroll-smooth bg-white text-gray-900">

      {/* ══════════════ NAVBAR ══════════════ */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="#accueil"><Logo /></Link>

          <div className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href}
                className="text-sm font-medium text-gray-600 transition hover:text-blue-600">
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link href={primaryHref}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
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
        {menuOpen && (
          <div className="border-t border-gray-100 bg-white px-5 py-4 md:hidden">
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
        )}
      </header>

      {/* ══════════════ 1. HERO ══════════════ */}
      <section id="accueil" className="relative overflow-hidden scroll-mt-20">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50/70 via-white to-white" />
        <div className="absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl" />

        <div className="mx-auto max-w-6xl px-5 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            La gestion scolaire numérique pensée pour l’Afrique
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Toute votre école,{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              dans une seule plateforme
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Notes, bulletins, présences, paiements Mobile Money et communication avec les familles.
            ClasseLink réunit tous les acteurs de l’établissement dans un espace simple et sécurisé.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={primaryHref}
              className="w-full rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:w-auto">
              {primaryLabel}
            </Link>
            <a href="#fonctionnalites"
              className="w-full rounded-xl border border-gray-300 bg-white px-7 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto">
              Découvrir les fonctionnalités
            </a>
          </div>

          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4">
            {[
              ['100%', 'En ligne & mobile'],
              ['6', 'Espaces dédiés'],
              ['24/7', 'Accès sécurisé'],
            ].map(([stat, label]) => (
              <div key={label} className="rounded-2xl border border-gray-100 bg-white/70 p-4 shadow-sm">
                <p className="text-2xl font-extrabold text-blue-600 sm:text-3xl">{stat}</p>
                <p className="mt-1 text-xs text-gray-500 sm:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ 2. FONCTIONNALITÉS ══════════════ */}
      <section id="fonctionnalites" className="scroll-mt-20 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Fonctionnalités</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Tout ce dont votre établissement a besoin
            </h2>
            <p className="mt-4 text-gray-600">
              Une suite complète d’outils conçus pour simplifier la gestion quotidienne de l’école.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={f.icon} />
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ 3. ESPACES DÉDIÉS ══════════════ */}
      <section id="espaces" className="scroll-mt-20 bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Espaces dédiés</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Une expérience adaptée à chaque rôle
            </h2>
            <p className="mt-4 text-gray-600">
              Chaque utilisateur dispose d’un espace personnalisé avec exactement les outils qu’il lui faut.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map(r => (
              <div key={r.title} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className={`mb-4 inline-flex w-fit rounded-xl bg-gradient-to-br ${r.accent} px-3 py-1 text-xs font-semibold text-white`}>
                  {r.title}
                </div>
                <p className="text-sm leading-relaxed text-gray-600">{r.desc}</p>
                <ul className="mt-4 space-y-2">
                  {r.points.map(p => (
                    <li key={p} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="h-4 w-4 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ 4. COMMENT ÇA MARCHE ══════════════ */}
      <section id="demarrage" className="scroll-mt-20 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
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
              <div key={s.n} className="relative rounded-2xl border border-gray-100 bg-gradient-to-b from-blue-50/40 to-white p-7">
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
        </div>
      </section>

      {/* ══════════════ 5. TARIFS ══════════════ */}
      <section id="tarifs" className="scroll-mt-20 bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Tarifs</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Des forfaits pour chaque établissement
            </h2>
            <p className="mt-4 text-gray-600">
              Commencez gratuitement, évoluez quand vous le souhaitez. Sans engagement.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map(p => (
              <div key={p.name}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                  p.highlight ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-100'
                }`}>
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    Populaire
                  </span>
                )}
                <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
                <p className="mt-1 text-xs text-gray-500">{p.desc}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-gray-900">{p.price}</span>
                  <span className="text-xs font-medium text-gray-500">{p.period}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={primaryHref}
                  className={`mt-7 rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${
                    p.highlight
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ 6. CONTACT / CTA FINAL ══════════════ */}
      <section id="contact" className="scroll-mt-20 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 px-8 py-14 text-center shadow-xl sm:px-16">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-cyan-300/10 blur-2xl" />

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Prêt à moderniser votre établissement ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-blue-100">
              Rejoignez les écoles qui ont déjà digitalisé leur gestion avec ClasseLink.
              Notre équipe vous accompagne à chaque étape.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={primaryHref}
                className="w-full rounded-xl bg-white px-7 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 sm:w-auto">
                {primaryLabel}
              </Link>
              <a href="mailto:support@classelink.ci"
                className="w-full rounded-xl border border-white/40 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto">
                Demander une démo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
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
            © {new Date().getFullYear()} ClasseLink. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}
