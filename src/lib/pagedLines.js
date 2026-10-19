// BIR line tables hold every line of a period (a busy quarter has thousands). They are loaded whole, since the
// totals, the DAT and the send cover them all, but drawn 20 at a time, with a quick find by payee or TIN.

export const LINES_PER_PAGE = 20

const nameOf = (p) => p?.registered_name || [p?.last_name, p?.first_name, p?.middle_name].filter(Boolean).join(' ')

// Lines whose payee name or TIN matches what was typed.
export function findLines(rows, query) {
  const q = (query ?? '').trim().toLowerCase()
  if (!q) return rows
  const digits = q.replace(/\D/g, '')
  return rows.filter((e) => nameOf(e.payee).toLowerCase().includes(q) || (digits.length >= 3 && String(e.payee?.tin ?? '').includes(digits)))
}

// One page of lines: { rows, offset, pagination } (pagination as Pager expects it).
export function pageOf(rows, page, per = LINES_PER_PAGE) {
  const last = Math.max(1, Math.ceil(rows.length / per))
  const current = Math.min(Math.max(1, page || 1), last)
  return {
    rows: rows.slice((current - 1) * per, current * per),
    offset: (current - 1) * per,
    pagination: { current_page: current, last_page: last, per_page: per, total: rows.length },
  }
}
