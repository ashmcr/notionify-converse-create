import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, FileEdit, Download, Database } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Property {
  name: string;
  type: string;
  options?: string[];
}

interface View {
  name: string;
  type: string;
  properties?: string[];
}

interface TemplateStructure {
  properties: Property[];
  views: View[];
  suggestions: string[];
}

interface TemplatePreviewProps {
  loading?: boolean;
}

export function TemplatePreview({ loading = false }: TemplatePreviewProps) {
  const [templateData, setTemplateData] = useState<TemplateStructure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(loading);

  useEffect(() => {
    const handleTemplateUpdate = (event: CustomEvent<TemplateStructure>) => {
      setPreviewLoading(true);
      try {
        setTemplateData(event.detail);
        setError(null);
      } catch (err) {
        setError("Failed to update template preview");
      } finally {
        setPreviewLoading(false);
      }
    };

    window.addEventListener('templateUpdate', handleTemplateUpdate as EventListener);
    return () => {
      window.removeEventListener('templateUpdate', handleTemplateUpdate as EventListener);
    };
  }, []);

  if (loading || previewLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-8">
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!templateData) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Database className="mx-auto h-12 w-12 opacity-50 mb-4" />
        <p>Start chatting to generate your template preview</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-6rem)]">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Database Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Properties</h3>
              <div className="space-y-2">
                {templateData.properties.map((prop, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{prop.name}</span>
                    <Badge variant="secondary">{prop.type}</Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-semibold mb-2">Views</h3>
              <div className="space-y-2">
                {templateData.views.map((view, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{view.name}</span>
                    <Badge>{view.type}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <FileEdit className="h-4 w-4 mr-2" />
              Modify
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="default" size="sm" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Get Template
            </Button>
          </CardFooter>
        </Card>

        {templateData.suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                {templateData.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}