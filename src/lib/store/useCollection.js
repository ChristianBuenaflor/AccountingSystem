import { useCallback, useEffect, useState } from 'react'
import { load, save } from './db.js'

export function useCollection(key, seedFn) {
  const [rows, setRows] = useState(() => seedFn())
  useEffect(() => { setRows(load(key, seedFn)) }, [key])
  const persist = useCallback((next) => { setRows(next); save(key, next) }, [key])
  const create = useCallback((row) => {
    const out = { id: Date.now(), ...row }
    persist([...load(key, seedFn), out])
    return out
  }, [key, persist])
  const update = useCallback((id, patch) => {
    persist(load(key, seedFn).map((r) => (String(r.id) === String(id) ? { ...r, ...patch } : r)))
  }, [key, persist])
  const remove = useCallback((id) => {
    persist(load(key, seedFn).filter((r) => String(r.id) !== String(id)))
  }, [key, persist])
  const reload = useCallback(() => setRows(load(key, seedFn)), [key])
  return { rows, create, update, remove, reload }
}

export default useCollection
