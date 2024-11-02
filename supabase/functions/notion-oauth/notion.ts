import { Client } from "https://deno.land/x/notion_sdk/src/mod.ts";
import { corsHeaders } from "./utils.ts";

const NOTION_CLIENT_ID = Deno.env.get('NOTION_CLIENT_ID')!;
const NOTION_CLIENT_SECRET = Deno.env.get('NOTION_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

export const exchangeCodeForToken = async (code: string) => {
  console.log('[notion] Exchanging code for access token');
  
  try {
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`)}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${SUPABASE_URL}/functions/v1/notion-oauth`,
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

export const findTemplateDatabase = async (accessToken: string) => {
  console.log('[notion] Searching for template database');
  const notion = new Client({ auth: accessToken });

  try {
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

    console.log('[notion] Search results:', JSON.stringify(response.results.length));

    if (!response.results.length) {
      throw new Error('Template database not found');
    }

    const templateDb = response.results[0];
    console.log('[notion] Found template database:', templateDb.id);

    // Verify permissions by trying to retrieve the database
    await notion.databases.retrieve({ database_id: templateDb.id });

    return {
      databaseId: templateDb.id,
      parentPageId: templateDb.parent.type === 'page_id' ? templateDb.parent.page_id : null,
    };
  } catch (error) {
    console.error('[notion] Error finding template:', error);
    throw error;
  }
};