import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { processTemplateResponse } from "@/utils/templateProcessor";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are a Notion template expert. Help users create custom templates by:
1. Understanding their needs through conversation
2. Suggesting appropriate database structures
3. Recommending properties and views
4. Providing best practices for their use case.

When suggesting database properties, use this format:
Property: [Property Name]: [Property Type]
Options for [Property Name]: [comma-separated options] (for select properties)

When suggesting views, use this format:
View: [View Name]: [View Type]
Properties for [View Name]: [comma-separated property names]

For best practices and suggestions, start lines with "Suggestion:" or "Best Practice:"

Always define clear database properties with specific types and options.`;

export function TemplateChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [templateStructure, setTemplateStructure] = useState<any>(null);
  const session = useSession();
  const { toast } = useToast();

  const handleUserMessage = async (userInput: string) => {
    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to use the chat",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const newMessage: Message = { role: 'user', content: userInput };
      setMessages(prevMessages => [...prevMessages, newMessage]);

      const response = await supabase.functions.invoke('claude-chat', {
        body: {
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
            newMessage
          ]
        }
      });

      if (response.error) throw response.error;

      const assistantMessage = { 
        role: 'assistant' as const, 
        content: response.data.content 
      };

      setMessages(prevMessages => [...prevMessages, assistantMessage]);

      // Process the response into template structure
      const structure = processTemplateResponse(response.data.content);
      setTemplateStructure(structure);

      // Emit the template structure for preview
      if (structure.properties.length > 0 || structure.views.length > 0) {
        const event = new CustomEvent('templateUpdate', { 
          detail: structure 
        });
        window.dispatchEvent(event);
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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