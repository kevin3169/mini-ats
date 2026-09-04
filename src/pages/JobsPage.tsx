import { FormEvent, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Modal } from '../components/Modal'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { supabase } from '../lib/supabase'
import type { Job } from '../types'

export function JobsPage() {
  const { activeCompanyId } = useWorkspace()
  const [jobs, setJobs] = useState<Job[]>([])
  const [show, setShow] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    if (!activeCompanyId) return setJobs([])
    const { data, error } = await supabase.from('jobs').select('*').eq('company_id', activeCompanyId).order('created_at', { ascending: false })
    if (error) throw error
    setJobs((data ?? []) as Job[])
  }
  useEffect(() => { void load() }, [activeCompanyId])

  const create = async (e: FormEvent) => {
    e.preventDefault(); if (!activeCompanyId) return
    setBusy(true)
    const { error } = await supabase.from('jobs').insert({ company_id: activeCompanyId, title, description, status: 'open' })
    setBusy(false)
    if (!error) { setTitle(''); setDescription(''); setShow(false); void load() }
  }

  const toggle = async (job: Job) => {
    await supabase.from('jobs').update({ status: job.status === 'open' ? 'closed' : 'open' }).eq('id', job.id)
    void load()
  }

  return <>
    <div className="page-title"><div><span className="eyebrow">Requisitions</span><h2>Jobs</h2><p>Create roles and keep hiring work organized.</p></div><button className="primary-button" onClick={() => setShow(true)}><Plus size={17}/>New job</button></div>
    <div className="grid-cards">
      {jobs.map(job => <article className="card" key={job.id}><div className="row-between"><span className={`status ${job.status}`}>{job.status}</span><button className="text-button" onClick={() => void toggle(job)}>{job.status === 'open' ? 'Close' : 'Reopen'}</button></div><h3>{job.title}</h3><p>{job.description || 'No description added yet.'}</p><small>Created {new Date(job.created_at).toLocaleDateString()}</small></article>)}
      {!jobs.length && <div className="empty-state"><h3>No jobs yet</h3><p>Create the first role to start building a pipeline.</p></div>}
    </div>
    {show && <Modal title="Create job" onClose={() => setShow(false)}><form className="form-stack" onSubmit={create}><label>Job title<input value={title} onChange={e=>setTitle(e.target.value)} required placeholder="AI Developer"/></label><label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={6} placeholder="What will this person do?"/></label><button className="primary-button" disabled={busy}>{busy?'Creating…':'Create job'}</button></form></Modal>}
  </>
}
