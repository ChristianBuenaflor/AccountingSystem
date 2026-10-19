import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Users, Boxes, DollarSign, CreditCard,
  Mail, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'
import { useBooks } from '../../lib/api/useBooks.js'

const Dashboard = () => {
  const { invoices, bills, recentInvoices, customerCount, supplierCount, error } = useBooks()
  const { rows: products } = useCollection('products', seeds.products)
  const { rows: events } = useCollection('events', seeds.events)

  const sum = (rows) => rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
  const totalSales = sum(invoices)
  const totalPurchases = sum(bills)
  const stats = {
    totalSales, totalPurchases,
    totalContacts: customerCount + supplierCount, totalProducts: products.length,
    recentSales: recentInvoices,
    upcomingEvents: events.slice(0, 5),
  }

  // The last six months, this one included.
  const now = new Date()
  const chartData = [5, 4, 3, 2, 1, 0].map((back) => {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const inMonth = (rows) => sum(rows.filter((r) => String(r.date).startsWith(key)))
    return { name: d.toLocaleDateString('en-US', { month: 'short' }), revenue: inMonth(invoices), expense: inMonth(bills) }
  })

  const pieData = [
    { name: 'Revenue', value: totalSales || 65, color: '#00b894' },
    { name: 'Expenses', value: totalPurchases || 35, color: '#e74c3c' },
  ]

  // Latest month with entries against the month before it (a month still empty would read -100%).
  const change = (key) => {
    const i = chartData.findLastIndex((m) => m[key] > 0)
    if (i < 1 || !chartData[i - 1][key]) return null
    const [prev, curr] = [chartData[i - 1], chartData[i]]
    const pct = ((curr[key] - prev[key]) / prev[key]) * 100
    return { text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, up: pct >= 0, period: `${curr.name} vs ${prev.name}` }
  }
  const peso = (v) => `₱${v.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`

  const statCards = [
    { label: 'Total Revenue', value: peso(totalSales), icon: DollarSign, color: '#00b894', bg: '#f0fdf9', change: change('revenue') },
    { label: 'Total Expenses', value: peso(totalPurchases), icon: CreditCard, color: '#e74c3c', bg: '#fef2f2', change: change('expense') },
    { label: 'Contacts', value: stats.totalContacts || '—', icon: Users, color: '#3498db', bg: '#eff6ff', change: null },
    { label: 'Products', value: stats.totalProducts || '—', icon: Boxes, color: '#f39c12', bg: '#fffbeb', change: null },
  ]

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Dashboard</h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Welcome back, here is your financial overview.</p>
        </div>
        <span className="badge bg-light text-dark border">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
      </div>
      {error && <div className="alert alert-danger py-2" style={{ fontSize: '0.85rem' }}>Could not load invoices and bills: {error}</div>}

      {/* Stats */}
      <div className="row g-3 mb-4">
        {statCards.map((s, i) => (
          <div key={i} className="col-6 col-lg-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}><s.icon size={20} /></div>
              <div className="stat-value">{s.value}</div>
              <div className="d-flex align-items-center flex-wrap gap-1 column-gap-2">
                <span className="stat-label">{s.label}</span>
                {s.change && (
                  <span title={s.change.period} style={{ fontSize: '0.75rem', color: s.change.up ? '#00b894' : '#e74c3c' }} className="d-flex align-items-center gap-1">
                    {s.change.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {s.change.text} <span className="text-muted">{s.change.period}</span>
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Revenue vs Expenses</h6>
              <div className="d-flex gap-3" style={{ fontSize: '0.75rem' }}>
                <span className="d-flex align-items-center gap-1"><span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, background: '#00b894' }} /> Revenue</span>
                <span className="d-flex align-items-center gap-1"><span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, background: '#e74c3c' }} /> Expenses</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00b894" stopOpacity={0.15}/><stop offset="95%" stopColor="#00b894" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e74c3c" stopOpacity={0.15}/><stop offset="95%" stopColor="#e74c3c" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v/1000}k`} />
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#00b894" strokeWidth={2} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expense" stroke="#e74c3c" strokeWidth={2} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card p-4">
            <h6 className="fw-bold mb-3">Income Distribution</h6>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="d-flex justify-content-center gap-4 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="d-flex align-items-center gap-2" style={{ fontSize: '0.8rem' }}>
                  <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, background: d.color }} />
                  <span>{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card p-4">
            <h6 className="fw-bold mb-3">Recent Sales</h6>
            {stats.recentSales?.length ? stats.recentSales.slice(0, 5).map((s, i) => (
              <div key={i} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                <div>
                  <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{s.number}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{s.date ? new Date(s.date).toLocaleDateString() : '—'}{s.customer?.name ? ` · ${s.customer.name}` : ''}</div>
                </div>
                <span className="fw-bold" style={{ fontSize: '0.85rem' }}>₱{parseFloat(s.amount || 0).toLocaleString()}</span>
              </div>
            )) : <p className="text-muted text-center py-3">No recent sales</p>}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card p-4">
            <h6 className="fw-bold mb-3">Upcoming Events</h6>
            {stats.upcomingEvents?.length ? stats.upcomingEvents.map((e, i) => (
              <div key={i} className="d-flex gap-3 align-items-start py-2" style={{ borderBottom: i < stats.upcomingEvents.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div className="rounded p-2" style={{ background: '#f0fdf9' }}><Calendar size={16} color="#00b894" /></div>
                <div>
                  <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{e.title}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{e.start_time ? new Date(e.start_time).toLocaleString() : '—'}</div>
                </div>
              </div>
            )) : <p className="text-muted text-center py-3">No upcoming events</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
