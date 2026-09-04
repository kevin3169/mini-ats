# Northstar Mini ATS

Mini applicant tracking system built as a code test / MVP.

## Features
- Admin and customer authentication via Supabase
- Admin can create customer/admin accounts
- Customers can create jobs
- Candidates can be added with LinkedIn/profile info
- Candidates can be connected to jobs
- Compact kanban board with stages: New, Screening, Interview, Offer, Hired
- Filter by job and candidate name
- Admin can switch customer workspace and act on behalf of customers
- CV upload (PDF/TXT)
- AI-assisted CV assessment against a job description

## Stack
- React + TypeScript + Vite
- Supabase Auth, Postgres, Storage, RLS, Edge Functions
- OpenAI Responses API for CV assessment

## Local setup
```bash
npm install
cp .env.example .env
npm run dev
```

Required frontend env:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

## Supabase setup
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase secrets set OPENAI_API_KEY=YOUR_OPENAI_API_KEY
supabase functions deploy admin-create-user
supabase functions deploy assess-candidate
```

## First admin
Create the first user in Supabase Authentication, copy the auth UUID and run:

```sql
insert into public.profiles (id, email, full_name, role, company_id)
values (
  'AUTH_USER_UUID_HERE',
  'admin@example.com',
  'Kevin Admin',
  'admin',
  null
);
```

## Assumptions
- MVP-first implementation, not an enterprise ATS.
- A customer belongs to one company/workspace.
- Admins are platform-wide.
- Candidate and application are separate entities, so a candidate can be connected to multiple jobs.
- The workflow uses five fixed stages for the MVP.
- CV uploads are limited to PDF/TXT.
- AI assessment is decision support only and should not make final hiring decisions.

## Security
- RLS is enabled on business tables.
- Customers are scoped to their own company.
- Service-role access is only used in Edge Functions.
- OpenAI key and Supabase service-role key must never be exposed in frontend code.

## Demo flow
1. Log in as admin.
2. Create a customer/company.
3. Switch into the customer workspace.
4. Create a job.
5. Add candidates and upload a CV.
6. Open the kanban board and move candidates between stages.
7. Filter by candidate name/job.
8. Run AI CV assessment and review score, summary, strengths and gaps.

## AI use
AI tools were used heavily to accelerate implementation. Outputs were reviewed and the architecture intentionally keeps AI as assistive decision support rather than automated hiring.
