import { Card, Row, Col, Badge } from 'react-bootstrap'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'
import { buildReports } from '../../lib/store/reports.js'

const Reports = () => {
  const { rows: sales } = useCollection('sales', seeds.sales)
  const { rows: purchases } = useCollection('purchases', seeds.purchases)
  const { rows: assets } = useCollection('assets', seeds.assets)
  const data = buildReports({ sales, purchases, assets })

  const revenueChart = Object.entries(data.revenueByMonth || {}).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name))
  const expenseChart = Object.entries(data.expenseByMonth || {}).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name))
  const assetPie = Object.entries(data.assetsByStatus || {}).map(([name, value]) => ({ name, value }))
  const colors = ['#00b894', '#3498db', '#f39c12', '#e74c3c', '#9b59b6']

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Reports</h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Financial summaries and analytics.</p>
        </div>
        <Badge bg="light" text="dark" className="border">{new Date().getFullYear()}</Badge>
      </div>

      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="p-3 border-0 shadow-sm">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded p-2" style={{ background: '#f0fdf9' }}><DollarSign size={20} color="#00b894" /></div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Total Revenue</div>
                <div className="fw-bold fs-5">${data.totalRevenue?.toLocaleString() || 0}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="p-3 border-0 shadow-sm">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded p-2" style={{ background: '#fef2f2' }}><TrendingDown size={20} color="#e74c3c" /></div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Total Expenses</div>
                <div className="fw-bold fs-5">${data.totalExpenses?.toLocaleString() || 0}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="p-3 border-0 shadow-sm">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded p-2" style={{ background: '#eff6ff' }}><TrendingUp size={20} color="#3498db" /></div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Net Income</div>
                <div className="fw-bold fs-5">${((data.totalRevenue || 0) - (data.totalExpenses || 0)).toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="p-3 border-0 shadow-sm">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded p-2" style={{ background: '#fffbeb' }}><BarChart3 size={20} color="#f39c12" /></div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Asset Value</div>
                <div className="fw-bold fs-5">${data.totalAssets?.toLocaleString() || 0}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={6}>
          <Card className="border-0 shadow-sm p-4">
            <h6 className="fw-bold mb-3">Revenue by Month</h6>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `$${v/1000}k`} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#00b894" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="border-0 shadow-sm p-4">
            <h6 className="fw-bold mb-3">Expenses by Month</h6>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `$${v/1000}k`} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#e74c3c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={6}>
          <Card className="border-0 shadow-sm p-4">
            <h6 className="fw-bold mb-3">Assets by Status</h6>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={assetPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {assetPie.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="d-flex justify-content-center gap-3 flex-wrap mt-2">
              {assetPie.map((d, i) => (
                <div key={d.name} className="d-flex align-items-center gap-2" style={{ fontSize: '0.8rem' }}>
                  <span className="d-inline-block rounded-circle" style={{ width: 10, height: 10, background: colors[i % colors.length] }} />
                  <span className="text-capitalize">{d.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="border-0 shadow-sm p-4">
            <h6 className="fw-bold mb-3">Account Balances</h6>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {Object.entries(data.accountBalances || {}).map(([account, balance]) => (
                <div key={account} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <span className="fw-medium" style={{ fontSize: '0.9rem' }}>{account}</span>
                  <span className={balance >= 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold'} style={{ fontSize: '0.9rem' }}>
                    ${balance.toLocaleString()}
                  </span>
                </div>
              ))}
              {Object.keys(data.accountBalances || {}).length === 0 && <p className="text-muted text-center py-4">No account balances available.</p>}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Reports
