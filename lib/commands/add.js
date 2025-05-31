import { readPackage, writePackage, prompt } from '../utils.js'

export async function addScript(scriptName) {
  const pkg = await readPackage()
  const command = await prompt(`What should the "${scriptName}" script do? `)

  pkg.scripts = pkg.scripts || {}
  pkg.scripts[scriptName] = command

  await writePackage(pkg)
  console.log(`Added "${scriptName}": "${command}"`)
}
