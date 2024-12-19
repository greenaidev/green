export interface Message {
  role: string;
  content: string;
  tokens?: number;
  type?: string;
} 