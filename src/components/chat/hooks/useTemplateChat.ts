import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Message, ChatError, ChatResponse, TemplateResponse } from "../types/chatTypes";
import { processTemplateResponse } from "@/utils/templateProcessor";
import { ToastAction } from "@/components/ui/toast";

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Hi! I'm here to help you create a Notion template. To get started, could you tell me what kind of template you're looking for? For example, is it for project management, content planning, personal organization, or something else?"
};

const ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMIT: "You've reached the rate limit. Please try again in a few minutes.",
  TOKEN_LIMIT: "The response was too long. Please try a simpler request.",
  SERVICE_UNAVAILABLE: "The service is temporarily unavailable. Please try again later.",
  INVALID_STRUCTURE: "Failed to process the template structure. Please try again.",
  MISSING_FIELDS: "Some required template fields are missing. Please provide more details.",
  VALIDATION_ERROR: "Please ensure your input is valid and try again.",
  UNAUTHORIZED: "Please log in to continue.",
  NETWORK_ERROR: "Network error. Please check your connection and try again."
};

export function useTemplateChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateStructure, setTemplateStructure] = useState<any>(null);
  const session = useSession();
  const { toast } = useToast();

  const handleError = (error: ChatError) => {
    console.error('Chat error:', error);
    setError(null);
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
      const response = await supabase.functions.invoke('notion-template', {
        body: { templateSpec }
      });

      if (response.error) throw response.error;
      const data = response.data as TemplateResponse;

      if (data.success) {
        toast({
          title: "Success",
          description: "Template created! Click to view.",
          action: <ToastAction altText="View template" onClick={() => window.open(data.url || '', '_blank')}>
            Open Template
          </ToastAction>
        });
      } else {
        throw new Error(data.error?.message || 'Failed to create template');
      }
    } catch (error: any) {
      console.error('Template creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive"
      });
    }
  };

  const handleUserMessage = async (userInput: string) => {
    if (!session?.user?.id) {
      handleError({ code: 'UNAUTHORIZED', message: ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    if (!userInput.trim()) {
      handleError({ code: 'VALIDATION_ERROR', message: ERROR_MESSAGES.VALIDATION_ERROR });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const newMessage: Message = { role: 'user', content: userInput };
      setMessages(prevMessages => [...prevMessages, newMessage]);

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
      if (!data) {
        throw { code: 'SERVICE_UNAVAILABLE', message: ERROR_MESSAGES.SERVICE_UNAVAILABLE };
      }

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.content.map(item => ({ type: 'text', text: item.text }))
      };

      setMessages(prevMessages => [...prevMessages, assistantMessage]);

      try {
        const structure = processTemplateResponse(data.content[0].text);
        setTemplateStructure(structure);
      } catch (parseError) {
        console.error('Template parsing error:', parseError);
        handleError({ 
          code: 'INVALID_STRUCTURE', 
          message: ERROR_MESSAGES.INVALID_STRUCTURE 
        });
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