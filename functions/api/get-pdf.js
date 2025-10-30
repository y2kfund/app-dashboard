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

    // Decode base64 if needed (Cloudflare Workers way)
    let pdfBuffer = data.file_content
    if (typeof pdfBuffer === 'string') {
      const binary = atob(pdfBuffer)
      const len = binary.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      pdfBuffer = bytes
    }

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${data.file_name || "file.pdf"}"`
      }
    })
  } catch (err) {
    return new Response("Internal error: " + (err?.message || err), { status: 500 })
  }
}