import { readPackage, writePackage } from '../utils.js'

export async function addAlias(alias, scriptName) {
  const pkg = await readPackage()
  pkg.tpm = pkg.tpm || {}
  pkg.tpm.aliases = pkg.tpm.aliases || {}
  if (pkg.tpm.aliases[alias]) {
    console.error(`Alias '${alias}' already exists for script '${pkg.tpm.aliases[alias]}'`)
    return
  }
  pkg.tpm.aliases[alias] = scriptName
  await writePackage(pkg)
  console.log(`Alias '${alias}' -> '${scriptName}' added to .tpm.aliases`)
}

export async function addAliasUnix(scriptName, alias) {
  return addAlias(alias, scriptName);
}

export async function removeAlias(alias) {
  const pkg = await readPackage()
  if (!pkg.tpm || !pkg.tpm.aliases || !pkg.tpm.aliases[alias]) {
    console.error(`Alias '${alias}' does not exist`)
    return
  }
  delete pkg.tpm.aliases[alias]
  await writePackage(pkg)
  console.log(`Alias '${alias}' removed from .tpm.aliases`)
}
