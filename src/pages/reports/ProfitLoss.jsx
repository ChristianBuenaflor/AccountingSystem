import { Card, Row, Col, Badge } from 'react-bootstrap'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'
import { buildReports } from '../../lib/store/reports.js'

const ProfitLoss = () => {
  const { rows: sales } = useCollection('sales', seeds.sales)
  const { rows: purchases } = useCollection('purchases', seeds.purchases)
  const { rows: assets } = useCollection('assets', seeds.assets)
  const data = buildReports({ sales, purchases, assets })

  const revenueData = Object.entries(data.revenueByMonth || {}).map(([name, value]) => ({ name, revenue: value, expense: (data.expenseByMonth || {})[name] || 0 })).sort((a, b) => a.name.localeCompare(b.name))
  const netIncome = (data.totalRevenue || 0) - (data.totalExpenses || 0)
  const margin = data.totalRevenue ? ((netIncome / data.totalRevenue) * 100).toFixed(1) : 0

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h3 className="fw-bold mb-1">Profit & Loss</h3><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Income statement and profitability analysis.</p></div>
        <Badge bg="light" text="dark" className="border">{new Date().getFullYear()}</Badge>
      </div>
      <Row className="g-3 mb-4">
        <Col md={4}><Card className="p-3 border-0 shadow-sm"><div className="d-flex align-items-center gap-3"><div className="rounded p-2" style={{ background: '#f0fdf9' }}><DollarSign size={20} color="#00b894" /></div><div><div className="text-muted" style={{ fontSize: '0.75rem' }}>Total Revenue</div><div className="fw-bold fs-5">${data.totalRevenue?.toLocaleString() || 0}</div></div></div></Card></Col>
        <Col md={4}><Card className="p-3 border-0 shadow-sm"><div className="d-flex align-items-center gap-3"><div className="rounded p-2" style={{ background: '#fef2f2' }}><TrendingDown size={20} color="#e74c3c" /></div><div><div className="text-muted" style={{ fontSize: '0.75rem' }}>Total Expenses</div><div className="fw-bold fs-5">${data.totalExpenses?.toLocaleString() || 0}</div></div></div></Card></Col>
        <Col md={4}><Card className="p-3 border-0 shadow-sm"><div className="d-flex align-items-center gap-3"><div className="rounded p-2" style={{ background: '#eff6ff' }}><TrendingUp size={20} color="#3498db" /></div><div><div className="text-muted" style={{ fontSize: '0.75rem' }}>Net Income</div><div className="fw-bold fs-5">${netIncome.toLocaleString()} ({margin}%)</div></div></div></Card></Col>
      </Row>
      <Card className="border-0 shadow-sm p-4 mb-4">
        <h6 className="fw-bold mb-3">Revenue vs Expenses by Month</h6>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={v => `$${v/1000}k`} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} /><Bar dataKey="revenue" fill="#00b894" radius={[6, 6, 0, 0]} /><Bar dataKey="expense" fill="#e74c3c" radius={[6, 6, 0, 0]} /></BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
export default ProfitLoss
