import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function TemplateDbInitDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const initializeTemplateDb = async () => {
    try {
      setError(null);
      setProgress(20);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      setProgress(40);
      
      const response = await fetch('/api/notion-template-db-init', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initialize template database');
      }

      setProgress(80);
      const { database_id } = await response.json();

      // Update profile with the new database ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          notion_template_db_id: database_id,
          template_db_installed: true,
          template_db_installed_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      setProgress(100);
      toast({
        title: "Success",
        description: "Template library has been set up successfully!",
      });

      // Close dialog and redirect
      setTimeout(() => {
        onOpenChange(false);
        navigate('/templates');
      }, 1000);

    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    setProgress(0);
    setError(null);
    initializeTemplateDb();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Setting up your template library</DialogTitle>
          <DialogDescription>
            We're creating your template database in Notion...
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <Progress value={progress} className="mb-4" />
          
          {error ? (
            <div className="space-y-4">
              <p className="text-sm text-destructive">{error}</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRetry}>
                  Retry
                </Button>
              </div>
            </div>
          ) : progress < 100 ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <p className="text-sm text-center text-muted-foreground">
              Setup complete! Redirecting...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}