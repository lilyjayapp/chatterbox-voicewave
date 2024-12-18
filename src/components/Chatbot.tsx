import { useEffect, useRef, useState } from "react";
import { ChatMessage as ChatMessageType } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { toast } from "sonner";

const WEBHOOK_URL = "https://hook.eu2.make.com/your-webhook-id";

export const Chatbot = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const botMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: data.response || "Sorry, I couldn't process that.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      
      // Synthesize speech for bot response
      try {
        const audioResponse = await fetch("/api/text-to-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: botMessage.content }),
        });
        
        if (audioResponse.ok) {
          const audioBlob = await audioResponse.blob();
          const audio = new Audio(URL.createObjectURL(audioBlob));
          audio.play();
        }
      } catch (error) {
        console.error("TTS Error:", error);
        toast.error("Failed to generate speech response");
      }
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      if (!recognitionRef.current) {
        recognitionRef.current = new (window.SpeechRecognition || 
          window.webkitSpeechRecognition)();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleSendMessage(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          toast.error("Failed to recognize speech. Please try again.");
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }

      recognitionRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Speech recognition error:', error);
      toast.error("Failed to start speech recognition. Please try again.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <div className="flex h-[600px] w-full max-w-2xl flex-col rounded-lg border bg-chatbot-background shadow-lg">
      <div className="flex-none border-b bg-white p-4">
        <h2 className="text-lg font-semibold">Chat Assistant</h2>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 space-y-4 overflow-y-auto p-4"
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex animate-pulse justify-start">
            <div className="h-8 w-8 rounded-full bg-gray-200"></div>
          </div>
        )}
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        isRecording={isRecording}
        disabled={isLoading}
      />
    </div>
  );
};