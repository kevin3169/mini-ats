export type Role = 'admin' | 'customer'
export type Stage = 'new' | 'screening' | 'interview' | 'offer' | 'hired'

export interface Company {
  id: string
  name: string
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  company_id: string | null
  created_at: string
}

export interface Job {
  id: string
  company_id: string
  title: string
  description: string
  status: 'open' | 'closed'
  created_at: string
}

export interface Candidate {
  id: string
  company_id: string
  full_name: string
  email: string | null
  phone: string | null
  linkedin_url: string | null
  location: string | null
  notes: string | null
  cv_path: string | null
  cv_text: string | null
  created_at: string
}

export interface Application {
  id: string
  company_id: string
  candidate_id: string
  job_id: string
  stage: Stage
  created_at: string
  updated_at: string
  candidate?: Candidate
  job?: Job
  latest_assessment?: Assessment | null
}

export interface Assessment {
  id: string
  company_id: string
  candidate_id: string
  job_id: string
  score: number
  summary: string
  strengths: string[]
  gaps: string[]
  created_at: string
}
