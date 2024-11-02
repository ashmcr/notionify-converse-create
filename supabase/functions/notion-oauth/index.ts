import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const NOTION_CLIENT_ID = Deno.env.get('NOTION_CLIENT_ID')!;
const NOTION_CLIENT_SECRET = Deno.env.get('NOTION_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!code) {
      throw new Error('No authorization code provided');
    }

    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get the user ID from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Invalid session');
    }

    // Exchange the authorization code for access token
    console.log('Exchanging code for access token...');
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${req.headers.get('origin')}/settings`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notion API error:', errorData);
      throw new Error('Failed to exchange authorization code');
    }

    const data = await response.json();
    console.log('Successfully received Notion tokens');

    // Update the user's profile with Notion credentials
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

    console.log('Successfully updated user profile with Notion credentials');

    return new Response(JSON.stringify({
      access_token: data.access_token,
      workspace_id: data.workspace_id,
      workspace_name: data.workspace_name,
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error in notion-oauth function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});