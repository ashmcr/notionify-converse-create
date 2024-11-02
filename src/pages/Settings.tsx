import { useSession } from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TemplateDbInitDialog } from "@/components/notion/TemplateDbInitDialog";

const NOTION_CLIENT_ID = import.meta.env.VITE_NOTION_CLIENT_ID;
const NOTION_REDIRECT_URI = `${window.location.origin}/settings`;

export default function Settings() {
  const session = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [showInitDialog, setShowInitDialog] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate("/login");
      return;
    }

    fetchProfile();
  }, [session, navigate]);

  const fetchProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single();

      if (error) throw error;
      setProfile(profile);
    } catch (error: any) {
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleNotionConnect = () => {
    const scopes = [
      'workspace.content',
      'workspace.name',
      'page.read',
      'page.write',
    ].join(',');

    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${NOTION_CLIENT_ID}&redirect_uri=${NOTION_REDIRECT_URI}&response_type=code&owner=user&scope=${scopes}`;
    
    window.location.href = authUrl;
  };

  const handleNotionCallback = async (code: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notion/oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) throw new Error('Failed to connect Notion');

      const data = await response.json();
      
      // Update profile with Notion workspace info
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          notion_workspace_id: data.workspace_id,
          notion_access_token: data.access_token,
        })
        .eq('id', session?.user?.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Notion workspace connected successfully!",
      });

      await fetchProfile();
      
      // Show template database initialization dialog
      setShowInitDialog(true);
    } catch (error: any) {
      toast({
        title: "Error connecting Notion",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      toast({
        title: "Notion Connection Error",
        description: "Failed to connect Notion workspace",
        variant: "destructive",
      });
      return;
    }

    if (code) {
      handleNotionCallback(code);
      // Clean up URL
      window.history.replaceState({}, document.title, "/settings");
    }
  }, []);

  return (
    <MainLayout>
      <div className="container max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Notion Integration</CardTitle>
            <CardDescription>
              Connect your Notion workspace to use templates and save content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile?.notion_workspace_id ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connected to Notion workspace
                </p>
                <Button
                  variant="outline"
                  onClick={handleNotionConnect}
                  disabled={isLoading}
                >
                  Reconnect Workspace
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleNotionConnect}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Notion Workspace'
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        <TemplateDbInitDialog 
          open={showInitDialog} 
          onOpenChange={setShowInitDialog} 
        />
      </div>
    </MainLayout>
  );
}