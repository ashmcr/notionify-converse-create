import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const NOTION_CLIENT_ID = Deno.env.get('NOTION_CLIENT_ID')!;
const NOTION_CLIENT_SECRET = Deno.env.get('NOTION_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const REDIRECT_URI = 'https://notionify-converse-create.vercel.app/settings';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('Edge function loaded and running');

serve(async (req) => {
  console.log('Received request:', {
    method: req.method,
    url: req.url,
  });

  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // This is our access token
    const error = url.searchParams.get('error');

    console.log('Request details:', { 
      code: code ? 'present' : 'missing',
      state: state ? 'present' : 'missing',
      error: error || 'none',
    });

    if (error) {
      throw new Error(`Notion authorization error: ${error}`);
    }

    if (!code) {
      throw new Error('No authorization code provided');
    }

    if (!state) {
      throw new Error('No authorization token provided');
    }

    // Initialize Supabase client
    console.log('Initializing Supabase client');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user from session token
    console.log('Getting user from session token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(state);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Invalid session');
    }

    console.log('User authenticated:', user.id);
    console.log('Exchanging code for Notion access token');

    const notionResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    console.log('Notion API response status:', notionResponse.status);

    if (!notionResponse.ok) {
      const errorData = await notionResponse.json();
      console.error('Notion API error:', errorData);
      throw new Error('Failed to exchange authorization code');
    }

    const data = await notionResponse.json();
    console.log('Notion OAuth successful:', {
      workspace_id: data.workspace_id,
      workspace_name: data.workspace_name,
    });

    console.log('Updating user profile');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        notion_workspace_id: data.workspace_id,
        notion_access_token: data.access_token,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      throw new Error('Failed to update user profile');
    }

    console.log('Profile updated successfully');

    // Redirect back to the settings page with success parameters
    const redirectUrl = new URL(REDIRECT_URI);
    redirectUrl.searchParams.set('notion_connected', 'true');
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl.toString(),
      },
    });

  } catch (error) {
    console.error('Error in notion-oauth function:', error);
    const redirectUrl = new URL(REDIRECT_URI);
    redirectUrl.searchParams.set('error', error.message);
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl.toString(),
      },
    });
  }
});