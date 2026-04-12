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
  tenant: TenantConfig
}

export async function activateKiosk(
  licenseKey: string,
  name: string
): Promise<KioskState> {
  // Step 1: Find the license
  const { data: license, error: licenseError } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_key', licenseKey)
    .in('status', ['active', 'trial'])
    .single()

  if (licenseError || !license) {
    throw new Error('Ogiltig eller inaktiv licensnyckel')
  }

  // Step 2: Check device limit
  const { count } = await supabase
    .from('kiosks')
    .select('*', { count: 'exact', head: true })
    .eq('license_key', licenseKey)
    .eq('status', 'active')

  if (count !== null && count >= (license.max_devices ?? 1)) {
    throw new Error(`Enhetsgränsen nådd (${count} av ${license.max_devices} enheter)`)
  }

  // Step 3: Create the kiosk
  const deviceInfo = {
    platform: 'android',
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  }

  const { data: kiosk, error: kioskError } = await supabase
    .from('kiosks')
    .insert({
      tenant_id: license.tenant_id,
      name,
      license_key: licenseKey,
      status: 'active',
      device_info: deviceInfo,
      last_seen: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (kioskError) throw new Error(kioskError.message)

  // Step 4: Fetch tenant data
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', license.tenant_id)
    .single()

  if (tenantError) throw new Error(tenantError.message)

  const state: KioskState = {
    kioskId: kiosk.id,
    tenantId: kiosk.tenant_id,
    name: kiosk.name,
    adminPin: kiosk.admin_pin,
    swishNumber: kiosk.swish_number ?? tenant.swish_number,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      swish_enabled: tenant.swish_enabled ?? false,
      swish_number: tenant.swish_number ?? null,
      swish_test_mode: tenant.swish_test_mode ?? null,
      terminal_enabled: tenant.terminal_enabled ?? false,
      terminal_provider: tenant.terminal_provider ?? null,
      terminal_api_key: tenant.terminal_api_key ?? null,
      sumup_test_mode: tenant.sumup_test_mode ?? null,
      kiosk_primary_color: tenant.kiosk_primary_color ?? null,
      kiosk_accent_color: tenant.kiosk_accent_color ?? null,
      kiosk_logo_emoji: tenant.kiosk_logo_emoji ?? null,
      kiosk_logo_image: tenant.kiosk_logo_image ?? null,
      kiosk_club_name: tenant.kiosk_club_name ?? null,
      kiosk_welcome_text: tenant.kiosk_welcome_text ?? null,
      kiosk_idle_timeout: tenant.kiosk_idle_timeout ?? null,
      kiosk_idle_message: tenant.kiosk_idle_message ?? null,
      kiosk_columns: tenant.kiosk_columns ?? null,
    },
  }

  await setItem(STORAGE_KEY, state)
  return state
}

export async function getCachedKiosk(): Promise<KioskState | null> {
  return getItem<KioskState>(STORAGE_KEY)
}

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
      tenant: {
        id: tenant.id,
        name: tenant.name,
        swish_enabled: tenant.swish_enabled ?? false,
        swish_number: tenant.swish_number ?? null,
        swish_test_mode: tenant.swish_test_mode ?? null,
        terminal_enabled: tenant.terminal_enabled ?? false,
        terminal_provider: tenant.terminal_provider ?? null,
        terminal_api_key: tenant.terminal_api_key ?? null,
        sumup_test_mode: tenant.sumup_test_mode ?? null,
        kiosk_primary_color: tenant.kiosk_primary_color ?? null,
        kiosk_accent_color: tenant.kiosk_accent_color ?? null,
        kiosk_logo_emoji: tenant.kiosk_logo_emoji ?? null,
        kiosk_logo_image: tenant.kiosk_logo_image ?? null,
        kiosk_club_name: tenant.kiosk_club_name ?? null,
        kiosk_welcome_text: tenant.kiosk_welcome_text ?? null,
        kiosk_idle_timeout: tenant.kiosk_idle_timeout ?? null,
        kiosk_idle_message: tenant.kiosk_idle_message ?? null,
        kiosk_columns: tenant.kiosk_columns ?? null,
      },
    }

    await setItem(STORAGE_KEY, updated)
    return updated
  } catch {
    return cached
  }
}

export async function clearKiosk(): Promise<void> {
  await removeItem(STORAGE_KEY)
}

export function verifyAdminPin(input: string, storedPin: string | null): boolean {
  if (!storedPin) return false
  return input === storedPin
}
