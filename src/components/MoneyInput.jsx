import { useState } from 'react'
import { Form, InputGroup } from 'react-bootstrap'
import { formatAmount, unformatAmount } from '../lib/money'

// Peso amount box: shows "₱ 12,345.00" once you leave it, plain digits while you type.
// value / onChange carry the plain number as text ("12345.5"), never the commas.
export default function MoneyInput({ value, onChange, onBlur, onFocus, isInvalid, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <InputGroup hasValidation>
      <InputGroup.Text aria-hidden>₱</InputGroup.Text>
      <Form.Control
        {...props}
        className={`text-end ${props.className ?? ''}`}
        inputMode="decimal"
        autoComplete="off"
        isInvalid={isInvalid}
        value={focused ? (value ?? '') : formatAmount(value)}
        onFocus={(e) => { setFocused(true); onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); onBlur?.(e) }}
        onChange={(e) => onChange(unformatAmount(e.target.value))}
      />
    </InputGroup>
  )
}
