import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send } from "lucide-react";
import { useState, useRef } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  disabled?: boolean;
}

export const ChatInput = ({
  onSendMessage,
  onStartRecording,
  onStopRecording,
  isRecording,
  disabled,
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4">
      <Input
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1"
        disabled={disabled}
      />
      <Button
        type="submit"
        disabled={!message.trim() || disabled}
        className="bg-primary hover:bg-primary/90"
      >
        <Send className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        onClick={handleMicClick}
        disabled={disabled}
        variant={isRecording ? "destructive" : "outline"}
        className={isRecording ? "animate-pulse" : ""}
      >
        <Mic className="h-4 w-4" />
      </Button>
    </form>
  );
};