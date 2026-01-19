'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Ticket, Message } from '@/types';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function TicketPage() {
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTicketAndMessages = async () => {
      try {
        // Fetch ticket
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single();

        if (ticketError) throw ticketError;
        setTicket(ticketData);

        // Note: Messages are stored with ticket_id reference, not conversation_id
        // For now, skip fetching messages as they need ticket_id field
        setMessages([]);
      } catch (err) {
        console.error('Error fetching ticket:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicketAndMessages();

    // Subscribe to message updates
    const channel = supabase
      .channel(`messages:${ticketId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [ticketId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !ticket) return;

    setIsSubmitting(true);
    try {
      // For now, just update ticket status
      // TODO: Integrate with full message system when implemented
      
      await supabase
        .from('tickets')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      setReplyText('');
      setTicket((prev) => (prev ? { ...prev, status: 'in_progress' } : null));
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    try {
      await supabase
        .from('tickets')
        .update({ status: 'resolved' })
        .eq('id', ticketId);
      setTicket((prev) => (prev ? { ...prev, status: 'resolved' } : null));
    } catch (err) {
      console.error('Error resolving ticket:', err);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <p className="text-gray-600">Loading ticket...</p>
        </div>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <p className="text-gray-600">Ticket not found</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800 mb-6 block">
          ← Back to Dashboard
        </Link>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {ticket.issue_summary}
              </h1>

              {/* Messages */}
              <div className="border-t pt-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Conversation
                </h2>
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No messages yet
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-lg ${
                          msg.sender === 'admin'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-gray-900 capitalize">
                            {msg.sender}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-800">{msg.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reply Form */}
              {ticket.status !== 'resolved' && (
                <form onSubmit={handleReply} className="border-t pt-6">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response..."
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                  <div className="mt-4 flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting || !replyText.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Reply'}
                    </button>
                    <button
                      type="button"
                      onClick={handleResolve}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Mark as Resolved
                    </button>
                  </div>
                </form>
              )}

              {ticket.status === 'resolved' && (
                <div className="border-t pt-6 bg-green-50 p-4 rounded-lg text-center text-green-800">
                  ✓ This ticket has been resolved
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="bg-white rounded-lg shadow p-6 h-fit">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ticket Details
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${
                      ticket.status === 'open'
                        ? 'bg-red-500'
                        : ticket.status === 'in_progress'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                  ></span>
                  <span className="font-medium text-gray-900 capitalize">
                    {ticket.status}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Ticket ID</div>
                <div className="font-mono text-sm text-gray-900">{ticket.id}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Created</div>
                <div className="text-sm text-gray-900">
                  {new Date(ticket.created_at).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Last Updated</div>
                <div className="text-sm text-gray-900">
                  {new Date(ticket.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
