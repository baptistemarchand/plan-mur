import {mkdirSync, writeFileSync} from 'node:fs'
import {dirname} from 'node:path'
import {hashPassword} from '../src/lib/server/auth.ts'

const [slug, password, output] = process.argv.slice(2)
if (!slug || !password) {
  console.error('Usage: node scripts/set-password.ts <slug> <mot-de-passe> [sortie.sql]')
  process.exit(1)
}

const file = output ?? `seeds/password-${slug}.sql`
const quote = (value: string): string => `'${value.replace(/'/g, "''")}'`

const header = [
  `-- Généré par scripts/set-password.ts pour le club ${slug}.`,
  `-- Le mot de passe en clair n'apparaît nulle part ici, ni dans la base.`,
  `-- npx wrangler d1 execute plan-mur --remote --file=${file}`,
  '',
].join('\n')

const statement = `UPDATE club SET passwordHash = ${quote(await hashPassword(password))} WHERE slug = ${quote(slug)};`

mkdirSync(dirname(file), {recursive: true})
writeFileSync(file, `${header}${statement}\n`)

console.log(`mot de passe du club ${slug} -> ${file}`)
console.log("les sessions ouvertes de ce club tomberont à l'exécution.")
