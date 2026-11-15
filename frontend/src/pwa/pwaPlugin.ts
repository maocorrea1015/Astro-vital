import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

const publicFiles = [
  'manifest.webmanifest',
  'icons/astro-vital-192.png',
  'icons/astro-vital-512.png',
  'icons/astro-vital-maskable-512.png',
]

export function pwaPlugin(): Plugin {
  let root: string
  let publicDir: string

  return {
    name: 'astro-vital-pwa',
    apply: 'build',
    configResolved(config) {
      root = config.root
      publicDir = config.publicDir
    },
    generateBundle: {
      order: 'post',
      async handler(_options, bundle) {
        const shell = Object.keys(bundle).filter((name) =>
          name === 'index.html' || /\.(js|css)$/.test(name))
        if (!shell.includes('index.html')) this.error('Falta index.html en el build de la PWA.')

        // Use emitted content as well as public assets so a manifest or icon change also updates the worker.
        const files = [...shell, ...publicFiles].sort()
        const worker = await readFile(resolve(root, 'src/pwa/service-worker.js'), 'utf8')
        const hash = createHash('sha256').update(worker)
        for (const file of files) {
          const output = bundle[file]
          const content = output
            ? (output.type === 'asset' ? output.source : output.code)
            : await readFile(resolve(publicDir, file))
          hash.update(file).update(content)
        }
        const revision = hash.digest('hex').slice(0, 16)
        this.emitFile({
          type: 'asset',
          fileName: 'sw.js',
          source: `const SHELL_REVISION = ${JSON.stringify(revision)};\nconst SHELL_FILES = ${JSON.stringify(files)};\n${worker}`,
        })
      },
    },
  }
}
