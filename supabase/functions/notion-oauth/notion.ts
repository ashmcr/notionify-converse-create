import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const NOTION_CLIENT_ID = Deno.env.get('NOTION_CLIENT_ID')!;
const NOTION_CLIENT_SECRET = Deno.env.get('NOTION_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

export const exchangeCodeForToken = async (code: string) => {
  console.log('[notion] Exchanging code for access token');
  
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
    console.error('[notion] Failed to exchange code:', await response.text());
    return null;
  }

  const data = await response.json();
  console.log('[notion] Successfully exchanged code for token');
  return data;
};