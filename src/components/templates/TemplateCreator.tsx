import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TEMPLATE_CATEGORIES = [
  "Project Management",
  "Personal Organization",
  "Content Planning",
  "Knowledge Base",
  "Custom"
];

export function TemplateCreator() {
  const session = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(TEMPLATE_CATEGORIES[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to create templates",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      // Create template in Notion
      const response = await supabase.functions.invoke('notion-template', {
        body: {
          templateData: {
            name,
            description,
            category,
            blocks: [] // Add default blocks if needed
          }
        }
      });

      if (response.error) throw response.error;

      // Track template creation
      const { error: dbError } = await supabase
        .from('template_generations')
        .insert({
          name,
          description,
          user_id: session.user.id,
          notion_page_id: response.data.templateId,
          template_url: response.data.publicUrl
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Template created successfully"
      });

      // Reset form
      setName("");
      setDescription("");
      setCategory(TEMPLATE_CATEGORIES[0]);

    } catch (error: any) {
      console.error('Template creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Template</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Template Name</label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your template"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Template'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}