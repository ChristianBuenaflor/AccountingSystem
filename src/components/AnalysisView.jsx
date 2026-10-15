import { useEffect, useState } from 'react'
import { Accordion, Alert, Badge, Table } from 'react-bootstrap'
import { toolsApi } from '../lib/api/alphalist'

// Renders DatAnalyzer::analyze() output: issues, schedule totals and per-line field mapping.
export default function AnalysisView({ analysis }) {
  const [layouts, setLayouts] = useState({})
  useEffect(() => { toolsApi.spec().then(setLayouts).catch(() => {}) }, [])
  const { issues = [], summary = {}, parsed } = analysis
  const errors = issues.filter((i) => i.level === 'error').length
  const warnings = issues.length - errors

  return (
    <>
      <div className="fp-card p-3 mb-3">
        <div className="d-flex gap-2 align-items-center flex-wrap">
          {!issues.length && <Badge bg="success">Structure OK</Badge>}
          {errors > 0 && <Badge bg="danger">{errors} error(s)</Badge>}
          {warnings > 0 && <Badge bg="warning" text="dark">{warnings} warning(s)</Badge>}
          {summary.form && (
            <span className="fp-sub">
              Form <strong>{summary.form}</strong> · Agent TIN {summary.agent_tin}-{summary.agent_branch} · Period {summary.return_period} ·{' '}
              {summary.line_count} line(s) · {parsed.line_ending} · {parsed.encoding}
            </span>
          )}
        </div>
        {issues.map((i, n) => (
          <Alert key={n} variant={i.level === 'error' ? 'danger' : 'warning'} className="py-1 mt-2 mb-0">
            {i.line ? `Line ${i.line}: ` : ''}{i.message}
          </Alert>
        ))}
      </div>

      {summary.schedules && (
        <div className="fp-card mb-3">
          <Table responsive className="mb-0">
            <thead><tr><th>Schedule</th><th>Lines</th><th>Totals</th></tr></thead>
            <tbody>
              {Object.entries(summary.schedules).map(([k, s]) => (
                <tr key={k}>
                  <td><code>{k}</code> {s.title}</td><td>{s.rows}</td>
                  <td>{Object.entries(s.totals).map(([f, v]) => <span key={f} className="me-3"><span className="fp-sub">{f}</span> <code>{v}</code></span>)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <h5>Field mapping</h5>
      <Accordion defaultActiveKey="0" alwaysOpen>
        {parsed.lines.map((line, idx) => {
          const L = layouts[line.key]
          const defs = L ? [...L.fields, ...(L.optional || [])] : []
          return (
            <Accordion.Item eventKey={String(idx)} key={line.number}>
              <Accordion.Header>Line {line.number}&nbsp;<code>{line.key}</code>&nbsp;<span className="fp-sub">{line.title ?? 'unknown record type'}</span></Accordion.Header>
              <Accordion.Body className="p-0">
                <Table size="sm" className="mb-0">
                  <thead><tr><th>#</th><th>Field</th><th>Value</th></tr></thead>
                  <tbody>
                    {line.columns.map((v, i) => (
                      <tr key={i}><td>{i + 1}</td><td>{defs[i]?.[2] ?? 'unmapped'} {defs[i] && <code className="fp-sub">{defs[i][0]}</code>}</td><td><code>{v === '' ? '(empty)' : v}</code></td></tr>
                    ))}
                  </tbody>
                </Table>
              </Accordion.Body>
            </Accordion.Item>
          )
        })}
      </Accordion>
    </>
  )
}
