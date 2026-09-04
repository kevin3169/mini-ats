import { BriefcaseBusiness, KanbanSquare, LogOut, ShieldCheck, UsersRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'

export function Layout() {
  const { profile, signOut } = useAuth()
  const { companies, activeCompanyId, setActiveCompanyId } = useWorkspace()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">N</div><div><strong>Northstar</strong><span>Mini ATS</span></div></div>
        <nav>
          <NavLink to="/board"><KanbanSquare size={18} />Pipeline</NavLink>
          <NavLink to="/jobs"><BriefcaseBusiness size={18} />Jobs</NavLink>
          <NavLink to="/candidates"><UsersRound size={18} />Candidates</NavLink>
          {profile?.role === 'admin' && <NavLink to="/admin"><ShieldCheck size={18} />Admin</NavLink>}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-mini"><div className="avatar">{profile?.full_name?.[0] ?? '?'}</div><div><strong>{profile?.full_name}</strong><span>{profile?.role}</span></div></div>
          <button className="ghost-button full" onClick={() => void signOut()}><LogOut size={16} />Sign out</button>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div><span className="eyebrow">Workspace</span><h1>{companies.find(c => c.id === activeCompanyId)?.name ?? 'Select a customer'}</h1></div>
          {profile?.role === 'admin' && (
            <select value={activeCompanyId ?? ''} onChange={(e) => setActiveCompanyId(e.target.value)}>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          )}
        </header>
        <div className="page"><Outlet /></div>
      </main>
    </div>
  )
}
