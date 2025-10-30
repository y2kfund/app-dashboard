import { createClient } from '@supabase/supabase-js'

export async function onRequest(context) {
  // --- CORS Setup ---
  const origin = context.request.headers.get('Origin') || '*'
  const allowedOrigins = [
    'https://www.y2k.fund',
    'https://y2k.fund',
    'http://localhost:5100',
    'http://localhost:5173',
    'http://localhost:3000'
  ]
  const corsOrigin = allowedOrigins.includes(origin) ? origin : '*'
  const corsHeaders = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
    'Content-Type': 'application/pdf'
  }

  // --- OPTIONS Preflight ---
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  // --- Only Allow GET ---
  if (context.request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const url = new URL(context.request.url)
  const id = url.searchParams.get("id")
  if (!id) {
    return new Response("Missing id", { status: 400, headers: corsHeaders })
  }

  // Use env vars like ai-analyze-task.js
  const supabase = createClient(
    context.env.VITE_SUPA_URL,
    context.env.VITE_SUPA_SERVICE_ROLE_KEY // Use service role for access to file_content
  )

  const { data, error } = await supabase
    .from('thesisStockResources')
    .select('file_content,file_name')
    .eq('id', id)
    .single()

  if (error || !data?.file_content) {
    return new Response("Not found", { status: 404, headers: corsHeaders })
  }

  return new Response(data.file_content, {
    headers: {
      ...corsHeaders,
      "Content-Disposition": `inline; filename="${data.file_name || "file.pdf"}"`
    }
  })
}