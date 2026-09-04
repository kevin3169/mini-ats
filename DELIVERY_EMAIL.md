Subject: Mini-ATS kodtest – leverans

Hej Jonas,

Tack för ett roligt kodtest. Jag har nu en första leverans av mini-ATS:et klar.

Live: [LÄGG IN LIVE-LÄNK]
Repo: [LÄGG IN GITHUB-LÄNK]
Demo (ca 5 min): [LÄGG IN LOOM-LÄNK]

Admin-login:
E-post: [ADMIN-E-POST]
Lösenord: [DELA VIA LÄMPLIG SÄKER KANAL]

Jag valde att prioritera ett litet men komplett flöde som skulle kunna användas av en första kund: admin-/kundroller, jobb, kandidater, LinkedIn/CV-information, kompakt kanban, filtrering samt möjlighet för admin att arbeta i kundernas workspaces.

Några antaganden jag gjorde:
- En kundanvändare tillhör ett företag, medan admin är plattformsövergripande.
- Kandidat och ansökan är separata objekt så samma kandidat kan kopplas till flera jobb framöver.
- Pipeline har fem fasta steg i MVP:n: New, Screening, Interview, Offer och Hired.
- CV stödjer PDF/TXT i första versionen.
- AI-bedömningen är ett beslutsstöd och inte ett automatiserat anställningsbeslut.

Jag implementerade även den extra AI-funktionen. Den jämför CV-texten med jobbets beskrivning och returnerar ett strukturerat matchscore, en sammanfattning, styrkor och möjliga luckor. I demon går jag även igenom hur jag skulle vidareutveckla detta för en riktig produkt, bland annat utvärdering, fairness/bias, audit logging och hantering av personuppgifter.

Jag använde AI-verktyg aktivt under utvecklingen för att arbeta snabbt med arkitektur, implementation, UI och granskning, men har försökt hålla tydliga säkerhetsgränser: tenant-isolering ligger i Supabase RLS och privilegierade nycklar ligger enbart server-side i Edge Functions.

Ser fram emot din feedback.

Mvh
Kevin
