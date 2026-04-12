# Corevo POS — Database & Code Audit Report
**Date:** 2026-04-13
**Tenant:** zivar (3a6658e9-dc53-4381-a744-69f9c0662146)
**Kiosk:** Ucs kiosk (51912136-8c1b-4238-9682-cf5f2f3fcdb9)

---

## Database Checks

### B1. Orders
- **Result:** OK
- 0 orders with NULL created_at or status
- Latest orders have correct timestamptz values (e.g. 2026-04-12 22:13:36+00)
- 201 total orders (14 app-created + 187 migrated from Firebase)

### B2. Order Items
- **Result:** OK
- 0 orphaned order_items (all linked to valid orders)
- 249 total items

### B3. Products
- **Result:** OK (after fix)
- 33 products with show_on_kiosk = true
- All Firebase products present with correct prices
- 22 products have images, 11 use emoji fallback (new products without images)
- Old test products (Chips, Chokladkaka, Kaffe, Losgodis, Popcorn) hidden (show_on_kiosk = false)
- **FIX APPLIED:** Fanta Orange and Bonaqua/Schweeps had vat_rate = '12' instead of '25'. Updated to '25'.

### B4. Categories
- **Result:** OK
- 4 active: Dryck (1), Snacks (2), Mellanmal (3), Mat (4)
- 1 hidden: Godis (show_on_kiosk = false, holds old test products)

### B5. Kiosks
- **Result:** OK (after fix)
- 1 active kiosk: "Ucs kiosk" with swish_number = 0729408522
- 3 inactive kiosks (Test-API, H, EE)
- **FIX APPLIED:** admin_pin was empty string. Set to '1234'.

### B6. Licenses
- **Result:** OK
- COREVO3X: active, max_devices = 99, 1 active kiosk

### B7. Tenant Config
- **Result:** OK
- swish_enabled = false (correct — using private Swish, not API)
- swish_number = 1234679304 (tenant-level, kiosk overrides with 0729408522)
- terminal_enabled = false
- kiosk_club_name and kiosk_primary_color not set (uses defaults)

### B8. Receipt Sequences
- **Result:** OK
- 2 sequences for date 2026-04-12
- Active kiosk at last_number = 7
- next_receipt_number RPC works: returns "20260412-008"

### B9. RPC Functions
- **Result:** OK
- All required RPCs exist: next_receipt_number, activate_kiosk_with_auth, verify_staff_pin, close_day, notify_order_created, log_audit_event

### B10. App Code Audit
| File | Status | Notes |
|------|--------|-------|
| orders.ts | OK | generateReceiptNumber(tenantId, kioskId), correct VAT formula |
| swish.ts | OK | Correct QR format: C{number};{amount};{message};0 |
| supabase.ts | OK | Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY |
| storage.ts | OK | Capacitor Preferences + localStorage fallback |
| sync.ts | OK | Offline queue with auto-sync on reconnect |
| usePayment.ts | OK | Passes tenantId to generateReceiptNumber |
| useCart.ts | OK | VAT: rate/(1+rate) inclusive formula |
| useProducts.ts | OK | Filters show_on_kiosk=true, stock_status!=dold |
| useIdleTimer.ts | OK | Respects kiosk_idle_timeout, 2s debounce |
| useOnlineStatus.ts | OK | Capacitor Network API |
| .env | OK | Both vars present |

### B11. Security
- **Result:** OK
- No hardcoded API keys in source
- All secrets via .env (gitignored)
- Anon key in frontend is expected (RLS enforced)
- Kiosk role can only read/write own tenant data via RLS policies

### B12. Migration Verification
- **Result:** OK
- 201 Swish orders total
- Date range: 2026-03-20 to 2026-04-12
- 187 migrated from Firebase (all status=completed)
- 14 created by app

---

## Fixes Applied

1. **vat_rate** on Fanta Orange and Bonaqua/Schweeps: `'12'` → `'25'`
2. **admin_pin** on active kiosk: empty string → `'1234'`

## No Issues Found
- orders.ts correctly passes p_tenant_id to RPC
- All products have correct prices matching Firebase export
- Receipt sequences working (gapless)
- Offline sync properly implemented
- VAT calculation correct (25% inclusive)
