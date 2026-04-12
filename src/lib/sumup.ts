/**
 * SumUp Android SDK wrapper.
 * In browser/web: only test mode works.
 * On native Android with SumUp SDK: real NFC payments.
 */

export interface SumUpResult {
  success: boolean
  transactionCode: string
  message: string
}

export function initSumUp(apiKey: string, affiliateKey: string): void {
  if (
    typeof window !== 'undefined' &&
    (window as unknown as Record<string, unknown>).SumUpSDK
  ) {
    const sdk = (window as unknown as Record<string, unknown>).SumUpSDK as {
      init: (config: { apiKey: string; affiliateKey: string }) => void
    }
    sdk.init({ apiKey, affiliateKey })
  }
}

/**
 * Start a payment via SumUp.
 *
 * IMPORTANT: testMode must be checked with === true.
 * Never use ?? true or !== false — that would activate test mode
 * when the value is undefined/null.
 */
export async function startPayment(
  amount: number,
  currency: string,
  title: string,
  testMode: boolean
): Promise<SumUpResult> {
  // Test mode — simulate success after 2 seconds
  if (testMode === true) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const code = Math.floor(1000 + Math.random() * 9000)
    return {
      success: true,
      transactionCode: `TEST-${code}`,
      message: 'Testbetalning godkänd',
    }
  }

  // Native Android with SumUp SDK
  if (
    typeof window !== 'undefined' &&
    (window as unknown as Record<string, unknown>).SumUpSDK
  ) {
    try {
      const sdk = (window as unknown as Record<string, unknown>).SumUpSDK as {
        pay: (config: {
          amount: number
          currency: string
          title: string
        }) => Promise<{ transactionCode: string }>
      }
      const result = await sdk.pay({ amount, currency, title })
      return {
        success: true,
        transactionCode: result.transactionCode,
        message: 'Betalning godkänd',
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Okänt fel vid betalning'
      return { success: false, transactionCode: '', message }
    }
  }

  // Browser without test mode
  return {
    success: false,
    transactionCode: '',
    message: 'SumUp kräver Android-app med NFC',
  }
}
