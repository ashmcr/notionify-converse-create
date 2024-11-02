import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/notion_sdk/src/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TemplateData {
  name: string;
  description: string;
  category: string;
  blocks: any[];
}

async function createTemplateInWorkspace(templateData: TemplateData, userId: string) {
  console.log('[notion] Creating template:', templateData.name);
  
  const notion = new Client({ 
    auth: Deno.env.get('NOTION_ADMIN_TOKEN')
  });

  const templateDbId = Deno.env.get('NOTION_TEMPLATE_DB_ID');
  if (!templateDbId) {
    throw new Error('Template database ID not configured');
  }

  try {
    // Create template in central database
    const templatePage = await notion.pages.create({
      parent: {
        database_id: templateDbId
      },
      properties: {
        Name: {
          title: [{ text: { content: templateData.name } }]
        },
        Description: {
          rich_text: [{ text: { content: templateData.description } }]
        },
        Category: {
          select: { name: templateData.category }
        },
        Status: {
          select: { name: 'draft' }
        },
        CreatedBy: {
          rich_text: [{ text: { content: userId } }]
        },
        DateCreated: {
          date: { start: new Date().toISOString() }
        }
      }
    });

    console.log('[notion] Created template page:', templatePage.id);

    // Add template content
    await notion.blocks.children.append({
      block_id: templatePage.id,
      children: templateData.blocks
    });

    console.log('[notion] Added template content');

    // Make template public
    const publicPage = await notion.pages.update({
      page_id: templatePage.id,
      properties: {
        Status: {
          select: { name: 'published' }
        },
        PublicURL: {
          url: `https://notion.so/${templatePage.id}`
        },
        LastModified: {
          date: { start: new Date().toISOString() }
        }
      }
    });

    console.log('[notion] Template published:', publicPage.id);

    return {
      templateId: templatePage.id,
      publicUrl: `https://notion.so/${templatePage.id}`
    };
  } catch (error) {
    console.error('[notion] Template creation failed:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Get request data
    const { templateData } = await req.json();
    if (!templateData) {
      throw new Error('Missing template data');
    }

    // Create template
    const result = await createTemplateInWorkspace(templateData, authHeader);

    return new Response(
      JSON.stringify(result),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('[server] Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});