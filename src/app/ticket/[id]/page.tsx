'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Ticket, TicketMessage } from '@/types';
import { supabase } from '@/lib/supabase/client';

export default function UserTicketPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        // Fetch ticket
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single();

        if (ticketError) {
          setError('Ticket not found');
          return;
        }
        setTicket(ticketData);

        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true });

        if (!messagesError) {
          setMessages(messagesData || []);
        }
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError('Failed to load ticket');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicket();

    // Subscribe to new messages
    const channel = supabase
      .channel(`user_ticket:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as TicketMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticketId}`,
        },
        (payload) => {
          setTicket(payload.new as Ticket);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !ticket) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          ticket_id: ticketId,
          sender: 'user',
          content: replyText.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) => [...prev, data]);
      setReplyText('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <p className="text-gray-500 text-center">Loading ticket...</p>
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Ticket Not Found</h1>
          <p className="text-gray-500 mb-6">{error || 'The ticket you are looking for does not exist.'}</p>
          <Link href="/" className="text-gray-900 hover:text-gray-600 font-medium">
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm inline-flex items-center gap-1 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Support Ticket</h1>
        </div>

        {/* Ticket Info Card */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Ticket #{ticketId.slice(0, 8)}</p>
              <h2 className="text-lg font-medium text-gray-900">{ticket.issue_summary}</h2>
            </div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                ticket.status === 'open'
                  ? 'bg-red-50 text-red-700'
                  : ticket.status === 'in_progress'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-green-50 text-green-700'
              }`}
            >
              {ticket.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Created {new Date(ticket.created_at).toLocaleDateString()} at{' '}
            {new Date(ticket.created_at).toLocaleTimeString()}
          </p>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Conversation</h3>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {ticket.status === 'open' 
                  ? 'Your ticket is being reviewed. We\'ll respond shortly.'
                  : 'No messages yet.'}
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.sender === 'admin'
                      ? 'bg-gray-900 text-white mr-8'
                      : 'bg-gray-100 ml-8'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-medium uppercase tracking-wide ${msg.sender === 'admin' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {msg.sender === 'admin' ? 'Support Team' : 'You'}
                    </span>
                    <span className={`text-xs ${msg.sender === 'admin' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className={msg.sender === 'admin' ? 'text-gray-100' : 'text-gray-700'}>{msg.content}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Reply Form */}
        {ticket.status !== 'resolved' ? (
          <form onSubmit={handleReply} className="bg-white rounded-xl border border-gray-200 p-4">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your message..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-400 resize-none"
              rows={3}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !replyText.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-green-50 p-4 rounded-xl text-center text-green-700 border border-green-200">
            ✓ This ticket has been resolved. Thank you for contacting support!
          </div>
        )}

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Save this page URL to check your ticket status anytime.
        </p>
      </div>
    </main>
  );
}
