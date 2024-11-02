import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface NotionIntegrationCardProps {
  isLoading: boolean;
  profile: any;
  onConnect: () => void;
}

export function NotionIntegrationCard({ isLoading, profile, onConnect }: NotionIntegrationCardProps) {
  return (
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
              onClick={onConnect}
              disabled={isLoading}
            >
              Reconnect Workspace
            </Button>
          </div>
        ) : (
          <Button
            onClick={onConnect}
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
  );
}