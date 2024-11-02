import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { useTemplateChat } from "./hooks/useTemplateChat";
import { TemplateStructureCheck } from "./TemplateStructureCheck";

export function ChatInterface() {
  const [message, setMessage] = useState("");
  const { messages, isLoading, error, templateStructure, handleUserMessage, handleTemplateCreation } = useTemplateChat();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      await handleUserMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role}`}>
            {typeof msg.content === 'string' ? msg.content : msg.content.map(c => c.text).join('\n')}
          </div>
        ))}
        {isLoading && <div>Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}
      </div>
      {templateStructure && (
        <TemplateStructureCheck 
          structure={templateStructure} 
          onTemplateCreation={handleTemplateCreation}
        />
      )}
      <div className="border-t p-4">
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <Input
            placeholder="Type your message..."
            className="flex-1"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}