import { Alert, Card, Row, Col, Badge } from 'react-bootstrap'
import { DollarSign, Landmark, TrendingUp } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'
import { buildReports } from '../../lib/store/reports.js'
import { forReports, useBooks } from '../../lib/api/useBooks.js'

const BalanceSheet = () => {
  const { invoices, bills, receivable, payable, error } = useBooks()
  const { rows: assets } = useCollection('assets', seeds.assets)
  const data = buildReports({ sales: forReports(invoices), purchases: forReports(bills), assets })

  const totalAssets = data.totalAssets || 0

  const assetItems = [
    { name: 'Cash & Bank', value: 393721.25 },
    { name: 'Accounts Receivable', value: receivable },
    { name: 'Inventory', value: 8500 },
    { name: 'Fixed Assets', value: 933000 },
  ]

  const liabilityItems = [
    { name: 'Accounts Payable', value: payable },
    { name: 'Salaries Payable', value: 28500 },
  ]
  const totalLiabilities = liabilityItems.reduce((s, l) => s + l.value, 0)
  const totalEquity = totalAssets - totalLiabilities

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h3 className="fw-bold mb-1">Balance Sheet</h3><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Assets, liabilities, and equity overview.</p></div>
        <Badge bg="light" text="dark" className="border">{new Date().getFullYear()}</Badge>
      </div>
      {error && <Alert variant="danger" className="py-2" style={{ fontSize: '0.85rem' }}>Could not load invoices and bills: {error}</Alert>}
      <Row className="g-3 mb-4">
        <Col md={4}><Card className="p-3 border-0 shadow-sm"><div className="d-flex align-items-center gap-3"><div className="rounded p-2" style={{ background: '#f0fdf9' }}><Landmark size={20} color="#00b894" /></div><div><div className="text-muted" style={{ fontSize: '0.75rem' }}>Total Assets</div><div className="fw-bold fs-5">₱{totalAssets.toLocaleString()}</div></div></div></Card></Col>
        <Col md={4}><Card className="p-3 border-0 shadow-sm"><div className="d-flex align-items-center gap-3"><div className="rounded p-2" style={{ background: '#fef2f2' }}><DollarSign size={20} color="#e74c3c" /></div><div><div className="text-muted" style={{ fontSize: '0.75rem' }}>Total Liabilities</div><div className="fw-bold fs-5">₱{totalLiabilities.toLocaleString()}</div></div></div></Card></Col>
        <Col md={4}><Card className="p-3 border-0 shadow-sm"><div className="d-flex align-items-center gap-3"><div className="rounded p-2" style={{ background: '#eff6ff' }}><TrendingUp size={20} color="#3498db" /></div><div><div className="text-muted" style={{ fontSize: '0.75rem' }}>Total Equity</div><div className="fw-bold fs-5">₱{totalEquity.toLocaleString()}</div></div></div></Card></Col>
      </Row>
      <Row className="g-4">
        <Col lg={6}>
          <Card className="border-0 shadow-sm p-4">
            <h6 className="fw-bold mb-3">Assets</h6>
            {assetItems.map(a => (
              <div key={a.name} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.9rem' }}>{a.name}</span>
                <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>₱{a.value.toLocaleString()}</span>
              </div>
            ))}
            <div className="d-flex justify-content-between align-items-center py-2 mt-2">
              <span className="fw-bold">Total Assets</span>
              <span className="fw-bold text-success">₱{totalAssets.toLocaleString()}</span>
            </div>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="border-0 shadow-sm p-4">
            <h6 className="fw-bold mb-3">Liabilities & Equity</h6>
            {liabilityItems.map(l => (
              <div key={l.name} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.9rem' }}>{l.name}</span>
                <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>₱{l.value.toLocaleString()}</span>
              </div>
            ))}
            <div className="d-flex justify-content-between align-items-center py-2 mt-2">
              <span className="fw-bold">Total Liabilities</span>
              <span className="fw-bold text-danger">₱{totalLiabilities.toLocaleString()}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center py-2" style={{ borderTop: '2px solid #f1f5f9' }}>
              <span className="fw-bold">Total Equity</span>
              <span className="fw-bold text-primary">₱{totalEquity.toLocaleString()}</span>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
export default BalanceSheet
