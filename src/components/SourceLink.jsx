import { Link } from 'react-router-dom'
import { Badge } from 'react-bootstrap'
import { BoxArrowUpRight } from 'react-bootstrap-icons'

// A BIR line written from a FinancePro record (alphalist-api `source`: an employee's compensation, a bill or
// an invoice). Saving the record rewrites the line, so it is changed there, not on the BIR screen: this badge
// links to the record and stands in for the line's Edit / Remove buttons.
export default function SourceLink({ source }) {
  return (
    <Badge as={Link} to={source.path} bg="light" text="dark" pill className="border text-decoration-none fw-medium"
      title={`${source.description}. Edit it there: saving it updates this line.`}>
      From {source.label} <BoxArrowUpRight size={10} aria-hidden />
    </Badge>
  )
}
