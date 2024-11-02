import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Anthropic } from 'https://esm.sh/@anthropic-ai/sdk@0.4.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `// ... keep existing code`

const REFINEMENT_PROMPTS = {
  properties: `Based on the template specification provided, suggest additional properties that would enhance the functionality. Include exact Notion API configurations for each suggestion.`,
  
  views: `Analyze the current view configurations and recommend additional views that would improve data visualization and workflow. Provide complete view specifications.`,
  
  automations: `Review the template structure and suggest advanced automations using Notion formulas, relations, and rollups. Include exact formula syntax and configuration details.`,
  
  optimization: `Evaluate the current template specification and suggest optimizations for performance and usability. Include specific technical improvements.`
};

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
    });

    const { messages, refinementType } = await req.json()
    
    console.log('Processing template chat request:', { messages, refinementType })

    // If refinementType is provided, append the appropriate refinement prompt
    const finalMessages = refinementType 
      ? [
          ...messages,
          {
            role: 'user',
            content: REFINEMENT_PROMPTS[refinementType as keyof typeof REFINEMENT_PROMPTS]
          }
        ]
      : messages;

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        ...finalMessages.map(msg => ({
          role: msg.role,
          content: `${msg.role === 'user' && !refinementType ? 'Create a Notion template for: ' : ''}${msg.content}`
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