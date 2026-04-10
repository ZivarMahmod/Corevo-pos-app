# SumUp NFC-betalning — Setup-guide

## Hårdvara som krävs
- Elo Edge Connect NFC-adapter för I-Series 4 (beställs på elotouch.com)
- Elo I-Series 4 skärm (redan klar)
- SumUp 3G+ terminal (redan klar, används som backup)

## Konto som krävs
- Verifierat SumUp-konto på me.sumup.com
- API-nyckel skapad under Integrationer → API-nycklar med behörighet: payments
- SumUp Affiliate Key från developer.sumup.com (behövs vid APK-bygge)

## Aktivera för kund
1. Logga in på tenant-adminen
2. Gå till Inställningar → Betalterminal
3. Aktivera toggle → välj SumUp
4. Klistra in API-nyckel från me.sumup.com
5. Ange Merchant Code (visas uppe till höger i SumUp-dashboarden)
6. Lämna Testläge på tills allt är verifierat
7. Spara

## Testa utan NFC-adapter (testläge)
Med testläge aktivt simuleras betalningen efter 2 sekunder. Hela flödet — animering, orderregistrering, tack-skärm — fungerar exakt som på riktigt. Ingen kortläsare behövs.

## Bygga APK
```
expo eas build --platform android
```
APK:n installeras på Elo-skärmen via ADB eller direkt nedladdning.

## Viktigt
NFC-funktionen är inaktiv i webbläsaren. Den aktiveras automatiskt när APK är installerad och NFC-adaptern är monterad.
