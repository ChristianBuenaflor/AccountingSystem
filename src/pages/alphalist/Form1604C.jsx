// 1604-C (employees): the dialog's sections and its live summary.
// compute1604C() is the client copy of Form1604C::compute() in alphalist-api (app/Alphalist/Forms/Form1604C.php),
// in integer centavos like the API. It only previews; the API recomputes every line when it is saved.
import { centsToAmount, toCents } from '../../lib/money'

// Form1604C::employee() fields, and Form1604C::required().
const EMPLOYEE = ['region_num', 'nationality', 'employment_from', 'employment_to', 'employment_status', 'reason_separation', 'subs_filing']
export const required1604C = (schedule) => ['region_num', 'nationality', 'employment_from', 'employment_to', ...(schedule === 'D2' ? ['factor_used'] : [])]

// Where an input of either schedule goes in the dialog, and its label there (without the "Present:" prefix).
export function layout1604C(field, label) {
  const short = label.replace(/^(Present|Previous employer|Previous):\s*/i, '')
  const cap = short.charAt(0).toUpperCase() + short.slice(1)
  if (EMPLOYEE.includes(field)) return { section: 'Employee', label }
  const section = field.startsWith('prev_') ? 'Previous employer' : 'Present employer'
  const group = /tax_wthld|tax_credit/.test(field) ? 'Tax withheld & credits'
    : /taxable|^tax_basic_sal/.test(field) && !/nontax/.test(field) ? 'Taxable compensation'
      : 'Non-taxable / exempt compensation'
  return { section, group, label: cap }
}

// PHP round() on a float (half away from zero), with its pre-rounding of float noise: 12345.4999999999 -> 12345.5.
const phpRound = (x) => Math.sign(x) * Math.round(Math.abs(Number(x.toPrecision(15))))

// Form1604C::taxDue(): graduated table of Alphalist 7.4 (2023 onward), centavos in and out.
export function taxDue(net) {
  const x = net / 100
  const tax = x <= 250000 ? 0
    : x <= 400000 ? (x - 250000) * 0.15
      : x <= 800000 ? 22500 + (x - 400000) * 0.20
        : x <= 2000000 ? 102500 + (x - 800000) * 0.25
          : x <= 8000000 ? 402500 + (x - 2000000) * 0.30
            : 2202500 + (x - 8000000) * 0.35
  return phpRound(tax * 100)
}

