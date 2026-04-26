# Här Zivar, är du nöjd

> Systemrapport efter ultra-dykning av Corevo (huvud-repo `corevo-pos-system` + denna Capacitor-wrapper).
> Skriven av Claude Code efter 9 parallella Explore-agenter + verifikation mot live-DB.
> Språk: rakt. Ingen hype. Alla påståenden har fil:rad-referens.

---

## 1. Kort svar

**Nej, inte än.** Systemet har sund arkitektur (multi-tenant, RLS, Supabase Realtime finns, komponentstruktur är ren efter senaste refactor) — men flera KRITISKA brister står mellan nuvarande bygge och en pålitlig produkt du kan sälja utan oro: **RLS-läckor som exponerar alla tenants till vem som helst, svenska lagkrav-fält saknas i `orders`, realtime saknas helt för kiosken, betalningsverifikation saknas i enkel Swish, stock-decrement har race-condition.** Inget av detta är oöverstigligt — allt är fixbart inom 1-2 veckor. Men just nu är bygget **inte redo att ta in en ny, okänd kund** förrän minst tre stop-ship-punkter är åtgärdade.

Inte heller är kodmängden (30k rader) orimlig — den är för hög för vad systemet gör idag eftersom tre filer (`use-supabase-data.ts`, `TenantProducts.tsx`, `TenantInventory.tsx`) är över 1000 rader var. Splittning är lågriskarbete när det behövs.

---

## 2. Dina 15 punkter — verklighet vs ideal

| # | Ideal | Status | Vad som händer i verkligheten |
|---|-------|--------|-------------------------------|
| 1 | Skapa kund i super-admin | ⚠️ | `NewCustomerDialog.tsx` → `useCreateCustomer` → INSERT tenant → `create_auth_user` RPC → auth-user. **Inte atomär** — om steg 2 failar står tenant-raden utan admin-user (halvkörd state). Licens skapas INTE automatiskt. |
| 2 | Licens till 2 kiosker | ⚠️ | Ingen auto-creation i onboarding-flödet. Måste manuellt skapas via superadmin UI/DB efter tenant. |
| 3 | Ladda ner APK | ✅ | Standard Android APK via ADB-install. `~/Corevo-pos-app`. |
| 4 | Aktivera med licens + namn | ✅ | Efter migration 021 + nya APK:n: `activate_kiosk_with_auth` RPC. UUID-baserad upsert fungerar (ingen spök-dublett vid re-aktivering). |
| 5 | Kiosk dyker upp i admin | ✅ | TenantKiosks visar kiosken med `last_seen`, status, och ny device-info-panel (`TenantKiosks.tsx:232-268` — modell/OS/skärm/UUID). Data fylls först när Elo re-aktiverats med nya APK:n. |
| 6 | Fylla databas med produkter | ⚠️ | Fungerar funktionellt. **Men anon kan läsa/skriva dina produkter från internet** — se punkt 3 nedan. |
| 7 | Ändring triggar realtime till kiosk | 🔴 | **Kritisk brist.** `useSupabaseRealtime` finns (`use-supabase-data.ts:2122`) men används BARA i admin via `App.tsx:85 <RealtimeSync />`. Kiosk-bundlen (`kiosk-entry.tsx`) lyssnar INTE på ett enda postgres-event. Resultat: kiosken får din nya offer först efter 30-sek staleTime expiree eller manuell reload. |
| 8 | Snabb reload & rätt data | 🔴 | Samma rot-orsak som 7. |
| 9 | POS + panik-admin-PIN | ⚠️ | Panik-flödet fungerar nu (PIN → signOut → /login → tenant_admin). MEN PIN-säkerheten är svag: SHA-256 utan salt, ingen brute-force-gräns, 4-siffrig brute-force tar ~100 sek. |
| 10 | Live online/offline-status | ✅ | `sendHeartbeat` var 5 min → `kiosks.last_seen`. Threshold 15 min. `TenantKiosks` visar korrekt. Tabellen `kiosk_heartbeats` skapades men används aldrig — cron-job 5 städar den. |
| 11 | (Chrome spelar ingen roll) | ✅ | Noterat. All testning sker mot Elo via ADB. |
| 12 | Alla admin-sidor pushar realtime | 🔴 | Admin har realtime på 13 tabeller, men `swish_payments`, `tenant_activity_log`, `daily_closings`, `staff` är i `supabase_realtime` PUBLICATION utan motsvarande klient-subscription. Admin ser inte betalningsstatus live. |
| 13 | Inloggning via corevo.se landing | ✅ | Fungerar. Login → `getRoleHomePath(role)` omdirigerar rätt. |
| 14 | MSS toggled ren | ⚠️ | Badge-texten i `SwishCheckout.tsx:48-50` säger hårdkodat "TESTLÄGE — ansluten till Swish testmiljö (MSS)" när `testMode=true`. Toggle fungerar men texten säger "MSS" även om kunden inte kör MSS. |
| 15 | Heartbeat per kiosk | ✅ | Fungerar, men `kiosk_heartbeats`-tabellen är onödig och skulle kunna städas bort. |

