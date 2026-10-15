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

const Dashboard = () => {
  const { rows: sales } = useCollection('sales', seeds.sales)
  const { rows: purchases } = useCollection('purchases', seeds.purchases)
  const { rows: contacts } = useCollection('contacts', seeds.contacts)
  const { rows: products } = useCollection('products', seeds.products)
  const { rows: events } = useCollection('events', seeds.events)

  const totalSales = sales.reduce((s, r) => s + (parseFloat(r.total_amount) || 0), 0)
  const totalPurchases = purchases.reduce((s, r) => s + (parseFloat(r.total_amount) || 0), 0)
  const stats = {
    totalSales, totalPurchases,
    totalContacts: contacts.length, totalProducts: products.length,
    recentSales: [...sales].reverse().slice(0, 5),
    upcomingEvents: events.slice(0, 5),
  }

  const chartData = [
    { name: 'Jan', revenue: 42000, expense: 28000 },
    { name: 'Feb', revenue: 38000, expense: 25000 },
    { name: 'Mar', revenue: 55000, expense: 32000 },
    { name: 'Apr', revenue: 48000, expense: 29000 },
    { name: 'May', revenue: 62000, expense: 34000 },
    { name: 'Jun', revenue: 58000, expense: 31000 },
  ]

  const pieData = [
    { name: 'Revenue', value: totalSales || 65, color: '#00b894' },
    { name: 'Expenses', value: totalPurchases || 35, color: '#e74c3c' },
  ]

  const statCards = [
    { label: 'Total Revenue', value: `$${totalSales.toLocaleString()}`, icon: DollarSign, color: '#00b894', bg: '#f0fdf9', change: '+12.5%' },
    { label: 'Total Expenses', value: `$${totalPurchases.toLocaleString()}`, icon: CreditCard, color: '#e74c3c', bg: '#fef2f2', change: '-3.2%' },
    { label: 'Contacts', value: stats.totalContacts || '—', icon: Users, color: '#3498db', bg: '#eff6ff', change: '+5.1%' },
    { label: 'Products', value: stats.totalProducts || '—', icon: Boxes, color: '#f39c12', bg: '#fffbeb', change: '+8.7%' },
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

      {/* Stats */}
      <div className="row g-3 mb-4">
        {statCards.map((s, i) => (
          <div key={i} className="col-md-6 col-lg-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}><s.icon size={20} /></div>
              <div className="stat-value">{s.value}</div>
              <div className="d-flex align-items-center gap-2">
                <span className="stat-label">{s.label}</span>
                <span style={{ fontSize: '0.75rem', color: s.change.startsWith('+') ? '#00b894' : '#e74c3c' }} className="d-flex align-items-center gap-1">
                  {s.change.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {s.change}
                </span>
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
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
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
                  <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{s.invoice_number}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{s.date ? new Date(s.date).toLocaleDateString() : '—'}</div>
                </div>
                <span className="fw-bold" style={{ fontSize: '0.85rem' }}>${parseFloat(s.total_amount || 0).toLocaleString()}</span>
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
