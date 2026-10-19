import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from './api/client'

// Loads a page's data and says when it is loading.
//   const { data, loading, error, reload } = useLoad(() => agentId && qapApi.get(agentId, period), [agentId, period])
// When the deps change (another agent, period...) the old data is dropped at once, so a page never shows one
// agent's lines under another's name; reload() (after a save) keeps it on screen while it refreshes.
// Answers that arrive after a newer request are ignored. load() returning null/undefined means "nothing to load yet".
// { keep: true } keeps the old data on screen on every change too (e.g. while a search narrows a list).
export default function useLoad(load, deps, { keep: keepOnChange = false } = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const seq = useRef(0)

  const run = useCallback((keep) => {
    const n = ++seq.current
    const p = load()
    if (!p) { setState({ data: null, loading: false, error: '' }); return Promise.resolve() }
    setState((s) => ({ data: keep ? s.data : null, loading: true, error: '' }))
    return Promise.resolve(p).then(
      (data) => { if (n === seq.current) setState({ data, loading: false, error: '' }) },
      (e) => { if (n === seq.current) setState((s) => ({ data: keep ? s.data : null, loading: false, error: errorMessage(e) })) },
    )
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { run(keepOnChange) }, [run]) // eslint-disable-line react-hooks/exhaustive-deps
  const reload = useCallback(() => run(true), [run])
  return { ...state, reload }
}