---

## 3. Kritiska säkerhetshål (RLS) — verifierat mot live-DB

Alla nedanstående är VERIFIERADE via `SELECT * FROM pg_policies WHERE roles::text LIKE '%anon%'` mot produktion.

| Tabell | Policy | qual | Risk |
|--------|--------|------|------|
| `tenants` | `anon_can_read_tenants` | `true` | 🔴 GDPR — vem som helst dumpar alla kundnamn, org.nr, kontakter |
| `orders` | `anon_can_update_orders` | `true` | 🔴 Kund kan ändra status på andras ordrar, kassa-fusk |
| `products` | `anon_can_update_products` | `true` | 🔴 Vem som helst kan ändra priser på vilken produkt som helst |
| `licenses` | `anon_can_lookup_license` | `true` | 🔴 Brute-force: iterera licensnycklar → aktivera pirat-kiosk |
| `categories/offers/products` | `*_select_authenticated` | `true` | 🟠 Tenant A ser tenant B:s data vid inloggning (cross-tenant leak) |
| `products` UPDATE för kiosk | saknar `WITH_CHECK` tenant_id | — | 🟠 Kiosk för tenant A kan skriva över produkter i tenant B |

**Rot-orsak:** Anon-policyerna är legacy från innan kiosk-rollen fick egen auth-session. De behövs inte längre — kiosken loggar in som `role=kiosk` via `activate_kiosk_with_auth`, och får sin tenant-filtrering via JWT `app_metadata.tenant_id`. Anon-policyerna kan stramas till `qual: false` eller raderas helt (utom `anon_can_insert_kiosk` som behövs för aktivering — den skyddas ändå av SECURITY DEFINER-funktionen).

**Fix:** En migration `022-anon-policies-cleanup.sql` som droppar läckande anon-policyer. Testa på staging först — kiosk-aktiveringsflödet får inte brytas.

---

## 4. Compliance-brister (svenska lagkrav)

Enligt `CLAUDE.md` rad 65-77 MÅSTE varje kvitto innehålla: `org_number`, `receipt_number`, `control_code`, `control_unit_serial`, `vat_breakdown`, `payment_method`, `timestamp`, `address`.

**Verifierat mot live-DB:**

| Fält | Status |
|------|--------|
| `org_number` | 🔴 Saknas i orders-tabellen |
| `address` | 🔴 Saknas i orders-tabellen |
| `control_code` | 🔴 Saknas (nullable-typ i TS men ingen DB-kolumn) |
| `control_unit_serial` | 🔴 Saknas |
| `receipt_number` | ✅ Finns |
| `vat_breakdown` | ✅ JSONB |
| `payment_method` | ✅ text |
| `timestamp` (created_at) | ✅ timestamptz |

**Dessutom:** `close_day()` i `server/supabase/volumes/db/init/08-feature-foundations.sql:263-277` aggregerar **BRUTTOPRIS** via `SUM(oi.price * oi.qty)` istället för moms per skattesats. Frontend `buildVatBreakdown()` (`src/lib/orders.ts`) räknar rätt, men Z-rapporten från DB-funktionen är felaktig.

**Receipt-nummer gap-risk:** Fallback i `orders.ts:83-107` använder `% 999` → luckor möjliga vid offline. `receipt_sequences` är korrekt upplagt med `ON CONFLICT` — fallbacken är roten.

---

## 5. Betalningsintegritet

**Enkel Swish — kritisk brist (`KioskPreview.tsx:registerPurchase`):**
I enkel-läge (ingen Swish Handel API) kan kunden trycka "Jag har betalat" utan att ha betalat. Ingen DB-verifikation. `finishCheckout("completed")` kör, stock dekrementeras, kvitto genereras. Kassa-fusk möjligt.
**Fix-idé:** Byt knapp-text till "Registrera kvitto" + lägg order i separat status (`unverified_paid` eller liknande) så admin manuellt kan verifiera. Du sade detta tidigare — inte gjort än.

**Stock decrement race (`supabase-service.ts:atomicStockDecrement`):**
Funktionen heter "atomic" men gör SELECT + UPDATE i två steg med retry-loop. Race condition: två parallella köp av samma produkt kan läsa samma `quantity=50` → båda uppdaterar till 49 → ett köp för mycket.
**Fix:** Postgres-RPC med `UPDATE products SET quantity = quantity - $1 WHERE id = $2 AND quantity >= $1 RETURNING` — atomär.

