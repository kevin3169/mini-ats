import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Search, Sparkles } from 'lucide-react'
import { Modal } from '../components/Modal'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { supabase } from '../lib/supabase'
import type { Application, Assessment, Job, Stage } from '../types'

const STAGES: { key: Stage; label: string }[] = [
  { key:'new', label:'New' }, { key:'screening', label:'Screening' }, { key:'interview', label:'Interview' }, { key:'offer', label:'Offer' }, { key:'hired', label:'Hired' }
]

function CandidateCard({ app, onOpen }: { app: Application; onOpen: () => void }) {
  return <button className="candidate-card" onClick={onOpen} id={app.id}>
    <div className="row-between"><strong>{app.candidate?.full_name}</strong>{app.latest_assessment && <span className="score-badge">{app.latest_assessment.score}</span>}</div>
    <span>{app.job?.title}</span>
    <small>{app.candidate?.location || 'No location'}</small>
  </button>
}

export function BoardPage() {
  const { activeCompanyId } = useWorkspace()
  const [apps, setApps] = useState<Application[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [query, setQuery] = useState('')
  const [jobId, setJobId] = useState('')
  const [selected, setSelected] = useState<Application | null>(null)
  const [assessing, setAssessing] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    if(!activeCompanyId){ setApps([]); setJobs([]); return }
    const [a,j,assessmentRows] = await Promise.all([
      supabase.from('applications').select('*, candidate:candidates(*), job:jobs(*)').eq('company_id',activeCompanyId).order('created_at'),
      supabase.from('jobs').select('*').eq('company_id',activeCompanyId).order('title'),
      supabase.from('cv_assessments').select('*').eq('company_id',activeCompanyId).order('created_at',{ascending:false}),
    ])
    if(a.error) throw a.error; if(j.error) throw j.error; if(assessmentRows.error) throw assessmentRows.error
    const assessments=(assessmentRows.data??[]) as Assessment[]
    const rows=((a.data??[]) as Application[]).map(app=>({...app,latest_assessment:assessments.find(x=>x.candidate_id===app.candidate_id&&x.job_id===app.job_id)??null}))
    setApps(rows); setJobs((j.data??[]) as Job[])
    if(selected){ setSelected(rows.find(r=>r.id===selected.id)??null) }
  }
  useEffect(()=>{ void load() },[activeCompanyId])

  const filtered=useMemo(()=>apps.filter(a=>(!jobId||a.job_id===jobId)&&a.candidate?.full_name.toLowerCase().includes(query.toLowerCase())),[apps,jobId,query])

  const move = async (appId:string, target:Stage) => {
    const current=apps.find(a=>a.id===appId); if(!current||current.stage===target) return
    setApps(rows=>rows.map(a=>a.id===appId?{...a,stage:target}:a))
    const {error}=await supabase.from('applications').update({stage:target,updated_at:new Date().toISOString()}).eq('id',appId)
    if(error){ setError(error.message); void load() }
  }

  const assess = async () => {
    if(!selected) return
    setAssessing(true); setError('')
    const { data, error } = await supabase.functions.invoke('assess-candidate',{body:{candidate_id:selected.candidate_id,job_id:selected.job_id}})
    setAssessing(false)
    if(error){ setError(error.message); return }
    await load()
    const next = { ...selected, latest_assessment: data.assessment as Assessment }
    setSelected(next)
  }

  return <>
    <div className="page-title"><div><span className="eyebrow">Hiring pipeline</span><h2>Candidate board</h2><p>Drag candidates between stages and focus the view by role or name.</p></div></div>
    <div className="toolbar"><div className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filter by candidate name…"/></div><select value={jobId} onChange={e=>setJobId(e.target.value)}><option value="">All jobs</option>{jobs.map(j=><option value={j.id} key={j.id}>{j.title}</option>)}</select></div>
    {error&&<div className="alert error">{error}</div>}
    <div className="kanban">{STAGES.map(stage=><section className="kanban-column" key={stage.key}><div className="kanban-head"><h3>{stage.label}</h3><span>{filtered.filter(a=>a.stage===stage.key).length}</span></div><div className="kanban-drop" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); const id=e.dataTransfer.getData('text/plain'); if(id) void move(id,stage.key)}}>{filtered.filter(a=>a.stage===stage.key).map(app=><DraggableCard key={app.id} app={app} onOpen={()=>setSelected(app)}/>)}</div></section>)}</div>
    {selected&&<Modal title="Candidate details" onClose={()=>setSelected(null)} wide><div className="candidate-detail"><div><span className="eyebrow">Candidate</span><h2>{selected.candidate?.full_name}</h2><p>{selected.candidate?.email||'No email'} · {selected.candidate?.location||'No location'}</p>{selected.candidate?.linkedin_url&&<a className="inline-link" target="_blank" rel="noreferrer" href={selected.candidate.linkedin_url}>LinkedIn <ExternalLink size={14}/></a>}</div><div className="detail-grid"><div className="detail-card"><span>Job</span><strong>{selected.job?.title}</strong></div><div className="detail-card"><span>Stage</span><strong>{STAGES.find(s=>s.key===selected.stage)?.label}</strong></div></div><div className="notes-box"><strong>Notes</strong><p>{selected.candidate?.notes||'No notes yet.'}</p></div><div className="ai-panel"><div className="row-between"><div><span className="eyebrow">AI decision support</span><h3>CV match assessment</h3></div><button className="primary-button" disabled={assessing||!selected.candidate?.cv_text} onClick={()=>void assess()}><Sparkles size={16}/>{assessing?'Assessing…':selected.latest_assessment?'Re-assess CV':'Assess CV'}</button></div>{!selected.candidate?.cv_text&&<p className="muted">Upload a PDF/TXT CV for this candidate to enable AI assessment.</p>}{selected.latest_assessment&&<div className="assessment"><div className="score-circle">{selected.latest_assessment.score}<small>/100</small></div><div><p>{selected.latest_assessment.summary}</p><div className="assessment-cols"><div><strong>Strengths</strong><ul>{selected.latest_assessment.strengths.map(x=><li key={x}>{x}</li>)}</ul></div><div><strong>Potential gaps</strong><ul>{selected.latest_assessment.gaps.map(x=><li key={x}>{x}</li>)}</ul></div></div><small>AI output is decision support only and should not be used as an automated hiring decision.</small></div></div>}</div></div></Modal>}
  </>
}

function DraggableCard({app,onOpen}:{app:Application;onOpen:()=>void}){
  // Native draggable keeps the dependency footprint small while DndContext is used for the board container.
  return <div draggable onDragStart={e=>{ e.dataTransfer.setData('text/plain',app.id); (e.currentTarget as HTMLElement).dataset.dragging='true' }} onDragEnd={e=>{ delete (e.currentTarget as HTMLElement).dataset.dragging }}><CandidateCard app={app} onOpen={onOpen}/></div>
}
