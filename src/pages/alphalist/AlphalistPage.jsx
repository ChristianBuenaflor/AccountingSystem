import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Form, Modal, Spinner, Table } from 'react-bootstrap'
import { alphalistApi } from '../../lib/api/alphalist'
import { errorMessage } from '../../lib/api/client'
import PageHeader from '../../components/PageHeader'
import { agentName, pad4, refreshAlphalist } from '../../components/AgentPicker'
import { Loading, LoadError, SkeletonRows } from '../../components/Loading'
import { confirmDialog } from '../../lib/confirm'
import { toast } from '../../lib/toast'
import useLoad from '../../lib/useLoad'

/** Explorer-like popup over the server's own drives (the browser cannot see full C:\ paths). */
function FolderBrowser({ onPick, onClose }) {
  const [cur, setCur] = useState({ loading: true })
  const go = async (dir) => {
    setCur((c) => ({ ...c, loading: true, error: null }))
    try {
      setCur({ data: await alphalistApi.browse(dir) })
    } catch (e) {
      setCur({ error: errorMessage(e) })
    }
  }
  useEffect(() => { go(undefined) }, [])
  const d = cur.data

  return (
    <Modal show onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">Browse folders on this PC</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {cur.loading && <Loading className="mb-3" />}
        {cur.error && (
          <Alert variant="danger" className="mb-0">
            {cur.error}
            <div className="mt-2"><Button size="sm" variant="light" onClick={() => go(undefined)}>Back to This PC</Button></div>
          </Alert>
        )}
        {d && (
          <>
            <div className="d-flex gap-2 align-items-center flex-wrap mb-3">
              <Button size="sm" variant="light" onClick={() => go(undefined)}>This PC</Button>
              {d.parent && <Button size="sm" variant="light" onClick={() => go(d.parent)}>Up</Button>}
              <strong className="ms-1">{d.path || 'This PC'}</strong>
            </div>
            {!d.path && (
              <div className="d-flex gap-2 flex-wrap mb-3">
                {d.drives.map((drive) => (
                  <Button key={drive} size="sm" variant="light" onClick={() => go(drive)}>{drive}</Button>
                ))}
                {d.desktop && <Button size="sm" variant="light" onClick={() => go(d.desktop)}>Desktop</Button>}
              </div>
            )}
            {d.note && <Alert variant="warning">{d.note}</Alert>}
            {d.path && d.dirs.length === 0 && !d.note && <div className="fp-sub">No subfolders.</div>}
            {d.dirs.length > 0 && (
              <Table hover responsive className="mb-0 align-middle">
                <tbody>
                  {d.dirs.map((dir) => (
                    <tr key={dir.path}>
                      <td>
                        <Button size="sm" variant="link" className="p-0 text-start" onClick={() => go(dir.path)}>{dir.name}</Button>
                        {dir.hasAlphalist && <Badge bg="success" className="ms-2">Alphalist here</Badge>}
                      </td>
                      <td className="text-end">
                        <Button size="sm" variant="light" onClick={() => onPick(dir.path)}>Choose</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button size="sm" variant="light" onClick={onClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default function AlphalistPage() {
  const { data: d, loading, error: loadError, reload } = useLoad(() => alphalistApi.overview(), [])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('') // which action is waiting: 'restore:<name>' | 'remove' | 'check' | 'upload'
  const fail = (e) => setError(errorMessage(e))
  // Alphalist changed: this page and the top bar's badge both look again.
  const changed = () => { reload(); refreshAlphalist() }
  const act = async (what, fn) => {
    setBusy(what); setError('')
    try { await fn() } catch (e) { fail(e) } finally { setBusy('') }
  }

  const restore = async (name) => {
    if (!await confirmDialog(`Restore Alphalist's data from ${name}? This replaces its current data.`, { ok: 'Restore', variant: 'danger' })) return
    act(`restore:${name}`, async () => { await alphalistApi.restore(name); toast(`Restored Alphalist's data from ${name}.`); changed() })
  }
  const s = d?.status

  // Alphalist holds one withholding agent; removing it (and its lines there) lets another agent be sent.
  const removeAgent = async () => {
    if (!await confirmDialog(`Remove ${s.agent.name} (${s.agent.tin}-${pad4(s.agent.branch_code)}) from BIR Alphalist, with all its lines there? A backup is taken first, so it can be restored.`, { ok: 'Remove agent', variant: 'danger' })) return
    act('remove', async () => { const r = await alphalistApi.removeAgent(); toast(r.message); changed() })
  }

  // Choose the Alphalist folder when it was not found (Desktop, moved install...).
  const [choosing, setChoosing] = useState(false)
  const [folder, setFolder] = useState('')
  const [saving, setSaving] = useState(false)
  const openChooser = () => { setFolder(s?.path || 'C:\\BIRALPHA74'); setChoosing(true) }
  const saveFolder = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await alphalistApi.setPath(folder)
      toast(`Using Alphalist folder ${folder}.`)
      setChoosing(false)
      changed()
    } catch (err) { fail(err) }
    finally { setSaving(false) }
  }

  // Explorer-like folder browser (server-side: the browser cannot see full C:\ paths).
  const [browsing, setBrowsing] = useState(false)

  // Upload a .DAT into Alphalist: preview what it would do, then confirm.
  const [file, setFile] = useState(null)
  const [plan, setPlan] = useState(null)
  const previewUpload = (e) => {
    e.preventDefault(); setPlan(null)
    act('check', async () => setPlan(await alphalistApi.uploadPreview(file)))
  }
  const doUpload = () => act('upload', async () => {
    const r = await alphalistApi.upload(file)
    toast(`${r.message} In Alphalist: ${r.open_in_alphalist}.`)
    setPlan(null); setFile(null); changed()
  })
  const spin = (what) => busy === what && <Spinner size="sm" aria-hidden />

  return (
    <>
      <PageHeader title="BIR Alphalist" sub="Connection to the Alphalist Data Entry program on this PC, its backups, and send history.">
        <Button variant="light" size="sm" disabled={loading} onClick={changed}>{loading && d && <Spinner size="sm" aria-hidden />} Check again</Button>
      </PageHeader>
      <LoadError error={loadError} onRetry={reload} />
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {!d && loading && <div className="fp-card p-3 mb-3"><Loading text="Looking for BIR Alphalist on this PC…" /></div>}
      {s && (
        <div className="fp-card p-3 mb-3">
          <div className="d-flex gap-3 align-items-center flex-wrap">
            <strong className="text-break">{s.path}</strong>
            <Badge bg={s.found ? 'success' : 'danger'}>{s.found ? 'Found' : 'Not found'}</Badge>
            {!s.found && !choosing && <Button size="sm" className="btn-fp" onClick={openChooser}>Choose folder…</Button>}
            {s.found && <Badge bg={s.locked ? 'warning' : 'secondary'} text={s.locked ? 'dark' : undefined}>{s.locked ? 'Open (locked)' : 'Closed'}</Badge>}
            {s.agent && <span className="fp-sub">Registered agent: <strong>{s.agent.name ?? s.agent.tin}</strong> ({s.agent.tin}-{pad4(s.agent.branch_code)})</span>}
            {s.agent && <Button size="sm" variant="outline-danger" disabled={s.locked || !!busy} onClick={removeAgent}>{spin('remove')} Remove agent from Alphalist</Button>}
          </div>
          {s.error && <Alert variant="warning" className="mt-3 mb-0">{s.error}</Alert>}
          {!s.found && choosing && (
            <Form onSubmit={saveFolder} className="mt-3">
              <Form.Label htmlFor="alphalist-folder" className="small fw-semibold">Alphalist folder on this PC</Form.Label>
              <div className="d-flex gap-2 flex-wrap">
                <Form.Control id="alphalist-folder" value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="C:\BIRALPHA74" disabled={saving} style={{ maxWidth: 420 }} aria-describedby="alphalist-folder-help" />
                <Button variant="light" size="sm" disabled={saving} onClick={() => setBrowsing(true)}>Browse…</Button>
                <Button type="submit" className="btn-fp" size="sm" disabled={saving || !folder.trim()}>{saving && <Spinner size="sm" aria-hidden />} Use this folder</Button>
                <Button variant="light" size="sm" disabled={saving} onClick={() => setChoosing(false)}>Cancel</Button>
              </div>
              <div id="alphalist-folder-help" className="fp-sub mt-2">Example: <code>C:\BIRALPHA74</code> or <code>C:\Users\you\Desktop\BIRALPHA74</code>. Checked before anything is saved.</div>
            </Form>
          )}
        </div>
      )}
      {browsing && (
        <FolderBrowser
          onPick={(path) => { setFolder(path); setBrowsing(false) }}
          onClose={() => setBrowsing(false)}
        />
      )}
      <h5 className="mt-4">Upload a DAT into Alphalist</h5>
      <div className="fp-card p-3 mb-3">
        <Form onSubmit={previewUpload} className="d-flex gap-3 align-items-end flex-wrap">
          <Form.Group controlId="alphalist-upload">
            <Form.Label className="small fw-semibold">QAP 1601-EQ / 1601-FQ, 1604-F or 1604-E file</Form.Label>
            <Form.Control type="file" accept=".dat,.DAT" onChange={(e) => { setFile(e.target.files[0] || null); setPlan(null) }} />
          </Form.Group>
          <Button type="submit" variant="light" disabled={!file || !!busy}>{spin('check')} Check file</Button>
        </Form>
        <div className="fp-sub mt-2">Only that agent, form and period are replaced in Alphalist; its other data is kept. A backup is taken first.</div>
        {plan && (
          <Alert variant={plan.can_upload ? 'info' : 'danger'} className="mt-3 mb-0">
            <div><strong>{plan.form_type}</strong> · period {plan.return_period} · {plan.withholding_agent.display_name} ({plan.withholding_agent.tin}-{plan.withholding_agent.branch_code})</div>
            <div>Adds {plan.lines_to_add} line(s) ({Object.entries(plan.lines_by_schedule).map(([k, v]) => `${k}: ${v}`).join(', ')}), replaces {plan.lines_to_replace} older line(s).</div>
            {plan.agent_action === 'register' && <div>The agent will be registered in Alphalist.</div>}
            {plan.agent_action === 'conflict' && <div>Alphalist is registered to another agent ({plan.registered_agent?.name}); upload is blocked.</div>}
            {plan.warnings?.length > 0 && <ul className="mb-0">{plan.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}
            {plan.can_upload && <Button variant="dark" size="sm" className="mt-2" disabled={!!busy} onClick={doUpload}>{spin('upload')} Upload into Alphalist</Button>}
          </Alert>
        )}
      </div>

      <h5 className="mt-4">Backups</h5>
      <div className="fp-card mb-4">
        <Table responsive className="mb-0 align-middle fp-stack" aria-busy={loading}>
          <thead><tr><th>Backup</th><th>Created</th><th className="fp-actions"><span className="visually-hidden">Actions</span></th></tr></thead>
          <tbody>
            {!d && loading && <SkeletonRows cols={3} />}
            {d && !d.backups.length && <tr><td colSpan={3} className="fp-empty">No backups yet.</td></tr>}
            {d?.backups.map((b) => (
              <tr key={b.name}><td className="text-break">{b.name}</td><td className="text-nowrap">{new Date(b.created * 1000).toLocaleString()}</td>
                <td className="fp-actions"><Button size="sm" variant="outline-danger" disabled={!!busy} onClick={() => restore(b.name)}>{spin(`restore:${b.name}`)} Restore</Button></td></tr>
            ))}
          </tbody>
        </Table>
      </div>
      <h5>Send history</h5>
      <div className="fp-card">
        <Table responsive className="mb-0 align-middle fp-stack" aria-busy={loading}>
          <thead><tr><th>When</th><th>Agent</th><th>Form</th><th className="fp-hide-narrow">Period</th><th className="fp-num">Added</th><th className="fp-num">Replaced</th></tr></thead>
          <tbody>
            {!d && loading && <SkeletonRows cols={6} hide={[3]} />}
            {d && !d.syncs.length && <tr><td colSpan={6} className="fp-empty">Nothing sent yet.</td></tr>}
            {d?.syncs.map((x) => (
              <tr key={x.id}>
                <td className="text-nowrap">{new Date(x.created_at).toLocaleString()}</td><td className="fp-name">{x.agent ? agentName(x.agent) : ''}</td><td>{x.form_type}</td>
                <td className="fp-hide-narrow text-nowrap">{String(x.return_period).slice(0, 10)}</td><td className="fp-num">{x.rows_added}</td><td className="fp-num">{x.rows_replaced}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  )
}
