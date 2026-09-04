import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ExternalLink, Plus, Search, Sparkles, Upload } from 'lucide-react'
import { Modal } from '../components/Modal'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { supabase } from '../lib/supabase'
import { extractPdfText } from '../lib/pdf'
import type { Candidate, Job } from '../types'

export function CandidatesPage() {
  const { activeCompanyId } = useWorkspace()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [query, setQuery] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ full_name:'', email:'', phone:'', linkedin_url:'', location:'', notes:'', job_id:'' })
  const [file, setFile] = useState<File | null>(null)

  const load = async () => {
    if (!activeCompanyId) return
    const [c, j] = await Promise.all([
      supabase.from('candidates').select('*').eq('company_id', activeCompanyId).order('created_at', { ascending:false }),
      supabase.from('jobs').select('*').eq('company_id', activeCompanyId).eq('status','open').order('title'),
    ])
    if (c.error) throw c.error; if (j.error) throw j.error
    setCandidates((c.data??[]) as Candidate[]); setJobs((j.data??[]) as Job[])
  }
  useEffect(()=>{ void load() },[activeCompanyId])

  const filtered = useMemo(()=>candidates.filter(c=>c.full_name.toLowerCase().includes(query.toLowerCase()) || (c.email??'').toLowerCase().includes(query.toLowerCase())),[candidates,query])

  const create = async (e:FormEvent) => {
    e.preventDefault(); if(!activeCompanyId || !form.job_id) return
    setBusy(true)
    try {
      let cv_path:string|null=null, cv_text:string|null=null
      if(file){
        cv_text = file.type === 'application/pdf' ? await extractPdfText(file) : await file.text()
        const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_')
        cv_path=`${activeCompanyId}/${crypto.randomUUID()}-${safeName}`
        const upload=await supabase.storage.from('cvs').upload(cv_path,file,{contentType:file.type||undefined,upsert:false})
        if(upload.error) throw upload.error
      }
      const {data:candidate,error}=await supabase.from('candidates').insert({company_id:activeCompanyId,full_name:form.full_name,email:form.email||null,phone:form.phone||null,linkedin_url:form.linkedin_url||null,location:form.location||null,notes:form.notes||null,cv_path,cv_text}).select().single()
      if(error) throw error
      const app=await supabase.from('applications').insert({company_id:activeCompanyId,candidate_id:candidate.id,job_id:form.job_id,stage:'new'})
      if(app.error) throw app.error
      setShow(false); setFile(null); setForm({full_name:'',email:'',phone:'',linkedin_url:'',location:'',notes:'',job_id:''}); await load()
    } finally { setBusy(false) }
  }

  return <>
    <div className="page-title"><div><span className="eyebrow">Talent pool</span><h2>Candidates</h2><p>Keep contact details, LinkedIn and CV context in one place.</p></div><button className="primary-button" onClick={()=>setShow(true)} disabled={!jobs.length}><Plus size={17}/>Add candidate</button></div>
    {!jobs.length && <div className="alert">Create an open job before adding a candidate.</div>}
    <div className="toolbar"><div className="search"><Search size={17}/><input placeholder="Search candidates…" value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
    <div className="table-card"><table><thead><tr><th>Name</th><th>Contact</th><th>Location</th><th>Profile</th><th>CV</th></tr></thead><tbody>{filtered.map(c=><tr key={c.id}><td><strong>{c.full_name}</strong></td><td>{c.email||'—'}<br/><small>{c.phone||''}</small></td><td>{c.location||'—'}</td><td>{c.linkedin_url?<a href={c.linkedin_url} target="_blank" rel="noreferrer">LinkedIn <ExternalLink size={13}/></a>:'—'}</td><td>{c.cv_path?<span className="badge"><Sparkles size={13}/>Ready for AI</span>:'—'}</td></tr>)}</tbody></table>{!filtered.length&&<div className="empty-state"><h3>No candidates found</h3><p>Add a candidate or change your search.</p></div>}</div>
    {show&&<Modal title="Add candidate" onClose={()=>setShow(false)} wide><form className="form-grid" onSubmit={create}><label>Full name<input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label><label>Job<select required value={form.job_id} onChange={e=>setForm({...form,job_id:e.target.value})}><option value="">Select job</option>{jobs.map(j=><option key={j.id} value={j.id}>{j.title}</option>)}</select></label><label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>LinkedIn URL<input type="url" value={form.linkedin_url} onChange={e=>setForm({...form,linkedin_url:e.target.value})} placeholder="https://linkedin.com/in/..."/></label><label>Location<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label><label className="span-2">Notes<textarea rows={4} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label><label className="span-2 file-drop"><Upload size={20}/><span>{file?file.name:'Upload CV (PDF or TXT)'}</span><input type="file" accept="application/pdf,text/plain" onChange={e=>setFile(e.target.files?.[0]??null)}/></label><div className="span-2 form-actions"><button type="button" className="ghost-button" onClick={()=>setShow(false)}>Cancel</button><button className="primary-button" disabled={busy}>{busy?'Saving…':'Add candidate'}</button></div></form></Modal>}
  </>
}
