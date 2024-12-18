import { useEffect, useRef, useState } from "react";
import { ChatMessage as ChatMessageType } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { toast } from "sonner";

const WEBHOOK_URL = "https://hook.eu2.make.com/your-webhook-id";
const ELEVEN_LABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah's voice
const ELEVEN_LABS_MODEL = "eleven_multilingual_v2";

export const Chatbot = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const playAudioResponse = async (text: string) => {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_LABS_VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": process.env.ELEVEN_LABS_API_KEY || "",
          },
          body: JSON.stringify({
            text,
            model_id: ELEVEN_LABS_MODEL,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate speech");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      toast.error("Failed to generate speech");
      console.error("TTS Error:", error);
    }
  };

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
      
      // Generate speech for bot's response if the original input was voice
      if (isRecording) {
        await playAudioResponse(botMessage.content);
      }
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleSendMessage(transcript);
      };

      recognition.onerror = (event) => {
        toast.error("Speech recognition error. Please try again.");
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (error) {
      toast.error("Failed to access microphone. Please check your permissions.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
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