import { FormEvent, useEffect, useState } from 'react'
import { Plus, ShieldCheck, UserRoundCog } from 'lucide-react'
import { Modal } from '../components/Modal'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { supabase } from '../lib/supabase'
import type { Company, Profile, Role } from '../types'

export function AdminPage() {
  const { profile } = useAuth()
  const { refreshCompanies } = useWorkspace()
  const [users, setUsers] = useState<Profile[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ full_name:'', email:'', password:'', role:'customer' as Role, company_id:'', company_name:'' })

  const load = async () => {
    const [u,c]=await Promise.all([
      supabase.from('profiles').select('*').order('created_at',{ascending:false}),
      supabase.from('companies').select('*').order('name')
    ])
    if(u.error) throw u.error; if(c.error) throw c.error
    setUsers((u.data??[]) as Profile[]); setCompanies((c.data??[]) as Company[])
  }
  useEffect(()=>{ if(profile?.role==='admin') void load() },[profile?.id])

  const create = async (e:FormEvent) => {
    e.preventDefault(); setBusy(true); setMessage('')
    const { data, error } = await supabase.functions.invoke('admin-create-user',{ body: form })
    setBusy(false)
    if(error){ setMessage(error.message); return }
    setMessage(`Created ${data.user.email}`)
    setShow(false)
    setForm({full_name:'',email:'',password:'',role:'customer',company_id:'',company_name:''})
    await Promise.all([load(),refreshCompanies()])
  }

  if(profile?.role!=='admin') return <div className="empty-state"><h3>Admin only</h3></div>

  return <>
    <div className="page-title"><div><span className="eyebrow">Platform administration</span><h2>Accounts</h2><p>Create admin and customer logins without exposing privileged credentials in the browser.</p></div><button className="primary-button" onClick={()=>setShow(true)}><Plus size={17}/>Create account</button></div>
    {message&&<div className="alert">{message}</div>}
    <div className="admin-metrics"><div className="metric-card"><ShieldCheck/><div><strong>{users.filter(u=>u.role==='admin').length}</strong><span>Admins</span></div></div><div className="metric-card"><UserRoundCog/><div><strong>{users.filter(u=>u.role==='customer').length}</strong><span>Customer users</span></div></div><div className="metric-card"><div className="metric-icon">C</div><div><strong>{companies.length}</strong><span>Companies</span></div></div></div>
    <div className="table-card"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Company</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td><strong>{u.full_name}</strong></td><td>{u.email}</td><td><span className="badge">{u.role}</span></td><td>{companies.find(c=>c.id===u.company_id)?.name||'Platform'}</td></tr>)}</tbody></table></div>
    {show&&<Modal title="Create account" onClose={()=>setShow(false)}><form className="form-stack" onSubmit={create}><label>Full name<input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label><label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Temporary password<input required minLength={8} type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><label>Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value as Role})}><option value="customer">Customer</option><option value="admin">Admin</option></select></label>{form.role==='customer'&&<><label>Existing company<select value={form.company_id} onChange={e=>setForm({...form,company_id:e.target.value,company_name:''})}><option value="">Create a new company</option>{companies.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label>{!form.company_id&&<label>New company name<input required value={form.company_name} onChange={e=>setForm({...form,company_name:e.target.value})}/></label>}</>}<button className="primary-button" disabled={busy}>{busy?'Creating…':'Create account'}</button></form></Modal>}
  </>
}
