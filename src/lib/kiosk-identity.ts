import { supabase } from './supabase'
import { getItem, setItem, removeItem } from './storage'

const STORAGE_KEY = 'corevo:kiosk'

export interface TenantConfig {
  id: string
  name: string
  swish_enabled: boolean
  swish_number: string | null
  swish_test_mode: boolean | null
  terminal_enabled: boolean
  terminal_provider: string | null
  terminal_api_key: string | null
  sumup_test_mode: boolean | null
  kiosk_primary_color: string | null
  kiosk_accent_color: string | null
  kiosk_logo_emoji: string | null
  kiosk_logo_image: string | null
  kiosk_club_name: string | null
  kiosk_welcome_text: string | null
  kiosk_idle_timeout: number | null
  kiosk_idle_message: string | null
  kiosk_columns: number | null
}

export interface KioskState {
  kioskId: string
  tenantId: string
  name: string
  adminPin: string | null
  swishNumber: string | null
  authEmail: string
  authPassword: string
  tenant: TenantConfig
}

function mapTenantConfig(tenant: Record<string, unknown>): TenantConfig {
  return {
    id: tenant.id as string,
    name: tenant.name as string,
    swish_enabled: (tenant.swish_enabled as boolean) ?? false,
    swish_number: (tenant.swish_number as string) ?? null,
    swish_test_mode: (tenant.swish_test_mode as boolean) ?? null,
    terminal_enabled: (tenant.terminal_enabled as boolean) ?? false,
    terminal_provider: (tenant.terminal_provider as string) ?? null,
    terminal_api_key: (tenant.terminal_api_key as string) ?? null,
    sumup_test_mode: (tenant.sumup_test_mode as boolean) ?? null,
    kiosk_primary_color: (tenant.kiosk_primary_color as string) ?? null,
    kiosk_accent_color: (tenant.kiosk_accent_color as string) ?? null,
    kiosk_logo_emoji: (tenant.kiosk_logo_emoji as string) ?? null,
    kiosk_logo_image: (tenant.kiosk_logo_image as string) ?? null,
    kiosk_club_name: (tenant.kiosk_club_name as string) ?? null,
    kiosk_welcome_text: (tenant.kiosk_welcome_text as string) ?? null,
    kiosk_idle_timeout: (tenant.kiosk_idle_timeout as number) ?? null,
    kiosk_idle_message: (tenant.kiosk_idle_message as string) ?? null,
    kiosk_columns: (tenant.kiosk_columns as number) ?? null,
  }
}

/**
 * Activate kiosk via RPC (SECURITY DEFINER, callable as anon).
 * Creates kiosk + auth user in one atomic DB call, then signs in.
 */
export async function activateKiosk(
  licenseKey: string,
  name: string
): Promise<KioskState> {
  // Step 1: Call activation RPC (runs as anon, SECURITY DEFINER in DB)
  const { data, error } = await supabase.rpc('activate_kiosk_with_auth', {
    p_license_key: licenseKey,
    p_name: name,
    p_device_info: {
      platform: 'android',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    },
  })

  if (error) throw new Error(error.message)

  const result = data as {
    kiosk_id: string
    tenant_id: string
    email: string
    password: string
    user_id: string
  }

  // Step 2: Sign in with the credentials returned by the RPC
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: result.email,
    password: result.password,
  })

  if (authError) throw new Error(authError.message)

  // Step 3: Now authenticated with role=kiosk — fetch tenant data
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', result.tenant_id)
    .single()

  if (tenantError || !tenant) throw new Error('Kunde inte hämta kunddata')

  // Step 4: Fetch kiosk details (admin_pin, swish_number override)
  const { data: kiosk } = await supabase
    .from('kiosks')
    .select('admin_pin, swish_number')
    .eq('id', result.kiosk_id)
    .single()

  // Step 5: Cache everything including auth credentials for re-login
  const state: KioskState = {
    kioskId: result.kiosk_id,
    tenantId: result.tenant_id,
    name,
    adminPin: kiosk?.admin_pin ?? null,
    swishNumber: kiosk?.swish_number ?? tenant.swish_number ?? null,
    authEmail: result.email,
    authPassword: result.password,
    tenant: mapTenantConfig(tenant),
  }

  await setItem(STORAGE_KEY, state)
  return state
}

/**
 * Load cached kiosk and re-authenticate.
 * If cached credentials exist, signs in with Supabase Auth.
 * Returns null if no cached kiosk or auth fails.
 */
export async function getCachedKiosk(): Promise<KioskState | null> {
  const cached = await getItem<KioskState>(STORAGE_KEY)
  if (!cached) return null

  // Re-authenticate using cached credentials
  if (cached.authEmail && cached.authPassword) {
    const { data: session } = await supabase.auth.getSession()

    // Only sign in if there's no active session
    if (!session?.session) {
      const { error } = await supabase.auth.signInWithPassword({
        email: cached.authEmail,
        password: cached.authPassword,
      })

      if (error) {
        console.error('[kiosk] Re-auth failed:', error.message)
        // Credentials invalid — force re-activation
        await removeItem(STORAGE_KEY)
        return null
      }
    }
  }

  return cached
}

/**
 * Refresh kiosk data from DB (requires active auth session).
 */
export async function refreshKioskData(): Promise<KioskState | null> {
  const cached = await getCachedKiosk()
  if (!cached) return null

  try {
    const { data: kiosk } = await supabase
      .from('kiosks')
      .select('*')
      .eq('id', cached.kioskId)
      .single()

    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', cached.tenantId)
      .single()

    if (!kiosk || !tenant) return cached

    const updated: KioskState = {
      kioskId: kiosk.id,
      tenantId: kiosk.tenant_id,
      name: kiosk.name,
      adminPin: kiosk.admin_pin,
      swishNumber: kiosk.swish_number ?? tenant.swish_number,
      authEmail: cached.authEmail,
      authPassword: cached.authPassword,
      tenant: mapTenantConfig(tenant),
    }

    await setItem(STORAGE_KEY, updated)
    return updated
  } catch {
    return cached
  }
}

/**
 * Deactivate: sign out of Supabase Auth + clear local cache.
 */
export async function clearKiosk(): Promise<void> {
  await supabase.auth.signOut()
  await removeItem(STORAGE_KEY)
}

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyAdminPin(input: string, storedPin: string | null): Promise<boolean> {
  if (!storedPin) return false
  const inputHash = await hashPin(input)
  return inputHash === storedPin
}
