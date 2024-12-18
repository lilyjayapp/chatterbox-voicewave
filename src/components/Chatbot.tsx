import { useEffect, useRef, useState } from "react";
import { ChatMessage as ChatMessageType } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { toast } from "sonner";
import { synthesizeSpeech, transcribeSpeech } from "@/api/googleCloud";

const WEBHOOK_URL = "https://hook.eu2.make.com/your-webhook-id"; // Replace with your actual Make.com webhook URL

export const Chatbot = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    try {
      const userMessage: ChatMessageType = {
        id: Date.now().toString(),
        type: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors", // Handle CORS issues
        body: JSON.stringify({ 
          message: content,
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
        }),
      });

      // Since we're using no-cors, we'll assume success and show a message
      const botMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Message sent to webhook successfully. Check your scenario's history to confirm it was triggered.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      
      try {
        await synthesizeSpeech(botMessage.content);
      } catch (error) {
        console.error("TTS Error:", error);
        toast.error("Failed to generate speech response");
      }
    } catch (error) {
      console.error("Message Error:", error);
      toast.error("Failed to send message to Make.com webhook. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        try {
          const transcript = await transcribeSpeech(audioBlob);
          if (transcript) {
            handleSendMessage(transcript);
          } else {
            toast.error("Could not transcribe audio. Please try again.");
          }
        } catch (error) {
          console.error("STT Error:", error);
          toast.error("Failed to transcribe speech");
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Failed to access microphone. Please check your permissions.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
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
