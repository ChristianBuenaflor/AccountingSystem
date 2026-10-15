import { useState, useEffect } from 'react'
import { Card, Form, Button, Row, Col, Alert, Badge, Tabs, Tab, Modal } from 'react-bootstrap'
import { Save, User, Lock, Bell, Globe, Shield, Eye, EyeOff, Trash2, Camera } from 'lucide-react'
import { load, save } from '../../lib/store/db.js'

const AccountSettings = () => {
  const [saved, setSaved] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [profile, setProfile] = useState(() => load('account_profile', () => ({
    firstName: 'James',
    lastName: 'Wilson',
    email: 'j.wilson@financepro.com',
    phone: '+1-555-1001',
    jobTitle: 'Chief Financial Officer',
    department: 'Finance',
    bio: 'Experienced finance professional with 15+ years in corporate accounting and financial planning.',
    language: 'en',
    timezone: 'America/New_York',
    avatar: null,
  })))
  useEffect(() => { save('account_profile', profile) }, [profile])

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  const [notifications, setNotifications] = useState(() => load('account_notifications', () => ({
    emailInvoices: true,
    emailPayments: true,
    emailReports: true,
    emailSystem: true,
    pushInvoices: false,
    pushPayments: true,
    pushReports: false,
    pushSystem: true,
    digestWeekly: true,
    digestDaily: false,
  })))
  useEffect(() => { save('account_notifications', notifications) }, [notifications])

  const [security, setSecurity] = useState(() => load('account_security', () => ({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    lastPasswordChange: '2026-08-15',
    activeSessions: [
      { device: 'Chrome on macOS', location: 'New York, USA', ip: '192.168.1.45', current: true, lastActive: 'Just now' },
      { device: 'Safari on iPhone', location: 'New York, USA', ip: '192.168.1.102', current: false, lastActive: '2 hours ago' },
    ],
  })))
  useEffect(() => { save('account_security', security) }, [security])

  const handleProfileSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePasswordChange = (e) => {
    e.preventDefault()
    if (password.new !== password.confirm) {
      alert('New passwords do not match')
      return
    }
    setPassword({ current: '', new: '', confirm: '' })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setProfile(prev => ({ ...prev, avatar: reader.result }))
      reader.readAsDataURL(file)
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Account Settings</h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage your personal profile, security, and preferences.</p>
        </div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={handleProfileSave}>
          <Save size={16} /> Save Changes
        </Button>
      </div>

      {saved && (
        <Alert variant="success" className="mb-4" onClose={() => setSaved(false)} dismissible>
          Settings saved successfully!
        </Alert>
      )}

      <Row>
        <Col lg={3} className="mb-4">
          <Card className="border-0 shadow-sm p-4 text-center">
            <div className="position-relative d-inline-block mx-auto mb-3">
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto" style={{ width: 100, height: 100, fontSize: '2rem', fontWeight: 700, overflow: 'hidden' }}>
                {profile.avatar ? <img src={profile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : `${profile.firstName[0]}${profile.lastName[0]}`}
              </div>
              <label className="position-absolute bottom-0 end-0 bg-white rounded-circle p-1 shadow-sm" style={{ cursor: 'pointer' }}>
                <Camera size={14} />
                <input type="file" accept="image/*" className="d-none" onChange={handleAvatarChange} />
              </label>
            </div>
            <h6 className="fw-bold mb-1">{profile.firstName} {profile.lastName}</h6>
            <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>{profile.jobTitle}</p>
            <Badge bg="success" className="mb-3">Active</Badge>
            <div className="text-start" style={{ fontSize: '0.8rem' }}>
              <div className="text-muted mb-1">Member since</div>
              <div className="fw-medium mb-2">January 2020</div>
              <div className="text-muted mb-1">Last login</div>
              <div className="fw-medium">Just now</div>
            </div>
          </Card>
        </Col>

        <Col lg={9}>
          <Tabs defaultActiveKey="profile" className="mb-4">
            <Tab eventKey="profile" title={<span className="d-flex align-items-center gap-2"><User size={14} /> Profile</span>}>
              <Card className="border-0 shadow-sm p-4">
                <h6 className="fw-bold mb-4">Personal Information</h6>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>First Name</Form.Label>
                      <Form.Control value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Email</Form.Label>
                      <Form.Control type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Phone</Form.Label>
                      <Form.Control value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Job Title</Form.Label>
                      <Form.Control value={profile.jobTitle} onChange={e => setProfile({ ...profile, jobTitle: e.target.value })} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Department</Form.Label>
                      <Form.Select value={profile.department} onChange={e => setProfile({ ...profile, department: e.target.value })}>
                        <option>Finance</option>
                        <option>Accounting</option>
                        <option>Sales</option>
                        <option>HR</option>
                        <option>IT</option>
                        <option>Operations</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Bio</Form.Label>
                      <Form.Control as="textarea" rows={3} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} />
                    </Form.Group>
                  </Col>
                </Row>

                <hr className="my-4" />
                <h6 className="fw-bold mb-4">Regional Preferences</h6>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Language</Form.Label>
                      <Form.Select value={profile.language} onChange={e => setProfile({ ...profile, language: e.target.value })}>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="zh">Chinese</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Timezone</Form.Label>
                      <Form.Select value={profile.timezone} onChange={e => setProfile({ ...profile, timezone: e.target.value })}>
                        <option>America/New_York</option>
                        <option>America/Chicago</option>
                        <option>America/Los_Angeles</option>
                        <option>Europe/London</option>
                        <option>Europe/Berlin</option>
                        <option>Asia/Tokyo</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card>
            </Tab>

            <Tab eventKey="security" title={<span className="d-flex align-items-center gap-2"><Lock size={14} /> Security</span>}>
              <Card className="border-0 shadow-sm p-4 mb-4">
                <h6 className="fw-bold mb-4">Change Password</h6>
                <Form onSubmit={handlePasswordChange}>
                  <Row className="g-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Current Password</Form.Label>
                        <div className="position-relative">
                          <Form.Control type={showCurrentPassword ? 'text' : 'password'} required value={password.current} onChange={e => setPassword({ ...password, current: e.target.value })} />
                          <Button variant="link" className="position-absolute end-0 top-50 translate-middle-y p-1 me-2" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>New Password</Form.Label>
                        <div className="position-relative">
                          <Form.Control type={showNewPassword ? 'text' : 'password'} required value={password.new} onChange={e => setPassword({ ...password, new: e.target.value })} />
                          <Button variant="link" className="position-absolute end-0 top-50 translate-middle-y p-1 me-2" onClick={() => setShowNewPassword(!showNewPassword)}>
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Confirm New Password</Form.Label>
                        <Form.Control type="password" required value={password.confirm} onChange={e => setPassword({ ...password, confirm: e.target.value })} />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="d-flex justify-content-end mt-3">
                    <Button type="submit" className="btn-accent">Update Password</Button>
                  </div>
                </Form>
              </Card>

              <Card className="border-0 shadow-sm p-4 mb-4">
                <h6 className="fw-bold mb-4 d-flex align-items-center gap-2"><Shield size={16} /> Active Sessions</h6>
                {security.activeSessions.map((s, i) => (
                  <div key={i} className="d-flex justify-content-between align-items-center py-3" style={{ borderBottom: i < security.activeSessions.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded p-2" style={{ background: s.current ? '#f0fdf9' : '#f8fafc' }}>
                        <Globe size={16} color={s.current ? '#00b894' : '#718096'} />
                      </div>
                      <div>
                        <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{s.device} {s.current && <Badge bg="success" style={{ fontSize: '0.65rem' }}>Current</Badge>}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{s.location} • {s.ip} • {s.lastActive}</div>
                      </div>
                    </div>
                    {!s.current && (
                      <Button variant="outline-danger" size="sm">Revoke</Button>
                    )}
                  </div>
                ))}
              </Card>

              <Card className="border-0 shadow-sm p-4 border-danger">
                <h6 className="fw-bold mb-3 text-danger d-flex align-items-center gap-2"><Trash2 size={16} /> Danger Zone</h6>
                <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>Permanently delete your account and all associated data. This action cannot be undone.</p>
                <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)}>Delete Account</Button>
              </Card>
            </Tab>

            <Tab eventKey="notifications" title={<span className="d-flex align-items-center gap-2"><Bell size={14} /> Notifications</span>}>
              <Card className="border-0 shadow-sm p-4">
                <h6 className="fw-bold mb-4">Email Notifications</h6>
                <div className="d-flex flex-column gap-3 mb-4">
                  <Form.Check type="switch" label="Invoice created / updated" checked={notifications.emailInvoices} onChange={e => setNotifications({ ...notifications, emailInvoices: e.target.checked })} />
                  <Form.Check type="switch" label="Payment received / overdue" checked={notifications.emailPayments} onChange={e => setNotifications({ ...notifications, emailPayments: e.target.checked })} />
                  <Form.Check type="switch" label="Reports generated" checked={notifications.emailReports} onChange={e => setNotifications({ ...notifications, emailReports: e.target.checked })} />
                  <Form.Check type="switch" label="System alerts and maintenance" checked={notifications.emailSystem} onChange={e => setNotifications({ ...notifications, emailSystem: e.target.checked })} />
                </div>
                <hr className="my-4" />
                <h6 className="fw-bold mb-4">Push Notifications</h6>
                <div className="d-flex flex-column gap-3 mb-4">
                  <Form.Check type="switch" label="Invoice created / updated" checked={notifications.pushInvoices} onChange={e => setNotifications({ ...notifications, pushInvoices: e.target.checked })} />
                  <Form.Check type="switch" label="Payment received / overdue" checked={notifications.pushPayments} onChange={e => setNotifications({ ...notifications, pushPayments: e.target.checked })} />
                  <Form.Check type="switch" label="Reports generated" checked={notifications.pushReports} onChange={e => setNotifications({ ...notifications, pushReports: e.target.checked })} />
                  <Form.Check type="switch" label="System alerts and maintenance" checked={notifications.pushSystem} onChange={e => setNotifications({ ...notifications, pushSystem: e.target.checked })} />
                </div>
                <hr className="my-4" />
                <h6 className="fw-bold mb-4">Digest Emails</h6>
                <div className="d-flex flex-column gap-3">
                  <Form.Check type="switch" label="Weekly summary digest" checked={notifications.digestWeekly} onChange={e => setNotifications({ ...notifications, digestWeekly: e.target.checked })} />
                  <Form.Check type="switch" label="Daily activity digest" checked={notifications.digestDaily} onChange={e => setNotifications({ ...notifications, digestDaily: e.target.checked })} />
                </div>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title className="fw-bold text-danger">Delete Account</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="mb-3">Are you sure you want to permanently delete your account? All your data will be erased and this action cannot be undone.</p>
          <Form.Group>
            <Form.Label>Type <strong>DELETE</strong> to confirm</Form.Label>
            <Form.Control />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger">Permanently Delete</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default AccountSettings
