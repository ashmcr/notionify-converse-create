import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { TemplateStructureCheck } from "./TemplateStructureCheck";
import { useTemplateChat } from "./hooks/useTemplateChat";

export function TemplateChatInterface() {
  const {
    messages,
    isLoading,
    error,
    templateStructure,
    handleUserMessage,
    handleTemplateCreation
  } = useTemplateChat();

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