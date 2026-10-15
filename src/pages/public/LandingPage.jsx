import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3, Shield, Zap, Globe, TrendingUp, Users,
  ArrowRight, CheckCircle2, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const features = [
    { icon: BarChart3, title: 'Real-time Analytics', desc: 'Track your financial health with live dashboards and custom reports.' },
    { icon: Shield, title: 'Bank-grade Security', desc: 'Enterprise-level encryption and compliance built into every transaction.' },
    { icon: Zap, title: 'Automation', desc: 'Automate invoices, reconciliations, and recurring journal entries.' },
    { icon: Globe, title: 'Multi-currency', desc: 'Handle transactions in 150+ currencies with automatic exchange rates.' },
    { icon: TrendingUp, title: 'Growth Insights', desc: 'AI-powered forecasting to help you plan and scale confidently.' },
    { icon: Users, title: 'Team Collaboration', desc: 'Unlimited users with role-based access for your entire organization.' },
  ]

  const testimonials = [
    { name: 'Sarah Mitchell', role: 'CFO, TechVentures', text: 'FinancePro cut our month-end close from 10 days to 3 days. Incredible platform.' },
    { name: 'James Rodriguez', role: 'Finance Director, BuildCorp', text: 'The automation features alone saved us 40 hours per week across the team.' },
    { name: 'Amanda Chen', role: 'Controller, RetailMax', text: 'Cleanest accounting interface I have ever used. My team adopted it instantly.' },
  ]

  return (
    <div style={{ overflowX: 'hidden' }}>
      {/* Navbar */}
      <nav className="position-absolute w-100 top-0 start-0 z-3" style={{ padding: '1rem 2rem' }}>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <div className="sidebar-brand-icon">FP</div>
            <span className="fw-bold text-white fs-5">FinancePro</span>
          </div>
          <div className="d-none d-md-flex align-items-center gap-4">
            <a href="#features" className="text-white text-decoration-none opacity-75">Features</a>
            <a href="#testimonials" className="text-white text-decoration-none opacity-75">Testimonials</a>
            <a href="#pricing" className="text-white text-decoration-none opacity-75">Pricing</a>
            <Link to="/login" className="btn btn-accent px-4">Get Started</Link>
          </div>
          <button className="btn btn-link text-white d-md-none" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="d-md-none mt-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <a href="#features" className="d-block text-white text-decoration-none py-2">Features</a>
            <a href="#testimonials" className="d-block text-white text-decoration-none py-2">Testimonials</a>
            <a href="#pricing" className="d-block text-white text-decoration-none py-2">Pricing</a>
            <Link to="/login" className="btn btn-accent w-100 mt-2">Get Started</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="container position-relative z-1">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-4" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="badge bg-accent rounded-pill" style={{ background: '#00b894' }}>New</span>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>AI-powered forecasting is now live</span>
                </div>
                <h1 className="hero-title">Modern Accounting for Growing Businesses</h1>
                <p className="hero-subtitle">Streamline your finance operations with an all-in-one platform for accounting, invoicing, payroll, and compliance.</p>
                <div className="d-flex gap-3 flex-wrap">
                  <Link to="/login" className="btn btn-accent btn-lg px-4">Start Free Trial <ArrowRight size={18} className="ms-2" /></Link>
                  <button className="btn btn-outline-light btn-lg px-4">Watch Demo</button>
                </div>
                <div className="d-flex gap-4 mt-5">
                  <div>
                    <div className="fw-bold fs-4">10k+</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Active Companies</div>
                  </div>
                  <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
                  <div>
                    <div className="fw-bold fs-4">$2B+</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Transactions Processed</div>
                  </div>
                  <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
                  <div>
                    <div className="fw-bold fs-4">99.9%</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Uptime SLA</div>
                  </div>
                </div>
              </motion.div>
            </div>
            <div className="col-lg-6 d-none d-lg-block">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
                <div className="position-relative" style={{ padding: '2rem' }}>
                  <div className="card p-4" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20 }}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <span className="text-white fw-semibold">Revenue Overview</span>
                      <span className="badge bg-success">+12.5%</span>
                    </div>
                    <div className="d-flex align-items-end gap-2 mb-2" style={{ height: 160 }}>
                      {[40,65,45,80,55,90,70,85,60,75,95,80].map((h,i) => (
                        <div key={i} className="rounded-top" style={{ flex: 1, height: `${h}%`, background: i===10 ? '#00b894' : 'rgba(255,255,255,0.15)', borderRadius: '4px 4px 0 0' }} />
                      ))}
                    </div>
                    <div className="d-flex justify-content-between text-white-50" style={{ fontSize: '0.7rem' }}>
                      <span>Jan</span><span>Mar</span><span>Jun</span><span>Sep</span><span>Dec</span>
                    </div>
                  </div>
                  <div className="card p-3 position-absolute" style={{ width: 200, top: -20, right: -10, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }}>
                    <div className="text-white-50 mb-1" style={{ fontSize: '0.75rem' }}>Total Sales</div>
                    <div className="text-white fw-bold fs-5">$482,390</div>
                    <div className="text-success mt-1" style={{ fontSize: '0.75rem' }}>+8.2% vs last month</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="py-5 bg-white border-bottom">
        <div className="container text-center">
          <p className="text-muted mb-4" style={{ fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>Trusted by leading finance teams</p>
          <div className="d-flex justify-content-center gap-5 flex-wrap opacity-50">
            {['Stripe', 'Shopify', 'Notion', 'Figma', 'Slack', 'Vercel'].map(name => (
              <span key={name} className="fw-bold text-dark" style={{ fontSize: '1.2rem' }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-5 bg-white">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-2" style={{ fontSize: '2.2rem' }}>Everything you need to run finance</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: 500 }}>One platform for your entire accounting lifecycle — from invoicing to reconciliation.</p>
          </div>
          <div className="row g-4">
            {features.map((f, i) => (
              <div key={i} className="col-md-6 col-lg-4">
                <motion.div whileHover={{ y: -4 }} className="card h-100 p-4">
                  <div className="stat-icon" style={{ background: '#f0fdf9', color: '#00b894' }}>
                    <f.icon size={20} />
                  </div>
                  <h5 className="fw-bold mb-2">{f.title}</h5>
                  <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>{f.desc}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-5" style={{ background: '#f8fafc' }}>
        <div className="container py-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <h2 className="fw-bold mb-3" style={{ fontSize: '2.2rem' }}>A dashboard that actually makes sense</h2>
              <p className="text-muted mb-4">No clutter. No confusion. Just the metrics that matter, updated in real-time so you can make decisions faster.</p>
              <div className="d-flex flex-column gap-3">
                {['Cash flow forecasting', 'Automated bank feeds', 'Multi-entity consolidation', 'Custom report builder'].map(item => (
                  <div key={item} className="d-flex align-items-center gap-3">
                    <CheckCircle2 size={20} className="text-success" />
                    <span className="fw-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card p-4 shadow-sm">
                <div className="d-flex justify-content-between mb-4">
                  <h6 className="fw-bold mb-0">Financial Overview</h6>
                  <span className="badge bg-light text-dark border">This Month</span>
                </div>
                <div className="row g-3 mb-4">
                  {[
                    { label: 'Revenue', value: '$128,450', color: '#00b894' },
                    { label: 'Expenses', value: '$42,120', color: '#e74c3c' },
                    { label: 'Profit', value: '$86,330', color: '#3498db' },
                  ].map(s => (
                    <div key={s.label} className="col-4">
                      <div className="p-3 rounded" style={{ background: `${s.color}08` }}>
                        <div style={{ fontSize: '0.75rem', color: '#718096' }}>{s.label}</div>
                        <div className="fw-bold" style={{ color: s.color }}>{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded" style={{ height: 160, background: '#f8fafc', display: 'flex', alignItems: 'end', gap: 4, padding: '1rem' }}>
                  {[35,55,40,70,50,85,65,75,60,90,70,80].map((h,i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: i===9 ? '#1e3a5f' : '#e2e8f0', borderRadius: 3 }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-5 bg-white">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-2" style={{ fontSize: '2.2rem' }}>Loved by finance teams</h2>
            <p className="text-muted">See why thousands of companies trust FinancePro.</p>
          </div>
          <div className="row g-4">
            {testimonials.map((t, i) => (
              <div key={i} className="col-md-4">
                <div className="card h-100 p-4">
                  <div className="d-flex gap-1 mb-3">
                    {[1,2,3,4,5].map(s => <span key={s} style={{ color: '#f39c12' }}>★</span>)}
                  </div>
                  <p className="mb-4" style={{ fontSize: '0.95rem' }}>"{t.text}"</p>
                  <div className="d-flex align-items-center gap-3 mt-auto">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: 40, height: 40, fontSize: '0.85rem' }}>
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{t.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-5" style={{ background: '#1a2332' }}>
        <div className="container text-center py-5">
          <h2 className="fw-bold text-white mb-3" style={{ fontSize: '2.5rem' }}>Ready to modernize your finance?</h2>
          <p className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 500 }}>Join 10,000+ companies using FinancePro to run smarter, faster accounting.</p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/login" className="btn btn-accent btn-lg px-5">Get Started Free</Link>
            <button className="btn btn-outline-light btn-lg px-4">Talk to Sales</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 border-top" style={{ background: '#f8fafc' }}>
        <div className="container d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-2">
            <div className="sidebar-brand-icon" style={{ width: 28, height: 28, fontSize: '0.8rem' }}>FP</div>
            <span className="fw-bold" style={{ fontSize: '0.9rem' }}>FinancePro</span>
          </div>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>© 2026 FinancePro. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
