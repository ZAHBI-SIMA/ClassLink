import type { CSSProperties } from 'react'

export interface SchoolThemeValues {
  primaryColor?:   string | null
  secondaryColor?: string | null
  fontFamily?:     string | null
}

const GOOGLE_FONTS = new Set(['Poppins', 'Roboto', 'Open Sans', 'Montserrat', 'Inter'])

/**
 * Construit l'objet de style à poser sur le conteneur racine d'un espace école.
 * Redéfinit les variables CSS `--primary`/`--secondary` (donc les classes Tailwind
 * `bg-primary`, `text-primary`, `border-primary`) et la police, par héritage CSS.
 */
export function schoolThemeStyle({ primaryColor, secondaryColor, fontFamily }: SchoolThemeValues): CSSProperties {
  const style: Record<string, string> = {}
  if (primaryColor)   style['--primary'] = primaryColor
  if (secondaryColor) style['--secondary'] = secondaryColor
  if (fontFamily)     style.fontFamily = `'${fontFamily}', system-ui, sans-serif`
  return style as CSSProperties
}

/**
 * Charge la police Google Fonts choisie par l'école (le cas échéant).
 * Rendu serveur — émet simplement les balises `<link>`. Aucun affichage propre.
 */
export function SchoolThemeFont({ fontFamily }: { fontFamily?: string | null }) {
  if (!fontFamily || !GOOGLE_FONTS.has(fontFamily) || fontFamily === 'Inter') return null
  const family = fontFamily.replace(/ /g, '+')
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?family=${family}:wght@400;500;600;700&display=swap`}
      />
    </>
  )
}
