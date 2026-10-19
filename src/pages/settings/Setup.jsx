import { useState, useEffect } from 'react'
import { Card, Form, Button, Row, Col, Badge, Accordion, Tab, Tabs, Alert, Table, Modal } from 'react-bootstrap'
import { Save, Plus, Pencil, Trash2, Building2, Landmark, Receipt, Globe, Bell, Shield, FileText, Tag, CreditCard, Briefcase, Hash } from 'lucide-react'
import { load, save } from '../../lib/store/db.js'

const Setup = () => {
  const [activeTab, setActiveTab] = useState('company')
  const [saved, setSaved] = useState(false)

  // Company Profile
  const [company, setCompany] = useState(() => load('setup_company', () => ({
    name: 'FinancePro Inc.',
    legalName: 'FinancePro Accounting Solutions Inc.',
    taxId: '12-3456789',
    registrationNumber: 'REG-2026-001',
    address: '500 Finance Avenue',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'USA',
    phone: '+1-555-0199',
    email: 'admin@financepro.com',
    website: 'https://financepro.com',
    currency: 'PHP',
    fiscalYearStart: '01-01',
    timezone: 'Asia/Manila',
    baseLanguage: 'en',
  })))
  useEffect(() => { save('setup_company', company) }, [company])

  // Chart of Accounts
  const [accounts, setAccounts] = useState(() => load('setup_accounts', () => [
    { id: 1, code: '1000', name: 'Cash', type: 'Asset', balance: 245800.50 },
    { id: 2, code: '1100', name: 'Accounts Receivable', type: 'Asset', balance: 12500.00 },
    { id: 3, code: '1200', name: 'Inventory', type: 'Asset', balance: 8500.00 },
    { id: 4, code: '1500', name: 'Fixed Assets', type: 'Asset', balance: 933000.00 },
    { id: 5, code: '2000', name: 'Accounts Payable', type: 'Liability', balance: 18450.00 },
    { id: 6, code: '2100', name: 'Salaries Payable', type: 'Liability', balance: 28500.00 },
    { id: 7, code: '3000', name: 'Equity', type: 'Equity', balance: 1224850.50 },
    { id: 8, code: '4000', name: 'Revenue', type: 'Revenue', balance: 11648.83 },
    { id: 9, code: '5000', name: 'Cost of Goods Sold', type: 'Expense', balance: 3500.00 },
    { id: 10, code: '6000', name: 'Rent Expense', type: 'Expense', balance: 4500.00 },
    { id: 11, code: '6100', name: 'Salaries Expense', type: 'Expense', balance: 28500.00 },
    { id: 12, code: '6200', name: 'Depreciation Expense', type: 'Expense', balance: 1200.00 },
  ]))
  useEffect(() => { save('setup_accounts', accounts) }, [accounts])
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [accountForm, setAccountForm] = useState({ code: '', name: '', type: 'Asset', balance: '' })

  // Bank Accounts
  const [banks, setBanks] = useState(() => load('setup_banks', () => [
    { id: 1, name: 'Chase Business Checking', accountNumber: '****4521', bankName: 'Chase Bank', currency: 'USD', balance: 245800.50, active: true },
    { id: 2, name: 'Amex Business Platinum', accountNumber: '****8823', bankName: 'American Express', currency: 'USD', balance: 18420.75, active: true },
    { id: 3, name: 'Wells Fargo Savings', accountNumber: '****9912', bankName: 'Wells Fargo', currency: 'USD', balance: 125000.00, active: true },
    { id: 4, name: 'PayPal Business', accountNumber: '****3344', bankName: 'PayPal', currency: 'USD', balance: 8520.00, active: false },
  ]))
  useEffect(() => { save('setup_banks', banks) }, [banks])
  const [showBankModal, setShowBankModal] = useState(false)
  const [editingBank, setEditingBank] = useState(null)
  const [bankForm, setBankForm] = useState({ name: '', accountNumber: '', bankName: '', currency: 'USD', balance: '', active: true })

  // Tax Rates
  const [taxRates, setTaxRates] = useState(() => load('setup_taxes', () => [
    { id: 1, name: 'VAT Standard', rate: 20, type: 'VAT', country: 'UK', active: true },
    { id: 2, name: 'Sales Tax - NY', rate: 8.875, type: 'Sales Tax', country: 'USA', active: true },
    { id: 3, name: 'GST', rate: 10, type: 'GST', country: 'Australia', active: true },
    { id: 4, name: 'Zero Rated', rate: 0, type: 'VAT', country: 'All', active: true },
  ]))
  useEffect(() => { save('setup_taxes', taxRates) }, [taxRates])
  const [showTaxModal, setShowTaxModal] = useState(false)
  const [editingTax, setEditingTax] = useState(null)
  const [taxForm, setTaxForm] = useState({ name: '', rate: '', type: 'VAT', country: '', active: true })

  // Payment Terms
  const [paymentTerms, setPaymentTerms] = useState(() => load('setup_terms', () => [
    { id: 1, name: 'Due on Receipt', days: 0, description: 'Payment due immediately' },
    { id: 2, name: 'Net 15', days: 15, description: 'Payment due within 15 days' },
    { id: 3, name: 'Net 30', days: 30, description: 'Payment due within 30 days' },
    { id: 4, name: 'Net 60', days: 60, description: 'Payment due within 60 days' },
    { id: 5, name: 'Net 90', days: 90, description: 'Payment due within 90 days' },
  ]))
  useEffect(() => { save('setup_terms', paymentTerms) }, [paymentTerms])
  const [showTermModal, setShowTermModal] = useState(false)
  const [editingTerm, setEditingTerm] = useState(null)
  const [termForm, setTermForm] = useState({ name: '', days: '', description: '' })

  // System Settings
  const [system, setSystem] = useState(() => load('setup_system', () => ({
    autoNumbering: true,
    invoicePrefix: 'INV',
    poPrefix: 'PO',
    journalPrefix: 'JE',
    decimalPlaces: 2,
    dateFormat: 'MM/DD/YYYY',
    allowNegativeInventory: false,
    enableAuditLog: true,
    twoFactorAuth: false,
    emailNotifications: true,
    autoBackup: true,
  })))
  useEffect(() => { save('setup_system', system) }, [system])

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // Account CRUD
  const handleAccountSubmit = (e) => {
    e.preventDefault()
    const payload = { ...accountForm, balance: parseFloat(accountForm.balance) || 0 }
    if (editingAccount) {
      setAccounts(prev => prev.map(a => a.id === editingAccount.id ? { ...a, ...payload } : a))
    } else {
      setAccounts(prev => [...prev, { id: Date.now(), ...payload }])
    }
    setShowAccountModal(false)
    setEditingAccount(null)
    setAccountForm({ code: '', name: '', type: 'Asset', balance: '' })
  }
  const handleEditAccount = (a) => { setEditingAccount(a); setAccountForm({ code: a.code, name: a.name, type: a.type, balance: a.balance }); setShowAccountModal(true) }
  const handleDeleteAccount = (id) => { if (confirm('Delete this account?')) setAccounts(prev => prev.filter(a => a.id !== id)) }

  // Bank CRUD
  const handleBankSubmit = (e) => {
    e.preventDefault()
    const payload = { ...bankForm, balance: parseFloat(bankForm.balance) || 0 }
    if (editingBank) {
      setBanks(prev => prev.map(b => b.id === editingBank.id ? { ...b, ...payload } : b))
    } else {
      setBanks(prev => [...prev, { id: Date.now(), ...payload }])
    }
    setShowBankModal(false)
    setEditingBank(null)
    setBankForm({ name: '', accountNumber: '', bankName: '', currency: 'USD', balance: '', active: true })
  }
  const handleEditBank = (b) => { setEditingBank(b); setBankForm({ name: b.name, accountNumber: b.accountNumber, bankName: b.bankName, currency: b.currency, balance: b.balance, active: b.active }); setShowBankModal(true) }
  const handleDeleteBank = (id) => { if (confirm('Delete this bank account?')) setBanks(prev => prev.filter(b => b.id !== id)) }

  // Tax CRUD
  const handleTaxSubmit = (e) => {
    e.preventDefault()
    const payload = { ...taxForm, rate: parseFloat(taxForm.rate) || 0 }
    if (editingTax) {
      setTaxRates(prev => prev.map(t => t.id === editingTax.id ? { ...t, ...payload } : t))
    } else {
      setTaxRates(prev => [...prev, { id: Date.now(), ...payload }])
    }
    setShowTaxModal(false)
    setEditingTax(null)
    setTaxForm({ name: '', rate: '', type: 'VAT', country: '', active: true })
  }
  const handleEditTax = (t) => { setEditingTax(t); setTaxForm({ name: t.name, rate: t.rate, type: t.type, country: t.country, active: t.active }); setShowTaxModal(true) }
  const handleDeleteTax = (id) => { if (confirm('Delete this tax rate?')) setTaxRates(prev => prev.filter(t => t.id !== id)) }

  // Term CRUD
  const handleTermSubmit = (e) => {
    e.preventDefault()
    const payload = { ...termForm, days: parseInt(termForm.days) || 0 }
    if (editingTerm) {
      setPaymentTerms(prev => prev.map(t => t.id === editingTerm.id ? { ...t, ...payload } : t))
    } else {
      setPaymentTerms(prev => [...prev, { id: Date.now(), ...payload }])
    }
    setShowTermModal(false)
    setEditingTerm(null)
    setTermForm({ name: '', days: '', description: '' })
  }
  const handleEditTerm = (t) => { setEditingTerm(t); setTermForm({ name: t.name, days: t.days, description: t.description }); setShowTermModal(true) }
  const handleDeleteTerm = (id) => { if (confirm('Delete this payment term?')) setPaymentTerms(prev => prev.filter(t => t.id !== id)) }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Setup</h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Configure your company profile, chart of accounts, and system preferences.</p>
        </div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={handleSave}>
          <Save size={16} /> Save Changes
        </Button>
      </div>

      {saved && (
        <Alert variant="success" className="mb-4" onClose={() => setSaved(false)} dismissible>
          Settings saved successfully!
        </Alert>
      )}

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="company" title={<span className="d-flex align-items-center gap-2"><Building2 size={14} /> Company</span>}>
          <Card className="border-0 shadow-sm p-4">
            <h6 className="fw-bold mb-4 d-flex align-items-center gap-2"><Building2 size={16} /> Company Profile</h6>
            <Row className="g-3">
              <Col md={6}><Form.Group><Form.Label>Company Name</Form.Label><Form.Control value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Legal Name</Form.Label><Form.Control value={company.legalName} onChange={e => setCompany({ ...company, legalName: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Tax ID / EIN</Form.Label><Form.Control value={company.taxId} onChange={e => setCompany({ ...company, taxId: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Registration Number</Form.Label><Form.Control value={company.registrationNumber} onChange={e => setCompany({ ...company, registrationNumber: e.target.value })} /></Form.Group></Col>
              <Col md={12}><Form.Group><Form.Label>Address</Form.Label><Form.Control value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })} /></Form.Group></Col>
              <Col md={4}><Form.Group><Form.Label>City</Form.Label><Form.Control value={company.city} onChange={e => setCompany({ ...company, city: e.target.value })} /></Form.Group></Col>
              <Col md={4}><Form.Group><Form.Label>State / Province</Form.Label><Form.Control value={company.state} onChange={e => setCompany({ ...company, state: e.target.value })} /></Form.Group></Col>
              <Col md={4}><Form.Group><Form.Label>ZIP / Postal</Form.Label><Form.Control value={company.zip} onChange={e => setCompany({ ...company, zip: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Country</Form.Label><Form.Select value={company.country} onChange={e => setCompany({ ...company, country: e.target.value })}><option>USA</option><option>UK</option><option>Germany</option><option>France</option><option>Canada</option><option>Australia</option></Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Base Currency</Form.Label><Form.Select value={company.currency} onChange={e => setCompany({ ...company, currency: e.target.value })}><option>PHP</option><option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option><option>AUD</option></Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Phone</Form.Label><Form.Control value={company.phone} onChange={e => setCompany({ ...company, phone: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Email</Form.Label><Form.Control type="email" value={company.email} onChange={e => setCompany({ ...company, email: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Website</Form.Label><Form.Control value={company.website} onChange={e => setCompany({ ...company, website: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Timezone</Form.Label><Form.Select value={company.timezone} onChange={e => setCompany({ ...company, timezone: e.target.value })}><option>Asia/Manila</option><option>America/New_York</option><option>America/Chicago</option><option>America/Los_Angeles</option><option>Europe/London</option><option>Europe/Berlin</option><option>Asia/Tokyo</option></Form.Select></Form.Group></Col>
            </Row>
          </Card>
        </Tab>

        <Tab eventKey="accounts" title={<span className="d-flex align-items-center gap-2"><Landmark size={14} /> Chart of Accounts</span>}>
          <Card className="border-0 shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-2"><Landmark size={16} /> Chart of Accounts</h6>
              <Button className="btn-accent d-flex align-items-center gap-2" size="sm" onClick={() => { setEditingAccount(null); setAccountForm({ code: '', name: '', type: 'Asset', balance: '' }); setShowAccountModal(true) }}>
                <Plus size={14} /> Add Account
              </Button>
            </div>
            <Table responsive hover className="mb-0">
              <thead><tr><th>Code</th><th>Account Name</th><th>Type</th><th className="text-end">Balance</th><th style={{ width: 100 }}>Actions</th></tr></thead>
              <tbody>
                {accounts.map(a => (
                  <tr key={a.id}>
                    <td className="fw-semibold font-monospace">{a.code}</td>
                    <td className="fw-medium">{a.name}</td>
                    <td><Badge bg={a.type === 'Asset' ? 'success' : a.type === 'Liability' ? 'danger' : a.type === 'Equity' ? 'info' : a.type === 'Revenue' ? 'primary' : 'warning'} text={a.type === 'Expense' ? 'dark' : undefined}>{a.type}</Badge></td>
                    <td className="text-end fw-semibold">₱{a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>
                      <Button variant="link" className="p-1" onClick={() => handleEditAccount(a)}><Pencil size={14} /></Button>
                      <Button variant="link" className="p-1 text-danger" onClick={() => handleDeleteAccount(a.id)}><Trash2 size={14} /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </Tab>

        <Tab eventKey="banks" title={<span className="d-flex align-items-center gap-2"><CreditCard size={14} /> Bank Accounts</span>}>
          <Card className="border-0 shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-2"><CreditCard size={16} /> Bank Accounts</h6>
              <Button className="btn-accent d-flex align-items-center gap-2" size="sm" onClick={() => { setEditingBank(null); setBankForm({ name: '', accountNumber: '', bankName: '', currency: 'USD', balance: '', active: true }); setShowBankModal(true) }}>
                <Plus size={14} /> Add Bank
              </Button>
            </div>
            <Row className="g-3">
              {banks.map(b => (
                <Col md={6} key={b.id}>
                  <Card className="p-3 border" style={{ borderLeft: `4px solid ${b.active ? '#00b894' : '#cbd5e1'}` }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-bold">{b.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{b.bankName} • {b.accountNumber} • {b.currency}</div>
                        <div className="fw-bold mt-2" style={{ fontSize: '1.1rem', color: b.active ? '#1e3a5f' : '#718096' }}>₱{b.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="d-flex gap-1">
                        <Button variant="link" className="p-1" onClick={() => handleEditBank(b)}><Pencil size={14} /></Button>
                        <Button variant="link" className="p-1 text-danger" onClick={() => handleDeleteBank(b.id)}><Trash2 size={14} /></Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Form.Check type="switch" label="Active" checked={b.active} onChange={() => setBanks(prev => prev.map(x => x.id === b.id ? { ...x, active: !x.active } : x))} />
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Tab>

        <Tab eventKey="taxes" title={<span className="d-flex align-items-center gap-2"><Receipt size={14} /> Tax Rates</span>}>
          <Card className="border-0 shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-2"><Receipt size={16} /> Tax Rates</h6>
              <Button className="btn-accent d-flex align-items-center gap-2" size="sm" onClick={() => { setEditingTax(null); setTaxForm({ name: '', rate: '', type: 'VAT', country: '', active: true }); setShowTaxModal(true) }}>
                <Plus size={14} /> Add Tax Rate
              </Button>
            </div>
            <Table responsive hover className="mb-0">
              <thead><tr><th>Name</th><th>Rate</th><th>Type</th><th>Country</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {taxRates.map(t => (
                  <tr key={t.id}>
                    <td className="fw-medium">{t.name}</td>
                    <td className="fw-bold">{t.rate}%</td>
                    <td><Badge bg="light" text="dark" className="border">{t.type}</Badge></td>
                    <td>{t.country}</td>
                    <td><Badge bg={t.active ? 'success' : 'secondary'}>{t.active ? 'Active' : 'Inactive'}</Badge></td>
                    <td>
                      <Button variant="link" className="p-1" onClick={() => handleEditTax(t)}><Pencil size={14} /></Button>
                      <Button variant="link" className="p-1 text-danger" onClick={() => handleDeleteTax(t.id)}><Trash2 size={14} /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </Tab>

        <Tab eventKey="terms" title={<span className="d-flex align-items-center gap-2"><FileText size={14} /> Payment Terms</span>}>
          <Card className="border-0 shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-2"><FileText size={16} /> Payment Terms</h6>
              <Button className="btn-accent d-flex align-items-center gap-2" size="sm" onClick={() => { setEditingTerm(null); setTermForm({ name: '', days: '', description: '' }); setShowTermModal(true) }}>
                <Plus size={14} /> Add Term
              </Button>
            </div>
            <Table responsive hover className="mb-0">
              <thead><tr><th>Name</th><th>Days</th><th>Description</th><th>Actions</th></tr></thead>
              <tbody>
                {paymentTerms.map(t => (
                  <tr key={t.id}>
                    <td className="fw-medium">{t.name}</td>
                    <td><Badge bg="primary">{t.days}</Badge></td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>{t.description}</td>
                    <td>
                      <Button variant="link" className="p-1" onClick={() => handleEditTerm(t)}><Pencil size={14} /></Button>
                      <Button variant="link" className="p-1 text-danger" onClick={() => handleDeleteTerm(t.id)}><Trash2 size={14} /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </Tab>

        <Tab eventKey="system" title={<span className="d-flex align-items-center gap-2"><Shield size={14} /> System</span>}>
          <Card className="border-0 shadow-sm p-4">
            <h6 className="fw-bold mb-4 d-flex align-items-center gap-2"><Shield size={16} /> System Settings</h6>
            <Row className="g-3">
              <Col md={6}><Form.Group><Form.Label>Invoice Number Prefix</Form.Label><Form.Control value={system.invoicePrefix} onChange={e => setSystem({ ...system, invoicePrefix: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Purchase Order Prefix</Form.Label><Form.Control value={system.poPrefix} onChange={e => setSystem({ ...system, poPrefix: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Journal Entry Prefix</Form.Label><Form.Control value={system.journalPrefix} onChange={e => setSystem({ ...system, journalPrefix: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Decimal Places</Form.Label><Form.Select value={system.decimalPlaces} onChange={e => setSystem({ ...system, decimalPlaces: parseInt(e.target.value) })}><option>0</option><option>2</option><option>3</option><option>4</option></Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Date Format</Form.Label><Form.Select value={system.dateFormat} onChange={e => setSystem({ ...system, dateFormat: e.target.value })}><option>MM/DD/YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></Form.Select></Form.Group></Col>
              <Col md={12}><hr className="my-2" /></Col>
              <Col md={6}><Form.Check type="switch" label="Auto-numbering for documents" checked={system.autoNumbering} onChange={e => setSystem({ ...system, autoNumbering: e.target.checked })} /></Col>
              <Col md={6}><Form.Check type="switch" label="Allow negative inventory" checked={system.allowNegativeInventory} onChange={e => setSystem({ ...system, allowNegativeInventory: e.target.checked })} /></Col>
              <Col md={6}><Form.Check type="switch" label="Enable audit log" checked={system.enableAuditLog} onChange={e => setSystem({ ...system, enableAuditLog: e.target.checked })} /></Col>
              <Col md={6}><Form.Check type="switch" label="Two-factor authentication" checked={system.twoFactorAuth} onChange={e => setSystem({ ...system, twoFactorAuth: e.target.checked })} /></Col>
              <Col md={6}><Form.Check type="switch" label="Email notifications" checked={system.emailNotifications} onChange={e => setSystem({ ...system, emailNotifications: e.target.checked })} /></Col>
              <Col md={6}><Form.Check type="switch" label="Automatic daily backup" checked={system.autoBackup} onChange={e => setSystem({ ...system, autoBackup: e.target.checked })} /></Col>
            </Row>
          </Card>
        </Tab>
      </Tabs>

      {/* Account Modal */}
      <Modal show={showAccountModal} onHide={() => setShowAccountModal(false)} centered>
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editingAccount ? 'Edit Account' : 'Add Account'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAccountSubmit}>
            <div className="row g-3">
              <Col md={6}><Form.Group><Form.Label>Account Code</Form.Label><Form.Control required value={accountForm.code} onChange={e => setAccountForm({ ...accountForm, code: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Account Type</Form.Label><Form.Select value={accountForm.type} onChange={e => setAccountForm({ ...accountForm, type: e.target.value })}><option>Asset</option><option>Liability</option><option>Equity</option><option>Revenue</option><option>Expense</option></Form.Select></Form.Group></Col>
              <Col md={12}><Form.Group><Form.Label>Account Name</Form.Label><Form.Control required value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Opening Balance</Form.Label><Form.Control type="number" step="0.01" value={accountForm.balance} onChange={e => setAccountForm({ ...accountForm, balance: e.target.value })} /></Form.Group></Col>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={() => setShowAccountModal(false)}>Cancel</Button>
              <Button type="submit" className="btn-accent">{editingAccount ? 'Update' : 'Add'}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Bank Modal */}
      <Modal show={showBankModal} onHide={() => setShowBankModal(false)} centered>
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editingBank ? 'Edit Bank Account' : 'Add Bank Account'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleBankSubmit}>
            <div className="row g-3">
              <Col md={6}><Form.Group><Form.Label>Account Name</Form.Label><Form.Control required value={bankForm.name} onChange={e => setBankForm({ ...bankForm, name: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Bank Name</Form.Label><Form.Control required value={bankForm.bankName} onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Account Number</Form.Label><Form.Control required value={bankForm.accountNumber} onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Currency</Form.Label><Form.Select value={bankForm.currency} onChange={e => setBankForm({ ...bankForm, currency: e.target.value })}><option>PHP</option><option>USD</option><option>EUR</option><option>GBP</option></Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Balance</Form.Label><Form.Control type="number" step="0.01" value={bankForm.balance} onChange={e => setBankForm({ ...bankForm, balance: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Check type="switch" label="Active" className="mt-4" checked={bankForm.active} onChange={e => setBankForm({ ...bankForm, active: e.target.checked })} /></Form.Group></Col>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={() => setShowBankModal(false)}>Cancel</Button>
              <Button type="submit" className="btn-accent">{editingBank ? 'Update' : 'Add'}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Tax Modal */}
      <Modal show={showTaxModal} onHide={() => setShowTaxModal(false)} centered>
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editingTax ? 'Edit Tax Rate' : 'Add Tax Rate'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleTaxSubmit}>
            <div className="row g-3">
              <Col md={6}><Form.Group><Form.Label>Name</Form.Label><Form.Control required value={taxForm.name} onChange={e => setTaxForm({ ...taxForm, name: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Rate (%)</Form.Label><Form.Control type="number" step="0.01" required value={taxForm.rate} onChange={e => setTaxForm({ ...taxForm, rate: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Type</Form.Label><Form.Select value={taxForm.type} onChange={e => setTaxForm({ ...taxForm, type: e.target.value })}><option>VAT</option><option>Sales Tax</option><option>GST</option><option>Other</option></Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Country</Form.Label><Form.Control value={taxForm.country} onChange={e => setTaxForm({ ...taxForm, country: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Check type="switch" label="Active" className="mt-4" checked={taxForm.active} onChange={e => setTaxForm({ ...taxForm, active: e.target.checked })} /></Form.Group></Col>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={() => setShowTaxModal(false)}>Cancel</Button>
              <Button type="submit" className="btn-accent">{editingTax ? 'Update' : 'Add'}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Term Modal */}
      <Modal show={showTermModal} onHide={() => setShowTermModal(false)} centered>
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editingTerm ? 'Edit Payment Term' : 'Add Payment Term'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleTermSubmit}>
            <div className="row g-3">
              <Col md={6}><Form.Group><Form.Label>Name</Form.Label><Form.Control required value={termForm.name} onChange={e => setTermForm({ ...termForm, name: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Days</Form.Label><Form.Control type="number" required value={termForm.days} onChange={e => setTermForm({ ...termForm, days: e.target.value })} /></Form.Group></Col>
              <Col md={12}><Form.Group><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={2} value={termForm.description} onChange={e => setTermForm({ ...termForm, description: e.target.value })} /></Form.Group></Col>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={() => setShowTermModal(false)}>Cancel</Button>
              <Button type="submit" className="btn-accent">{editingTerm ? 'Update' : 'Add'}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default Setup
