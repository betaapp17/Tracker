import assert from 'node:assert/strict'
import test from 'node:test'
import { compareSync, hashSync } from 'bcryptjs'
import { bootstrapProfiles } from '../lib/profile-bootstrap.mjs'

function memoryProfiles(rows = []) {
  const state = rows.map(row => ({ ...row }))
  return {
    state,
    from() {
      return {
        select() { return this },
        ilike(_field, name) {
          return { maybeSingle: async () => ({ data: state.find(row => row.name.toLowerCase() === name.toLowerCase()) ?? null, error: null }) }
        },
        insert: async row => {
          if (state.some(existing => existing.name.toLowerCase() === row.name.toLowerCase())) return { error: { code: '23505' } }
          state.push({ id: `id-${state.length}`, ...row })
          return { error: null }
        },
      }
    },
  }
}

const configuredProfiles = [
  { name: 'Eustaquio', role: 'owner', pin: '1111' },
  { name: 'Isabela', role: 'employee', pin: '2222' },
  { name: 'Instinct', role: 'employee', pin: '3333' },
]

test('bootstrap creates all missing profiles with bcrypt hashes', async () => {
  const supabase = memoryProfiles()
  await bootstrapProfiles({ supabase, profiles: configuredProfiles, hashPin: pin => hashSync(pin, 4) })
  assert.deepEqual(supabase.state.map(row => row.name).sort(), ['Eustaquio', 'Instinct', 'Isabela'])
  assert.ok(supabase.state.every(row => row.pin_hash !== configuredProfiles.find(profile => profile.name === row.name).pin))
  assert.ok(compareSync('1111', supabase.state.find(row => row.name === 'Eustaquio').pin_hash))
})

test('bootstrap is idempotent and never overwrites an existing PIN hash or profile data', async () => {
  const original = { id: 'fixed-id', name: 'Eustaquio', role: 'owner', pin_hash: hashSync('9999', 4), is_active: false, permissions: { keep: true } }
  const supabase = memoryProfiles([original])
  await bootstrapProfiles({ supabase, profiles: configuredProfiles, hashPin: pin => hashSync(pin, 4) })
  await bootstrapProfiles({ supabase, profiles: configuredProfiles, hashPin: pin => hashSync(pin, 4) })
  assert.equal(supabase.state.length, 3)
  assert.deepEqual(supabase.state.find(row => row.name === 'Eustaquio'), original)
  assert.ok(compareSync('9999', supabase.state.find(row => row.name === 'Eustaquio').pin_hash))
  assert.ok(!compareSync('1111', supabase.state.find(row => row.name === 'Eustaquio').pin_hash))
})

test('stored profile PIN hashes accept the configured PIN and reject an incorrect PIN after reinitialization', async () => {
  const firstProcess = memoryProfiles()
  await bootstrapProfiles({ supabase: firstProcess, profiles: configuredProfiles, hashPin: pin => hashSync(pin, 4) })
  // A new client/process receives the persisted rows, not an in-memory fallback.
  const restartedProcess = memoryProfiles(firstProcess.state)
  for (const profile of configuredProfiles) {
    const stored = restartedProcess.state.find(row => row.name === profile.name)
    assert.ok(compareSync(profile.pin, stored.pin_hash))
    assert.ok(!compareSync('0000', stored.pin_hash))
  }
})
