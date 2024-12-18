import { ChatMessage as ChatMessageType } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isBot = message.type === "bot";

  return (
    <div
      className={cn(
        "flex w-full animate-message-fade-in opacity-0",
        isBot ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2 shadow-sm",
          isBot ? "bg-chatbot-botMessage" : "bg-chatbot-userMessage"
        )}
      >
        <p className="text-sm text-gray-800">{message.content}</p>
        <span className="mt-1 block text-right text-xs text-gray-400">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
};