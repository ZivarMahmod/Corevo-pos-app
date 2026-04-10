// SumUp Android SDK — kräver APK-byggd app via Expo EAS Build för native NFC.
// I webbläsare körs alltid testläge-mock. Aktiveras fullt när Elo Edge Connect
// NFC-adapter är monterad och APK är installerad på Elo I-Series 4.

export interface SumUpResult {
  success: boolean;
  transactionCode: string;
  message: string;
}

/**
 * Initierar SumUp SDK med kundens API-nyckel.
 * Är en no-op i webbläsarmiljö.
 */
export function initSumUp(apiKey: string, affiliateKey: string): void {
  if (
    typeof window !== "undefined" &&
    (window as Record<string, unknown>).SumUpSDK
  ) {
    const sdk = (window as Record<string, unknown>).SumUpSDK as {
      init: (config: { apiKey: string; affiliateKey: string }) => void;
    };
    sdk.init({ apiKey, affiliateKey });
  }
  // No-op i webbläsare utan SDK
}

/**
 * Startar en betalning via SumUp.
 *
 * - testMode: väntar 2 sek och returnerar mock-success
 * - Native Android med SDK: anropar SumUp SDK
 * - Webbläsare utan testMode: returnerar fel
 */
export async function startPayment(
  amount: number,
  currency: string,
  title: string,
  testMode: boolean
): Promise<SumUpResult> {
  // Testläge — simulera lyckad betalning efter 2 sekunder
  if (testMode) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const code = Math.floor(1000 + Math.random() * 9000);
    return {
      success: true,
      transactionCode: `TEST-${code}`,
      message: "Testbetalning godkänd",
    };
  }

  // Native Android med SumUp SDK
  if (
    typeof window !== "undefined" &&
    (window as Record<string, unknown>).SumUpSDK
  ) {
    try {
      const sdk = (window as Record<string, unknown>).SumUpSDK as {
        pay: (config: {
          amount: number;
          currency: string;
          title: string;
        }) => Promise<{ transactionCode: string }>;
      };
      const result = await sdk.pay({ amount, currency, title });
      return {
        success: true,
        transactionCode: result.transactionCode,
        message: "Betalning godkänd",
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Okänt fel vid betalning";
      return {
        success: false,
        transactionCode: "",
        message,
      };
    }
  }

  // Webbläsare utan testMode
  return {
    success: false,
    transactionCode: "",
    message: "SumUp kräver Android-app",
  };
}
