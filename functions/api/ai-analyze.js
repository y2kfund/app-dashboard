/**
 * Cloudflare Pages Function for AI Analysis
 * Handles AI-powered analysis of dashboard screenshots and questions
 * Uses OpenRouter API for multi-model LLM access
 */

export async function onRequestPost(context) {
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS request (preflight)
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Get the API key from environment variables
    const apiKey = context.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'API key not configured' 
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    // Parse the incoming request
    const { question, screenshot, timestamp, url: pageUrl } = await context.request.json();

    // Validate required fields
    if (!question?.trim()) {
      return new Response(JSON.stringify({ 
        error: 'Question is required' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Prepare the message for the AI model with enhanced financial analysis prompt
    const messages = [
      {
        role: 'system',
        content: `You are an expert financial advisor and options trading specialist analyzing the Y2K Fund dashboard. 

Your analysis should be:
1. **Comprehensive & Data-Driven**: Extract all visible financial metrics, positions, P&L, strikes, expiration dates, and Greeks
2. **Risk-Assessed**: Categorize positions by risk level (🔴 Critical, 🟡 Moderate, 🟢 Low Risk)
3. **Actionable**: Provide specific recommendations (Hold, Close, Roll, Monitor) with reasoning
4. **Well-Structured**: Use emojis, headers, tables, and clear formatting
5. **Time-Sensitive**: Consider days to expiration and theta decay
6. **Market-Aware**: Reference current market conditions and volatility

For each position analyze:
- Current P&L (unrealized gains/losses)
- Strike price vs current stock price
- Days to expiration (calculate urgency)
- Theta decay implications
- Assignment risk and capital requirements
- Specific action recommendations with priority

Format your response with:
- Clear section headers with emojis (🔴🟡🟢⚠️✅❌📊🎯)
- Risk priority levels
- Bulleted action items
- Summary tables where appropriate
- Bottom-line recommendations

Be direct, professional, and specific. Users need actionable intelligence, not generic advice.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Question: ${question}\n\nPage URL: ${pageUrl}\nTimestamp: ${timestamp}\nCurrent Date: ${new Date().toISOString().split('T')[0]}`
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
    ];

    // Call OpenRouter API with optimized settings for detailed financial analysis
    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://www.y2k.fund'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages,
        max_tokens: 4096,
        temperature: 1.0,
        top_p: 1.0,
        top_k: 0,
      }),
    });

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      console.error('OpenRouter API error:', openrouterResponse.status, errorText);
      
      return new Response(JSON.stringify({ 
        error: 'AI service error',
        details: `Status: ${openrouterResponse.status}`
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    const openrouterData = await openrouterResponse.json();
    const response = openrouterData.choices[0]?.message?.content || 'Sorry, I could not process your request.';

    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error processing AI request:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
