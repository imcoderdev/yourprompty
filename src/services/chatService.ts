// ============================================================================
// Chat Service - Direct Gemini API Call
// ============================================================================
// Calls Google Gemini API directly from frontend for instant responses.
// ============================================================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface ChatMessage {
  message: string;
  context?: string;
  conversationId?: string | null;
}

interface ChatResponse {
  message: string;
  conversationId: string;
  actions?: Array<{
    type: string;
    [key: string]: any;
  }>;
}

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

Keep responses concise but helpful (2-3 sentences max). Be encouraging about users' creative ideas.`;

// ============================================================================
// DIRECT GEMINI API CALL - Fast response!
// ============================================================================

export async function sendMessage(input: ChatMessage): Promise<{
  data: ChatResponse | null;
  error: any;
}> {
  try {
    if (!GEMINI_API_KEY) {
      console.error('VITE_GEMINI_API_KEY not found in environment');
      return { 
        data: { 
          message: "I'm not configured yet! Please add VITE_GEMINI_API_KEY to your .env.local file. 🔧",
          conversationId: input.conversationId || crypto.randomUUID()
        }, 
        error: null 
      };
    }

    console.log('Calling Gemini API directly...');
    const startTime = Date.now();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
                { text: `User context: ${input.context || 'Browsing home feed'}` },
                { text: `User message: ${input.message}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 256, // Keep responses short for speed
          }
        })
      }
    );

    const elapsed = Date.now() - startTime;
    console.log(`Gemini API responded in ${elapsed}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    
    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response from AI');
    }

    return {
      data: {
        message: text,
        conversationId: input.conversationId || crypto.randomUUID(),
        actions: []
      },
      error: null
    };
  } catch (err: any) {
    console.error('Error in sendMessage:', err);
    return { 
      data: { 
        message: "Oops! Something went wrong. Let me try again! 😊",
        conversationId: input.conversationId || crypto.randomUUID()
      }, 
      error: null // Return a friendly message instead of error
    };
  }
}
