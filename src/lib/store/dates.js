// NaN-safe date formatting for edit-form inputs. Never throws.
export const toDateInput = (v, len = 10) => {
  const d = new Date(v)
  return isNaN(d) ? '' : d.toISOString().slice(0, len)
}
