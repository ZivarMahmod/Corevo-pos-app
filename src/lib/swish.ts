/**
 * Swish QR code generation for kiosk payments.
 *
 * The QR code contains a Swish payment request that the customer
 * scans with their Swish app on their phone.
 *
 * Format: C{number};{amount};{message};0
 * - C prefix = commercial payment
 * - Semicolon separated fields
 * - Trailing 0 = no edit allowed
 */

export function generateSwishPayload(
  swishNumber: string,
  amount: number,
  message: string = ''
): string {
  const cleanNumber = formatSwishNumber(swishNumber)
  const roundedAmount = Math.round(amount * 100) / 100
  const safeMessage = message.slice(0, 50).replace(/;/g, '')
  return `C${cleanNumber};${roundedAmount};${safeMessage};0`
}

export function formatSwishNumber(raw: string): string {
  // Remove spaces, dashes, dots
  let cleaned = raw.replace(/[\s\-\.]/g, '')
  // Convert +46 to 0
  if (cleaned.startsWith('+46')) {
    cleaned = '0' + cleaned.slice(3)
  }
  // Convert 46 prefix (without +) to 0
  if (cleaned.startsWith('46') && cleaned.length > 9) {
    cleaned = '0' + cleaned.slice(2)
  }
  return cleaned
}
