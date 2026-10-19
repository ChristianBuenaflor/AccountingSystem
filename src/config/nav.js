import {
  Cart, FileEarmarkText, People, Book, Calculator, Box, BarChart, Envelope,
  Calendar, Boxes, PersonCircle, Gear, Person, Cash, Building, Journals, PlugFill, CalendarCheck,
} from 'react-bootstrap-icons'

const doc = FileEarmarkText
const cols = ['#', 'Name', 'Date', 'Amount', 'Status', 'Actions']

export const NAV = [
  { section: 'OVERVIEW', items: [
    { label: 'Dashboard', icon: BarChart, path: '/dashboard', custom: true },
  ] },
  { section: 'BUSINESS', items: [
    { key: 'sales', label: 'Sales', icon: Cart, title: 'Sales', sub: 'Manage invoices, quotes, and sales orders.', children: [
      { label: 'Invoices', icon: Cash, path: '/sales/invoices', action: 'New Invoice', empty: 'No invoices found.', cols: ['#', 'Invoice #', 'Customer', 'Date', 'Due Date', 'Amount', 'Status', 'Actions'] },
      { label: 'Quotes', icon: doc, path: '/sales/quotes', action: 'New Quote', empty: 'No quotes found.', cols: ['#', 'Quote #', 'Customer', 'Date', 'Expiry', 'Amount', 'Status', 'Actions'] },
      { label: 'Orders', icon: doc, path: '/sales/orders', action: 'New Order', empty: 'No orders found.', cols: ['#', 'Order #', 'Customer', 'Date', 'Delivery', 'Amount', 'Status', 'Actions'] },
      { label: 'Customers', icon: People, path: '/sales/customers', action: 'New Customer', empty: 'No customers found.', cols: ['#', 'Name', 'TIN', 'Email', 'Phone', 'City', 'Actions'] },
      // BIR: taxes your customers withheld from your sales (their 2307s) -> SAWT, sent to Alphalist
      { label: 'Tax Withheld by Customers (SAWT)', icon: Journals, path: '/alphalist/sawt', custom: true },
    ] },
    { key: 'purchases', label: 'Purchases', icon: Cart, title: 'Purchases', sub: 'Manage bills, purchase orders, and suppliers.', children: [
      { label: 'Bills', icon: doc, path: '/purchases/bills', action: 'New Bill', empty: 'No bills found.', cols: ['#', 'Bill #', 'Supplier', 'Date', 'Due Date', 'Amount', 'Status', 'Actions'] },
      { label: 'Purchase Orders', icon: doc, path: '/purchases/orders', action: 'New Purchase Order', empty: 'No purchase orders found.', cols },
      { label: 'Suppliers', icon: People, path: '/purchases/suppliers', action: 'New Supplier', empty: 'No suppliers found.', cols: ['#', 'Name', 'TIN', 'Email', 'Phone', 'City', 'Actions'] },
      // BIR: tax you withhold when paying suppliers -> QAP 1601-EQ (and 1604-E yearly); government buyers -> MAP
      { label: 'Tax Withheld from Suppliers (QAP)', icon: Journals, path: '/alphalist/qap?form=1601EQ', custom: true },
      { label: 'VAT / % Tax Withheld (MAP)', icon: Journals, path: '/alphalist/map', custom: true },
    ] },
  ] },
  { section: 'ACCOUNTING', items: [
    { label: 'Journals', icon: Book, path: '/journals', title: 'Journals', sub: 'Record and review journal entries.', action: 'New Journal', empty: 'No journal entries found.', cols: ['#', 'Reference', 'Date', 'Debit', 'Credit', 'Status', 'Actions'] },
    { key: 'recon', label: 'Reconciliations', icon: Calculator, title: 'Reconciliations', sub: 'Match statements against your books.', children: [
      { label: 'Bank', icon: Calculator, path: '/reconciliations/bank', action: 'New Reconciliation', empty: 'No bank reconciliations found.', cols },
      { label: 'Credit Card', icon: Calculator, path: '/reconciliations/credit-card', action: 'New Reconciliation', empty: 'No card reconciliations found.', cols },
    ] },
    { label: 'Fixed Assets', icon: Box, path: '/fixed-assets', title: 'Fixed Assets', sub: 'Track assets and depreciation.', action: 'New Asset', empty: 'No fixed assets found.', cols },
    { key: 'reports', label: 'Reports', icon: BarChart, title: 'Reports', sub: 'Financial statements and summaries.', children: [
      { label: 'Profit & Loss', icon: BarChart, path: '/reports/profit-loss', empty: 'No data.', cols },
      { label: 'Calculator Sheet', icon: BarChart, path: '/reports/balance-sheet', empty: 'No data.', cols },
      { label: 'Cash Flow', icon: BarChart, path: '/reports/cash-flow', empty: 'No data.', cols },
    ] },
  ] },
  { section: 'OTHER', items: [
    { label: 'Mailbox', icon: Envelope, path: '/mailbox', title: 'Mailbox', sub: 'Messages and notifications.', empty: 'No messages.', cols: ['#', 'From', 'Subject', 'Date', 'Actions'] },
    { key: 'scheduler', label: 'Scheduler', icon: Calendar, title: 'Scheduler', sub: 'Plan events and tasks.', children: [
      { label: 'Calendar', icon: Calendar, path: '/scheduler/calendar', action: 'New Event', empty: 'No events.', cols },
      { label: 'Tasks', icon: Calendar, path: '/scheduler/tasks', action: 'New Task', empty: 'No tasks.', cols },
    ] },
    { key: 'products', label: 'Products', icon: Boxes, title: 'Products', sub: 'Items and categories you sell or buy.', children: [
      { label: 'Items', icon: Boxes, path: '/products/items', action: 'New Item', empty: 'No items found.', cols: ['#', 'Name', 'SKU', 'Price', 'Stock', 'Actions'] },
      { label: 'Services', icon: Boxes, path: '/products/services', action: 'New Service', empty: 'No services found.', cols: ['#', 'Name', 'SKU', 'Price', 'Cost', 'Margin', 'Actions'] },
    ] },
    { label: 'Contacts', icon: People, path: '/contacts', title: 'Contacts', sub: 'Customers and other contacts.', action: 'New Contact', empty: 'No contacts found.', cols: ['#', 'Name', 'Email', 'Phone', 'Type', 'Actions'] },
    // alphalist-api /employees: each year's compensation is the employee's 1604-C line
    { label: 'Employees', icon: PersonCircle, path: '/employees', custom: true },
  ] },
  { section: 'ALPHALIST', items: [
    // every return x period of the year: keyed, sent, changed since send, overdue
    { label: 'BIR Filing Status', icon: CalendarCheck, path: '/alphalist/status', custom: true },
    { label: 'Withholding Agents', icon: Building, path: '/alphalist/agents', custom: true },
    { label: 'TIN Library', icon: People, path: '/alphalist/payees', custom: true },
    { label: 'QAP Entry', icon: Journals, path: '/alphalist/qap', custom: true },
    { label: '1604-E Annual', icon: Journals, path: '/alphalist/1604e', custom: true },
    { label: '1604-F Annual', icon: Journals, path: '/alphalist/1604f', custom: true },
    { label: '1604-C Employees', icon: Journals, path: '/alphalist/1604c', custom: true },
    { label: '1621 Estates', icon: Journals, path: '/alphalist/1621', custom: true },
    { key: 'dattools', label: 'DAT Tools', icon: Box, title: 'DAT Tools', sub: '', children: [
      // BIR's Alphalist Validation module on any .DAT (the return pages check their own)
      { label: 'BIR Validation', icon: doc, path: '/alphalist/tools/validate', custom: true },
      { label: 'Analyze DAT', icon: doc, path: '/alphalist/tools/analyze', custom: true },
      { label: 'Compare DAT', icon: doc, path: '/alphalist/tools/compare', custom: true },
      { label: 'Format Spec', icon: doc, path: '/alphalist/tools/spec', custom: true },
    ] },
    { label: 'BIR Alphalist', icon: PlugFill, path: '/alphalist/sync', custom: true },
  ] },
  { section: 'SETTINGS', items: [
    { label: 'Setup', icon: Gear, path: '/setup', title: 'Setup', sub: 'Company and system settings.', empty: 'Nothing configured yet.', cols: ['Setting', 'Value', 'Actions'] },
    { label: 'Account', icon: Person, path: '/account', title: 'Account', sub: 'Your profile and preferences.', empty: 'Nothing here yet.', cols: ['Field', 'Value', 'Actions'] },
  ] },
]

// Flatten every page into { path, title, sub, action, empty, cols }
export const PAGES = NAV.flatMap((s) => s.items).flatMap((i) =>
  i.children ? i.children.map((c) => ({ ...c, title: i.title, sub: i.sub })) : [i]
).filter((p) => !p.custom)
