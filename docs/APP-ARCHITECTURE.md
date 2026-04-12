# Corevo POS App — Arkitektur & Dokumentation

> Komplett dokumentation av Android kiosk-appen.
> Uppdaterad: 2026-04-12

---

## Översikt

Corevo POS är en Android kiosk-app byggd med React + TypeScript + Vite + Capacitor.
Den körs primärt på Elo I-Series 4 (15", 1920x1080) men fungerar på vilken Android-skärm som helst.

**Syfte:** Kunder bläddrar produkter, lägger i varukorg, betalar med Swish QR eller kort (SumUp NFC).

**Stack:**
| Del | Teknik |
|-----|--------|
| UI | React 18 + TypeScript |
| Bundler | Vite 8 |
| Styling | Tailwind CSS v4 (inga komponentbibliotek) |
| Native wrapper | Capacitor 8 (Android) |
| Backend | Supabase self-hosted (PostgreSQL + Auth + RLS) |
| Animationer | Framer Motion (sparsamt, bara overlays) |
| QR-koder | qrcode.react |

---

## Filstruktur

```
corevo-pos-app/
├── index.html                  ← HTML-entry, viewport konfigurerad för kiosk
├── package.json                ← Dependencies och scripts
├── vite.config.ts              ← Vite + React + Tailwind plugins, alias @/
├── tsconfig.json               ← TypeScript strict mode, path alias @/*
├── capacitor.config.ts         ← App-ID: se.corevo.pos, webDir: dist
├── .env                        ← VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
├── .gitignore                  ← node_modules, dist, android, .env
│
├── docs/
│   ├── ELO-I-SERIES-4-VALUE-DEVICE-REPORT.md   ← Hårdvarurapport för Elo-skärmen
│   ├── SUMUP-NFC-SETUP.md                       ← SumUp NFC-instruktioner
│   └── APP-ARCHITECTURE.md                       ← DENNA FIL
│
├── src/
│   ├── main.tsx                ← React 18 createRoot entry point
│   ├── App.tsx                 ← HashRouter + KioskProvider + Routes
│   ├── vite-env.d.ts           ← Vite type definitions
│   │
│   ├── lib/                    ← Affärslogik och integrationer (noll UI)
│   │   ├── supabase.ts         ← Supabase-klient (public schema, anon key)
│   │   ├── storage.ts          ← Capacitor Preferences wrapper (JSON, fallback localStorage)
│   │   ├── kiosk-identity.ts   ← Licensaktivering, kiosk-state, admin-PIN
│   │   ├── elo-detect.ts       ← Detekterar Elo-hårdvara, konfigurerar kiosk-läge
│   │   ├── swish.ts            ← Swish QR-payload generering (C-format)
│   │   ├── sumup.ts            ← SumUp SDK wrapper (test + native NFC)
│   │   ├── orders.ts           ← Order CRUD, kvittonummer, moms, lagerhantering
│   │   └── sync.ts             ← Offline-kö, nätverkslyssnare, synkronisering
│   │
│   ├── hooks/                  ← React hooks (state management)
│   │   ├── useKiosk.tsx        ← Context + Provider. Identitet, aktivering, PIN
│   │   ├── useProducts.ts      ← Hämtar produkter + kategorier, cachear, kampanjpris
│   │   ├── useCart.ts          ← Varukorg-state, totaler, moms
│   │   ├── usePayment.ts      ← Betalflöde: Swish QR / Kort / Test
│   │   ├── useIdleTimer.ts    ← Inaktivitetstimer → callback
│   │   ├── useElo.ts          ← Elo-detektering + kiosk-konfigurering
│   │   └── useOnlineStatus.ts ← Realtids online/offline status
│   │
│   ├── screens/                ← Kiosk-skärmar (kundvyn)
│   │   ├── ActivationScreen.tsx    ← Licensnyckel + kiosknamn → aktivering
│   │   ├── IdleScreen.tsx          ← "Tryck för att börja" + admin-kugghjul
│   │   ├── ProductScreen.tsx       ← Produktgrid + kategorier + varukorg-sidebar
│   │   ├── CheckoutScreen.tsx      ← Swish QR / Kort NFC / Testläge
│   │   └── ThankYouScreen.tsx      ← Kvitto + auto-timeout 8s
│   │
│   ├── admin/                  ← Dold admin-portal
│   │   ├── AdminLogin.tsx      ← PIN-inmatning (4 siffror, lockout efter 3 försök)
│   │   ├── AdminDashboard.tsx  ← Grid: Produkter, Inställningar, Rapporter
│   │   ├── AdminProducts.tsx   ← Toggle show_on_kiosk, ändra lagersaldo
│   │   ├── AdminSettings.tsx   ← Swish on/off, SumUp on/off, testläge, avaktivera
│   │   └── AdminReports.tsx    ← Dagens försäljning (antal, total, per betalmetod)
│   │
│   ├── components/             ← Delade UI-komponenter
│   │   ├── ProductCard.tsx     ← Produktkort (emoji/bild, pris, kampanj, slutsåld)
│   │   ├── CartItem.tsx        ← Varukorgsrad (+/- knappar, ta bort)
│   │   ├── SwishQR.tsx         ← QR-kod rendering med qrcode.react
│   │   ├── AdminTrigger.tsx    ← Kugghjul-knapp (dag 1: synlig, framtida: gömd)
│   │   ├── StatusBar.tsx       ← Tenant-namn, WiFi-status, klocka
│   │   └── KeyboardInput.tsx   ← Numeriskt tangentbord för PIN-inmatning
│   │
│   └── styles/
│       └── globals.css         ← Tailwind v4 + Corevo CSS-variabler + animationer

├── android/                    ← Genererad av Capacitor (INTE i git)
```

---

## Flöden

### Licensaktivering (första start)
```
App startar → ingen cachad kiosk i Capacitor Preferences
  → ActivationScreen visas
  → Användaren skriver licensnyckel (t.ex. COREVO3X) + kiosknamn
  → App söker i licenses-tabellen (status: active/trial)
  → Kollar enhetsgräns (antal aktiva kiosker vs max_devices)
  → INSERT i kiosks-tabellen (tenant_id, namn, device_info)
  → Hämtar tenant-data (namn, betalinställningar, kiosk-tema)
  → Cachar allt i Capacitor Preferences
  → Navigerar till IdleScreen
```

### Kundflöde
```
IdleScreen ("Tryck för att börja")
  → Kund trycker → ProductScreen
  → Produktgrid med kategoriflikar (vänster 70%)
  → Varukorg-sidebar (höger 30%)
  → Kund lägger till produkter → trycker "Betala"
  → CheckoutScreen
     → Swish: QR-kod visas, kund skannar, manuell bekräftelse
     → Kort: NFC-animation, SumUp SDK (testläge: 2s simulering)
  → ThankYouScreen (kvittonummer, auto-timeout 8s)
  → Tillbaka till IdleScreen
```

### Admin-flöde
```
IdleScreen → kugghjul-knapp (center-top)
  → AdminLogin (PIN, 3 försök, 30s lockout)
  → AdminDashboard (grid med val)
     → Produkter: toggle synlighet, ändra lager
     → Inställningar: Swish/kort on/off, testläge, avaktivera
     → Rapporter: dagens ordrar och total
  → Auto-logout efter 5 min inaktivitet
```

---

## Lib-moduler i detalj

### supabase.ts
- Skapar Supabase-klient med `VITE_SUPABASE_URL` och `VITE_SUPABASE_ANON_KEY`
- Default `public` schema (alla tabeller lever i public)
- Anon key är publik — säkerhet sköts av RLS i databasen

### storage.ts
- Wrapper kring `@capacitor/preferences` med JSON serialize/deserialize
- `setItem<T>`, `getItem<T>`, `removeItem`
- Fallback till `localStorage` i webbläsare (dev-läge)

### kiosk-identity.ts
- `activateKiosk(licenseKey, name)` — validerar licens, kollar gräns, skapar kiosk, hämtar tenant
- `getCachedKiosk()` — läser från Capacitor Preferences
- `refreshKioskData()` — uppdaterar cache från Supabase (bakgrund)
- `clearKiosk()` — tar bort cache (avaktivering)
- `verifyAdminPin(input, storedPin)` — jämför PIN

### elo-detect.ts
- `isEloDevice()` — kollar userAgent för 'ELO', 'I-Series', 'i4_in'
- `configureEloKiosk()` — döljer StatusBar via Capacitor plugin

### swish.ts
- `generateSwishPayload(number, amount, message)` — format: `C{number};{amount};{message};0`
- `formatSwishNumber(raw)` — rengör nummer (+46 → 0, tar bort mellanslag)
- QR-koden skannas av kundens Swish-app

### sumup.ts
- `initSumUp(apiKey, affiliateKey)` — initierar SDK (no-op i browser)
- `startPayment(amount, currency, title, testMode)` — testläge simulerar 2s, native anropar SDK
- **KRITISKT:** testMode kontrolleras med `=== true`, ALDRIG `?? true` eller `!== false`

### orders.ts
- `generateReceiptNumber(kioskId)` — gapless YYYYMMDD-NNNN per kiosk per dag
- `calculateVat(items)` — svensk moms (inklusiv i pris): `price * qty * (rate / (1 + rate))`
- `createOrder(payload)` — INSERT i orders + order_items
- `updateOrderStatus(id, status)` — pending/completed/cancelled
- `decrementStock(items)` — direkt UPDATE på products.quantity

### sync.ts
- `queueOrder(order)` — sparar i offline-kö (Capacitor Preferences)
- `processQueue()` — synkar köade orders vid reconnect
- `startSyncListener()` — lyssnar på nätverksändringar via `@capacitor/network`

---

## Databas (Supabase, public schema)

### Tabeller som appen använder
| Tabell | Läs | Skriv | Syfte |
|--------|-----|-------|-------|
| licenses | SELECT | — | Validera licensnyckel vid aktivering |
| kiosks | SELECT | INSERT | Skapa kiosk vid aktivering, läsa kiosk-data |
| tenants | SELECT | — | Tenant-inställningar (namn, betalmetoder, tema) |
| products | SELECT | UPDATE | Produkter för kiosk-vyn, lagersaldo |
| categories | SELECT | — | Kategorier för produktgrid |
| orders | SELECT, UPDATE | INSERT | Skapa och hantera ordrar |
| order_items | — | INSERT | Orderrader |

### RLS + GRANTs
Anon-rollen behöver:
- `GRANT SELECT ON licenses, kiosks, tenants, products, categories, orders TO anon`
- `GRANT INSERT ON kiosks, orders, order_items TO anon`
- `GRANT UPDATE ON kiosks, orders, products TO anon`
- RLS-policys med `USING (true)` / `WITH CHECK (true)` för anon

### Viktiga kolumner
- **licenses:** `license_key`, `tenant_id`, `status` (active/trial), `max_devices`
- **kiosks:** `tenant_id`, `name`, `license_key`, `status`, `admin_pin`, `swish_number`, `device_info`
- **tenants:** `name`, `swish_enabled`, `swish_number`, `terminal_enabled`, `sumup_test_mode`, `kiosk_*` (tema-fält)
- **products:** `tenant_id`, `name`, `price`, `emoji`, `image`, `quantity`, `stock_status`, `show_on_kiosk`, `campaign_price/from/to`, `vat_rate`
- **orders:** `tenant_id`, `kiosk_id`, `receipt_number`, `total`, `vat`, `payment_method`, `status`

---

## Design

### Färger (Corevo brand)
```css
--color-primary:       #2d6b5a   (djupgrön)
--color-primary-light: #f0f7f4   (ljusgrön bakgrund)
--color-secondary:     #d4a574   (varm guld/brun)
--color-accent:        #f5a623   (orange)
--color-swish:         #4CAF50   (Swish-grön)
--color-card:          #00B4D8   (kort-blå)
--color-danger:        #dc2626   (röd)
--color-success:       #16a34a   (grön)
```

### Layout (1920x1080, Elo)
```
┌─────────────────────────────────┬──────────────────┐
│ StatusBar (namn, WiFi, klocka)  │                  │
├─────────────────────────────────┤   Varukorg       │
│ [Kategori-tabs]                 │   (340px fast)   │
│                                 │                  │
│ Produktgrid (3-4 kolumner)      │   Items          │
│ ProductCard-komponenter         │   Totalt + moms  │
│                                 │   [Betala kort]  │
│                                 │   [Betala Swish] │
└─────────────────────────────────┴──────────────────┘
```

### Touch-optimering
- Alla klickbara element ≥ 48x48px
- `active:scale-95` för taktil feedback
- `touch-action: manipulation` (ingen double-tap zoom)
- Ingen text-selection, inga scrollbars
- User-scalable=no i viewport

### Responsivt
- ≥1200px: produktgrid + sidebar (Elo-läge)
- 768-1199px: produktgrid + bottom sheet cart
- <768px: produktlista + fullskärms cart

---

## Android-bygge

### Förutsättningar
```
JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"   (OpenJDK 21)
ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"                   (Build tools 34-36)
ADB: USB + WiFi (192.168.50.151:5555)
```

### Bygga och deploya
```bash
npm run build                           # Vite → dist/
npx cap sync android                    # dist/ → android assets
cd android && ./gradlew assembleDebug   # → app-debug.apk
adb -s 192.168.50.151:5555 install -r app/build/outputs/apk/debug/app-debug.apk
adb -s 192.168.50.151:5555 shell am start -n se.corevo.pos/.MainActivity
```

### Android-konfiguration
- `minSdk: 29` (Android 10, matchar Elo)
- `targetSdk: 36`
- `screenOrientation: landscape`
- Permissions: INTERNET, ACCESS_NETWORK_STATE, NFC
- App-ID: `se.corevo.pos`

---

## Elo Premium-lager

Detekteras automatiskt via `elo-detect.ts`. Om Elo:
- StatusBar döljs via Capacitor plugin
- Immersive mode aktiveras
- NFC-stack tillgänglig (framtida)

Om INTE Elo:
- Standard Android fullscreen
- Inga Elo-specifika API-anrop

---

## Kända begränsningar (dag 1)

| Område | Status | Framtida |
|--------|--------|----------|
| Swish | QR visas, manuell "Jag har betalat" | Server-callback via Swish Handel API |
| SumUp | Testläge funkar (2s simulering) | SumUp SDK Capacitor-plugin för riktig NFC |
| Kvittonummer | Client-side gapless counter | Server-side RPC `next_receipt_number` |
| Admin PIN | Plaintext i DB | Hashad PIN |
| Offline | Cachade produkter, offline-kö | Konfliktlösning, batch-sync |
| Kiosk-lås | Ingen (EloView senare) | EloView kiosk management |
| Admin-trigger | Synligt kugghjul | Gömd 5s-håll i hörnet |

---

## Säkerhet

- **Anon key** är publik — all säkerhet sköts av RLS
- **Service role key** används ALDRIG i appen
- **Admin PIN** verifieras lokalt mot cachad kiosk-data
- **testMode** kontrolleras alltid med `=== true` (aldrig `?? true`)
- Ingen kortdata, BankID-data eller Swish-telefonnummer lagras
- `.env` committas ALDRIG till git
