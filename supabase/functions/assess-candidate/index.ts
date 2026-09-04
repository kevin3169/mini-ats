import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) return json({ error: 'OPENAI_API_KEY is not configured' }, 500)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const client = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: authData, error: authError } = await client.auth.getUser()
    if (authError || !authData.user) return json({ error: 'Unauthorized' }, 401)

    const { candidate_id, job_id } = await req.json()
    const [{ data: candidate, error: candidateError }, { data: job, error: jobError }] = await Promise.all([
      client.from('candidates').select('*').eq('id', candidate_id).single(),
      client.from('jobs').select('*').eq('id', job_id).single(),
    ])
    if (candidateError || jobError || !candidate || !job) return json({ error: 'Candidate or job not found' }, 404)
    if (!candidate.cv_text) return json({ error: 'Candidate has no extracted CV text' }, 400)
    if (candidate.company_id !== job.company_id) return json({ error: 'Company mismatch' }, 400)

    const prompt = `You are an ATS decision-support assistant. Compare the CV against the job description. Use only job-relevant evidence. Do not infer protected or sensitive traits. Do not reward or penalize age, gender, ethnicity, religion, disability, family status, nationality, or similar attributes. Return a conservative job-match score based on skills and experience only.\n\nJOB TITLE:\n${job.title}\n\nJOB DESCRIPTION:\n${job.description}\n\nCANDIDATE CV:\n${String(candidate.cv_text).slice(0, 30000)}`

    const ai = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-5.6-luna',
        input: prompt,
        text: { format: { type: 'json_schema', name: 'cv_assessment', strict: true, schema: {
          type: 'object', additionalProperties: false,
          properties: {
            score: { type: 'integer', minimum: 0, maximum: 100 },
            summary: { type: 'string' },
            strengths: { type: 'array', items: { type: 'string' }, maxItems: 5 },
            gaps: { type: 'array', items: { type: 'string' }, maxItems: 5 }
          },
          required: ['score','summary','strengths','gaps']
        } } }
      })
    })
    if (!ai.ok) return json({ error: `AI provider error: ${await ai.text()}` }, 502)
    const raw = await ai.json()
    const outputText = raw.output_text ?? raw.output?.flatMap((o: any) => o.content ?? []).find((c: any) => c.type === 'output_text')?.text
    if (!outputText) return json({ error: 'AI returned no structured output' }, 502)
    const parsed = JSON.parse(outputText)

    const admin = createClient(url, serviceKey)
    const { data: assessment, error: insertError } = await admin.from('cv_assessments').insert({
      company_id: candidate.company_id, candidate_id, job_id,
      score: parsed.score, summary: parsed.summary, strengths: parsed.strengths, gaps: parsed.gaps,
    }).select().single()
    if (insertError) throw insertError

    return json({ assessment })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}
