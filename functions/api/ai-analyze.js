/**
 * Cloudflare Pages Function for AI Analysis
 * Handles AI-powered analysis of dashboard screenshots and questions
 * Uses OpenRouter API for multi-model LLM access
 */

export async function onRequest(context) {
  // Handle CORS - allow requests from localhost during development
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
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
    'Content-Type': 'application/json'
  }

  // Handle OPTIONS request (preflight)
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  // Only allow POST requests for actual API calls
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    }), {
      status: 405,
      headers: corsHeaders
    })
  }

  try {
    // Get the API key from environment variables
    const apiKey = context.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'Configuration error',
        message: 'OpenRouter API key is not configured'
      }), {
        status: 500,
        headers: corsHeaders
      })
    }

    // Parse the incoming request
    const { question, screenshot, timestamp, url: pageUrl, context: conversationContext } = await context.request.json()

    // Validate required fields
    if (!question?.trim()) {
      return new Response(JSON.stringify({ 
        error: 'Validation error',
        message: 'Question is required'
      }), {
        status: 400,
        headers: corsHeaders
      })
    }

    // Build messages array for the AI
    const messages = [
      {
        role: 'system',
        content: `You are an expert financial advisor and options trading analyst with deep expertise in risk management and portfolio optimization.

Current date: ${new Date().toISOString().split('T')[0]}

When analyzing positions, you MUST:

## Risk Assessment Framework
- Use color-coded risk indicators: 🔴 HIGH RISK | 🟡 MODERATE RISK | 🟢 LOW RISK
- Evaluate time decay (Theta) impact on positions
- Consider implied volatility and upcoming events
- Assess assignment risk for short positions
- Calculate potential max loss scenarios

## Analysis Structure
1. **Overall Portfolio Health**
   - Total P&L summary
   - Capital at risk assessment
   - Diversification analysis

2. **Individual Position Analysis**
   - Current P&L and percentage return
   - Days to expiration and theta decay
   - Strike price vs current stock price
   - Recommendation: HOLD | CLOSE | ROLL | ADJUST

3. **Priority Actions**
   - Immediate actions required (next 24-48 hours)
   - Weekly monitoring items
   - Month-end considerations

4. **Strategic Recommendations**
   - Position sizing suggestions
   - Risk mitigation strategies
   - Potential adjustment strategies (rolls, spreads, hedges)

## Formatting Guidelines
- Use **bold** for emphasis
- Use emojis for visual clarity (🔴🟡🟢 for risk, ✅❌⚠️ for actions)
- Create tables for multi-position comparisons
- Provide specific numeric targets and dates
- Include reasoning for each recommendation

${conversationContext ? `
## Conversation Context
This is a follow-up question. Previous context:
- Previous Question: "${conversationContext.previousQuestion}"
- Previous Response: "${conversationContext.previousResponse}"

The user is asking a follow-up question about the same positions/screenshot. Maintain continuity with your previous analysis while addressing the new question.
` : ''}

Be direct, actionable, and data-driven. Always consider the user's risk tolerance and time horizon.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `${conversationContext ? 'Follow-up question: ' : ''}${question}\n\nPage URL: ${pageUrl}\nTimestamp: ${timestamp}`
          },
          ...(screenshot ? [{
            type: 'image_url',
            image_url: {
              url: screenshot,
              detail: 'high'
            }
          }] : [])
        ]
      }
    ]

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://www.y2k.fund',
        'X-Title': 'Y2K Fund Dashboard'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: messages,
        max_tokens: 4096,
        temperature: 1.0,
        top_p: 1.0,
        top_k: 0
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenRouter API error:', errorData)
      return new Response(JSON.stringify({ 
        error: 'AI service error',
        message: errorData.error?.message || 'Failed to get AI response'
      }), {
        status: response.status,
        headers: corsHeaders
      })
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content

    if (!aiResponse) {
      return new Response(JSON.stringify({ 
        error: 'Invalid response',
        message: 'No response from AI'
      }), {
        status: 500,
        headers: corsHeaders
      })
    }

    // Return successful response
    return new Response(JSON.stringify({ 
      response: aiResponse,
      timestamp: new Date().toISOString(),
      model: 'anthropic/claude-sonnet-4.5'
    }), {
      status: 200,
      headers: corsHeaders
    })

  } catch (error) {
    console.error('Error in ai-analyze function:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: corsHeaders
    })
  }
}

// Export both onRequest and onRequestPost for flexibility
export const onRequestPost = onRequest
