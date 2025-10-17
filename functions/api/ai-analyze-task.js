import { createClient } from '@supabase/supabase-js'

export async function onRequest(context) {
  // --- CORS Setup ---
  const origin = context.request.headers.get('Origin') || '*'
  const allowedOrigins = [
    'https://www.y2k.fund',
    'https://y2k.fund',
    'http://localhost:5100',
    'http://localhost:5104',
    'http://localhost:3000'
  ]
  const corsOrigin = allowedOrigins.includes(origin) ? origin : '*'
  const corsHeaders = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
    'Content-Type': 'application/json'
  }

  // --- OPTIONS Preflight ---
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  // --- Only Allow POST ---
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    }), { status: 405, headers: corsHeaders })
  }

  try {
    const { taskId, userId, question } = await context.request.json()
    const supabase = createClient(
      context.env.VITE_SUPA_URL,
      context.env.VITE_SUPA_ANON
    )

    // Fetch task description
    const { data: task } = await supabase
      .from('tasks')
      .select('description')
      .eq('id', taskId)
      .single()

    // Fetch all comments
    const { data: comments } = await supabase
      .from('task_comments')
      .select('comment, created_by, created_at')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    // Build prompt
    let prompt = `Task Description:\n${task?.description || ''}\n\nComments:\n`
    for (const c of comments || []) {
      prompt += `- ${c.comment} (by ${c.created_by} at ${c.created_at})\n`
    }
    prompt += `\nAnalysis Request:\n${question}`

    // Call AI (OpenRouter example)
    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          { role: 'system', content: 'You are an expert assistant for task analysis.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1024
      })
    })
    const aiData = await aiRes.json()
    const aiReply = aiData.choices?.[0]?.message?.content || 'No response.'

    return new Response(JSON.stringify({ reply: aiReply }), {
      status: 200,
      headers: corsHeaders
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: corsHeaders
    })
  }
}