// Local mock store: localStorage-backed with in-memory fallback (node-safe).
const mem = new Map()
const store = () =>
  typeof localStorage !== 'undefined'
    ? localStorage
    : {
        getItem: (k) => (mem.has(k) ? mem.get(k) : null),
        setItem: (k, v) => mem.set(k, String(v)),
        removeItem: (k) => mem.delete(k),
      }

export const keyFor = (key) => `fp.${key}.v1`

export function load(key, seedFn) {
  const fb = seedFn()
  try {
    const raw = store().getItem(keyFor(key))
    if (!raw) return fb
    const parsed = JSON.parse(raw)
    if (parsed === null || parsed === undefined) return fb
    if (Array.isArray(fb) && !Array.isArray(parsed)) return fb
    return parsed
  } catch {
    return fb
  }
}

export function save(key, rows) {
  try {
    store().setItem(keyFor(key), JSON.stringify(rows))
  } catch {
    /* quota or unavailable — keep in-memory state only */
  }
}

export const seeds = {
  sales: () => [
    { id: 1, invoice_number: 'INV-1001', contact_id: 1, date: '2026-09-01', due_date: '2026-09-15', total_amount: 1250, status: 'paid', notes: '' },
    { id: 2, invoice_number: 'INV-1002', contact_id: 2, date: '2026-09-05', due_date: '2026-09-20', total_amount: 840.5, status: 'sent', notes: '' },
    { id: 3, invoice_number: 'QT-2001', contact_id: 1, date: '2026-09-08', due_date: '2026-10-08', total_amount: 2100, status: 'sent', notes: '' },
    { id: 4, invoice_number: 'SO-3001', contact_id: 2, date: '2026-09-10', due_date: '2026-09-25', total_amount: 975, status: 'confirmed', notes: '' },
  ],
  purchases: () => [
    { id: 1, po_number: 'PO-5001', contact_id: 3, date: '2026-09-02', due_date: '', total_amount: 640, status: 'received', notes: '' },
    { id: 2, po_number: 'BL-6001', contact_id: 3, date: '2026-09-06', due_date: '2026-09-21', total_amount: 1120, status: 'draft', notes: '' },
    { id: 3, po_number: 'BL-6002', contact_id: 4, date: '2026-09-09', due_date: '2026-09-24', total_amount: 455.75, status: 'paid', notes: '' },
  ],
  contacts: () => [
    { id: 1, name: 'Acme Corp', email: 'billing@acme.test', phone: '555-0101', type: 'customer', address: '1 Main St', city: 'Manila', country: 'PH' },
    { id: 2, name: 'Globex Ltd', email: 'hello@globex.test', phone: '555-0102', type: 'customer', address: '2 Side St', city: 'Cebu', country: 'PH' },
    { id: 3, name: 'Supply House', email: 'sales@supply.test', phone: '555-0103', type: 'supplier', address: '3 Depot Rd', city: 'Manila', country: 'PH' },
    { id: 4, name: 'Parts Co', email: 'info@parts.test', phone: '555-0104', type: 'supplier', address: '4 Wharf Ave', city: 'Davao', country: 'PH' },
  ],
  journals: () => [
    { id: 1, entry_number: 'JE-001', date: '2026-09-01', description: 'Opening entry', total_debit: 5000, total_credit: 5000 },
    { id: 2, entry_number: 'JE-002', date: '2026-09-05', description: 'Office supplies', total_debit: 320, total_credit: 320 },
  ],
  reconciliations: () => [
    { id: 1, account_name: 'Bank - BDO Checking', statement_date: '2026-09-30', statement_balance: 15230.5, book_balance: 15230.5, status: 'reconciled' },
    { id: 2, account_name: 'Credit Card - Visa', statement_date: '2026-09-30', statement_balance: 2140.25, book_balance: 2140.25, status: 'pending' },
  ],
  assets: () => [
    { id: 1, name: 'Office Laptop', asset_code: 'FA-001', purchase_date: '2025-06-01', purchase_cost: 65000, current_value: 52000, depreciation_method: 'Straight Line', useful_life: 3, status: 'active' },
    { id: 2, name: 'Delivery Van', asset_code: 'FA-002', purchase_date: '2024-03-15', purchase_cost: 850000, current_value: 600000, depreciation_method: 'Straight Line', useful_life: 5, status: 'active' },
  ],
  mailbox: () => [
    { id: 1, from_name: 'BIR Notices', subject: 'Quarterly reminder', body: 'Reminder body', folder: 'inbox', created_at: '2026-09-28T09:00:00', is_read: false, is_starred: false },
    { id: 2, from_name: 'Me', subject: 'Sent sample', body: 'Sent body', folder: 'sent', created_at: '2026-09-27T14:30:00', is_read: true, is_starred: true },
  ],
  events: () => [
    { id: 1, title: 'Monthly close', description: 'Close September books', start_time: '2026-10-05T09:00', end_time: '2026-10-05T11:00', all_day: false, color: '#00b894' },
    { id: 2, title: 'Task: follow up invoice INV-1002', description: 'task call client', start_time: '2026-10-06T10:00', end_time: '2026-10-06T10:30', all_day: false, color: '#3498db', due_date: '2026-10-06', priority: 'medium', status: 'todo' },
  ],
  products: () => [
    { id: 1, name: 'Widget A', sku: 'W-A', description: 'Standard widget', price: 199, cost: 120, stock_quantity: 50, category: 'Item' },
    { id: 2, name: 'Install Service', sku: 'S-INST', description: 'On-site install', price: 1500, cost: 800, category: 'Service' },
  ],
  employees: () => [
    { id: 1, first_name: 'Juan', last_name: 'Dela Cruz', email: 'juan@test.ph', phone: '555-0201', department: 'Sales', position: 'Rep', hire_date: '2024-01-15', salary: 30000, status: 'active' },
    { id: 2, first_name: 'Maria', last_name: 'Santos', email: 'maria@test.ph', phone: '555-0202', department: 'Accounting', position: 'Clerk', hire_date: '2023-08-01', salary: 28000, status: 'active' },
  ],
  settings: () => [
    { id: 1, section: 'company', key: 'name', value: 'FinancePro Demo' },
    { id: 2, section: 'company', key: 'currency', value: 'PHP' },
  ],
}
