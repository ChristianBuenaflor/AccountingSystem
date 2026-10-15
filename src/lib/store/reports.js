// Derive /api/reports-style aggregates from mock collections.
export function buildReports({ sales = [], purchases = [], assets = [] }) {
  const sum = (rows, f) => rows.reduce((s, r) => s + (parseFloat(r[f]) || 0), 0)
  const month = (d) => (d && d.length >= 7 ? d.slice(0, 7) : 'n/a')
  const revenueByMonth = {}
  const expenseByMonth = {}
  sales.forEach((r) => { const k = month(r.date); revenueByMonth[k] = (revenueByMonth[k] || 0) + (parseFloat(r.total_amount) || 0) })
  purchases.forEach((r) => { const k = month(r.date); expenseByMonth[k] = (expenseByMonth[k] || 0) + (parseFloat(r.total_amount) || 0) })
  const assetsByStatus = {}
  assets.forEach((a) => { const k = a.status || 'active'; assetsByStatus[k] = (assetsByStatus[k] || 0) + 1 })
  const totalRevenue = sum(sales, 'total_amount')
  const totalExpenses = sum(purchases, 'total_amount')
  const totalAssets = sum(assets, 'current_value')
  return {
    totalRevenue, totalExpenses, totalAssets,
    revenueByMonth, expenseByMonth, assetsByStatus,
    accountBalances: { Sales: totalRevenue, Purchases: -totalExpenses, Assets: totalAssets },
  }
}
