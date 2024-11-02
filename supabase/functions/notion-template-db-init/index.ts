import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const NOTION_CLIENT_ID = Deno.env.get('NOTION_CLIENT_ID')!;
const NOTION_CLIENT_SECRET = Deno.env.get('NOTION_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const EXAMPLE_TEMPLATES = [
  {
    name: "Project Tracker",
    category: "Project Management",
    description: "Track project progress, milestones, and team assignments",
    instructions: "1. Add your project\n2. Set up milestones\n3. Assign team members\n4. Track progress",
    status: "Example",
    views: ["Table", "Board", "Timeline"],
  },
  {
    name: "Content Calendar",
    category: "Content Management",
    description: "Plan and schedule content across different platforms",
    instructions: "1. Plan content topics\n2. Set publication dates\n3. Track content status\n4. Monitor performance",
    status: "Example",
    views: ["Calendar", "Table", "Board"],
  },
  {
    name: "Personal Task Manager",
    category: "Personal Organization",
    description: "Organize personal tasks and track habits",
    instructions: "1. Add your tasks\n2. Set priorities\n3. Track deadlines\n4. Monitor habits",
    status: "Example",
    views: ["Board", "Calendar", "Table"],
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Verify the session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) throw new Error('Invalid session');

    // Get user's Notion access token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('notion_access_token')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.notion_access_token) {
      throw new Error('Notion connection not found');
    }

    // Create the database in Notion
    const response = await fetch('https://api.notion.com/v1/databases', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profile.notion_access_token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { type: "workspace", workspace: true },
        title: [{ type: "text", text: { content: "Template Library" } }],
        properties: {
          Name: { title: {} },
          Category: {
            select: {
              options: [
                { name: "Project Management", color: "blue" },
                { name: "Personal Organization", color: "green" },
                { name: "Content Management", color: "orange" },
                { name: "Custom", color: "default" },
              ]
            }
          },
          Description: { rich_text: {} },
          Instructions: { rich_text: {} },
          Status: {
            select: {
              options: [
                { name: "Ready to Use", color: "green" },
                { name: "Example", color: "blue" },
                { name: "Custom", color: "default" },
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
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create Notion database');
    }

    const { id: database_id } = await response.json();

    // Add example templates
    for (const template of EXAMPLE_TEMPLATES) {
      await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${profile.notion_access_token}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          parent: { database_id },
          properties: {
            Name: { title: [{ text: { content: template.name } }] },
            Category: { select: { name: template.category } },
            Description: { rich_text: [{ text: { content: template.description } }] },
            Instructions: { rich_text: [{ text: { content: template.instructions } }] },
            Status: { select: { name: template.status } },
            "Views Required": { multi_select: template.views.map(name => ({ name })) },
            Rating: { number: 5 },
          },
        }),
      });
    }

    return new Response(JSON.stringify({ database_id }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});