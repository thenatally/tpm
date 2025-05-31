import { readPackage, writePackage } from '../utils.js'

export async function setField(key, value) {
  const pkg = await readPackage()
  pkg[key] = value
  await writePackage(pkg)
  console.log(`Set ${key} to ${value}`)
}
