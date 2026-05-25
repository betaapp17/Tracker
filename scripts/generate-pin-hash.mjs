import { hashSync } from 'bcryptjs'

const pin = process.argv[2]
if (!pin || !/^\d{4}$/.test(pin)) {
  console.error('Usage: node scripts/generate-pin-hash.mjs <4-digit-pin>')
  process.exit(1)
}
console.log(hashSync(pin, 10))
