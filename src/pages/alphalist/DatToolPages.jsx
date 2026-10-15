import { useState } from 'react'
import { useEffect } from 'react'
import { Alert, Badge, Button, Form, Table } from 'react-bootstrap'
import { toolsApi } from '../../lib/api/alphalist'
import { errorMessage } from '../../lib/api/client'
import AnalysisView from '../../components/AnalysisView'
import PageHeader from '../../components/PageHeader'

const pick = (set) => (e) => set(e.target.files[0] || null)

export function AnalyzePage() {
  const [file, setFile] = useState(null)
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  const run = async (e) => {
    e.preventDefault(); setErr(''); setRes(null)
    try { setRes(await toolsApi.analyze(file)) } catch (x) { setErr(errorMessage(x)) }
  }
  return (
    <>
      <PageHeader title="Analyze a DAT file" sub="Open any Alphalist .DAT. Each column is mapped to its field and the file is checked: control totals, sequence numbers, TIN/branch formats, line endings and file name." />
      <Form onSubmit={run} className="fp-card p-3 mb-3 d-flex gap-3 align-items-end flex-wrap">
        <div><Form.Label className="small fw-semibold">.DAT file</Form.Label><Form.Control type="file" accept=".dat,.DAT,.txt" onChange={pick(setFile)} /></div>
        <Button type="submit" className="btn-fp" disabled={!file}>Analyze</Button>
      </Form>
      {err && <Alert variant="danger">{err}</Alert>}
      {res && <><h5>{res.filename}</h5><AnalysisView analysis={res.analysis} /></>}
    </>
  )
}

export function ComparePage() {
  const [expected, setExpected] = useState(null)
  const [actual, setActual] = useState(null)
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  const run = async (e) => {
    e.preventDefault(); setErr(''); setRes(null)
    try { setRes(await toolsApi.compare(expected, actual)) } catch (x) { setErr(errorMessage(x)) }
  }
  return (
    <>
      <PageHeader title="Compare two DAT files" sub="Key the same data into BIR Alphalist and into this system, generate a DAT from each, then upload both. Any difference is shown per line and per field." />
      <Form onSubmit={run} className="fp-card p-3 mb-3 d-flex gap-3 align-items-end flex-wrap">
        <div><Form.Label className="small fw-semibold">Expected (from BIR Alphalist)</Form.Label><Form.Control type="file" onChange={pick(setExpected)} /></div>
        <div><Form.Label className="small fw-semibold">Actual (from this system)</Form.Label><Form.Control type="file" onChange={pick(setActual)} /></div>
        <Button type="submit" className="btn-fp" disabled={!expected || !actual}>Compare</Button>
      </Form>
      {err && <Alert variant="danger">{err}</Alert>}
      {res && (
        <>
          <div className="fp-card p-3 mb-3">
            {res.byte_identical ? <Badge bg="success">Byte-for-byte identical</Badge>
              : res.identical ? <Badge bg="warning" text="dark">Same content, different bytes</Badge>
              : <Badge bg="danger">Files differ</Badge>}
            {res.notes?.length > 0 && <ul className="mb-0 mt-2">{res.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
          </div>
          <div className="fp-card">
            <Table responsive className="mb-0">
              <thead><tr><th>Line</th><th>Result</th><th>Details</th></tr></thead>
              <tbody>
                {res.lines.map((l) => (
                  <tr key={l.number}>
                    <td>{l.number}</td>
                    <td><Badge bg={l.same ? 'success' : 'danger'}>{l.same ? 'same' : 'differs'}</Badge></td>
                    <td style={{ wordBreak: 'break-all' }}>
                      {l.same ? <code>{l.expected}</code>
                        : l.expected === null ? <>Extra line: <code>{l.actual}</code></>
                        : l.actual === null ? <>Missing line: <code>{l.expected}</code></>
                        : l.diffs.map((d, i) => <div key={i}><strong>{d.field}</strong>: expected <code>{d.expected ?? '(none)'}</code>, got <code>{d.actual ?? '(none)'}</code></div>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </>
  )
}

export function SpecPage() {
  const [layouts, setLayouts] = useState(null)
  useEffect(() => { toolsApi.spec().then(setLayouts).catch(() => setLayouts({})) }, [])
  return (
    <>
      <PageHeader title="DAT format specification" sub="Record layouts taken from the FoxPro code inside BIR Alphalist Data Entry v7.4. Comma separated, every line ends with CR LF, Windows-1252." />
      <div className="fp-card p-3 mb-3 small">
        <strong>Rendering rules</strong>
        <ul className="mb-0">
          <li><code>name</code>: trimmed, with <code>"</code> <code>,</code> <code>'</code> removed, wrapped in double quotes; empty name is written as nothing.</li>
          <li><code>text</code>: trimmed the same way, no quotes (TIN, ATC, status code). <code>branch</code>: 4 digits zero padded.</li>
          <li><code>amount</code>: 2 decimals, no thousands separator. <code>int</code>: plain whole number (sequence 1..n per schedule).</li>
          <li>A control line (C1, C4…) follows its schedule's detail lines and carries their totals.</li>
          <li>File names: QAP <code>{'{TIN}{BRANCH}{MM}{YYYY}1601FQ.DAT'}</code>, annual <code>{'{TIN}{BRANCH}1231{YYYY}1604F.DAT'}</code>.</li>
        </ul>
      </div>
      {layouts && Object.entries(layouts).map(([key, L]) => (
        <div key={key} className="mb-4">
          <h5><code>{key}</code> {L.title}</h5>
          <div className="fp-card">
            <Table responsive size="sm" className="mb-0">
              <thead><tr><th>#</th><th>Field</th><th>Type</th><th>Description</th></tr></thead>
              <tbody>
                {[...L.fields, ...(L.optional || [])].map(([name, type, label], i) => (
                  <tr key={i}><td>{i + 1}</td><td><code>{name}</code></td><td>{type}</td><td>{label} {i >= L.fields.length && <Badge bg="secondary">optional</Badge>}</td></tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      ))}
    </>
  )
}
