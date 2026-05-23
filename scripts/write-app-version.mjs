import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const outputPath = join(root, 'public', 'app-version.json')

function gitValue(command) {
  try {
    return execSync(command, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return null
  }
}

const commit = process.env.VERCEL_GIT_COMMIT_SHA || gitValue('git rev-parse --short HEAD') || 'local'
const timestamp = new Date().toISOString()
const version = `${commit}-${timestamp}`

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(
  outputPath,
  JSON.stringify({ version, commit, builtAt: timestamp }, null, 2) + '\n'
)
