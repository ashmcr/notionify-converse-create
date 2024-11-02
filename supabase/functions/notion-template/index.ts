import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/notion_sdk/src/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TemplateSpec {
  template_name: string;
  description: string;
  blocks: any[];
  database_properties?: Record<string, any>;
  sample_data?: any[];
}

async function createTemplateInNotion(spec: TemplateSpec) {
  console.log('[notion] Creating template:', spec.template_name);
  
  const notion = new Client({ 
    auth: Deno.env.get('NOTION_ADMIN_TOKEN')
  });

  const templateDbId = Deno.env.get('NOTION_TEMPLATE_DB_ID');
  if (!templateDbId) {
    throw new Error('Template database ID not configured');
  }

  try {
    // First, create the template entry in the templates database
    console.log('[notion] Creating template entry in database:', templateDbId);
    const templatePage = await notion.pages.create({
      parent: {
        database_id: templateDbId
      },
      properties: {
        Name: {
          title: [{ text: { content: spec.template_name } }]
        },
        Description: {
          rich_text: [{ text: { content: spec.description } }]
        },
        Status: {
          select: { name: 'draft' }
        }
      }
    });

    console.log('[notion] Created template page:', templatePage.id);

    // Add template content blocks
    if (spec.blocks && spec.blocks.length > 0) {
      console.log('[notion] Adding template blocks');
      await notion.blocks.children.append({
        block_id: templatePage.id,
        children: spec.blocks
      });
    }

    // If template includes a database, create it
    if (spec.database_properties) {
      console.log('[notion] Creating template database');
      const database = await notion.databases.create({
        parent: { page_id: templatePage.id },
        title: [{ text: { content: `${spec.template_name} Database` } }],
        properties: spec.database_properties
      });

      console.log('[notion] Created database:', database.id);

      // Add sample data if provided
      if (spec.sample_data && spec.sample_data.length > 0) {
        console.log('[notion] Adding sample data');
        for (const item of spec.sample_data) {
          await notion.pages.create({
            parent: { database_id: database.id },
            properties: item
          });
        }
      }
    }

    // Make template public and update status
    console.log('[notion] Publishing template');
    const publicPage = await notion.pages.update({
      page_id: templatePage.id,
      properties: {
        Status: {
          select: { name: 'published' }
        },
        PublicURL: {
          url: `https://notion.so/${templatePage.id}`
        }
      }
    });

    console.log('[notion] Template published:', publicPage.id);

    return {
      success: true,
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
    const { templateSpec } = await req.json();
    
    // Validate required fields
    if (!templateSpec || !templateSpec.template_name || !templateSpec.description || !templateSpec.blocks) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: 'Missing required fields in template specification' }
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

    // Create template in Notion
    const result = await createTemplateInNotion(templateSpec);

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
        success: false,
        error: { message: error.message || 'Internal server error' }
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});