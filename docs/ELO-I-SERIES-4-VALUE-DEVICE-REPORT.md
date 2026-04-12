# Elo I-Series 4 Value 15" - Full Device Report

> Granskad: 2026-04-12
> Serial: E225A21086
> Hostname: 15in-I-Series-4-Value
> ADB: 192.168.50.151:5555 (WiFi)

---

## 1. Hardware

| Egenskap | Detaljer |
|----------|---------|
| Modell | Elo 15" I-Series 4 Value |
| SKU | i4_in15_value |
| HW Revision | ELO3399 |
| HW ID | 01.40.00 |
| SoC | Rockchip RK3399 |
| CPU | 4x Cortex-A53 (liten) + 2x Cortex-A72 (stor) - big.LITTLE |
| Arkitektur | ARM64 (arm64-v8a, armeabi-v7a, armeabi) |
| GPU | Mali (OpenGL ES 3.2, Vulkan 1.0) |
| RAM | 4 GB (3933 MB total) |
| Lagring | 16 GB eMMC (15 GB tillgangligt pa /data) |
| Skarm | 15" 1920x1080 @ 60Hz, 240 DPI, eDP-ansluten |
| Touch | SiS (sis_touch) kapacitiv touchscreen, multi-touch |
| Ethernet | 1x RJ45 (eth0, MAC: 1c:ee:c9:41:11:23) - ej ansluten |
| WiFi | wlan0 (ansluten, SSID: "ImadJetLazer", IP: 192.168.50.151, MAC: ca:ff:95:5c:8a:6b) |
| Bluetooth | 5.0 (adress: 70:F7:54:39:72:87) |
| USB Host | Ja - tangentbord/mus/tillbehor via USB-A portar |
| USB-C | Ja - stoder 15W USB-C stromforsorjning (PoE) |
| Stromforsorjning | DC (nuvarande), stoder PoE via USB-C |
| Batteri | Inget fysiskt batteri (simulerat: AC powered) |
| Kamera | Kameraserver kors men ingen fysisk kamera bekraftad |
| NFC | NFC-stack finns men ar avaktiverad |
| HDMI CEC | Stods (cec-hal-1-0) |

---

## 2. Software

| Egenskap | Detaljer |
|----------|---------|
| Android version | 10 (API 29) |
| Build ID | QQ2A.200305.004.A1 |
| Firmware version | 5.000.034.0013+v |
| Kernel | Linux 4.19.111 (byggd 2025-05-05) |
| Sakerhetspatch | 2023-02-05 |
| Build-typ | user (release-keys) |
| Krypterad | Ja (file-based encryption) |
| Verified Boot | Ja (gron status, AVB 1.1) |
| Bootloader | Laast (flash.locked=1) |
| A/B partitioner | Ja (slot_suffix=_a) |
| Zram | Aktiverad (2 GB swap) |
| GMS | Google Mobile Services installerat (v10_202102) |
| DRM | Widevine + ClearKey |

---

## 3. Partitioner

| Partition | Block | Beskrivning |
|-----------|-------|-------------|
| uboot_a | mmcblk2p1 | U-Boot bootloader (slot A) |
| uboot_b | mmcblk2p2 | U-Boot bootloader (slot B) |
| trust_a | mmcblk2p3 | Trusted firmware (slot A) |
| trust_b | mmcblk2p4 | Trusted firmware (slot B) |
| misc | mmcblk2p5 | Recovery/boot misc |
| dtb | mmcblk2p6 | Device Tree Blob |
| dtbo_a | mmcblk2p7 | Device Tree Overlay (slot A) |
| dtbo_b | mmcblk2p8 | Device Tree Overlay (slot B) |
| vbmeta_a | mmcblk2p9 | Verified Boot metadata (slot A) |
| vbmeta_b | mmcblk2p10 | Verified Boot metadata (slot B) |
| boot_a | mmcblk2p11 | Boot image (slot A) |
| boot_b | mmcblk2p12 | Boot image (slot B) |
| backup | mmcblk2p13 | Backup partition |
| security | mmcblk2p14 | Security data |
| cache | mmcblk2p15 | Cache (356 MB) |
| metadata | mmcblk2p16 | Metadata (11 MB) |
| frp | mmcblk2p17 | Factory Reset Protection |
| super | mmcblk2p18 | Super partition (system/vendor/product/odm) |
| elo | mmcblk2p19 | Elo-specifik konfiguration |
| eloconf | mmcblk2p20 | Elo konfiguration (27 MB) |
| logo | mmcblk2p21 | Boot-logotyp |
| userdata | mmcblk2p22 | Anvandardata (16 GB) |

