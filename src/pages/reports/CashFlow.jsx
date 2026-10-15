import { Card, Row, Col, Badge } from 'react-bootstrap'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowDownRight, ArrowUpRight, DollarSign } from 'lucide-react'

const CashFlow = () => {
  const cashData = [
    { name: 'Operating', inflow: 125000, outflow: 85000 },
    { name: 'Investing', inflow: 5000, outflow: 15000 },
    { name: 'Financing', inflow: 0, outflow: 25000 },
  ]

  const netOperating = 40000
  const netInvesting = -10000
  const netFinancing = -25000
  const totalChange = netOperating + netInvesting + netFinancing

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h3 className="fw-bold mb-1">Cash Flow Statement</h3><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Operating, investing, and financing cash flows.</p></div>
        <Badge bg="light" text="dark" className="border">{new Date().getFullYear()}</Badge>
      </div>
      <Row className="g-3 mb-4">
        <Col md={4}><Card className="p-3 border-0 shadow-sm"><div className="d-flex align-items-center gap-3"><div className="rounded p-2" style={{ background: '#f0fdf9' }}><ArrowUpRight size={20} color="#00b894" /></div><div><div className="text-muted" style={{ fontSize: '0.75rem' }}>Operating</div><div className="fw-bold fs-5">${netOperating.toLocaleString()}</div></div></div></Card></Col>
        <Col md={4}><Card className="p-3 border-0 shadow-sm"><div className="d-flex align-items-center gap-3"><div className="rounded p-2" style={{ background: '#fef2f2' }}><ArrowDownRight size={20} color="#e74c3c" /></div><div><div className="text-muted" style={{ fontSize: '0.75rem' }}>Investing</div><div className="fw-bold fs-5">${netInvesting.toLocaleString()}</div></div></div></Card></Col>
        <Col md={4}><Card className="p-3 border-0 shadow-sm"><div className="d-flex align-items-center gap-3"><div className="rounded p-2" style={{ background: '#fffbeb' }}><DollarSign size={20} color="#f39c12" /></div><div><div className="text-muted" style={{ fontSize: '0.75rem' }}>Net Change</div><div className="fw-bold fs-5">${totalChange.toLocaleString()}</div></div></div></Card></Col>
      </Row>
      <Card className="border-0 shadow-sm p-4 mb-4">
        <h6 className="fw-bold mb-3">Cash Flow by Activity</h6>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={cashData}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={v => `$${v/1000}k`} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} /><Area type="monotone" dataKey="inflow" stroke="#00b894" fill="#00b894" fillOpacity={0.15} /><Area type="monotone" dataKey="outflow" stroke="#e74c3c" fill="#e74c3c" fillOpacity={0.15} /></AreaChart>
        </ResponsiveContainer>
      </Card>
      <Row className="g-4">
        {cashData.map(c => (
          <Col md={4} key={c.name}>
            <Card className="border-0 shadow-sm p-4">
              <h6 className="fw-bold mb-3">{c.name} Activities</h6>
              <div className="d-flex justify-content-between py-2" style={{ borderBottom: '1px solid #f1f5f9' }}><span className="text-muted" style={{ fontSize: '0.85rem' }}>Cash In</span><span className="fw-semibold text-success">${c.inflow.toLocaleString()}</span></div>
              <div className="d-flex justify-content-between py-2" style={{ borderBottom: '1px solid #f1f5f9' }}><span className="text-muted" style={{ fontSize: '0.85rem' }}>Cash Out</span><span className="fw-semibold text-danger">${c.outflow.toLocaleString()}</span></div>
              <div className="d-flex justify-content-between py-2 mt-1"><span className="fw-bold">Net</span><span className={`fw-bold ${(c.inflow - c.outflow) >= 0 ? 'text-success' : 'text-danger'}`}>${(c.inflow - c.outflow).toLocaleString()}</span></div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
export default CashFlow
