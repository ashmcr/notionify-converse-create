import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Anthropic } from 'https://esm.sh/@anthropic-ai/sdk@0.4.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are a technical Notion template architect. Your role is to provide specific, technical instructions for creating Notion databases with detailed property configurations and view setups. 

When analyzing user requests, always respond with a structured template specification in this format:

1. Database Properties (provide exact technical specifications):
{
  "properties": {
    "Name": { "type": "title" },
    // List all properties with exact Notion API specifications
    // Include property configurations, options, and validations
  }
}

2. View Configurations (specify all views with settings):
{
  "views": [
    {
      "type": "table|board|calendar|etc",
      "name": "View Name",
      "filter": {}, // Include filter specifications
      "sort": {},   // Include sort specifications
      // Include all view-specific settings
    }
  ]
}

3. Automation Suggestions:
- List specific Notion formulas
- Provide relation configurations
- Suggest rollup calculations

4. Template Structure:
- Provide exact property types and options
- Include sample data format
- Specify relation and rollup configurations

Example response format:
{
  "template": {
    "name": "Template Name",
    "properties": {
      // Exact Notion API property configurations
    },
    "views": [
      // Exact view configurations
    ],
    "automations": [
      // Formula and relation specifications
    ],
    "sample_data": [
      // Example entries in correct format
    ]
  }
}`

function validateTemplateSpec(content: string): boolean {
  try {
    const spec = JSON.parse(content);
    if (!spec.template) return false;
    
    const requiredFields = ['properties', 'views', 'automations'];
    return requiredFields.every(field => spec.template[field] !== undefined);
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    })

    const { messages } = await req.json()

    console.log('Processing template chat request:', messages)

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        ...messages.map(msg => ({
          role: msg.role,
          content: `${msg.role === 'user' ? 'Create a Notion template for: ' : ''}${msg.content}`
        }))
      ]
    })

    console.log('Claude API response:', JSON.stringify(response))

    // Validate template specification
    if (!validateTemplateSpec(response.content[0].text)) {
      throw new Error('Invalid template specification format');
    }

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