---

## 4. Natverk

| Interface | Status | Detaljer |
|-----------|--------|---------|
| wlan0 | UP | IP: 192.168.50.151/24, Gateway: 192.168.50.1, DNS: 8.8.8.8/8.8.4.4 |
| eth0 | DOWN | MAC: 1c:ee:c9:41:11:23 (ingen kabel) |
| Bluetooth | ON | 70:F7:54:39:72:87 |
| ADB TCP | OPEN | Port 5555 (persist.vendor.adb.tcp.port=5555) |

---

## 5. Skarm/Display

| Egenskap | Varde |
|----------|-------|
| Upplasning | 1920x1080 |
| App-omrade | 1920x1008 (72px for systemUI) |
| Densitet | 240 DPI |
| Uppdateringsfrekvens | 60 Hz |
| Ansluningstyp | eDP (intern) |
| Ljusstyrka | 204/255 (80%) |
| Rotation | Fast (ej rotationsensor) |
| Touch-input | SiS kapacitiv, multi-touch |
| HDR | Stods (HdrCapabilities) |

---

## 6. Installerade paket (efter factory reset)

### Elo-specifika
| Paket | Beskrivning |
|-------|-------------|
| com.elo.secure | Elo sakerhetslager |
| com.elo.peripheral | Elo periferihantering |
| com.elo.display.fullsize | Fullskarmsvisning |
| com.elo.android.multiclientinputmethod | Multi-klient tangentbord |
| com.elo.otaupdater | OTA-uppdaterare |
| com.elo.systemui.navbar.nobutton | SystemUI utan knappar |
| com.elotouch.presetup | Elo forkonfigurering |
| com.elotouch.keyboard | Elo tangentbord |
| com.elotouch.networkdiagnostics | Natverksdiagnostik |
| com.elotouch.eloextend | Elo Extend (casting) |
| com.elotouch.oauthmanager | OAuth-hanterare |
| com.elotouch.miami.testapp | Miami testapp |
| com.eloview.homesdk.testapp | EloView Home SDK test |
| elo.peripheral.web | Webb-periferi |
| com.sis.qautotooli2c | SiS touch-kalibreringsverktyg |

### EloView / Kiosk
| Paket | Status efter factory reset |
|-------|--------------------------|
| com.elotouch.home | **BORTTAGEN** (var NoviSign-launcher) |
| com.novisign.android.player | **BORTTAGEN** |
| com.navori.engine | **BORTTAGEN** |
| com.navori.conductor | **BORTTAGEN** |

> **VIKTIGT:** EloView Home (com.elotouch.home) och NoviSign raderades vid factory reset.
> EloView kan aterinstalleras fran Elos portal om kiosk-lage behovs i framtiden.

### Standard Android
- com.android.launcher3 (standard hemskarm - **AKTIV**)
- com.android.settings
- com.android.chrome
- com.android.camera2
- com.android.vending (Google Play Store)
- com.google.android.gms (Google Play Services)
- Plus alla standard Google-appar (YouTube, Gmail, Maps, Photos, etc.)

---

## 7. Elo-specifika systeminställningar

| Property | Varde | Beskrivning |
|----------|-------|-------------|
| persist.sys.athens.home | com.elotouch.home | Standard Elo-hemapp (borttagen) |
| persist.sys.default.home | com.android.launcher3 | Fallback-launcher |
| persist.sys.elo.eloview | false | EloView-lage avaktiverat |
| persist.sys.elo.navbar | true | Navigeringsfalt synligt |
| persist.sys.elo.statusbar | false | Statusfalt dolt |
| persist.sys.elo.sticky_android | true | Sticky Android-lage |
| persist.sys.stdandroid | true | Standard Android-lage |
| persist.sys.disable.elo | false | Elo-tjanster aktiva |
| persist.sys.whitelist.state | false | Vitlistning av |
| persist.internet_adb_enable | 1 | Internet ADB aktiverat |
| persist.vendor.adb.tcp.port | 5555 | ADB TCP-port |

---

## 8. Kapacitet for Corevo POS-app

