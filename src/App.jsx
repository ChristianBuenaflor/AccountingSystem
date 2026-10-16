import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import RequireAuth from './components/RequireAuth'
import LandingPage from './pages/public/LandingPage'
import Login from './pages/public/Login'
import AgentsPage from './pages/alphalist/AgentsPage'
import PayeesPage from './pages/alphalist/PayeesPage'
import QapPage from './pages/alphalist/QapPage'
import AlphalistPage from './pages/alphalist/AlphalistPage'
import Annual1604FPage from './pages/alphalist/Annual1604FPage'
import { AnalyzePage, ComparePage, SpecPage } from './pages/alphalist/DatToolPages'
import Dashboard from './pages/overview/Dashboard'
import Sales from './pages/sales/Sales'
import Quotes from './pages/sales/Quotes'
import Orders from './pages/sales/Orders'
import Purchases from './pages/purchases/Purchases'
import Bills from './pages/purchases/Bills'
import Suppliers from './pages/purchases/Suppliers'
import Journals from './pages/accounting/Journals'
import Reconciliations from './pages/accounting/Reconciliations'
import BankReconciliation from './pages/accounting/BankReconciliation'
import CreditCardReconciliation from './pages/accounting/CreditCardReconciliation'
import FixedAssets from './pages/accounting/FixedAssets'
import Reports from './pages/reports/Reports'
import ProfitLoss from './pages/reports/ProfitLoss'
import BalanceSheet from './pages/reports/BalanceSheet'
import CashFlow from './pages/reports/CashFlow'
import Mailbox from './pages/mailbox/Mailbox'
import Scheduler from './pages/schedule/Scheduler'
import Calendar from './pages/schedule/Calendar'
import Tasks from './pages/schedule/Tasks'
import Products from './pages/catalog/Products'
import Services from './pages/catalog/Services'
import Contacts from './pages/people/Contacts'
import Employees from './pages/people/Employees'
import Setup from './pages/settings/Setup'
import AccountSettings from './pages/settings/AccountSettings'

function GatedShell() {
  return (
    <RequireAuth>
      <div className="fp-shell">
        <Sidebar />
        <div className="fp-main">
          <Topbar />
          <main className="fp-content">
            <Outlet />
          </main>
        </div>
      </div>
    </RequireAuth>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route element={<GatedShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sales/invoices" element={<Sales />} />
        <Route path="/sales/quotes" element={<Quotes />} />
        <Route path="/sales/orders" element={<Orders />} />
        <Route path="/purchases/orders" element={<Purchases />} />
        <Route path="/purchases/bills" element={<Bills />} />
        <Route path="/purchases/suppliers" element={<Suppliers />} />
        <Route path="/journals" element={<Journals />} />
        <Route path="/reconciliations" element={<Reconciliations />} />
        <Route path="/reconciliations/bank" element={<BankReconciliation />} />
        <Route path="/reconciliations/credit-card" element={<CreditCardReconciliation />} />
        <Route path="/fixed-assets" element={<FixedAssets />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/profit-loss" element={<ProfitLoss />} />
        <Route path="/reports/balance-sheet" element={<BalanceSheet />} />
        <Route path="/reports/cash-flow" element={<CashFlow />} />
        <Route path="/reports/trial-balance" element={<Navigate to="/reports/cash-flow" replace />} />
        <Route path="/mailbox" element={<Mailbox />} />
        <Route path="/scheduler" element={<Scheduler />} />
        <Route path="/scheduler/calendar" element={<Calendar />} />
        <Route path="/scheduler/tasks" element={<Tasks />} />
        <Route path="/products/items" element={<Products />} />
        <Route path="/products/services" element={<Services />} />
        <Route path="/products/categories" element={<Navigate to="/products/services" replace />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/account" element={<AccountSettings />} />
        <Route path="/alphalist/agents" element={<AgentsPage />} />
        <Route path="/alphalist/payees" element={<PayeesPage />} />
        <Route path="/alphalist/qap" element={<QapPage />} />
        <Route path="/alphalist/1604f" element={<Annual1604FPage form="1604F" />} />
        <Route path="/alphalist/1604e" element={<Annual1604FPage key="1604E" form="1604E" />} />
        <Route path="/alphalist/tools/analyze" element={<AnalyzePage />} />
        <Route path="/alphalist/tools/compare" element={<ComparePage />} />
        <Route path="/alphalist/tools/spec" element={<SpecPage />} />
        <Route path="/alphalist/sync" element={<AlphalistPage />} />
      </Route>
    </Routes>
  )
}
