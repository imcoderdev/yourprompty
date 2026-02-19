// ============================================================================
// YourPrompty Chat Edge Function
// ============================================================================
// Supabase Edge Function for AI-powered chat using Google Gemini API.
// Deploy with: supabase functions deploy chat
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

// Rate limiting storage (in-memory, per function instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 10 // requests per window
const RATE_LIMIT_WINDOW = 60000 // 1 minute in ms

// System prompt for the chatbot
const SYSTEM_PROMPT = `You are Prompty, a friendly and creative AI assistant for YourPrompty - a platform where creators share AI prompts.

Your personality:
- Enthusiastic and supportive
- Creative and inspiring
- Helpful with prompt creation
- Use emojis occasionally to be friendly 😊

You can help users with:
- Creating and improving AI prompts
- Finding inspiration for images, art, and creative projects
- Understanding how to use different AI models
- Navigating the YourPrompty platform
- Tips for getting better AI-generated results

Keep responses concise but helpful. Be encouraging about users' creative ideas.

If asked to do something harmful, unethical, or outside your capabilities, politely decline and redirect to creative prompt assistance.`

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Rate limit check
function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true }
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((userLimit.resetTime - now) / 1000) 
    }
  }
  
  userLimit.count++
  return { allowed: true }
}

// Call Gemini API
async function callGemini(message: string, context: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              { text: `User context: ${context}` },
              { text: `User message: ${message}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      })
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('Gemini API error:', error)
    throw new Error('Failed to get AI response')
  }

  const data = await response.json()
  
  // Extract text from Gemini response
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!text) {
    throw new Error('No response from AI')
  }

  return text
}

// Parse actions from AI response
function parseActions(response: string): Array<{ type: string; data?: any }> {
  const actions: Array<{ type: string; data?: any }> = []
  
  // Detect navigation intents
  if (response.toLowerCase().includes('upload') && response.toLowerCase().includes('prompt')) {
    actions.push({ type: 'navigate', data: { to: 'upload' } })
  }
  
  if (response.toLowerCase().includes('profile')) {
    actions.push({ type: 'navigate', data: { to: 'profile' } })
  }
  
  return actions
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { message, context, conversationId } = await req.json()

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user ID for rate limiting (from auth header or IP)
    const authHeader = req.headers.get('Authorization')
    let userId = 'anonymous'
    
    if (authHeader && SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false }
      })
      
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      
      if (user) {
        userId = user.id
      }
    }

    // Check rate limit
    const rateLimit = checkRateLimit(userId)
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: `Too many requests. Please wait ${rateLimit.retryAfter} seconds.` 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfter)
          } 
        }
      )
    }

    // Call Gemini AI
    const aiResponse = await callGemini(message, context || 'Browsing home feed')
    
    // Parse any actions from the response
    const actions = parseActions(aiResponse)

    // Generate conversation ID if not provided
    const newConversationId = conversationId || crypto.randomUUID()

    return new Response(
      JSON.stringify({
        message: aiResponse,
        conversationId: newConversationId,
        actions
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Chat function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Something went wrong',
        message: "Oops! I'm having a bit of trouble right now. Let's try again in a moment! 😊"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
