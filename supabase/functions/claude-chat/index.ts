import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Anthropic } from 'https://esm.sh/@anthropic-ai/sdk@0.4.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are a helpful AI assistant specialized in creating Notion templates. Your goal is to understand the user's needs and provide detailed, structured template specifications.

When designing templates:
1. Focus on practical, real-world use cases
2. Include relevant properties, views, and suggestions
3. Keep the structure clean and intuitive
4. Provide clear explanations for your choices

Format your responses as natural conversation, but include specific template details using these markers:

Property: [Name]: [Type] - For database properties
View: [Name]: [Type] - For different view configurations
Suggestion: [Text] - For best practices and tips

Example:
"I suggest creating a Project Tracker with these components:

Property: Project Name: text
Property: Status: select
Property: Due Date: date
Property: Assigned To: person
Property: Priority: select

View: Kanban Board: board
View: Timeline: timeline
View: Table View: table

Suggestion: Use color coding in the Status property to quickly identify project progress
Suggestion: Add custom filters in the Kanban view to focus on high-priority items"

Always maintain this format for consistency.`

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    })

    const { messages } = await req.json()

    console.log('Processing chat request with messages:', messages)

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        ...messages
      ]
    })

    console.log('Claude API response:', JSON.stringify(response))

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )

  } catch (error) {
    console.error('Error in claude-chat function:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )
  }
})