# Assumptions shared with Jonas

- The goal is a small but complete MVP suitable for an initial customer, rather than a full enterprise ATS.
- A customer login belongs to one company; platform admins can work across all companies.
- Candidates and applications are separate entities so a candidate can later be attached to more than one job.
- Five fixed stages are enough for the MVP: New, Screening, Interview, Offer and Hired.
- PDF/TXT CV upload is enough for the first version; 6 MB is the current limit.
- AI CV assessment uses job-related skills/experience only and is decision support, never an automatic accept/reject mechanism.
- Temporary passwords are acceptable for the code test. Production would use email invitations/password setup.
- Basic responsive web UX is prioritized; advanced reporting, calendar/email integrations and custom pipeline configuration are deferred.
