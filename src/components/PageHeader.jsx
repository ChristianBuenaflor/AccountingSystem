export default function PageHeader({ title, sub, children }) {
  return (
    <div className="d-flex justify-content-between align-items-start mb-3 gap-3 flex-wrap">
      <div><h1 className="fp-title">{title}</h1><div className="fp-sub">{sub}</div></div>
      <div className="d-flex gap-2 align-items-center flex-wrap">{children}</div>
    </div>
  )
}