### Styrkor
- **1920x1080 touchskarm** — perfekt for POS-grenssnitt
- **4 GB RAM** — tillrackligt for en Android POS-app
- **16 GB lagring** (15 GB ledigt) — gott om plats
- **WiFi + Ethernet** — dubbla natverksalternativ
- **Bluetooth** — kan anvandas for kvittoskrivare, kortlasare
- **USB Host** — stod for USB-tillbehor (skanner, skrivare, etc.)
- **USB-C** — stoder strom + data
- **ADB over natverk** — fjarrinstallation och debugging
- **Google Play Store** — kan installera appar direkt
- **NFC-stack** — kan potentiellt anvandas for kontaktlos betalning
- **ARM64** — stoder alla moderna Android-appar

### Begransningar
- **Android 10 (API 29)** — aldre version, vissa nya API:er saknas
- **Sakerhetspatch fran 2023-02** — kraftigt foraldrad
- **Laast bootloader** — kan inte flasha custom recovery/ROM utan att lasa upp
- **Ingen fysisk kamera** (har kamera-HAL men troligtvis ingen lins)
- **Inget SIM/mobildata** — enbart WiFi/Ethernet
- **240 DPI** — lagre densitet, UI-element blir storre (bra for touch-POS)

### Rekommendationer for app-utveckling
1. **Target SDK:** 29 (Android 10), minSdk kan sattas till 29
2. **Arkitektur:** arm64-v8a (primariskt), armeabi-v7a (fallback)
3. **Skarm-layout:** Designa for 1920x1080 @ 240dpi (mdpi-hdpi)
4. **Touch:** Multi-touch stods — bra for gestures i POS
5. **Natverksanslutning:** Bygg for WiFi (primar) med Ethernet som fallback
6. **Kiosk-lage:** Anvand `com.elotouch.home` (EloView) eller Androids inbyggda kiosk-lage nar appen ska lasas

---

## 9. EloView for framtida kiosk-lasning

EloView (com.elotouch.home) togs bort vid factory reset men kan aterinstalleras:

1. **Fran Elo-portalen:** Ladda ner EloView APK fran admin.eloview.com
2. **Via ADB:** `adb install eloview.apk`
3. **Konfigurering:** EloView kan lasa enheten till en specifik app (Corevo POS)

Relevanta properties for kiosk-konfiguration:
```
persist.sys.elo.eloview=true      # Aktivera EloView
persist.sys.athens.home=<package> # Satt hem-app
persist.sys.elo.navbar=false      # Dolj navigering
persist.sys.elo.statusbar=false   # Dolj statusfalt
persist.sys.whitelist.state=true  # Vitlista appar
```

---

## 10. Anslutning

### ADB over WiFi (aktiv)
```bash
adb connect 192.168.50.151:5555
```

### ADB over USB
USB-C kabel till dator. Kraver USB-debugging aktiverat i Developer Options.

### USB Vendor/Product IDs
| Lage | VID | PID |
|------|-----|-----|
| Normal (ADB) | 18D1 | D001 |
| Fastboot | 18D1 | D00D |
| Touch controller | BEEF | 0001 |
| Recovery/Sideload | 18D1 | D001 |

---

## 11. Tjanster som kor

### Elo-specifika tjanster
- `eloLogging` — Elo-loggning
- `eloPartd` — Partitionshantering
- `elowdt` — Watchdog-timer
- `vendor.elo-hal-1-0` — Elo HAL (Hardware Abstraction Layer)
- `vendor.poe-hal-1-0` — Power over Ethernet HAL
- `vendor.signway-hal-1-0` — Signway HAL

### Input-enheter detekterade
- **sis_touch** — Inbyggd touchskarm
- **Gaming Keyboard** (VID: 2ea8, PID: 2122) — Externt USB-tangentbord
- **gpio-keys** — Fysiska knappar pa enheten

---

## 12. Nuvarande status

| Aspekt | Status |
|--------|--------|
| Android | Uppstartat, korektar pa com.android.settings |
| Launcher | com.android.launcher3 (standard Android) |
| EloView | Borttagen (kan aterinstalleras) |
| NoviSign | Borttagen |
| ADB WiFi | Aktiv pa port 5555 |
| USB Debug | Aktiverat |
| Developer Mode | Aktiverat |
| Factory Reset | Genomford 2026-04-12 |
| Kiosk-lage | Avaktiverat |

**Enheten ar redo for app-installation och testning.**
