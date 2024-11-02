import { useState, useEffect } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { processTemplateResponse } from "@/utils/templateProcessor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ToastAction } from "@/components/ui/toast";
import { TemplateStructureCheck } from "./TemplateStructureCheck";
import { ChatError } from "./types";

interface Message {
  role: 'user' | 'assistant';
  content: string | { type: string; text: string }[];
}

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

async function handleTemplateChat(messages: Message[]) {
  try {
    const response = await supabase.functions.invoke('claude-chat', {
      body: { messages }
    });

    if (response.error) {
      throw {
        code: 'SERVICE_UNAVAILABLE',
        message: response.error.message || 'Failed to process template request'
      };
    }

    if (!response.data) {
      throw {
        code: 'INVALID_STRUCTURE',
        message: 'Invalid response from template service'
      };
    }

    if (response.data.error) {
      throw {
        code: response.data.error.code || 'SERVICE_UNAVAILABLE',
        message: response.data.error.message || response.data.error.details
      };
    }

    return response.data;

  } catch (error: any) {
    console.error('Chat error:', error);
    throw {
      code: error.code || 'NETWORK_ERROR',
      message: error.message || 'Failed to process template request'
    };
  }
}

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
      const data = response.data;

      if (data.success) {
        toast({
          title: "Success",
          description: "Template created! Click to view.",
          action: (
            <ToastAction 
              altText="View template"
              onClick={() => window.open(data.url, '_blank')}
            >
              Open Template
            </ToastAction>
          )
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

      const chatResponse = await handleTemplateChat([
        ...messages.map(msg => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : msg.content.map(c => c.text).join('\n')
        })),
        { role: 'user', content: userInput }
      ]);

      if (!chatResponse) {
        throw { code: 'SERVICE_UNAVAILABLE', message: ERROR_MESSAGES.SERVICE_UNAVAILABLE };
      }

      const assistantMessage = { 
        role: 'assistant' as const, 
        content: chatResponse.content 
      };

      setMessages(prevMessages => [...prevMessages, assistantMessage]);

      try {
        const structure = processTemplateResponse(chatResponse.content[0].text);
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

      {templateStructure && (
        <TemplateStructureCheck 
          structure={templateStructure}
          onTemplateCreation={handleTemplateCreation}
        />
      )}

      <div className="border-t p-4">
        <ChatInput 
          onSend={handleUserMessage}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}