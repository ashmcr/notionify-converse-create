import { cn } from "@/lib/utils";

interface MessageContent {
  type: string;
  text: string;
}

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string | MessageContent | MessageContent[];
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const messageText = typeof content === 'string' 
    ? content 
    : Array.isArray(content)
    ? content.map(item => item.text).join('\n')
    : content.text || '';

  return (
    <div
      className={cn(
        "flex w-full",
        role === 'user' ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          role === 'user' 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{messageText}</p>
      </div>
    </div>
  );
}