import { pathToFileURL } from 'node:url'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
export async function buildPwa(publicDir) {
  const root = pathToFileURL(publicDir.replace(/[\\/]$/, '') + '/')
  const assets = (await readdir(new URL('_nuxt/', root), { recursive: true })).filter(path => /\.(js|css|woff2?|png|svg)$/.test(path)).map(path => `/_nuxt/${path.replaceAll('\\','/')}`).sort()
  const shellSource = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8')
  const brand = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8')
  const manifest = await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8')
  const version = createHash('sha256').update(JSON.stringify(assets) + shellSource + brand + manifest).digest('hex').slice(0, 16)
  await writeFile(new URL('pwa-assets.js', root), `self.MYHABIT_BUILD=${JSON.stringify(version)};\nself.MYHABIT_ASSETS=${JSON.stringify(assets)};\n`)
  console.log(`Offline shell: ${assets.length} versioned assets (${version})`)

}
