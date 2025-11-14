import { createClient } from '@supabase/supabase-js'

/**
 * Cron job for automated AI analysis of instrument details
 * Captures screenshot and gets AI recommendations, stores in existing ai_recommendations_conversations table
 * 
 * Required environment variables:
 * - VITE_SUPA_URL: Supabase URL
 * - VITE_SUPA_ANON: Supabase anonymous key
 * - VITE_SUPA_SERVICE_KEY: Supabase service role key (for auth bypass)
 * - OPENROUTER_API_KEY: OpenRouter API key
 * - VITE_APP_URL: Your app URL (e.g., https://www.y2k.fund)
 * 
 * Usage:
 * POST /api/cron-ai-analysis
 * Body: { "userId": "uuid", "symbolRoot": "META" }
 */

export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  }

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    }), { status: 405, headers: corsHeaders })
  }

  try {
    const { userId, symbolRoot } = await context.request.json()

    if (!userId || !symbolRoot) {
      return new Response(JSON.stringify({
        error: 'Missing parameters',
        message: 'userId and symbolRoot are required'
      }), { status: 400, headers: corsHeaders })
    }

    console.log(`[Cron] Starting automated AI analysis for ${symbolRoot} (user: ${userId})`)

    // Initialize Supabase with service role key (bypasses RLS)
    const supabase = createClient(
      context.env.VITE_SUPA_URL,
      context.env.VITE_SUPA_SERVICE_KEY || context.env.VITE_SUPA_ANON
    )

    // Step 1: Capture screenshot
    const screenshot = await captureScreenshot(context, userId, symbolRoot)

    if (!screenshot) {
      throw new Error('Failed to capture screenshot')
    }

    console.log(`[Cron] Screenshot captured successfully`)

    // Step 2: Get AI analysis
    const aiResponse = await getAiAnalysis(context, screenshot, symbolRoot)

    console.log(`[Cron] AI analysis received`)

    // Step 3: Save to existing ai_recommendations_conversations table
    const pageUrl = `${context.env.VITE_APP_URL || 'https://www.y2k.fund'}/instrument-details/${symbolRoot}`
    
    const { data: savedConversation, error: saveError } = await supabase
      .from('ai_recommendations_conversations')
      .insert({
        user_id: userId,
        symbol_root: symbolRoot,
        question: `🤖 Automated daily analysis for ${symbolRoot}`,
        screenshot: screenshot,
        ai_response: aiResponse.response,
        model: aiResponse.model,
        page_url: pageUrl,
        metadata: {
          timestamp: aiResponse.timestamp,
          automated: true,
          cron_trigger: true,
          analysis_type: 'daily_automated'
        }
      })
      .select()
      .single()

    if (saveError) {
      console.error('[Cron] Database save error:', saveError)
      throw saveError
    }

    console.log(`[Cron] Analysis saved to database: ${savedConversation.id}`)

    return new Response(JSON.stringify({
      success: true,
      conversation_id: savedConversation.id,
      symbol_root: symbolRoot,
      user_id: userId,
      timestamp: new Date().toISOString(),
      message: `Automated analysis completed for ${symbolRoot}`
    }), { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('[Cron] Error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error instanceof Error ? error.stack : undefined
    }), { status: 500, headers: corsHeaders })
  }
}

/**
 * Capture screenshot using Cloudflare Browser Rendering
 * Falls back to external screenshot service if not available
 */
async function captureScreenshot(context, userId, symbolRoot) {
  try {
    const pageUrl = `${context.env.VITE_APP_URL || 'https://www.y2k.fund'}/instrument/${symbolRoot}`

    // Option 1: Cloudflare Browser Rendering (if available)
    if (context.env.MYBROWSER) {
      console.log('[Cron] Using Cloudflare Browser Rendering')
      
      const browser = await context.env.MYBROWSER.launch()
      const page = await browser.newPage()
      
      // Navigate to the page
      await page.goto(pageUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      
      // Wait for the specific element
      await page.waitForSelector('.instrument-details-container', { timeout: 10000 })
      
      // Additional wait to ensure all data is loaded
      await page.waitForTimeout(2000)
      
      // Take screenshot of the container
      const element = await page.$('.instrument-details-container')
      const screenshotBuffer = await element.screenshot({ 
        type: 'jpeg',
        quality: 85,
        encoding: 'binary'
      })
      
      await browser.close()
      
      // Convert to base64
      const base64Screenshot = `data:image/jpeg;base64,${Buffer.from(screenshotBuffer).toString('base64')}`
      
      return base64Screenshot
    }

    // Option 2: Use screenshot.one API (fallback)
    console.log('[Cron] Using Screenshot.one API (fallback)')
    
    const screenshotApiUrl = `https://api.screenshot.one/take?access_key=${context.env.SCREENSHOT_ONE_API_KEY}&url=${encodeURIComponent(pageUrl)}&format=jpeg&quality=85&selector=.instrument-details-container&full_page=false&device_scale_factor=2`
    
    const response = await fetch(screenshotApiUrl)
    
    if (!response.ok) {
      throw new Error(`Screenshot API failed: ${response.statusText}`)
    }
    
    const screenshotBuffer = await response.arrayBuffer()
    const base64Screenshot = `data:image/jpeg;base64,${Buffer.from(screenshotBuffer).toString('base64')}`
    
    return base64Screenshot

  } catch (error) {
    console.error('[Cron] Screenshot capture failed:', error)
    throw error
  }
}

/**
 * Send screenshot to AI for automated analysis
 */
async function getAiAnalysis(context, screenshot, symbolRoot) {
  const apiKey = context.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const messages = [
    {
      role: 'system',
      content: `You are a professional hedge fund analyst providing automated daily analysis of options positions.

Your role is to:
- Provide clear, actionable insights on the current position status
- Identify risks and opportunities based on the data shown
- Suggest adjustments or highlight areas requiring attention
- Consider market dynamics and upcoming events

Format your response with:
1. **Position Summary** - Quick overview of current holdings
2. **Risk Assessment** - Key risks and exposure levels
3. **Market Context** - Relevant market conditions
4. **Recommendations** - Specific actionable suggestions
5. **Watch List** - Important dates or levels to monitor

Be concise, data-driven, and professional. This is an automated daily report that will appear in the user's conversation timeline.`
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `📊 **Automated Daily Analysis Request**

**Symbol:** ${symbolRoot}
**Date:** ${currentDate}
**Type:** Scheduled automated analysis

Please analyze the positions shown in the screenshot and provide your daily assessment.`
        },
        {
          type: 'image_url',
          image_url: {
            url: screenshot,
            detail: 'high'
          }
        }
      ]
    }
  ]

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': context.env.VITE_APP_URL || 'https://www.y2k.fund',
      'X-Title': 'Y2K Fund - Automated Daily Analysis'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      messages,
      max_tokens: 4096,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const aiResponse = data.choices?.[0]?.message?.content

  if (!aiResponse) {
    throw new Error('No response from AI')
  }

  return {
    response: aiResponse,
    model: 'anthropic/claude-sonnet-4.5',
    timestamp: new Date().toISOString()
  }
}

export const onRequestPost = onRequest