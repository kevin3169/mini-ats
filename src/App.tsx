import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { BoardPage } from './pages/BoardPage'
import { JobsPage } from './pages/JobsPage'
import { CandidatesPage } from './pages/CandidatesPage'
import { AdminPage } from './pages/AdminPage'

export default function App() {
  return <BrowserRouter><AuthProvider><WorkspaceProvider><Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route element={<ProtectedRoute><Layout/></ProtectedRoute>}>
      <Route path="/board" element={<BoardPage/>}/>
      <Route path="/jobs" element={<JobsPage/>}/>
      <Route path="/candidates" element={<CandidatesPage/>}/>
      <Route path="/admin" element={<AdminPage/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/board" replace/>}/>
  </Routes></WorkspaceProvider></AuthProvider></BrowserRouter>
}
