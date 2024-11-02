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
  const [isConnecting, setIsConnecting] = useState(false);
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
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .limit(1);

      if (error) throw error;
      
      if (!profiles || profiles.length === 0) {
        throw new Error('Profile not found');
      }

      setProfile(profiles[0]);
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
    
    setIsConnecting(true);
    try {
      console.log('Calling notion-oauth function with code');
      const { data, error } = await supabase.functions.invoke('notion-oauth', {
        body: { code },
      });

      if (error) throw error;
      
      console.log('Notion OAuth response:', data);
      
      toast({
        title: "Success",
        description: "Notion workspace connected successfully!",
      });

      await fetchProfile();
      setShowInitDialog(true);
    } catch (error: any) {
      console.error('Notion connection error:', error);
      toast({
        title: "Error connecting Notion",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const error_description = url.searchParams.get('error_description');

    // Clean up URL parameters
    if (code || error) {
      window.history.replaceState({}, document.title, "/settings");
    }

    if (error) {
      toast({
        title: "Notion Connection Error",
        description: error_description || "Failed to connect Notion workspace",
        variant: "destructive",
      });
      return;
    }

    if (code) {
      handleNotionCallback(code);
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
            isLoading={isConnecting}
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