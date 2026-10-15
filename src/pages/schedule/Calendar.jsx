import { useState } from 'react'
import { Card, Badge, Button } from 'react-bootstrap'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'

const Calendar = () => {
  const { rows: events } = useCollection('events', seeds.events)
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const dayEvents = (day) => events.filter(e => {
    const d = new Date(e.start_time)
    return !isNaN(d) && d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
  })

  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h3 className="fw-bold mb-1">Calendar</h3><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Monthly event and schedule overview.</p></div>
        <div className="d-flex align-items-center gap-2">
          <Button variant="light" className="d-flex align-items-center" onClick={prevMonth}><ChevronLeft size={18} /></Button>
          <span className="fw-bold px-3">{monthName}</span>
          <Button variant="light" className="d-flex align-items-center" onClick={nextMonth}><ChevronRight size={18} /></Button>
        </div>
      </div>
      <Card className="border-0 shadow-sm p-4">
        <div className="d-flex justify-content-between mb-3 text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center flex-grow-1">{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {days.map((day, i) => {
            const evs = day ? dayEvents(day) : []
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()
            return (
              <div key={i} className="rounded p-2" style={{ minHeight: 90, background: day ? (isToday ? '#f0fdf9' : '#fff') : 'transparent', border: day ? '1px solid #f1f5f9' : 'none' }}>
                {day && <div className={`fw-semibold mb-1 ${isToday ? 'text-success' : ''}`} style={{ fontSize: '0.85rem' }}>{day}</div>}
                {evs.map(e => (
                  <div key={e.id} className="rounded px-1 py-1 mb-1 text-truncate" style={{ fontSize: '0.7rem', background: (e.color || '#00b894') + '20', color: e.color || '#00b894', fontWeight: 600 }}>{e.title}</div>
                ))}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
export default Calendar
