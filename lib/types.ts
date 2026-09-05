export type ReflectionMode = 'reflection' | 'summary' | 'brainstorm' | 'chat';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface UserInteraction {
  id?: string;
  userId: string;
  title: string;
  prompt: string;
  response: string;
  mode: ReflectionMode;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  modelUsed?: string;
  tags?: string[];
}

export interface ReflectionRequestPayload {
  prompt: string;
  mode: ReflectionMode;
  history?: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>;
  title?: string;
}

export interface ReflectionResponsePayload {
  success: boolean;
  text: string;
  title: string;
  modelUsed: string;
  error?: string;
}
