import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyJWT } from "./auth.ts";
import { exchangeCodeForToken, findTemplateDatabase } from "./notion.ts";
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

    // Find template database and validate permissions
    console.log('[server] Looking for template database...');
    let templateInfo = null;
    try {
      templateInfo = await findTemplateDatabase(notionData.access_token);
    } catch (error) {
      console.log('[server] Template database not found or inaccessible:', error);
      // Continue without template info - user might not have created it yet
    }

    // Update user profile with Notion credentials and template info
    console.log('[server] Updating user profile...');
    await updateUserProfile(userId, {
      accessToken: notionData.access_token,
      workspaceId: notionData.workspace_id,
      templateDbId: templateInfo?.databaseId,
      defaultPageId: templateInfo?.parentPageId,
    });

    console.log('[server] OAuth flow completed successfully');

    // Redirect back to the frontend
    const redirectUrl = new URL('/settings', FRONTEND_URL);
    redirectUrl.searchParams.set('success', 'true');
    
    if (!templateInfo) {
      redirectUrl.searchParams.set('warning', 'template-not-found');
    }

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl.toString(),
      },
    });

  } catch (error) {
    console.error('[server] Error in notion-oauth function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    const redirectUrl = new URL('/settings', FRONTEND_URL);
    redirectUrl.searchParams.set('error', encodeURIComponent(errorMessage));
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl.toString(),
      },
    });
  }
});