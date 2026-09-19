import { createClient } from '@supabase/supabase-js'
import { hashSync } from 'bcryptjs'
import { bootstrapProfiles } from '../lib/profile-bootstrap.mjs'

const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
for (const key of required) if (!process.env[key]) throw new Error(`${key} is required.`)

const profiles = [
  ['Eustaquio', 'owner', process.env.BOOTSTRAP_EUSTAQUIO_PIN],
  ['Isabela', 'employee', process.env.BOOTSTRAP_ISABELA_PIN],
  ['Instinct', 'employee', process.env.BOOTSTRAP_INSTINCT_PIN],
]
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

await bootstrapProfiles({
  supabase,
  profiles: profiles.map(([name, role, pin]) => ({ name, role, pin })),
  hashPin: pin => hashSync(pin, 10),
})