// The amounts Form1604C::compute() fills in, in centavos.
export function compute1604C(schedule, v) {
  const c = (f) => toCents(v[f])
  const sum = (...fs) => fs.reduce((s, f) => s + c(f), 0)
  const out = {}
  let prevNontax, presNontax, prevTaxable, net
  if (schedule === 'D2') {
    const factor = Number(String(v.factor_used ?? '').replace(/,/g, '')) || 0
    const day = c('pres_nontax_basic_smw_day')
    out.pres_nontax_basic_smw_year = phpRound(day * factor)
    out.pres_nontax_basic_smw_month = phpRound(day * factor / 12)
    prevNontax = sum('prev_nontax_basic_smw', 'prev_nontax_holiday_pay', 'prev_nontax_overtime_pay', 'prev_nontax_night_diff',
      'prev_nontax_hazard_pay', 'prev_nontax_13th_month', 'prev_nontax_de_minimis', 'prev_nontax_sss_gsis_oth_cont', 'prev_nontax_salaries')
    presNontax = sum('pres_nontax_holiday_pay', 'pres_nontax_overtime_pay', 'pres_nontax_night_diff', 'pres_nontax_hazard_pay',
      'pres_nontax_13th_month', 'pres_nontax_de_minimis', 'pres_nontax_sss_gsis_oth_cont', 'pres_nontax_salaries', 'nontax_basic_sal')
    prevTaxable = sum('prev_taxable_salaries', 'prev_taxable_13th_month')
    net = sum('tax_basic_sal', 'pres_taxable_13th_month', 'pres_taxable_salaries', 'prev_taxable_13th_month', 'prev_taxable_salaries')
  } else {
    prevNontax = sum('prev_nontax_basic_smw', 'prev_nontax_13th_month', 'prev_nontax_de_minimis', 'prev_nontax_sss_gsis_oth_cont', 'prev_nontax_salaries')
    presNontax = sum('pres_nontax_13th_month', 'pres_nontax_de_minimis', 'pres_nontax_sss_gsis_oth_cont', 'pres_nontax_salaries', 'nontax_basic_sal')
    prevTaxable = sum('prev_taxable_salaries', 'prev_taxable_13th_month', 'prev_taxable_basic_salary')
    net = sum('tax_basic_sal', 'pres_taxable_13th_month', 'pres_taxable_salaries', 'prev_taxable_13th_month', 'prev_taxable_salaries', 'prev_taxable_basic_salary')
  }
  const presTaxable = sum('pres_taxable_salaries', 'pres_taxable_13th_month', 'tax_basic_sal')
  net = Math.max(0, net)
  const due = taxDue(net)
  const credits = sum('pres_tax_wthld', 'prev_tax_wthld', 'tax_credit_pera')

  return {
    ...out,
    prev_total_nontax_comp_income: prevNontax,
    pres_total_nontax_comp_income: presNontax,
    prev_total_taxable: prevTaxable,
    pres_total_comp: presTaxable,
    prev_nontax_gross_comp_income: Math.max(0, prevNontax + prevTaxable),
    pres_nontax_gross_comp_income: presNontax + presTaxable,
    gross_comp_income: prevTaxable + presTaxable,
    net_taxable_comp_income: net,
    tax_due: due,
    credits,
    over_wthld: Math.max(0, credits - due),
    amt_wthld_dec: Math.max(0, due - credits),
    actual_amt_wthld: due,
  }
}

const Row = ({ label, cents, className = '' }) => (
  <><dt className={className}>{label}</dt><dd className={className}>₱{centsToAmount(cents)}</dd></>
)

// Footer of the 1604-C dialog on narrow screens, where the full summary is below the fields.
export function SummaryStrip1604C({ values }) {
  const r = compute1604C(values.schedule || 'D1', values)
  return (
    <span className="fp-tin">
      Tax due <strong>₱{centsToAmount(r.tax_due)}</strong> ·{' '}
      {r.over_wthld > 0
        ? <>over-withheld <strong className="text-success">₱{centsToAmount(r.over_wthld)}</strong></>
        : <>December <strong>₱{centsToAmount(r.amt_wthld_dec)}</strong></>}
    </span>
  )
}

// Beside the 1604-C dialog: what Alphalist will compute for this employee, updated as you type.
export function Summary1604C({ values }) {
  const schedule = values.schedule || 'D1'
  const r = compute1604C(schedule, values)
  const refund = r.over_wthld > 0
  return (
    <div>
      <div className="fw-semibold mb-1">Tax summary</div>
      <div className="fp-sub small mb-3">Worked out as you type. The server recomputes it when you save.</div>
      <dl>
        {schedule === 'D2' && <Row label="Basic SMW per year" cents={r.pres_nontax_basic_smw_year} />}
        <Row label="Non-taxable (present + previous)" cents={r.pres_total_nontax_comp_income + r.prev_total_nontax_comp_income} />
        <Row label="Gross taxable compensation" cents={r.gross_comp_income} />
        <Row label="Net taxable compensation" cents={r.net_taxable_comp_income} className="fp-total" />
        <Row label="Tax due" cents={r.tax_due} />
        <Row label="Withheld Jan–Nov, previous employer & PERA" cents={r.credits} />
        <Row label="Amount to withhold in December" cents={r.amt_wthld_dec} className={`fp-total ${!refund && r.amt_wthld_dec > 0 ? 'text-danger' : ''}`} />
        <Row label="Over-withheld (refund to employee)" cents={r.over_wthld} className={refund ? 'text-success fw-semibold' : ''} />
      </dl>
    </div>
  )
}
