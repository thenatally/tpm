import { readFile, writeFile } from 'fs/promises'
import readline from 'readline'

export async function readPackage() {
  const raw = await readFile('package.json', 'utf8')
  return JSON.parse(raw)
}

export async function writePackage(pkg) {
  await writeFile('package.json', JSON.stringify(pkg, null, 2))
}

export function prompt(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise(resolve =>
    rl.question(query, ans => {
      rl.close()
      resolve(ans)
    })
  )
}
