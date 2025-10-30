import { createClient } from '@supabase/supabase-js'

export async function onRequest(context) {
  try {
    if (context.request.method === 'OPTIONS') {
      return new Response(null, { status: 204 })
    }

    if (context.request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    const url = new URL(context.request.url)
    const id = url.searchParams.get("id")
    if (!id) {
      return new Response("Missing id", { status: 400 })
    }

    // Check env vars
    const supaUrl = context.env.VITE_SUPA_URL
    const supaKey = context.env.VITE_SUPA_ANON
    const supabase = createClient(supaUrl, supaKey)

    const { data, error } = await supabase
      .schema('hf')
      .from('thesisStockResources')
      .select('file_content,file_name')
      .eq('id', id)
      .single()

    if (error || !data?.file_content) {
      return new Response("Not found", { status: 404 })
    }

    // Serve as binary directly
    return new Response(data.file_content, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${data.file_name || "file.pdf"}"`
      }
    })
  } catch (err) {
    return new Response("Internal error: " + (err?.message || err), { status: 500 })
  }
}