import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyJWT } from "./auth.ts";
import { exchangeCodeForToken, findOrCreateTemplateDatabase } from "./notion.ts";
import { updateUserProfile } from "./database.ts";
import { corsHeaders, createErrorResponse } from "./utils.ts";

const FRONTEND_URL = 'https://notionify-converse-create.vercel.app';

serve(async (req) => {
  console.log('[server] Received request:', {
    method: req.method,
    url: req.url,
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    console.log('[server] Received params:', { 
      hasCode: !!code,
      hasState: !!state 
    });

    if (!code) {
      return createErrorResponse(400, 'No authorization code provided');
    }

    if (!state) {
      return createErrorResponse(400, 'No state token provided');
    }

    // Verify JWT from state parameter
    console.log('[server] Verifying state token...');
    const payload = await verifyJWT(state);
    if (!payload) {
      return createErrorResponse(401, 'Invalid or expired state token');
    }

    // Extract user ID from payload
    const userId = payload.sub;
    if (!userId) {
      return createErrorResponse(401, 'No user ID in token');
    }

    // Exchange code for Notion access token
    console.log('[server] Exchanging code for access token...');
    const notionData = await exchangeCodeForToken(code);
    if (!notionData) {
      return createErrorResponse(500, 'Failed to exchange code for access token');
    }

    // Find or create template database
    console.log('[server] Setting up template database...');
    const templateInfo = await findOrCreateTemplateDatabase(notionData.access_token);

    // Update user profile with Notion credentials and template info
    console.log('[server] Updating user profile...');
    await updateUserProfile(userId, {
      accessToken: notionData.access_token,
      workspaceId: notionData.workspace_id,
      templateDbId: templateInfo.databaseId,
      defaultPageId: templateInfo.parentPageId,
    });

    console.log('[server] OAuth flow completed successfully');

    // Redirect back to the frontend with success status
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${FRONTEND_URL}/settings?success=true`,
      },
    });

  } catch (error) {
    console.error('[server] Error in notion-oauth function:', {
      name: error.name,
      message: error.message,
      code: error?.code,
      status: error?.status,
      body: error?.body
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${FRONTEND_URL}/settings?error=${encodeURIComponent(errorMessage)}`,
      },
    });
  }
});