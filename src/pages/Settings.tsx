import { useSession } from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TemplateDbInitDialog } from "@/components/notion/TemplateDbInitDialog";
import { NotionIntegrationCard } from "@/components/settings/NotionIntegrationCard";

const NOTION_CLIENT_ID = import.meta.env.VITE_NOTION_CLIENT_ID;
const NOTION_REDIRECT_URI = `${window.location.origin}/settings`;

export default function Settings() {
  const session = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [showInitDialog, setShowInitDialog] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate("/login");
      return;
    }

    fetchProfile();
  }, [session]);

  const fetchProfile = async () => {
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setProfile(profile);
    } catch (error: any) {
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotionConnect = () => {
    if (!NOTION_CLIENT_ID) {
      toast({
        title: "Configuration Error",
        description: "Notion Client ID is not configured",
        variant: "destructive",
      });
      return;
    }

    const scopes = [
      'workspace.content',
      'workspace.name',
      'page.read',
      'page.write',
    ].join(',');

    window.location.href = `https://api.notion.com/v1/oauth/authorize?client_id=${NOTION_CLIENT_ID}&redirect_uri=${NOTION_REDIRECT_URI}&response_type=code&owner=user&scope=${scopes}`;
  };

  const handleNotionCallback = async (code: string) => {
    if (!session?.user?.id) return;
    
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
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          notion_workspace_id: data.workspace_id,
          notion_access_token: data.access_token,
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Notion workspace connected successfully!",
      });

      await fetchProfile();
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
      window.history.replaceState({}, document.title, "/settings");
    }
  }, []);

  return (
    <MainLayout>
      <div className="container max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <NotionIntegrationCard 
            isLoading={isLoading}
            profile={profile}
            onConnect={handleNotionConnect}
          />
        )}

        <TemplateDbInitDialog 
          open={showInitDialog} 
          onOpenChange={setShowInitDialog} 
        />
      </div>
    </MainLayout>
  );
}