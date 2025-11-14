// check-version.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read package.json version
const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'),
)
const pkgVersion = pkg.version

// Read changelog.ts and extract the most recent version (assumes export const changelog = [...] with { version: "x.y.z" } objects)
const changelogPath = path.join(
  __dirname,
  '..',
  'src',
  'shared',
  'changelog.ts',
)
const changelogContent = fs.readFileSync(changelogPath, 'utf8')
const versionMatch = changelogContent.match(
  /version:\s*["'`](\d+\.\d+\.\d+)["'`]/,
)

if (!versionMatch) {
  console.error('Could not find a version in changelog.ts')
  process.exit(1)
}

const changelogVersion = versionMatch[1]

if (pkgVersion !== changelogVersion) {
  console.error(
    `Version mismatch: package.json (${pkgVersion}) != changelog.ts (${changelogVersion})`,
  )
  process.exit(1)
}

console.log('Version check passed.')

export default {}
