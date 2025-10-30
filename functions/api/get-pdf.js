import { createClient } from '@supabase/supabase-js'

export async function onRequest(context) {
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

  try {
    if (context.request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    if (context.request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders })
    }

    const url = new URL(context.request.url)
    const id = url.searchParams.get("id")
    if (!id) {
      return new Response("Missing id", { status: 400, headers: corsHeaders })
    }

    // Check env vars
    const supaUrl = context.env.VITE_SUPA_URL
    const supaKey = context.env.VITE_SUPA_ANON
    if (!supaUrl || !supaKey) {
      return new Response("Supabase env vars missing", { status: 500, headers: corsHeaders })
    }

    const supabase = createClient(supaUrl, supaKey)

    const { data, error } = await supabase
      .from('thesisStockResources')
      .select('file_content,file_name')
      .eq('id', id)
      .single()

    if (error) {
      return new Response("Supabase error: " + error.message, { status: 500, headers: corsHeaders })
    }
    if (!data?.file_content) {
      return new Response("Not found", { status: 404, headers: corsHeaders })
    }

    // Convert file_content to Uint8Array if needed
    let pdfBuffer = data.file_content
    if (typeof pdfBuffer === "string") {
      // Supabase may return base64 string for bytea, decode it
      pdfBuffer = Uint8Array.from(atob(pdfBuffer), c => c.charCodeAt(0))
    }

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Disposition": `inline; filename="${data.file_name || "file.pdf"}"`
      }
    })
  } catch (err) {
    return new Response("Internal error: " + (err?.message || err), { status: 500, headers: corsHeaders })
  }
}