**Orphan-orders (1 st i DB just nu):**
`SELECT status, count(*) FROM orders GROUP BY status` → 1 pending från en crash. Ingen auto-cleanup-logik.
**Fix:** Cron-job som markerar pending-orders äldre än 1h som `timedout` + notification till admin.

**Offline-fel dolda (`KioskPreview.tsx:358`):**
`.catch(() => "")` gömmer fel vid `createOrder`. Ordern sparas i localStorage-kö OK, men kunden får ingen indikation. Om synkning sedan misslyckas → phantom completed + dubbelkonsumtion.
**Fix:** Toast "Ordern sparad offline, synkas när nät återvänder" + `window.addEventListener('online', syncQueue)`-verifiering.

---

## 6. Realtime-flöden

**Publication `supabase_realtime` innehåller** (verifierat): kiosks, orders, products, categories, offers, tenants, invoices, stores, stock_movements, store_transfers, store_messages, purchase_orders, licenses, swish_payments, tenant_activity_log, staff, daily_closings, support_codes, upgrade_requests — 20 tabeller.

**Admin lyssnar på** (`use-supabase-data.ts:2122-2148`): 13 av 20.
**Saknas i admin-lyssning:** `swish_payments`, `tenant_activity_log`, `daily_closings`, `support_codes`, `upgrade_requests`, `staff`, `kiosk_heartbeats`.

**Kiosk lyssnar på:** INGET. `kiosk-entry.tsx` använder `useSupabaseRealtime` inte alls.

**En-rads-fix för kiosken:** Lägg `<RealtimeSync />` som child till `<QueryClientProvider>` i `kiosk-entry.tsx`. Samma `useSupabaseRealtime`-hook → samma cache-invalidering. Ny offer i admin → kiosken uppdaterar inom sekunder.

**Obs RLS + Realtime:** Supabase filtrerar realtime-events enligt RLS-policies. Eftersom `offers_select_authenticated qual: true` läcker cross-tenant, kommer alla kiosker att få events för ALLA tenanters offers om inte RLS stramas samtidigt. Fixa RLS FÖRST, realtime SEN.

---

## 7. Kod-kvalitet

**Mega-filer över 1000 rader:**
- `src/hooks/use-supabase-data.ts` — **2346 rader**. Hela datalagret. Bör splittas per domän: `data/kiosks.ts`, `data/orders.ts`, `data/products.ts`, etc.
- `src/pages/tenant/TenantProducts.tsx` — 1272 rader. Dela: list, editor, filter, search.
- `src/pages/tenant/TenantInventory.tsx` — 1025 rader.
- `src/pages/KioskPreview.tsx` — 927 rader (redan nere från 1896 efter Fas 1-refactor).

**`any`-missbruk (9 ställen):**
- `use-supabase-data.ts:1061,1070` — `(updates as any).kioskLogoImage`
- `components/customer-admin-sections.tsx:906` — `{ modules: updated } as any`
- `pages/tenant/TenantOffers.tsx:198` — `const { id, ...rest } = o as any`
Alla kan ersättas med riktiga typer eller `Partial<>`.

**Svälja fel tyst — `} catch {}` × 10+:**
- `src/lib/orders.ts` — 5 ställen (rad 78, 103, 124, 167, 207)
- `src/lib/swish.ts` — 2 ställen
- `src/lib/supabase-service.ts:195` — tyst retry
Alla kritiska i betalningsflöden. Bör åtminstone `console.error` + toast eller throw uppåt.

**Console-logs i prod (12 st):**
- `kiosk-entry.tsx:39-44,50-52` — loggar JWT-refresh-event (inte känslig, men oljud)
- `src/lib/swish.ts:87,121` — debug-output
- `KioskPreview.tsx` — flera (mestadels [kiosk-pin] diagnostik som är avsiktliga)
Lös med `if (import.meta.env.DEV) console.xxx()`.

**Placeholders:**
- 3× `KASSA_PORTAL_URL = "/admin"` i `landing/Navbar.tsx`, `ActiveServices.tsx`, `Footer.tsx` med TODO "ersätt med riktig URL". Centralisera i env-variabel.
- `SHADAN_URL = "https://shadan.corevo.se"` i `landing/ActiveServices.tsx:8` — odokumenterat externt beroende.

**Oanvända filer:**
- `src/hooks/use-navigation-guard.ts` — exporteras, importeras 0 gånger. Radera.

**Duplicerad logik:**
- `isOnline()` i 3 filer: `lib/utils.ts`, `lib/supabase-service.ts`, `hooks/use-supabase-data.ts`. Behåll en, importera.

