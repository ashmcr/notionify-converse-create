export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2 p-4">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
      </div>
    </div>
  );
}