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
  user_id: string;
  category?: string;
}

async function createTemplateContainer(notion: Client, spec: TemplateSpec) {
  console.log('[notion] Creating template container:', spec.template_name);
  
  const templateDbId = Deno.env.get('NOTION_TEMPLATE_DB_ID');
  if (!templateDbId) {
    throw new Error('Template database ID not configured');
  }

  // Create container page in templates database
  const containerPage = await notion.pages.create({
    parent: { database_id: templateDbId },
    properties: {
      "Title": {
        title: [{ 
          type: "text",
          text: { content: spec.template_name } 
        }]
      },
      "Description": {
        rich_text: [{ 
          type: "text",
          text: { content: spec.description } 
        }]
      },
      "Category": {
        select: { 
          name: spec.category || "Custom"
        }
      },
      "CreatedBy": {
        rich_text: [{ 
          type: "text",
          text: { content: spec.user_id } 
        }]
      },
      "CloneCount": {
        number: 0
      }
    }
  });

  console.log('[notion] Created container page:', containerPage.id);

  // Create the actual template page within the container
  const templatePage = await notion.pages.create({
    parent: { page_id: containerPage.id },
    properties: {
      title: [{ 
        type: "text",
        text: { content: `${spec.template_name} Template Content` } 
      }]
    }
  });

  console.log('[notion] Created template content page:', templatePage.id);

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
      title: [{ 
        type: "text",
        text: { content: `${spec.template_name} Database` } 
      }],
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

  return {
    containerId: containerPage.id,
    templateId: templatePage.id
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateSpec } = await req.json();
    
    // Validate required fields
    if (!templateSpec || !templateSpec.template_name || !templateSpec.description || !templateSpec.blocks || !templateSpec.user_id) {
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

    // Initialize Notion client
    const notion = new Client({ 
      auth: Deno.env.get('NOTION_ADMIN_TOKEN')
    });

    // Create template with nested structure
    const result = await createTemplateContainer(notion, templateSpec);

    // Set public sharing permissions for the template page
    await notion.pages.update({
      page_id: result.templateId,
      public_permission: { 
        type: "public",
        allow_duplicate: true 
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        template: {
          id: result.templateId,
          containerId: result.containerId,
          url: `https://notion.so/${result.templateId}`
        }
      }),
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