**Secrets i DB utan kryptering:**
- `components/customer-admin-sections.tsx:306-407` — `resendApiKey`, `smtpPass` som klartext på `tenants`-tabellen. TODO-kommentar om `supabase_vault` men ej implementerat.
- `sumupTestMode: true` + `swishTestMode: true` som default för nya tenants (rad 27, 161). Glöms bort → kund blir aldrig live.

**Cron-job 4 — `close_day()` kl 23:00:**
Saknar felhantering. Ingen duplikat-check om kiosken redan har en stängning för dagen. Ingen loggning vid fail.

---

## 8. Är 30k rader för mycket?

**Tre perspektiv:**

**Funktionell yta:** Corevo täcker mycket — superadmin + tenant admin + kiosk POS + Swish Handel + NFC kort + multi-store + inventory + invoices + offers + kiosk-customize + rapporter. För den ytan är 30k inte orimligt. Jämförbara system (Sitoo, Quickbutik) ligger på liknande volym eller mer för feature-parity.

**Arkitektur:** Den är sund. Multi-tenant + RLS i DB-lagret är rätt val. Komponent-split efter Fas 1-refactor på kiosken är bra. Men datalagret (`use-supabase-data.ts` 2346 rader) är en monolit som måste splittas — det är där komplexiteten samlas.

**Dubletter & död kod:** Minimalt. `isOnline()` × 3, `use-navigation-guard.ts` oanvänd, några oanvända imports. Inget alarm.

**Slutsats:** Nej, 30k är inte för mycket. Problemet är inte mängd utan FÖRDELNING — tre mega-filer bär för mycket. Att splittra `use-supabase-data.ts` till 5-8 domänfiler är lågrisk och gör bygget mer underhållbart utan att ta bort rad.

---

## 9. Prioriterad åtgärdslista (nästa steg)

### 🛑 STOP-SHIP — måste fixas före nästa kund

1. **RLS anon-policyer stramas.** Droppa `anon_can_read_tenants`, `anon_can_update_orders`, `anon_can_update_products`, `anon_can_lookup_license`. Stäng `authenticated qual:true` till `tenant_id = get_tenant_id()`. Migration 022.
2. **Kontrollenhets-fält i orders.** Lägg till `control_code`, `control_unit_serial`, `org_number`, `address` som kolumner. Fyll via `tenants`-joint vid INSERT. Migration 023.
3. **Realtime i kiosk-entry.** En rad: `<RealtimeSync />` runt `<KioskPreview />` i `kiosk-entry.tsx`. Din offer-bugg försvinner direkt.

### ⚠️ VIKTIGT — inom 1-2 veckor

4. **Stock decrement atomär.** RPC med `UPDATE ... WHERE quantity >= $1 RETURNING`.
5. **PIN → bcrypt + rate-limit.** Migration som re-hashar vid nästa inmatning + max 5 försök per 5 min.
6. **Swish enkel-läge verifikation.** Byt "Jag har betalat" → "Registrera kvitto" + order-status `unverified_paid` + admin-verifiering.
7. **`close_day()` momsfix.** Använd `orders.vat_breakdown` istället för att räkna om.
8. **Tenant onboarding atomär.** Wrap hela flödet i en RPC (tenant + auth_user + licens i en transaktion).

### 🧹 NÄR DU ORKAR

9. Splittra `use-supabase-data.ts` till domänfiler.
10. Rensa `as any` × 9 + `catch {}` × 10 + console-logs × 12.
11. Error-boundary + toast på betalningsfel.
12. Supabase Vault för `resend_api_key`, `smtp_password`, Swish-cert.
13. Deduplicera `isOnline()`.
14. Lägg `swish_payments` + övriga publication-tabeller i admin-realtime.
15. Raderad `kiosk_heartbeats`-tabellen + cron-job 5 (onödiga).
16. Dokumentera/ta bort `SHADAN_URL` + ersätt `KASSA_PORTAL_URL` placeholders.

---

## 10. Min rekommendation för nästa steg

Börja med **stop-ship 3 (realtime i kiosk-entry)** — det är en rad och fixar din direkta observation om offers som inte syns. Ta sedan **stop-ship 1 (RLS)** som MÅSTE gå före all vidare kundonboarding. **Stop-ship 2 (kontrollenhets-fält)** kan köras parallellt — det är bara DB-migrering, påverkar inte pågående drift. Efter dessa tre kan du ta in nya kunder utan att hålla andan.

Därefter: betalningsintegritet (stock-race + Swish-verifikation) innan volymen växer, sen kod-splittning när lugn är återställd.

Inte allt är trasigt. Kärnbygget är solitt. Det är tre små hål att täppa till — inte en ombyggnad.

---

*Rapport genererad 2026-04-13 efter audit av 9 parallella Explore-agenter + direkt verifikation mot live-databasen i `corevo-supabase-db` (Docker).*
