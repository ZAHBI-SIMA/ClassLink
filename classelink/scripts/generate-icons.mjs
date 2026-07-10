// Régénère toutes les icônes (favicon, icônes App Router, icônes PWA) à
// partir du logo actuel (public/logo.png). Usage : node scripts/generate-icons.mjs
import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'

const SOURCE = 'public/logo.png'

const PWA_SIZES = [72, 96, 128, 192, 512]
const FAVICON_SIZES = [16, 32, 48]

/** Construit un .ico multi-résolutions à partir de PNG déjà encodés (format supporté par tous les navigateurs/OS modernes). */
function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length
  const headerSize = 6
  const entrySize = 16
  const offsets = []
  let offset = headerSize + entrySize * count
  for (const buf of pngBuffers) {
    offsets.push(offset)
    offset += buf.length
  }

  const header = Buffer.alloc(headerSize)
  header.writeUInt16LE(0, 0)     // reserved
  header.writeUInt16LE(1, 2)     // type: 1 = icon
  header.writeUInt16LE(count, 4) // nombre d'images

  const entries = Buffer.alloc(entrySize * count)
  sizes.forEach((size, i) => {
    const base = i * entrySize
    entries.writeUInt8(size >= 256 ? 0 : size, base + 0)     // largeur (0 = 256)
    entries.writeUInt8(size >= 256 ? 0 : size, base + 1)     // hauteur (0 = 256)
    entries.writeUInt8(0, base + 2)                          // palette
    entries.writeUInt8(0, base + 3)                          // réservé
    entries.writeUInt16LE(1, base + 4)                       // plans couleur
    entries.writeUInt16LE(32, base + 6)                      // bits par pixel
    entries.writeUInt32LE(pngBuffers[i].length, base + 8)    // taille des données
    entries.writeUInt32LE(offsets[i], base + 12)             // offset des données
  })

  return Buffer.concat([header, entries, ...pngBuffers])
}

async function main() {
  // Favicon.ico (multi-résolutions 16/32/48, format PNG intégré)
  const favPngs = await Promise.all(
    FAVICON_SIZES.map(size => sharp(SOURCE).resize(size, size).png().toBuffer())
  )
  await writeFile('app/favicon.ico', buildIco(favPngs, FAVICON_SIZES))
  console.log('✓ app/favicon.ico')

  // Icône moderne App Router (utilisée par les navigateurs qui supportent icon.png)
  await sharp(SOURCE).resize(192, 192).png().toFile('app/icon.png')
  console.log('✓ app/icon.png')

  // Icône iOS / écran d'accueil
  await sharp(SOURCE).resize(180, 180).png().toFile('app/apple-icon.png')
  console.log('✓ app/apple-icon.png')

  // Icônes PWA référencées par public/manifest.json
  for (const size of PWA_SIZES) {
    await sharp(SOURCE).resize(size, size).png().toFile(`public/icons/icon-${size}.png`)
    console.log(`✓ public/icons/icon-${size}.png`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
