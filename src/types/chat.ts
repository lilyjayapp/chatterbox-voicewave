export type MessageType = "user" | "bot";

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
}