import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      console.warn('⚠️  GEMINI_API_KEY not set! Chatbot will use fallback responses.');
      this.isConfigured = false;
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' 
    });
    this.isConfigured = true;
    console.log('✅ Gemini AI initialized successfully');
  }

  buildSystemContext(user, context) {
    return `You are Prompty, creative AI assistant for YourPrompty! 🎨

YourPrompty = Platform for sharing AI prompts

YOUR MAIN JOB - GIVE PROMPT IDEAS!
When user asks for a prompt (photo, art, design, etc):
✅ CREATE a creative prompt for them immediately!
✅ Examples:
  - "casual photo" → "Candid lifestyle shot, golden hour lighting, person enjoying coffee at outdoor cafe, natural smile, warm tones 📸"
  - "fashion photo" → "High fashion editorial, dramatic side lighting, minimalist background, confident pose, haute couture styling ✨"
  
Also help with:
✅ Signing up, uploading, browsing YourPrompty
✅ Friendly greetings and casual chat

Only refuse: Politics, math, history, news (off-topic stuff)

IMPORTANT: Prompt requests = YOUR SPECIALTY! Help them!

Keep SHORT (1-2 sentences)!

${user ? `User: ${user.name}` : 'User: Guest'}`;
  }

  async chat(message, user = null, context = null, conversationHistory = []) {
    try {
      // Fallback if API not configured
      if (!this.isConfigured) {
        return this.getFallbackResponse(message);
      }

      const systemContext = this.buildSystemContext(user, context);
      
      // Build conversation history
      const history = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      // Start chat with history
      const chat = this.model.startChat({
        history: history,
        generationConfig: {
          temperature: 0.8,
          topK: 30,
          topP: 0.9,
          maxOutputTokens: 80, // Super short!
        },
      });

      // Send message with system context prepended to EVERY message for enforcement
      const fullMessage = `${systemContext}

User Question: ${message}

Remember: If user asks for prompt ideas/suggestions, GIVE them creative prompts! If asking about YourPrompty features, help them! Only refuse if completely off-topic (politics, math, etc).`;

      const result = await chat.sendMessage(fullMessage);
      const response = result.response.text();

      // Check for action triggers
      const actions = this.detectActions(message, response);

      return {
        success: true,
        message: response,
        actions: actions
      };

    } catch (error) {
      console.error('Gemini API Error:', error);
      
      // Fallback on error
      return {
        success: false,
        message: this.getFallbackResponse(message),
        actions: [],
        error: error.message
      };
    }
  }

  detectActions(userMessage, botResponse) {
    const actions = [];
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = botResponse.toLowerCase();

    // Detect filter action
    const categories = ['photography', 'digital art', 'character', 'landscape', 'abstract', 'product', 'ai art', 'anime', '3d render', 'illustration', 'coding', 'ui/ux', 'web design', 'logo design', 'branding', 'marketing', 'social media', 'video', 'music', 'writing'];
    for (const category of categories) {
      if (lowerMessage.includes(category) || lowerResponse.includes(category)) {
        actions.push({
          type: 'FILTER_CATEGORY',
          category: category.charAt(0).toUpperCase() + category.slice(1)
        });
        break;
      }
    }

    // Detect upload action
    if (lowerMessage.includes('upload') || lowerMessage.includes('create prompt') || lowerMessage.includes('share')) {
      actions.push({ type: 'OPEN_UPLOAD' });
    }

    // Detect auth action
    if (lowerMessage.includes('sign up') || lowerMessage.includes('create account') || lowerMessage.includes('register')) {
      actions.push({ type: 'SHOW_AUTH', mode: 'signup' });
    }

    if (lowerMessage.includes('sign in') || lowerMessage.includes('log in') || lowerMessage.includes('login')) {
      actions.push({ type: 'SHOW_AUTH', mode: 'signin' });
    }

    return actions;
  }

  getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase().trim();

    // Handle greetings warmly
    const greetings = ['hi', 'hello', 'hey', 'sup', 'yo', 'hola', 'greetings'];
    if (greetings.some(g => lowerMessage === g || lowerMessage.startsWith(g + ' ') || lowerMessage.endsWith(' ' + g))) {
      return "Hey there! 😊 Need prompt ideas or help with YourPrompty?";
    }

    // Check if asking for prompt suggestions
    const promptRelated = ['prompt', 'photo', 'photography', 'art', 'design', 'image'];
    const isPromptRequest = promptRelated.some(keyword => lowerMessage.includes(keyword));
    
    if (isPromptRequest) {
      return "I can help with prompt ideas! Try the search or browse our categories for inspiration! 🎨";
    }

    if (lowerMessage.includes('sign') || lowerMessage.includes('account') || lowerMessage.includes('register') || lowerMessage.includes('login')) {
      return "Click Sign Up in the top right to join! 🎉";
    }

    if (lowerMessage.includes('upload') || lowerMessage.includes('post') || lowerMessage.includes('share')) {
      return "Click Upload Prompt in the header! 🚀";
    }

    if (lowerMessage.includes('browse') || lowerMessage.includes('search') || lowerMessage.includes('find')) {
      return "Use the search bar or browse categories! 🔍";
    }

    // Default
    return "I help with YourPrompty! Ask for prompt ideas or help using the site! 😊";
  }

  async streamChat(message, user = null, context = null, conversationHistory = []) {
    // For future implementation: streaming responses
    // This will show text as it's being generated
    return this.chat(message, user, context, conversationHistory);
  }
}

const geminiServiceInstance = new GeminiService();
export default geminiServiceInstance;
