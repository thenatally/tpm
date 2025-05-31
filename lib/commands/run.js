import { readPackage } from '../utils.js'
import { execSync } from 'child_process'

export async function runScript(scripts) {
  const pkg = await readPackage()
  const available = pkg.scripts || {}
  const aliases = (pkg.tpm && pkg.tpm.aliases) || {}

  const resolved = scripts.map(script => {
    if (available[script]) return script
    if (aliases[script] && available[aliases[script]]) return aliases[script]
    return null
  }).filter(Boolean)

  if (!resolved.length) return console.error('No valid scripts or aliases found.')

  resolved.forEach(script => {
    console.log(`npm run ${script}`)
    execSync(`npm run ${script}`, { stdio: 'inherit' })
  })
}
