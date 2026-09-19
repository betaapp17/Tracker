export const REQUIRED_PROFILE_NAMES = ['Eustaquio', 'Isabela', 'Instinct']

/** Insert only genuinely missing profiles. Existing rows are never updated. */
export async function bootstrapProfiles({ supabase, profiles, hashPin }) {
  for (const { name, role, pin } of profiles) {
    const { data: existing, error: lookupError } = await supabase
      .from('app_profiles')
      .select('id')
      .ilike('name', name)
      .maybeSingle()
    if (lookupError) throw new Error(`Could not check ${name}: ${lookupError.message}`)
    if (existing) continue
    if (!pin || !/^\d{4}$/.test(pin)) throw new Error(`A 4-digit bootstrap PIN is required to create missing profile ${name}.`)

    const { error } = await supabase.from('app_profiles').insert({
      name,
      role,
      pin_hash: hashPin(pin),
      is_active: true,
      permissions: {},
    })
    if (error && error.code !== '23505') throw new Error(`Could not create ${name}: ${error.message}`)
  }
}
