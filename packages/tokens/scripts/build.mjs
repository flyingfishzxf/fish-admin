import fs from 'node:fs'
import path from 'node:path'

import { generateArtifacts, paths, readSource, readVersion } from './lib.mjs'

const { files, manifest } = generateArtifacts(readSource(), readVersion())

fs.rmSync(paths.dist, { recursive: true, force: true })
fs.mkdirSync(paths.dist, { recursive: true })
for (const [file, content] of files) {
  fs.writeFileSync(path.join(paths.dist, file), content)
}

console.log(
  `tokens: wrote ${files.size} artifacts — ${manifest.tokens.length} tokens, ` +
    `${manifest.groups.length} groups, ${manifest.accents.length} accents`,
)
