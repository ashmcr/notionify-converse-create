import { useState, useEffect } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { processTemplateResponse } from "@/utils/templateProcessor";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  role: 'user' | 'assistant';
  content: string | { type: string; text: string }[];
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Hi! I'm here to help you create a Notion template. To get started, could you tell me what kind of template you're looking for? For example, is it for project management, content planning, personal organization, or something else?"
};

const ERROR_MESSAGES = {
  RATE_LIMIT: "You've reached the rate limit. Please try again in a few minutes.",
  TOKEN_LIMIT: "The response was too long. Please try a simpler request.",
  SERVICE_UNAVAILABLE: "The service is temporarily unavailable. Please try again later.",
  INVALID_STRUCTURE: "Failed to process the template structure. Please try again.",
  MISSING_FIELDS: "Some required template fields are missing. Please provide more details.",
  VALIDATION_ERROR: "Please ensure your input is valid and try again.",
  UNAUTHORIZED: "Please log in to continue.",
  NETWORK_ERROR: "Network error. Please check your connection and try again."
};

export function TemplateChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateStructure, setTemplateStructure] = useState<any>(null);
  const session = useSession();
  const { toast } = useToast();

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([INITIAL_MESSAGE]);
    }
  }, []);

  const handleError = (error: any) => {
    console.error('Chat error:', error);
    setError(null);

    if (error.status === 429) {
      setError(ERROR_MESSAGES.RATE_LIMIT);
    } else if (error.message?.includes('token')) {
      setError(ERROR_MESSAGES.TOKEN_LIMIT);
    } else if (error.message?.includes('unavailable')) {
      setError(ERROR_MESSAGES.SERVICE_UNAVAILABLE);
    } else if (error.message?.includes('structure')) {
      setError(ERROR_MESSAGES.INVALID_STRUCTURE);
    } else if (error.message?.includes('fields')) {
      setError(ERROR_MESSAGES.MISSING_FIELDS);
    } else {
      setError(ERROR_MESSAGES.NETWORK_ERROR);
    }

    toast({
      title: "Error",
      description: error.message || "An unexpected error occurred",
      variant: "destructive"
    });
  };

  const validateUserInput = (input: string): boolean => {
    if (!input.trim()) {
      setError(ERROR_MESSAGES.VALIDATION_ERROR);
      return false;
    }
    return true;
  };

  const handleUserMessage = async (userInput: string) => {
    if (!session?.user?.id) {
      setError(ERROR_MESSAGES.UNAUTHORIZED);
      toast({
        title: "Error",
        description: ERROR_MESSAGES.UNAUTHORIZED,
        variant: "destructive"
      });
      return;
    }

    if (!validateUserInput(userInput)) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const newMessage: Message = { role: 'user', content: userInput };
      setMessages(prevMessages => [...prevMessages, newMessage]);

      const response = await supabase.functions.invoke('claude-chat', {
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

      if (response.error) throw response.error;

      const assistantMessage = { 
        role: 'assistant' as const, 
        content: response.data.content 
      };

      setMessages(prevMessages => [...prevMessages, assistantMessage]);

      try {
        const structure = processTemplateResponse(response.data.content[0].text);
        setTemplateStructure(structure);

        if (structure.properties.length > 0 || structure.views.length > 0) {
          const event = new CustomEvent('templateUpdate', { 
            detail: structure 
          });
          window.dispatchEvent(event);
        }
      } catch (parseError) {
        console.error('Template parsing error:', parseError);
        setError(ERROR_MESSAGES.INVALID_STRUCTURE);
      }

    } catch (error: any) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            role={message.role}
            content={message.content}
          />
        ))}
        
        {isLoading && <TypingIndicator />}
      </div>

      <div className="border-t p-4">
        <ChatInput 
          onSend={handleUserMessage}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}