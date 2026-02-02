export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  status: 'active' | 'resolved' | 'escalated';
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'ai' | 'admin';
  content: string;
  created_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender: 'user' | 'admin';
  content: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  issue_summary: string;
  status: 'open' | 'in_progress' | 'resolved';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  embedding: number[];
}

export interface VoiceRequest {
  text: string;
  user_id?: string;
  conversation_id?: string;
}

export interface VoiceResponse {
  success: boolean;
  message: string;
  audio_url?: string;
  ticket_created?: boolean;
  ticket_id?: string;
  ticket_url?: string;
  faq_matched?: boolean;
  confidence?: number;
}
