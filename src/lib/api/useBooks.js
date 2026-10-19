// Invoices and bills for the Dashboard and the report pages, added up by the API over every record
// (GET /api/books/summary). Adding up a downloaded list in the browser went wrong past the first 500.
import { useEffect, useState } from 'react'
import api from './client'
import { errorMessage } from './client'

const EMPTY = { invoices: [], bills: [], recentInvoices: [], customerCount: 0, supplierCount: 0, receivable: 0, payable: 0, invoiceCount: 0, billCount: 0 }

export function useBooks() {
  const [books, setBooks] = useState(EMPTY)
  const [error, setError] = useState('')
  useEffect(() => {
    let live = true
    api.get('/books/summary').then(({ data: d }) => {
      if (!live) return
      // One row per month (date = the month's 1st, amount = that month's total): the screens group and sum by month.
      const monthly = (key) => d.months.filter((m) => Number(m[key]) !== 0).map((m) => ({ date: `${m.month}-01`, amount: m[key] }))
      setBooks({
        invoices: monthly('revenue'),
        bills: monthly('expenses'),
        recentInvoices: d.recent_invoices,
        customerCount: d.customer_count,
        supplierCount: d.supplier_count,
        receivable: Number(d.receivable),
        payable: Number(d.payable),
        invoiceCount: d.invoice_count,
        billCount: d.bill_count,
      })
    }).catch((e) => { if (live) setError(errorMessage(e)) })
    return () => { live = false }
  }, [])
  return { ...books, error }
}

// buildReports() reads `date` and `total_amount`.
export const forReports = (rows) => rows.map((r) => ({ date: r.date, total_amount: r.amount }))

export default useBooks
