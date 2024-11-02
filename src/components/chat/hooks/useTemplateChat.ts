import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Message, ChatResponse, TemplateResponse, ChatError, TemplateStructure } from "../types/chatTypes";
import { processTemplateResponse } from "@/utils/templateProcessor";

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Hi! I'm here to help you create a Notion template. What kind of template would you like to create?"
};

const ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMIT: "You've reached the rate limit. Please try again later.",
  TOKEN_LIMIT: "The response was too long. Please try a simpler request.",
  SERVICE_UNAVAILABLE: "The service is temporarily unavailable. Please try again later.",
  INVALID_STRUCTURE: "Failed to process the template structure. Please try again.",
  UNAUTHORIZED: "Please log in to continue.",
  NETWORK_ERROR: "Network error. Please check your connection and try again."
};

export function useTemplateChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateStructure, setTemplateStructure] = useState<TemplateStructure | null>(null);
  const session = useSession();
  const { toast } = useToast();

  const handleError = (error: ChatError) => {
    const errorMessage = ERROR_MESSAGES[error.code] || error.message || ERROR_MESSAGES.NETWORK_ERROR;
    setError(errorMessage);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive"
    });
  };

  const handleTemplateCreation = async (templateSpec: string) => {
    try {
      const parsedSpec = JSON.parse(templateSpec);
      
      // Validate required fields
      if (!parsedSpec.template_name || !parsedSpec.description || !parsedSpec.blocks) {
        throw new Error('Invalid template specification: missing required fields');
      }

      const response = await supabase.functions.invoke('notion-template', {
        body: { 
          templateSpec: {
            template_name: parsedSpec.template_name,
            description: parsedSpec.description,
            blocks: parsedSpec.blocks,
            database_properties: parsedSpec.database_properties || {},
            sample_data: parsedSpec.sample_data || []
          }
        }
      });

      if (response.error) throw response.error;
      
      const data = response.data as TemplateResponse;
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to create template');
      }

      toast({
        title: "Success",
        description: "Template created successfully",
      });
    } catch (error: any) {
      console.error('Template creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive"
      });
    }
  };

  const handleUserMessage = async (userInput: string) => {
    if (!session?.user?.id) {
      handleError({ code: 'UNAUTHORIZED', message: ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    if (!userInput.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const newMessage: Message = { role: 'user', content: userInput };
      setMessages(prev => [...prev, newMessage]);

      const chatResponse = await supabase.functions.invoke('claude-chat', {
        body: {
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: typeof msg.content === 'string' ? msg.content : msg.content.map(c => c.text).join('\n')
            })),
            { role: 'user', content: userInput }
          ]
        }
      });

      if (chatResponse.error) {
        throw { code: 'SERVICE_UNAVAILABLE', message: ERROR_MESSAGES.SERVICE_UNAVAILABLE };
      }

      const data = chatResponse.data as ChatResponse;
      
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.content.map(item => ({ type: 'text', text: item.text }))
      };

      setMessages(prev => [...prev, assistantMessage]);

      try {
        const structure = processTemplateResponse(data.content[0].text);
        setTemplateStructure(structure);
      } catch (parseError) {
        console.error('Template parsing error:', parseError);
      }

    } catch (error: any) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    templateStructure,
    handleUserMessage,
    handleTemplateCreation
  };
}