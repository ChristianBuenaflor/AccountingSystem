// Phones: tables with class "fp-stack" show each row as a small card of "label: value" lines
// (CSS in index.css, under 576px), so amounts and actions are not lost off the right edge.
// This keeps every cell's data-label equal to its column header, whatever page renders the table.

function label(table) {
  const heads = [...table.querySelectorAll('thead tr:last-child th')].map((th) => th.textContent.trim())
  if (!heads.length) return
  for (const row of table.querySelectorAll('tbody tr')) {
    let col = 0
    for (const cell of row.children) {
      const span = cell.colSpan || 1
      const text = span > 1 ? '' : heads[col] ?? ''
      if (cell.getAttribute('data-label') !== text) cell.setAttribute('data-label', text)
      col += span
    }
  }
}

let queued = false
function labelAll() {
  queued = false
  document.querySelectorAll('table.fp-stack').forEach(label)
}

export function startStackedTables() {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return
  const schedule = () => {
    if (!queued) { queued = true; requestAnimationFrame(labelAll) }
  }
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true })
  schedule()
}
