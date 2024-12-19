interface Message {
  role: string;
  content: string;
  tokens?: number;
  context?: boolean;
}

export type { Message }; 