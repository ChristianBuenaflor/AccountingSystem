// Peso amounts on the BIR screens: shown with thousands separators and 2 decimals, sent to the API as plain numbers.

const plain = (v) => String(v ?? '').replace(/[,\s₱]/g, '')
const isNumber = (s) => s !== '' && /^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)

// 12345.5 -> "12,345.50" ('' stays ''). Text that is not a number is returned as typed, so the server can flag it.
export const formatAmount = (v) => {
  const s = plain(v)
  if (s === '') return ''
  if (!isNumber(s)) return String(v)
  return Number(s).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// For table cells: blank stays blank.
export const money = (v) => (v == null || v === '' ? '' : formatAmount(v))
export const peso = (v) => `₱${formatAmount(v || 0)}`

// "12,345.50" -> "12345.50" for the API ('' stays '').
export const unformatAmount = (v) => plain(v)

// Money::toCents of alphalist-api (app/Alphalist/Dat/Money.php): integer centavos, rounding half up on the 3rd decimal.
export function toCents(v) {
  const s = plain(v)
  const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(s)
  if (!s || !m) return 0
  const frac = (m[3] ?? '').padEnd(3, '0')
  let cents = Number(m[2] || '0') * 100 + Number(frac.slice(0, 2))
  if (Number(frac[2]) >= 5) cents++
  return (m[1] === '-' ? -1 : 1) * cents
}

export const centsToAmount = (c) => formatAmount((c / 100).toFixed(2))
