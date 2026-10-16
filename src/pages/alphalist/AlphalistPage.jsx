import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Form, Table } from 'react-bootstrap'
import { alphalistApi } from '../../lib/api/alphalist'
import { errorMessage } from '../../lib/api/client'
import PageHeader from '../../components/PageHeader'
import { agentName } from '../../components/AgentPicker'

export default function AlphalistPage() {
  const [d, setD] = useState(null)
  const [msg, setMsg] = useState(null)
  const load = () => alphalistApi.overview().then(setD).catch((e) => setMsg({ variant: 'danger', text: errorMessage(e) }))
  useEffect(() => { load() }, [])

  const restore = async (name) => {
    if (!window.confirm(`Restore Alphalist's data from ${name}? This replaces its current data.`)) return
    try { await alphalistApi.restore(name); setMsg({ variant: 'success', text: `Restored from ${name}.` }); load() }
    catch (e) { setMsg({ variant: 'danger', text: errorMessage(e) }) }
  }
  const s = d?.status

  // Alphalist holds one withholding agent; removing it (and its lines there) lets another agent be sent.
  const removeAgent = async () => {
    if (!window.confirm(`Remove ${s.agent.name} (${s.agent.tin}-${s.agent.branch_code}) from BIR Alphalist, with all its lines there? A backup is taken first, so it can be restored.`)) return
    try { const r = await alphalistApi.removeAgent(); setMsg({ variant: 'success', text: r.message }); load() }
    catch (e) { setMsg({ variant: 'danger', text: errorMessage(e) }) }
  }

  // Choose the Alphalist folder when it was not found (Desktop, moved install...).
  const [choosing, setChoosing] = useState(false)
  const [folder, setFolder] = useState('')
  const [saving, setSaving] = useState(false)
  const openChooser = () => { setFolder(s?.path || 'C:\\BIRALPHA74'); setChoosing(true) }
  const saveFolder = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await alphalistApi.setPath(folder)
      setMsg({ variant: 'success', text: `Using Alphalist folder ${folder}.` })
      setChoosing(false)
      load()
    } catch (err) { setMsg({ variant: 'danger', text: errorMessage(err) }) }
    finally { setSaving(false) }
  }

  // Upload a .DAT into Alphalist: preview what it would do, then confirm.
  const [file, setFile] = useState(null)
  const [plan, setPlan] = useState(null)
  const previewUpload = async (e) => {
    e.preventDefault(); setPlan(null)
    try { setPlan(await alphalistApi.uploadPreview(file)) } catch (err) { setMsg({ variant: 'danger', text: errorMessage(err) }) }
  }
  const doUpload = async () => {
    try {
      const r = await alphalistApi.upload(file)
      setMsg({ variant: 'success', text: `${r.message} In Alphalist: ${r.open_in_alphalist}.` })
      setPlan(null); setFile(null); load()
    } catch (err) { setMsg({ variant: 'danger', text: errorMessage(err) }) }
  }

  return (
    <>
      <PageHeader title="BIR Alphalist" sub="Connection to the Alphalist Data Entry program on this PC, its backups, and send history." />
      {msg && <Alert variant={msg.variant} dismissible onClose={() => setMsg(null)}>{msg.text}</Alert>}
      {s && (
        <div className="fp-card p-3 mb-3">
          <div className="d-flex gap-3 align-items-center flex-wrap">
            <strong>{s.path}</strong>
            <Badge bg={s.found ? 'success' : 'danger'}>{s.found ? 'Found' : 'Not found'}</Badge>
            {!s.found && !choosing && <Button size="sm" className="btn-fp" onClick={openChooser}>Choose folder…</Button>}
            {s.found && <Badge bg={s.locked ? 'warning' : 'secondary'} text={s.locked ? 'dark' : undefined}>{s.locked ? 'Open (locked)' : 'Closed'}</Badge>}
            {s.agent && <span className="fp-sub">Registered agent: {s.agent.name ?? s.agent.tin ?? JSON.stringify(s.agent)} ({s.agent.tin}-{s.agent.branch_code})</span>}
            {s.agent && <Button size="sm" variant="outline-danger" disabled={s.locked} onClick={removeAgent}>Remove agent from Alphalist</Button>}
          </div>
          {s.error && <Alert variant="warning" className="mt-3 mb-0">{s.error}</Alert>}
          {!s.found && choosing && (
            <Form onSubmit={saveFolder} className="mt-3">
              <Form.Label className="small fw-semibold">Alphalist folder on this PC</Form.Label>
              <div className="d-flex gap-2 flex-wrap">
                <Form.Control value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="C:\BIRALPHA74" disabled={saving} style={{ maxWidth: 420 }} />
                <Button type="submit" className="btn-fp" size="sm" disabled={saving || !folder.trim()}>Use this folder</Button>
                <Button variant="light" size="sm" disabled={saving} onClick={() => setChoosing(false)}>Cancel</Button>
              </div>
              <div className="fp-sub mt-2">Example: <code>C:\BIRALPHA74</code> or <code>C:\Users\you\Desktop\BIRALPHA74</code>. Checked before anything is saved.</div>
            </Form>
          )}
        </div>
      )}
      <h5 className="mt-4">Upload a DAT into Alphalist</h5>
      <div className="fp-card p-3 mb-3">
        <Form onSubmit={previewUpload} className="d-flex gap-3 align-items-end flex-wrap">
          <div>
            <Form.Label className="small fw-semibold">QAP 1601-EQ / 1601-FQ, 1604-F or 1604-E file</Form.Label>
            <Form.Control type="file" accept=".dat,.DAT" onChange={(e) => { setFile(e.target.files[0] || null); setPlan(null) }} />
          </div>
          <Button type="submit" variant="light" disabled={!file}>Check file</Button>
        </Form>
        <div className="fp-sub mt-2">Only that agent, form and period are replaced in Alphalist; its other data is kept. A backup is taken first.</div>
        {plan && (
          <Alert variant={plan.can_upload ? 'info' : 'danger'} className="mt-3 mb-0">
            <div><strong>{plan.form_type}</strong> · period {plan.return_period} · {plan.withholding_agent.display_name} ({plan.withholding_agent.tin}-{plan.withholding_agent.branch_code})</div>
            <div>Adds {plan.lines_to_add} line(s) ({Object.entries(plan.lines_by_schedule).map(([k, v]) => `${k}: ${v}`).join(', ')}), replaces {plan.lines_to_replace} older line(s).</div>
            {plan.agent_action === 'register' && <div>The agent will be registered in Alphalist.</div>}
            {plan.agent_action === 'conflict' && <div>Alphalist is registered to another agent ({plan.registered_agent?.name}); upload is blocked.</div>}
            {plan.warnings?.length > 0 && <ul className="mb-0">{plan.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}
            {plan.can_upload && <Button variant="dark" size="sm" className="mt-2" onClick={doUpload}>Upload into Alphalist</Button>}
          </Alert>
        )}
      </div>

      <h5 className="mt-4">Backups</h5>
      <div className="fp-card mb-4">
        <Table responsive className="mb-0 align-middle">
          <thead><tr><th>Backup</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {!d?.backups.length && <tr><td colSpan={3} className="fp-empty">No backups yet.</td></tr>}
            {d?.backups.map((b) => (
              <tr key={b.name}><td>{b.name}</td><td>{new Date(b.created * 1000).toLocaleString()}</td>
                <td><Button size="sm" variant="outline-danger" onClick={() => restore(b.name)}>Restore</Button></td></tr>
            ))}
          </tbody>
        </Table>
      </div>
      <h5>Send history</h5>
      <div className="fp-card">
        <Table responsive className="mb-0">
          <thead><tr><th>When</th><th>Agent</th><th>Form</th><th>Period</th><th>Added</th><th>Replaced</th></tr></thead>
          <tbody>
            {!d?.syncs.length && <tr><td colSpan={6} className="fp-empty">Nothing sent yet.</td></tr>}
            {d?.syncs.map((x) => (
              <tr key={x.id}><td>{new Date(x.created_at).toLocaleString()}</td><td>{x.agent ? agentName(x.agent) : ''}</td><td>{x.form_type}</td><td>{String(x.return_period).slice(0, 10)}</td><td>{x.rows_added}</td><td>{x.rows_replaced}</td></tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  )
}
