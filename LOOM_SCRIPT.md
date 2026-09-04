# 5-minute Loom script

## 0:00–0:35 — Intro

Hi Jonas. I built this as a deliberately focused first-customer ATS. My main assumption was that speed-to-usable matters more than enterprise breadth, so I concentrated on the full core flow, tenant security and one small AI feature.

The stack is React and TypeScript in the frontend, with Supabase for authentication, Postgres, storage and Edge Functions.

## 0:35–1:15 — Admin flow

I'm logged in as a platform admin. An admin can switch between customer workspaces here, and can perform the same actions as a customer on their behalf.

Under Admin I can create both customer and admin accounts. Customer accounts either attach to an existing company or create a new company. The privileged Supabase service-role key is only used inside an Edge Function, never in the browser.

## 1:15–1:50 — Jobs

Inside a customer workspace I can create jobs, add a description and close or reopen a role. The job description also becomes the rubric used by the AI CV assessment.

## 1:50–2:40 — Candidate flow

I can add a candidate with contact details, location, LinkedIn, notes and a PDF or text CV, and connect them to a job immediately.

The CV bucket is private. PDF text is extracted for matching, while Supabase Row Level Security makes sure customer users can only access records belonging to their own company.

## 2:40–3:35 — Kanban + filters

This is the compact pipeline view. There are five MVP stages: New, Screening, Interview, Offer and Hired.

I can filter by candidate name and job, and move candidates between stages with drag and drop. As admin I can switch to another customer and see/manage their pipeline without changing accounts.

## 3:35–4:30 — AI assessment

For candidates with a CV, I can run an AI match assessment against the selected job. It returns a 0–100 match score, a short summary, job-relevant strengths and possible gaps.

I intentionally treat this as decision support, not an automated hiring decision. The prompt tells the model not to infer or use protected or sensitive characteristics. In a real ATS I would also build evaluation datasets, human feedback, audit logging, retention/deletion controls and fairness monitoring before relying on the feature at scale.

## 4:30–5:00 — Wrap-up

The main architectural choice I want to highlight is that tenant boundaries live in the database through RLS rather than only in frontend filters, and privileged operations live in Edge Functions.

If I continued from here, my first additions would be invite/password-reset flows, candidate editing and multi-job assignment UI, custom pipeline stages, activity history, bulk import and stronger automated tests.

I also used AI tools heavily during the build, as requested, but verified the security and data boundaries rather than treating generated code as automatically correct. Thanks for taking a look.
