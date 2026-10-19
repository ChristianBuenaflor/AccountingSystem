import { useState } from 'react'
import { Alert, Badge, Button, Spinner, Table } from 'react-bootstrap'
import { Download, FileEarmarkText, ShieldCheck, ShieldExclamation } from 'react-bootstrap-icons'
import { validationApi } from '../lib/api/alphalist'
import { errorMessage } from '../lib/api/client'
import { pageOf } from '../lib/pagedLines'
import useLoad from '../lib/useLoad'
import Pager from './Pager'

// A DAT line's values as written: names are the quoted ones (and may hold commas).
const columns = (line) => (String(line ?? '').match(/("[^"]*"|[^,]*)(,|$)/g) ?? []).map((v) => v.replace(/,$/, ''))

// Who a flagged line is about: the payee's TIN and name, from the DAT line itself.
export function whoOf(record, agentTin) {
  if (!record) return ''
  const values = columns(record)
  const tin = values.slice(2).find((v) => /^\d{9}$/.test(v) && v !== agentTin)
  const name = values.filter((v) => /^".+"$/.test(v)).map((v) => v.slice(1, -1)).join(' ')
  return [tin, name].filter(Boolean).join(' · ')
}

/**
 * What BIR's Alphalist Validation module said about a file: passed (with the validated file to download) or
 * its errors, 20 at a time. onDownload('validated' | 'report') fetches the file.
 */
export function ValidationResult({ v, loading, error, agentTin, onDownload, failedText }) {
  const [page, setPage] = useState(1)
  const [working, setWorking] = useState('')
  const [downloadError, setDownloadError] = useState('')
  const download = (file) => {
    setWorking(file); setDownloadError('')
    Promise.resolve(onDownload(file)).catch((e) => setDownloadError(errorMessage(e))).finally(() => setWorking(''))
  }
  const errors = v?.errors ?? []
  const { rows, pagination } = pageOf(errors, page)
  const passed = v?.passed
  const refused = v && !passed && errors.length === 0

  return (
    <div className={`fp-card mb-3 fp-validation ${passed ? 'is-passed' : v ? 'is-failed' : ''}`} aria-live="polite">
      <div className="p-3 d-flex align-items-center gap-2 flex-wrap">
        {passed ? <ShieldCheck size={20} className="text-success" aria-hidden /> : <ShieldExclamation size={20} className={v ? 'text-danger' : 'text-muted'} aria-hidden />}
        <strong>BIR validation</strong>
        {loading && <Spinner size="sm" className="text-muted" aria-label="Checking" />}
        {v && (passed
          ? <Badge bg="success">Passed</Badge>
          : <Badge bg="danger">{errors.length ? `${errors.length.toLocaleString()} error${errors.length === 1 ? '' : 's'}` : 'Not accepted'}</Badge>)}
        <span className="fp-sub flex-grow-1">
          {!v && !error && "Checking the file with BIR's Alphalist Validation rules…"}
          {passed && <>No errors in BIR&apos;s Alphalist Validation module. The validated file carries BIR&apos;s validation key: submit it with the return.</>}
          {v && !passed && errors.length > 0 && (failedText ?? <>BIR&apos;s Alphalist Validation module would reject this file. Fix these lines.</>)}
        </span>
        <div className="d-flex gap-2">
          {passed && (
            <Button size="sm" className="btn-fp" disabled={!!working} onClick={() => download('validated')} title={v.saves_as ? `The module saves it as ${v.saves_as}` : undefined}>
              {working === 'validated' ? <Spinner size="sm" aria-hidden /> : <Download aria-hidden />} Validated file
            </Button>
          )}
          {v?.report && (
            <Button size="sm" variant="light" disabled={!!working} onClick={() => download('report')}>
              {working === 'report' ? <Spinner size="sm" aria-hidden /> : <FileEarmarkText aria-hidden />} Report
            </Button>
          )}
        </div>
      </div>
      {(error || downloadError) && <Alert variant="danger" className="mx-3">{error || downloadError}</Alert>}
      {refused && v.messages.length > 0 && <Alert variant="warning" className="mx-3">{v.messages.join(' ')}</Alert>}
      {errors.length > 0 && (
        <>
          <Table responsive size="sm" className="mb-0 align-middle fp-stack border-top">
            <thead><tr><th className="fp-num">Line</th><th>Sch.</th><th>Error (BIR&apos;s words)</th><th>On</th></tr></thead>
            <tbody>
              {rows.map((e, i) => (
                <tr key={`${e.line}-${i}`}>
                  <td className="fp-num">{e.line || '—'}</td>
                  <td>{e.schedule ?? ''}</td>
                  <td className="fp-name">{e.message}</td>
                  <td className="small text-muted">{e.line === 1 ? 'Header (the company)' : whoOf(e.record, agentTin) || (/^C/.test(e.record ?? '') ? 'Totals line' : '')}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pager pagination={pagination} onPage={setPage} noun="errors" />
          {errors.some((e) => e.message.startsWith('Invalid character')) && (
            <div className="small text-muted px-3 pb-3">
              BIR&apos;s validation takes plain letters, digits and spaces in names: write Ñ as N and &amp; as AND, and leave out | &quot; &apos; and commas.
              Change the name in the TIN Library and the line follows.
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * BIR's Alphalist Validation module run on this return's DAT (GET /api/bir-validation): its checks, its report,
 * and when the file passes, the validated copy with BIR's validation key (what the module saves in eAlpha\).
 * `version` changes whenever the lines do, so the check runs again.
 */
export default function BirValidation({ agentId, agentTin, period, version, empty }) {
  const key = JSON.stringify(period)
  const check = useLoad(() => agentId && period && !empty && validationApi.get(agentId, period), [agentId, key, version, empty], { keep: true })
  if (!agentId || !period || empty) return null

  return (
    <ValidationResult v={check.data} loading={check.loading} error={check.error} agentTin={agentTin}
      onDownload={(file) => validationApi.download(agentId, period, file)}
      failedText={<>BIR&apos;s Alphalist Validation module would reject this file. Fix these lines: it checks again after every change.</>} />
  )
}
