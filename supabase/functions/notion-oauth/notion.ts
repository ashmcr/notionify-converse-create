import { Client } from "https://deno.land/x/notion_sdk/src/mod.ts";

export const exchangeCodeForToken = async (code: string) => {
  console.log('[notion] Exchanging code for access token');
  
  try {
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${Deno.env.get('NOTION_CLIENT_ID')}:${Deno.env.get('NOTION_CLIENT_SECRET')}`)}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/notion-oauth`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[notion] Token exchange failed:', errorText);
      throw new Error(`Failed to exchange code: ${errorText}`);
    }

    const data = await response.json();
    console.log('[notion] Successfully exchanged code for token');
    return data;
  } catch (error) {
    console.error('[notion] Error exchanging code:', error);
    throw error;
  }
};

interface NotionResponse {
  id: string;
  url: string;
  parent: {
    type: string;
    workspace?: boolean;
    page_id?: string;
  };
}

function validateDatabaseResponse(response: NotionResponse): void {
  if (!response?.id) {
    throw new Error('Invalid database response: missing id');
  }
  if (!response?.parent?.type) {
    throw new Error('Invalid database response: missing parent type');
  }
}

export const findOrCreateTemplateDatabase = async (accessToken: string) => {
  console.log('[notion] Initializing template database setup');
  const notion = new Client({ 
    auth: accessToken,
    logLevel: 'debug'
  });

  const startTime = Date.now();

  try {
    // First try to find existing database
    console.log('[notion] Searching for existing template database...');
    const response = await notion.search({
      query: "NotionGPT Template Library",
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time'
      },
      filter: {
        property: 'object',
        value: 'database'
      }
    });

    console.log('[notion] Search completed in', Date.now() - startTime, 'ms');
    console.log('[notion] Found', response.results.length, 'matching databases');

    if (response.results.length > 0) {
      const templateDb = response.results[0];
      console.log('[notion] Using existing database:', templateDb.id);
      
      // Verify permissions
      await notion.databases.retrieve({ database_id: templateDb.id });
      validateDatabaseResponse(templateDb as NotionResponse);
      
      return {
        databaseId: templateDb.id,
        parentPageId: templateDb.parent.type === 'page_id' ? templateDb.parent.page_id : null,
      };
    }

    // First, create a parent page to host our database
    console.log('[notion] Creating parent page for database');
    const parentPage = await notion.pages.create({
      parent: { type: "workspace", workspace: true },
      properties: {
        title: [{ 
          type: "text",
          text: { content: "NotionGPT Templates" }
        }]
      }
    });

    // Create new database under the parent page
    console.log('[notion] Creating new template database under parent page');
    const newDb = await notion.databases.create({
      parent: { 
        type: "page_id",
        page_id: parentPage.id
      },
      title: [{ type: "text", text: { content: "NotionGPT Template Library" } }],
      properties: {
        Name: { title: {} },
        Category: {
          select: {
            options: [
              { name: "Project Management", color: "blue" },
              { name: "Personal Organization", color: "green" },
              { name: "Content Planning", color: "purple" },
              { name: "Custom", color: "default" },
            ]
          }
        },
        Description: { rich_text: {} },
        Instructions: { rich_text: {} },
        Status: {
          select: {
            options: [
              { name: "Draft", color: "gray" },
              { name: "Active", color: "green" },
              { name: "Archived", color: "red" },
            ]
          }
        },
        "Views Required": {
          multi_select: {
            options: [
              { name: "Table", color: "blue" },
              { name: "Calendar", color: "green" },
              { name: "Board", color: "orange" },
              { name: "Timeline", color: "red" },
              { name: "Gallery", color: "purple" },
            ]
          }
        },
        Rating: { number: {} },
      },
    });

    console.log('[notion] Database creation completed in', Date.now() - startTime, 'ms');
    validateDatabaseResponse(newDb as NotionResponse);
    
    return {
      databaseId: newDb.id,
      parentPageId: parentPage.id,
    };
  } catch (error) {
    console.error('[notion] Error in template database setup:', {
      name: error.name,
      message: error.message,
      code: error?.code,
      status: error?.status,
      body: error?.body
    });
    throw error;
  }
};